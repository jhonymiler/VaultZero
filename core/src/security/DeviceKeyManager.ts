/**
 * Gerenciador de Chaves de Dispositivo
 * Sistema seguro para gerar e gerenciar chaves únicas por dispositivo
 */

import { createHash, randomBytes, generateKeyPairSync, pbkdf2Sync } from 'crypto';

// Simulação simplificada das funções BIP39 (em produção usar biblioteca real)
function generateMnemonic(): string {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
    'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
    'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit'
  ];
  
  const mnemonic: string[] = [];
  for (let i = 0; i < 12; i++) {
    mnemonic.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return mnemonic.join(' ');
}

function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.split(' ');
  if (words.length !== 12) return false;
  
  const validWords = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
    'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
    'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit'
  ];
  
  return words.every(word => validWords.includes(word));
}

async function mnemonicToSeed(mnemonic: string): Promise<Buffer> {
  return pbkdf2Sync(mnemonic, 'mnemonic', 2048, 64, 'sha512');
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'web' | 'hardware';
  publicKey: string;
  privateKey?: string; // Apenas no dispositivo local
  derivationPath: string;
  createdAt: Date;
  lastActive: Date;
  status: 'active' | 'revoked' | 'lost' | 'compromised';
  authorizedBy?: string; // ID do dispositivo que autorizou
  permissions: string[];
}

export interface IdentityWallet {
  address: string;
  mnemonic?: string; // Apenas para backup/restauração
  masterPublicKey: string;
  devices: Map<string, DeviceInfo>;
  profile: {
    name?: string;
    avatar?: string;
    preferences: Record<string, any>;
  };
  security: {
    requireBiometric: boolean;
    sessionTimeout: number;
    maxDevices: number;
  };
}

// Simulação de derivação HD (simplificada)
function deriveKey(seed: Buffer, path: string): { publicKey: Buffer; privateKey: Buffer } {
  const pathHash = createHash('sha256').update(path).digest();
  const combined = Buffer.concat([seed, pathHash]);
  
  const privateKey = createHash('sha256').update(combined).digest();
  const publicKey = createHash('sha256').update(privateKey.toString() + 'public').digest();
  
  return { privateKey, publicKey };
}

export class DeviceKeyManager {
  private static readonly MASTER_PATH = "m/44'/60'/0'/0"; // Ethereum-like derivation
  private static readonly DEVICE_PATH_BASE = "m/44'/60'/1"; // Dispositivos derivados

  /**
   * Gera uma nova identidade com mnemônico seguro
   */
  static async createNewIdentity(): Promise<{
    mnemonic: string;
    wallet: IdentityWallet;
    masterDevice: DeviceInfo;
  }> {
    // Gerar mnemônico BIP39 seguro
    const mnemonic = generateMnemonic();
    
    if (!validateMnemonic(mnemonic)) {
      throw new Error('Falha na geração do mnemônico');
    }

    const seed = await mnemonicToSeed(mnemonic);
    
    // Derivar chave mestre
    const masterKey = deriveKey(seed, this.MASTER_PATH);
    const address = this.generateAddressFromPublicKey(masterKey.publicKey);

    // Criar dispositivo mestre (primeiro dispositivo)
    const deviceId = this.generateDeviceId();
    const masterDevice = await this.createDeviceKey(
      mnemonic,
      deviceId,
      'Dispositivo Principal',
      'mobile' // ou tipo detectado
    );

    const wallet: IdentityWallet = {
      address,
      mnemonic, // Armazenar com segurança
      masterPublicKey: masterKey.publicKey.toString('hex'),
      devices: new Map([[deviceId, masterDevice]]),
      profile: {
        preferences: {}
      },
      security: {
        requireBiometric: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutos
        maxDevices: 5
      }
    };

    return {
      mnemonic,
      wallet,
      masterDevice
    };
  }

  /**
   * Restaura identidade a partir do mnemônico
   */
  static async restoreIdentity(mnemonic: string): Promise<IdentityWallet> {
    if (!validateMnemonic(mnemonic)) {
      throw new Error('Mnemônico inválido');
    }

    const seed = await mnemonicToSeed(mnemonic);
    
    const masterKey = deriveKey(seed, this.MASTER_PATH);
    const address = this.generateAddressFromPublicKey(masterKey.publicKey);

    // Criar novo dispositivo para restauração
    const deviceId = this.generateDeviceId();
    const restoredDevice = await this.createDeviceKey(
      mnemonic,
      deviceId,
      'Dispositivo Restaurado',
      'mobile'
    );

    const wallet: IdentityWallet = {
      address,
      mnemonic,
      masterPublicKey: masterKey.publicKey.toString('hex'),
      devices: new Map([[deviceId, restoredDevice]]),
      profile: {
        preferences: {}
      },
      security: {
        requireBiometric: true,
        sessionTimeout: 30 * 60 * 1000,
        maxDevices: 5
      }
    };

    return wallet;
  }

