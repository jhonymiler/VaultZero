/**
 * Storage Seguro para Dispositivos
 * Gerencia armazenamento criptografado de chaves e dados sensíveis
 */

import { createCipher, createDecipher, randomBytes, pbkdf2Sync } from 'crypto';
import { DeviceInfo, IdentityWallet } from './DeviceKeyManager';

export interface SecureStorageConfig {
  encryptionAlgorithm: string;
  keyDerivationRounds: number;
  saltLength: number;
  storageVersion: string;
}

export class SecureDeviceStorage {
  private static readonly CONFIG: SecureStorageConfig = {
    encryptionAlgorithm: 'aes-256-gcm',
    keyDerivationRounds: 100000,
    saltLength: 32,
    storageVersion: '1.0'
  };

  /**
   * Armazena wallet com criptografia baseada em biometria/PIN
   */
  static async storeWallet(
    wallet: IdentityWallet,
    deviceId: string,
    authKey: string // Derivado de biometria ou PIN
  ): Promise<string> {
    // Remover dados sensíveis antes de armazenar
    const safeWallet = this.sanitizeForStorage(wallet, deviceId);
    
    // Gerar salt único
    const salt = randomBytes(this.CONFIG.saltLength);
    
    // Derivar chave de criptografia
    const encryptionKey = pbkdf2Sync(
      authKey,
      salt,
      this.CONFIG.keyDerivationRounds,
      32,
      'sha256'
    );

    // Criptografar dados
    const encrypted = await this.encrypt(JSON.stringify(safeWallet), encryptionKey);
    
    // Criar envelope de storage
    const envelope = {
      version: this.CONFIG.storageVersion,
      deviceId,
      salt: salt.toString('base64'),
      data: encrypted,
      timestamp: Date.now()
    };

    return JSON.stringify(envelope);
  }

  /**
   * Recupera wallet do storage criptografado
   */
  static async retrieveWallet(
    encryptedData: string,
    deviceId: string,
    authKey: string
  ): Promise<IdentityWallet> {
    const envelope = JSON.parse(encryptedData);
    
    // Verificar versão e deviceId
    if (envelope.version !== this.CONFIG.storageVersion) {
      throw new Error('Versão de storage incompatível');
    }
    
    if (envelope.deviceId !== deviceId) {
      throw new Error('Device ID não confere');
    }

    // Derivar chave de descriptografia
    const salt = Buffer.from(envelope.salt, 'base64');
    const decryptionKey = pbkdf2Sync(
      authKey,
      salt,
      this.CONFIG.keyDerivationRounds,
      32,
      'sha256'
    );

    // Descriptografar dados
    const decrypted = await this.decrypt(envelope.data, decryptionKey);
    const wallet: IdentityWallet = JSON.parse(decrypted);
    
    // Reconstruir Map de devices
    if (wallet.devices && Array.isArray(wallet.devices)) {
      wallet.devices = new Map(wallet.devices as any);
    }

    return wallet;
  }

  /**
   * Armazena apenas dados do dispositivo local
   */
  static async storeDeviceData(
    deviceInfo: DeviceInfo,
    authKey: string
  ): Promise<string> {
    const salt = randomBytes(this.CONFIG.saltLength);
    const encryptionKey = pbkdf2Sync(authKey, salt, this.CONFIG.keyDerivationRounds, 32, 'sha256');
    
    // Incluir chave privada apenas no dispositivo local
    const deviceData = {
      ...deviceInfo,
      lastStored: Date.now()
    };

    const encrypted = await this.encrypt(JSON.stringify(deviceData), encryptionKey);
    
    const envelope = {
      version: this.CONFIG.storageVersion,
      type: 'device_data',
      deviceId: deviceInfo.id,
      salt: salt.toString('base64'),
      data: encrypted,
      timestamp: Date.now()
    };

    return JSON.stringify(envelope);
  }

  /**
   * Remove dados sensíveis para armazenamento/sincronização
   */
  private static sanitizeForStorage(wallet: IdentityWallet, currentDeviceId: string): any {
    const safeWallet = { ...wallet };
    
    // Remover mnemônico (apenas para backup offline)
    delete safeWallet.mnemonic;
    
    // Converter Map para Array para serialização
    const devicesArray = Array.from(wallet.devices.entries()).map(([id, device]) => {
      const safeDevice = { ...device };
      
      // Remover chave privada de outros dispositivos
      if (id !== currentDeviceId) {
        delete safeDevice.privateKey;
      }
      
      return [id, safeDevice];
    });
    
    return {
      ...safeWallet,
      devices: devicesArray
    };
  }

  /**
   * Criptografia AES-GCM
   */
  private static async encrypt(data: string, key: Buffer): Promise<string> {
    const iv = randomBytes(16);
    const cipher = createCipher(this.CONFIG.encryptionAlgorithm, key);
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return JSON.stringify({
      iv: iv.toString('base64'),
      data: encrypted
    });
  }

  /**
   * Descriptografia AES-GCM
   */
  private static async decrypt(encryptedData: string, key: Buffer): Promise<string> {
    const { iv, data } = JSON.parse(encryptedData);
    const decipher = createDecipher(this.CONFIG.encryptionAlgorithm, key);
    
    let decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Backup seguro do mnemônico
   */
  static async createMnemonicBackup(
    mnemonic: string,
    password: string
  ): Promise<string> {
    const salt = randomBytes(32);
    const key = pbkdf2Sync(password, salt, this.CONFIG.keyDerivationRounds * 2, 32, 'sha256');
    
    const encrypted = await this.encrypt(mnemonic, key);
    
    return JSON.stringify({
      type: 'mnemonic_backup',
      version: this.CONFIG.storageVersion,
      salt: salt.toString('base64'),
      data: encrypted,
      createdAt: Date.now()
    });
  }

  /**
   * Restaura mnemônico do backup
   */
  static async restoreMnemonicBackup(
    backupData: string,
    password: string
  ): Promise<string> {
    const backup = JSON.parse(backupData);
    
    if (backup.type !== 'mnemonic_backup') {
      throw new Error('Tipo de backup inválido');
    }
    
    const salt = Buffer.from(backup.salt, 'base64');
    const key = pbkdf2Sync(password, salt, this.CONFIG.keyDerivationRounds * 2, 32, 'sha256');
    
    return await this.decrypt(backup.data, key);
  }

  /**
   * Limpa dados sensíveis da memória
   */
  static secureDelete(obj: any): void {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
          // Sobrescrever string com dados aleatórios
          obj[key] = randomBytes(obj[key].length).toString('hex');
        }
        delete obj[key];
      });
    }
  }

  /**
   * Gera chave de autenticação a partir de biometria (simulado)
   */
  static async deriveAuthKeyFromBiometric(
    biometricData: string, // Hash da biometria
    deviceId: string
  ): Promise<string> {
    // Em produção, usar dados biométricos reais
    const combined = `${biometricData}:${deviceId}:${this.CONFIG.storageVersion}`;
    return pbkdf2Sync(combined, 'biometric_salt', 50000, 32, 'sha256').toString('hex');
  }

  /**
   * Migração de versões de storage
   */
  static async migrateStorage(
    oldData: string,
    fromVersion: string,
    toVersion: string
  ): Promise<string> {
    // Implementar migrações de schema conforme necessário
    if (fromVersion === '0.9' && toVersion === '1.0') {
      // Exemplo de migração
      const parsed = JSON.parse(oldData);
      parsed.version = '1.0';
      // Aplicar transformações necessárias
      return JSON.stringify(parsed);
    }
    
    throw new Error(`Migração não suportada: ${fromVersion} -> ${toVersion}`);
  }
}
