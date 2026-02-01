import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type { 
  RegistrationResponseJSON, 
  AuthenticationResponseJSON 
} from '@simplewebauthn/types';
import { nanoid } from 'nanoid';
import { PasskeyCredential, AuthChallenge } from '../types';

interface UserCredential {
  id: string;
  publicKey: string;
  counter: number;
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  transports?: string[];
}

export class PasskeyManager {
  private credentials: Map<string, UserCredential> = new Map();
  private challenges: Map<string, AuthChallenge> = new Map();
  private readonly RP_NAME = 'P2P Passwordless Auth';
  private readonly RP_ID = 'localhost'; // Em produção, usar o domínio real
  private readonly ORIGIN = 'http://localhost:3000'; // Em produção, usar a URL real
  private readonly CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutos

  constructor() {
    this.startCleanupTasks();
  }

  /**
   * Gera opções para registro de uma nova passkey
   */
  async generateRegistrationOptions(userId: string, userName: string, userDisplayName: string) {
    try {
      // Busca credenciais existentes do usuário
      const existingCredentials = this.getUserCredentials(userId);
      
      const options = await generateRegistrationOptions({
        rpName: this.RP_NAME,
        rpID: this.RP_ID,
        userID: new TextEncoder().encode(userId),
        userName: userName,
        userDisplayName: userDisplayName,
        timeout: 60000,
        attestationType: 'none',
        excludeCredentials: existingCredentials.map(cred => ({
          id: cred.id,
          type: 'public-key',
          transports: cred.transports as any,
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
          authenticatorAttachment: 'platform',
        },
        supportedAlgorithmIDs: [-7, -257], // ES256 e RS256
      });

      // Armazena o challenge
      const challenge: AuthChallenge = {
        id: nanoid(),
        challenge: options.challenge,
        timestamp: Date.now(),
        expiry: Date.now() + this.CHALLENGE_TTL
      };
      
      this.challenges.set(options.challenge, challenge);

      console.log(`Opções de registro geradas para usuário ${userName}`);
      return {
        options,
        challengeId: challenge.id
      };

    } catch (error) {
      console.error('Erro ao gerar opções de registro:', error);
      throw new Error('Falha ao gerar opções de registro');
    }
  }

  /**
   * Verifica a resposta de registro da passkey
   */
  async verifyRegistration(
    userId: string,
    response: RegistrationResponseJSON
  ): Promise<{ verified: boolean; credential?: PasskeyCredential }> {
    try {
      // Busca o challenge
      const challenge = this.challenges.get(response.response.clientDataJSON);
      if (!challenge || Date.now() > challenge.expiry) {
        throw new Error('Challenge inválido ou expirado');
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.ORIGIN,
        expectedRPID: this.RP_ID,
        requireUserVerification: false,
      });

      if (verification.verified && verification.registrationInfo) {
        const regInfo = verification.registrationInfo;

        // Cria nova credencial
        const credential: UserCredential = {
          id: regInfo.credentialID,
          publicKey: Buffer.from(regInfo.credentialPublicKey).toString('base64'),
          counter: regInfo.counter,
          deviceType: regInfo.credentialDeviceType,
          backedUp: regInfo.credentialBackedUp,
          transports: response.response.transports,
        };

        // Armazena a credencial
        this.credentials.set(`${userId}:${credential.id}`, credential);

        // Remove o challenge usado
        this.challenges.delete(response.response.clientDataJSON);

        const passkeyCredential: PasskeyCredential = {
          id: credential.id,
          publicKey: credential.publicKey,
          algorithm: 'ES256', // Simplificado
          userHandle: userId,
          transports: credential.transports || []
        };

        console.log(`Passkey registrada com sucesso para usuário ${userId}`);
        return { verified: true, credential: passkeyCredential };
      }

      return { verified: false };

    } catch (error) {
      console.error('Erro ao verificar registro:', error);
      return { verified: false };
    }
  }

  /**
   * Gera opções para autenticação com passkey
   */
  async generateAuthenticationOptions(userId?: string) {
    try {
      const allowCredentials = userId ? 
        this.getUserCredentials(userId).map(cred => ({
          id: cred.id,
          type: 'public-key' as const,
          transports: cred.transports as any,
        })) : 
        undefined;

      const options = await generateAuthenticationOptions({
        rpID: this.RP_ID,
        timeout: 60000,
        allowCredentials,
        userVerification: 'preferred',
      });

      // Armazena o challenge
      const challenge: AuthChallenge = {
        id: nanoid(),
        challenge: options.challenge,
        timestamp: Date.now(),
        expiry: Date.now() + this.CHALLENGE_TTL
      };
      
      this.challenges.set(options.challenge, challenge);

      console.log(`Opções de autenticação geradas ${userId ? `para usuário ${userId}` : 'para qualquer usuário'}`);
      return {
        options,
        challengeId: challenge.id
      };

    } catch (error) {
      console.error('Erro ao gerar opções de autenticação:', error);
      throw new Error('Falha ao gerar opções de autenticação');
    }
  }

  /**
   * Verifica a resposta de autenticação da passkey
   */
  async verifyAuthentication(
    response: AuthenticationResponseJSON
  ): Promise<{ verified: boolean; userId?: string; credential?: PasskeyCredential }> {
    try {
      // Busca o challenge
      const challenge = this.challenges.get(response.response.clientDataJSON);
      if (!challenge || Date.now() > challenge.expiry) {
        throw new Error('Challenge inválido ou expirado');
      }

      // Busca a credencial
      const credentialId = response.id;
      const userCredential = this.findCredentialById(credentialId);
      
      if (!userCredential) {
        throw new Error('Credencial não encontrada');
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: this.ORIGIN,
        expectedRPID: this.RP_ID,
        authenticator: {
          credentialID: userCredential.credential.id,
          credentialPublicKey: Buffer.from(userCredential.credential.publicKey, 'base64'),
          counter: userCredential.credential.counter,
        },
        requireUserVerification: false,
      });

      if (verification.verified) {
        // Atualiza o contador
        if (verification.authenticationInfo) {
          userCredential.credential.counter = verification.authenticationInfo.newCounter;
        }

        // Remove o challenge usado
        this.challenges.delete(response.response.clientDataJSON);

        const passkeyCredential: PasskeyCredential = {
          id: userCredential.credential.id,
          publicKey: userCredential.credential.publicKey,
          algorithm: 'ES256',
          userHandle: userCredential.userId,
          transports: userCredential.credential.transports || []
        };

        console.log(`Autenticação bem-sucedida para usuário ${userCredential.userId}`);
        return { 
          verified: true, 
          userId: userCredential.userId,
          credential: passkeyCredential
        };
      }

      return { verified: false };

    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { verified: false };
    }
  }

