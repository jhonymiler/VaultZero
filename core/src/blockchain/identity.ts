import { nanoid } from 'nanoid';
import { createHash, createSign, createVerify, generateKeyPairSync } from 'crypto';
import { Identity } from '../types/index.js';

export class DecentralizedIdentity {
  private privateKey: string;
  private publicKey: string;
  private id: string;

  constructor() {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    this.id = this.generateDID();
  }

  /**
   * Gera um DID (Decentralized Identifier) único baseado na chave pública
   */
  private generateDID(): string {
    const publicKeyHash = createHash('sha256').update(this.publicKey).digest('hex');
    return `did:p2p:${publicKeyHash.substring(0, 32)}`;
  }

  /**
   * Cria uma nova identidade com assinatura criptográfica
   */
  createIdentity(metadata?: any): Identity {
    const identity: Omit<Identity, 'signature'> = {
      id: this.id,
      publicKey: this.publicKey,
      timestamp: Date.now(),
      metadata
    };

    const dataToSign = JSON.stringify(identity);
    const signature = this.signData(dataToSign);

    return {
      ...identity,
      signature
    };
  }

  /**
   * Assina dados com a chave privada
   */
  private signData(data: string): string {
    const sign = createSign('sha256');
    sign.update(data);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * Verifica a assinatura de uma identidade
   */
  static verifyIdentity(identity: Identity): boolean {
    try {
      const { signature, ...identityData } = identity;
      const dataToVerify = JSON.stringify(identityData);
      
      const verify = createVerify('sha256');
      verify.update(dataToVerify);
      
      return verify.verify(identity.publicKey, signature, 'base64');
    } catch (error) {
      console.error('Erro ao verificar identidade:', error);
      return false;
    }
  }

  /**
   * Gera um hash único para uma identidade
   */
  static getIdentityHash(identity: Identity): string {
    const identityString = JSON.stringify({
      id: identity.id,
      publicKey: identity.publicKey,
      timestamp: identity.timestamp
    });
    return createHash('sha256').update(identityString).digest('hex');
  }

  /**
   * Verifica se duas identidades são a mesma
   */
  static areIdentitiesEqual(id1: Identity, id2: Identity): boolean {
    return this.getIdentityHash(id1) === this.getIdentityHash(id2);
  }

  // Getters
  getPublicKey(): string {
    return this.publicKey;
  }

  getDID(): string {
    return this.id;
  }
}