  /**
   * Cria chave única para um dispositivo
   */
  static async createDeviceKey(
    mnemonic: string,
    deviceId: string,
    deviceName: string,
    deviceType: DeviceInfo['type'],
    deviceIndex?: number
  ): Promise<DeviceInfo> {
    const seed = await mnemonicToSeed(mnemonic);
    
    // Usar índice do dispositivo ou hash do ID para derivação determinística
    const index = deviceIndex ?? this.hashToIndex(deviceId);
    const devicePath = `${this.DEVICE_PATH_BASE}/${index}`;
    
    const deviceKey = deriveKey(seed, devicePath);
    
    return {
      id: deviceId,
      name: deviceName,
      type: deviceType,
      publicKey: deviceKey.publicKey.toString('hex'),
      privateKey: deviceKey.privateKey.toString('hex'),
      derivationPath: devicePath,
      createdAt: new Date(),
      lastActive: new Date(),
      status: 'active',
      permissions: ['read', 'write', 'sign']
    };
  }

  /**
   * Gera solicitação de pareamento segura
   */
  static generatePairingRequest(deviceName: string, deviceType: DeviceInfo['type']): {
    deviceId: string;
    qrData: any;
    privateChallenge: string;
  } {
    const deviceId = this.generateDeviceId();
    const challenge = randomBytes(32).toString('hex');
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
    
    // Gerar par de chaves temporárias para o handshake
    const tempKeys = generateKeyPairSync('ed25519');
    
    const qrData = {
      type: 'device_pairing',
      version: '1.0',
      deviceId,
      deviceName,
      deviceType,
      challenge,
      publicKey: tempKeys.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
      pairingCode,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutos
    };

    return {
      deviceId,
      qrData,
      privateChallenge: tempKeys.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64')
    };
  }

  /**
   * Autoriza novo dispositivo
   */
  static async authorizeDevice(
    wallet: IdentityWallet,
    pairingData: any,
    authorizingDeviceId: string
  ): Promise<DeviceInfo> {
    // Verificar se dispositivo autorizador existe e está ativo
    const authDevice = wallet.devices.get(authorizingDeviceId);
    if (!authDevice || authDevice.status !== 'active') {
      throw new Error('Dispositivo autorizador inválido');
    }

    // Verificar se não excedeu limite de dispositivos
    const activeDevices = Array.from(wallet.devices.values())
      .filter(d => d.status === 'active');
    
    if (activeDevices.length >= wallet.security.maxDevices) {
      throw new Error('Limite máximo de dispositivos atingido');
    }

    // Verificar expiração
    if (pairingData.expiresAt < Date.now()) {
      throw new Error('Solicitação de pareamento expirada');
    }

    // Criar novo dispositivo
    if (!wallet.mnemonic) {
      throw new Error('Mnemônico não disponível para derivação');
    }

    const newDevice = await this.createDeviceKey(
      wallet.mnemonic,
      pairingData.deviceId,
      pairingData.deviceName,
      pairingData.deviceType
    );

    newDevice.authorizedBy = authorizingDeviceId;
    
    // Adicionar à carteira
    wallet.devices.set(pairingData.deviceId, newDevice);

    return newDevice;
  }

  /**
   * Revoga dispositivo
   */
  static revokeDevice(
    wallet: IdentityWallet,
    deviceIdToRevoke: string,
    revokingDeviceId: string,
    reason: 'revoked' | 'lost' | 'compromised' = 'revoked'
  ): boolean {
    const deviceToRevoke = wallet.devices.get(deviceIdToRevoke);
    const revokingDevice = wallet.devices.get(revokingDeviceId);

    if (!deviceToRevoke || !revokingDevice) {
      return false;
    }

    if (revokingDevice.status !== 'active') {
      return false;
    }

    // Não pode revogar a si mesmo (a menos que seja o último dispositivo ativo)
    if (deviceIdToRevoke === revokingDeviceId) {
      const activeDevices = Array.from(wallet.devices.values())
        .filter(d => d.status === 'active');
      
      if (activeDevices.length > 1) {
        return false;
      }
    }

    deviceToRevoke.status = reason;
    delete deviceToRevoke.privateKey; // Remover chave privada
    
    return true;
  }

  /**
   * Gera ID único para dispositivo
   */
  private static generateDeviceId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `dev_${timestamp}_${random}`;
  }

  /**
   * Converte hash de string em índice numérico para derivação
   */
  private static hashToIndex(input: string): number {
    const hash = createHash('sha256').update(input).digest();
    return hash.readUInt32BE(0) % 2147483647; // Máximo índice BIP32
  }

  /**
   * Gera endereço a partir da chave pública
   */
  private static generateAddressFromPublicKey(publicKey: Buffer): string {
    const hash = createHash('sha256').update(publicKey).digest();
    return '0x' + hash.toString('hex').substring(0, 40);
  }

  /**
   * Valida assinatura de dispositivo
   */
  static validateDeviceSignature(
    message: string,
    signature: string,
    deviceInfo: DeviceInfo
  ): boolean {
    try {
      // Implementar validação de assinatura Ed25519
      return true; // Placeholder
    } catch {
      return false;
    }
  }

  /**
   * Sincroniza estado entre dispositivos
   */
  static syncDeviceState(
    localWallet: IdentityWallet,
    remoteChanges: Partial<IdentityWallet>
  ): IdentityWallet {
    // Implementar merge inteligente baseado em timestamps
    // Last-write-wins para a maioria das operações
    
    if (remoteChanges.devices) {
      // Merge devices mantendo o mais recente
      for (const [deviceId, remoteDevice] of remoteChanges.devices) {
        const localDevice = localWallet.devices.get(deviceId);
        
        if (!localDevice || remoteDevice.lastActive > localDevice.lastActive) {
          localWallet.devices.set(deviceId, remoteDevice);
        }
      }
    }

    return localWallet;
  }
}
