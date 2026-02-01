import * as crypto from 'crypto';
import { nanoid } from 'nanoid';
import { BiometricCredential, AuthChallenge } from '../types';

interface BiometricTemplate {
  id: string;
  userId: string;
  type: 'fingerprint' | 'face' | 'voice' | 'iris';
  template: string;
  publicKey: string;
  privateKey: string;
  created: number;
}

export class BiometricManager {
  private templates: Map<string, BiometricTemplate> = new Map();
  private challenges: Map<string, AuthChallenge> = new Map();

  async registerBiometric(
    userId: string,
    biometricData: string,
    biometricType: 'fingerprint' | 'face' | 'voice' | 'iris'
  ) {
    try {
      const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });

      const template: BiometricTemplate = {
        id: nanoid(),
        userId,
        type: biometricType,
        template: this.encryptBiometricData(biometricData, keyPair.publicKey),
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        created: Date.now()
      };

      this.templates.set(template.id, template);

      return {
        success: true,
        credentialId: template.id,
        publicKey: template.publicKey
      };
    } catch (error) {
      console.error('Erro ao registrar biometria:', error);
      return { success: false, error: 'Falha no registro biométrico' };
    }
  }

  generateBiometricChallenge(userId: string, biometricType: 'fingerprint' | 'face' | 'voice' | 'iris') {
    const userTemplates = this.getUserTemplates(userId, biometricType);
    if (userTemplates.length === 0) {
      return null;
    }

    const challenge: AuthChallenge = {
      id: nanoid(),
      challenge: nanoid(),
      timestamp: Date.now(),
      expiry: Date.now() + 5 * 60 * 1000
    };

    this.challenges.set(challenge.id, challenge);

    return {
      challenge: challenge.challenge,
      challengeId: challenge.id,
      timestamp: challenge.timestamp
    };
  }

  async verifyBiometric(challengeId: string, biometricData: string, signature: string) {
    try {
      const challenge = this.challenges.get(challengeId);
      if (!challenge || Date.now() > challenge.expiry) {
        return { verified: false, error: 'Challenge inválido ou expirado' };
      }

      for (const template of this.templates.values()) {
        if (this.compareBiometricData(biometricData, template.template, template.privateKey)) {
          this.challenges.delete(challengeId);
          return {
            verified: true,
            userId: template.userId,
            credentialId: template.id
          };
        }
      }

      return { verified: false, error: 'Biometria não reconhecida' };
    } catch (error) {
      console.error('Erro ao verificar biometria:', error);
      return { verified: false, error: 'Erro na verificação' };
    }
  }

  listUserCredentials(userId: string): BiometricCredential[] {
    const credentials: BiometricCredential[] = [];
    
    for (const template of this.templates.values()) {
      if (template.userId === userId) {
        credentials.push({
          id: template.id,
          type: template.type,
          publicKey: template.publicKey,
          created: template.created
        });
      }
    }
    
    return credentials;
  }

  hasCredentials(userId: string): boolean {
    return this.listUserCredentials(userId).length > 0;
  }

  removeUserTemplates(userId: string): number {
    let removedCount = 0;
    for (const [id, template] of this.templates.entries()) {
      if (template.userId === userId) {
        this.templates.delete(id);
        removedCount++;
      }
    }
    return removedCount;
  }

  getStats() {
    const templatesByType: Record<string, number> = {};
    const templatesByUser: Record<string, number> = {};

    for (const template of this.templates.values()) {
      templatesByType[template.type] = (templatesByType[template.type] || 0) + 1;
      templatesByUser[template.userId] = (templatesByUser[template.userId] || 0) + 1;
    }

    return {
      totalTemplates: this.templates.size,
      templatesByType,
      templatesByUser,
      activeChallenges: this.challenges.size
    };
  }

  private getUserTemplates(userId: string, biometricType: 'fingerprint' | 'face' | 'voice' | 'iris'): BiometricTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.userId === userId && template.type === biometricType
    );
  }

  private encryptBiometricData(data: string, publicKey: string): string {
    return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString('base64');
  }

  private compareBiometricData(inputData: string, storedTemplate: string, privateKey: string): boolean {
    try {
      const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(storedTemplate, 'base64')).toString();
      return this.calculateSimilarity(inputData, decrypted) > 0.85;
    } catch {
      return false;
    }
  }

  private calculateSimilarity(a: string, b: string): number {
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1;
    
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) matches++;
    }
    
    return matches / maxLength;
  }
}