  /**
   * Busca credenciais de um usuário
   */
  private getUserCredentials(userId: string): UserCredential[] {
    const credentials: UserCredential[] = [];
    
    for (const [key, credential] of this.credentials.entries()) {
      if (key.startsWith(`${userId}:`)) {
        credentials.push(credential);
      }
    }
    
    return credentials;
  }

  /**
   * Busca uma credencial por ID
   */
  private findCredentialById(credentialId: string): { userId: string; credential: UserCredential } | null {
    for (const [key, credential] of this.credentials.entries()) {
      if (credential.id === credentialId) {
        const userId = key.split(':')[0];
        return { userId, credential };
      }
    }
    return null;
  }

  /**
   * Remove uma credencial específica
   */
  removeCredential(userId: string, credentialId: string): boolean {
    const key = `${userId}:${credentialId}`;
    const removed = this.credentials.delete(key);
    
    if (removed) {
      console.log(`Credencial removida: ${credentialId} do usuário ${userId}`);
    }
    
    return removed;
  }

  /**
   * Remove todas as credenciais de um usuário
   */
  removeUserCredentials(userId: string): number {
    let removedCount = 0;
    
    for (const key of this.credentials.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.credentials.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removidas ${removedCount} credenciais do usuário ${userId}`);
    }
    
    return removedCount;
  }

  /**
   * Lista todas as credenciais de um usuário
   */
  listUserCredentials(userId: string): PasskeyCredential[] {
    const credentials = this.getUserCredentials(userId);
    
    return credentials.map(cred => ({
      id: cred.id,
      publicKey: cred.publicKey,
      algorithm: 'ES256',
      userHandle: userId,
      transports: cred.transports || []
    }));
  }

  /**
   * Verifica se um usuário tem credenciais registradas
   */
  hasCredentials(userId: string): boolean {
    return this.getUserCredentials(userId).length > 0;
  }

  /**
   * Inicia tarefas de limpeza
   */
  private startCleanupTasks(): void {
    // Limpa challenges expirados a cada 5 minutos
    setInterval(() => {
      this.cleanupExpiredChallenges();
    }, 5 * 60 * 1000);
  }

  /**
   * Remove challenges expirados
   */
  private cleanupExpiredChallenges(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [challengeString, challenge] of this.challenges.entries()) {
      if (now > challenge.expiry) {
        this.challenges.delete(challengeString);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removidos ${removedCount} challenges expirados`);
    }
  }

  /**
   * Retorna estatísticas das passkeys
   */
  getStats() {
    // Agrupa credenciais por usuário
    const userCredentialCounts = new Map<string, number>();
    
    for (const key of this.credentials.keys()) {
      const userId = key.split(':')[0];
      userCredentialCounts.set(userId, (userCredentialCounts.get(userId) || 0) + 1);
    }

    return {
      totalCredentials: this.credentials.size,
      totalUsers: userCredentialCounts.size,
      activeChallenges: this.challenges.size,
      credentialsPerUser: Object.fromEntries(userCredentialCounts),
      averageCredentialsPerUser: userCredentialCounts.size > 0 
        ? Array.from(userCredentialCounts.values()).reduce((sum, count) => sum + count, 0) / userCredentialCounts.size 
        : 0
    };
  }

  /**
   * Exporta credenciais para backup (sem chaves privadas)
   */
  exportCredentials(): string {
    const exportData = {
      credentials: Object.fromEntries(this.credentials),
      exportTimestamp: Date.now(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importa credenciais de backup
   */
  importCredentials(exportData: string): number {
    try {
      const data = JSON.parse(exportData);
      let importedCount = 0;
      
      if (data.credentials) {
        for (const [key, credential] of Object.entries(data.credentials)) {
          this.credentials.set(key, credential as UserCredential);
          importedCount++;
        }
      }
      
      console.log(`Importadas ${importedCount} credenciais`);
      return importedCount;
      
    } catch (error) {
      console.error('Erro ao importar credenciais:', error);
      return 0;
    }
  }
}