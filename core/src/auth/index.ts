export { PasskeyManager } from './passkey.js';
export { BiometricManager } from './biometric.js';

import { PasskeyManager } from './passkey.js';
import { BiometricManager } from './biometric.js';
import { DecentralizedIdentity } from '../blockchain/identity.js';
import { Identity, AuthMethod } from '../types/index.js';

export class AuthenticationManager {
  private passkeyManager: PasskeyManager;
  private biometricManager: BiometricManager;
  private identity: DecentralizedIdentity;

  constructor() {
    this.passkeyManager = new PasskeyManager();
    this.biometricManager = new BiometricManager();
    this.identity = new DecentralizedIdentity();
  }

  /**
   * Registra uma nova conta com passkey
   */
  async registerWithPasskey(userId: string, userName: string, userDisplayName: string) {
    try {
      // Gera opções de registro
      const { options, challengeId } = await this.passkeyManager.generateRegistrationOptions(
        userId,
        userName,
        userDisplayName
      );

      return {
        success: true,
        registrationOptions: options,
        challengeId,
        identityDID: this.identity.getDID()
      };
    } catch (error) {
      console.error('Erro ao registrar com passkey:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Completa o registro com passkey
   */
  async completePasskeyRegistration(userId: string, response: any) {
    try {
      const result = await this.passkeyManager.verifyRegistration(userId, response);
      
      if (result.verified && result.credential) {
        // Cria identidade descentralizada
        const identity = this.identity.createIdentity({
          userId,
          credentialType: 'passkey',
          credentialId: result.credential.id,
          deviceInfo: this.getDeviceInfo()
        });

        return {
          success: true,
          identity,
          credential: result.credential
        };
      }

      return { success: false, error: 'Falha na verificação da passkey' };
    } catch (error) {
      console.error('Erro ao completar registro:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Registra biometria para um usuário
   */
  async registerBiometric(
    userId: string,
    biometricData: string,
    biometricType: 'fingerprint' | 'face' | 'voice' | 'iris'
  ) {
    try {
      const result = await this.biometricManager.registerBiometric(
        userId,
        biometricData,
        biometricType
      );

      if (result.success) {
        // Cria identidade descentralizada para biometria
        const identity = this.identity.createIdentity({
          userId,
          credentialType: 'biometric',
          biometricType,
          credentialId: result.credentialId,
          deviceInfo: this.getDeviceInfo()
        });

        return {
          success: true,
          identity,
          credentialId: result.credentialId,
          publicKey: result.publicKey
        };
      }

      return { success: false, error: 'Falha ao registrar biometria' };
    } catch (error) {
      console.error('Erro ao registrar biometria:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Autentica com passkey
   */
  async authenticateWithPasskey(userId?: string) {
    try {
      // Gera opções de autenticação
      const { options, challengeId } = await this.passkeyManager.generateAuthenticationOptions(userId);

      return {
        success: true,
        authenticationOptions: options,
        challengeId
      };
    } catch (error) {
      console.error('Erro ao autenticar com passkey:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Completa autenticação com passkey
   */
  async completePasskeyAuthentication(response: any) {
    try {
      const result = await this.passkeyManager.verifyAuthentication(response);
      
      if (result.verified && result.userId) {
        // Cria sessão de identidade
        const identity = this.identity.createIdentity({
          userId: result.userId,
          credentialType: 'passkey',
          credentialId: result.credential?.id,
          sessionId: this.generateSessionId(),
          deviceInfo: this.getDeviceInfo()
        });

        return {
          success: true,
          userId: result.userId,
          identity,
          credential: result.credential
        };
      }

      return { success: false, error: 'Falha na autenticação' };
    } catch (error) {
      console.error('Erro ao completar autenticação:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Autentica com biometria
   */
  async authenticateWithBiometric(
    userId: string,
    biometricType: 'fingerprint' | 'face' | 'voice' | 'iris'
  ) {
    try {
      // Gera desafio biométrico
      const challenge = this.biometricManager.generateBiometricChallenge(userId, biometricType);
      
      if (!challenge) {
        return { success: false, error: 'Usuário não possui biometria registrada' };
      }

      return {
        success: true,
        challenge: challenge.challenge,
        challengeId: challenge.challengeId,
        timestamp: challenge.timestamp
      };
    } catch (error) {
      console.error('Erro ao autenticar com biometria:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Completa autenticação biométrica
   */
  async completeBiometricAuthentication(
    challengeId: string,
    biometricData: string,
    signature: string
  ) {
    try {
      const result = await this.biometricManager.verifyBiometric(
        challengeId,
        biometricData,
        signature
      );

      if (result.verified && result.userId) {
        // Cria sessão de identidade
        const identity = this.identity.createIdentity({
          userId: result.userId,
          credentialType: 'biometric',
          credentialId: result.credentialId,
          sessionId: this.generateSessionId(),
          deviceInfo: this.getDeviceInfo()
        });

        return {
          success: true,
          userId: result.userId,
          identity,
          credentialId: result.credentialId
        };
      }

      return { success: false, error: 'Falha na verificação biométrica' };
    } catch (error) {
      console.error('Erro ao completar autenticação biométrica:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Lista métodos de autenticação disponíveis para um usuário
   */
  getAvailableAuthMethods(userId: string) {
    const methods: AuthMethod[] = [];

    if (this.passkeyManager.hasCredentials(userId)) {
      methods.push({
        type: 'passkey',
        credentials: this.passkeyManager.listUserCredentials(userId)
      } as AuthMethod);
    }

    if (this.biometricManager.hasCredentials(userId)) {
      methods.push({
        type: 'biometric',
        credentials: this.biometricManager.listUserCredentials(userId)
      } as AuthMethod);
    }

    return {
      userId,
      availableMethods: methods,
      totalMethods: methods.length
    };
  }

  /**
   * Remove todas as credenciais de um usuário
   */
  removeUserCredentials(userId: string) {
    const passkeyCount = this.passkeyManager.removeUserCredentials(userId);
    const biometricCount = this.biometricManager.removeUserTemplates(userId);

    return {
      success: true,
      removedPasskeys: passkeyCount,
      removedBiometrics: biometricCount,
      totalRemoved: passkeyCount + biometricCount
    };
  }

  /**
   * Retorna estatísticas de autenticação
   */
  getAuthStats() {
    const passkeyStats = this.passkeyManager.getStats();
    const biometricStats = this.biometricManager.getStats();

    return {
      passkeys: passkeyStats,
      biometrics: biometricStats,
      totalUsers: new Set([
        ...Object.keys(passkeyStats.credentialsPerUser || {}),
        ...Object.keys(biometricStats.templatesByType || {})
      ]).size,
      identityDID: this.identity.getDID()
    };
  }

  /**
   * Gera ID de sessão único
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Obtém informações do dispositivo
   */
  private getDeviceInfo(): string {
    // Em um ambiente real, coletaria informações do dispositivo
    return `device_${process.platform}_${Date.now()}`;
  }

  /**
   * Obtém os gerenciadores internos (para uso avançado)
   */
  getManagers() {
    return {
      passkey: this.passkeyManager,
      biometric: this.biometricManager,
      identity: this.identity
    };
  }
}