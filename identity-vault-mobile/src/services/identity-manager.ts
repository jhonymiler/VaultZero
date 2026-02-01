import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { CryptoService } from './crypto';

// Interfaces baseadas na especificação técnica
export interface BlockchainIdentity {
  address: string;
  derivationPath: string;
  publicKey: string;
  devices: {
    [deviceId: string]: {
      name: string;
      addedAt: Date;
      lastSync: Date;
      publicKey: string;
    }
  };
  profile: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: string;
  };
  permissions: {
    [siteUrl: string]: {
      allowedFields: string[];
      grantedAt: Date;
      expiresAt?: Date;
      autoLogin: boolean;
    }
  };
}

export interface BiometricData {
  isEnrolled: boolean;
  type: 'fingerprint' | 'facial' | 'none';
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  modelName: string;
  osVersion: string;
}

// Chaves para armazenamento
const KEYS = {
  IDENTITY: 'identity',
  MNEMONIC: 'secure_mnemonic',
  DEVICE_ID: 'device_id',
  BIOMETRIC_ENROLLED: 'biometric_enrolled'
};

class IdentityManager {
  private identity: BlockchainIdentity | null = null;
  private deviceId: string | null = null;
  private cryptoService: CryptoService;
  
  constructor() {
    this.cryptoService = new CryptoService();
  }
  
  // Inicializa o gerenciador de identidade
  async initialize(): Promise<boolean> {
    try {
      // Carregar identidade do armazenamento
      const identityJson = await AsyncStorage.getItem(KEYS.IDENTITY);
      if (identityJson) {
        this.identity = JSON.parse(identityJson);
      }
      
      // Carregar ou gerar ID do dispositivo
      const storedDeviceId = await AsyncStorage.getItem(KEYS.DEVICE_ID);
      if (storedDeviceId) {
        this.deviceId = storedDeviceId;
      } else {
        this.deviceId = await this.generateDeviceId();
        await AsyncStorage.setItem(KEYS.DEVICE_ID, this.deviceId);
      }
      
      return !!this.identity;
    } catch (error) {
      console.error('Error initializing identity manager:', error);
      return false;
    }
  }
  
  // Verifica se existe uma identidade armazenada
  hasIdentity(): boolean {
    return !!this.identity;
  }
  
  // Gera um ID único para o dispositivo
  private async generateDeviceId(): Promise<string> {
    return CryptoService.generateDeviceId();
  }
  
  // Gera um conjunto de palavras mnemônicas (12 palavras)
  async generateMnemonic(): Promise<string> {
    try {
      return CryptoService.generateMnemonic();
    } catch (error) {
      console.error('Error generating mnemonic:', error);
      throw new Error('Falha ao gerar palavras de recuperação');
    }
  }
  
  // Cria uma nova identidade
  async createIdentity(name: string, deviceName: string): Promise<BlockchainIdentity> {
    try {
      if (!this.deviceId) {
        throw new Error('Device ID not initialized');
      }
      
      // Gera mnemônico
      const mnemonic = await this.generateMnemonic();
      
      // Gera par de chaves a partir do mnemônico
      const keyPair = await this.generateKeyPair(mnemonic);
      
      // Salva mnemônico de forma segura
      await this.secureSaveMnemonic(mnemonic);
      
      // Cria objeto de identidade
      const now = new Date();
      this.identity = {
        address: `0x${keyPair.address}`,
        derivationPath: "m/44'/60'/0'/0/0",
        publicKey: keyPair.publicKey,
        devices: {
          [this.deviceId]: {
            name: deviceName,
            addedAt: now,
            lastSync: now,
            publicKey: keyPair.publicKey
          }
        },
        profile: {
          name: name
        },
        permissions: {}
      };
      
      // Salva identidade
      await this.saveIdentity();
      
      return this.identity;
    } catch (error) {
      console.error('Error creating identity 1:', error);
      throw new Error('Falha ao criar identidade');
    }
  }
  
  // Restaura uma identidade a partir das palavras mnemônicas
  async restoreIdentity(mnemonic: string, name: string, deviceName: string): Promise<BlockchainIdentity> {
    try {
      if (!this.deviceId) {
        throw new Error('Device ID not initialized');
      }
      
      // Valida mnemônico
      this.validateMnemonic(mnemonic);
      
      // Gera par de chaves a partir do mnemônico
      const keyPair = await this.generateKeyPair(mnemonic);
      
      // Salva mnemônico de forma segura
      await this.secureSaveMnemonic(mnemonic);
      
      // Cria objeto de identidade
      const now = new Date();
      this.identity = {
        address: `0x${keyPair.address}`,
        derivationPath: "m/44'/60'/0'/0/0",
        publicKey: keyPair.publicKey,
        devices: {
          [this.deviceId]: {
            name: deviceName,
            addedAt: now,
            lastSync: now,
            publicKey: keyPair.publicKey
          }
        },
        profile: {
          name: name
        },
        permissions: {}
      };
      
      // Salva identidade
      await this.saveIdentity();
      
      return this.identity;
    } catch (error) {
      console.error('Error restoring identity:', error);
      throw new Error('Falha ao restaurar identidade');
    }
  }
  
  // Salva identidade no armazenamento
  private async saveIdentity(): Promise<void> {
    if (this.identity) {
      await AsyncStorage.setItem(KEYS.IDENTITY, JSON.stringify(this.identity));
    }
  }
  
  // Salva mnemônico de forma segura
  private async secureSaveMnemonic(mnemonic: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.MNEMONIC, mnemonic);
  }
  
  // Recupera mnemônico de forma segura (requer autenticação)
  async getSecureMnemonic(): Promise<string> {
    const hasBiometrics = await LocalAuthentication.hasHardwareAsync();
    
    if (hasBiometrics) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar para acessar palavras de recuperação',
        disableDeviceFallback: false,
        cancelLabel: 'Cancelar'
      });
      
      if (result.success) {
        const mnemonic = await SecureStore.getItemAsync(KEYS.MNEMONIC);
        if (!mnemonic) {
          throw new Error('Mnemônico não encontrado');
        }
        return mnemonic;
      } else {
        throw new Error('Autenticação cancelada');
      }
    } else {
      // Se não há biometria, ainda retorna o mnemônico (para desenvolvimento)
      const mnemonic = await SecureStore.getItemAsync(KEYS.MNEMONIC);
      if (!mnemonic) {
        throw new Error('Mnemônico não encontrado');
      }
      return mnemonic;
    }
  }
  
  // Gera par de chaves a partir do mnemônico
  private async generateKeyPair(mnemonic: string): Promise<{address: string, publicKey: string, privateKey: string}> {
    try {
      return CryptoService.generateKeyPairFromMnemonic(mnemonic);
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error('Falha ao gerar par de chaves');
    }
  }
  
  // Valida se um mnemônico é válido
  validateMnemonic(mnemonic: string): boolean {
    try {
      return CryptoService.validateMnemonic(mnemonic);
    } catch (error) {
      throw new Error('Formato inválido. Deve conter exatamente 12 palavras BIP39 válidas.');
    }
  }
  
  // Configura biometria
  async setupBiometric(): Promise<BiometricData> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return {
          isEnrolled: false,
          type: 'none'
        };
      }
      
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return {
          isEnrolled: false,
          type: 'none'
        };
      }
      
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFingerprint = types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
      const hasFacial = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      
      const type = hasFacial ? 'facial' : (hasFingerprint ? 'fingerprint' : 'none');
      
      await AsyncStorage.setItem(KEYS.BIOMETRIC_ENROLLED, 'true');
      
      return {
        isEnrolled: true,
        type
      };
    } catch (error) {
      console.error('Error setting up biometrics:', error);
      return {
        isEnrolled: false,
        type: 'none'
      };
    }
  }
  
  // Verifica se o dispositivo tem biometria configurada
  async hasBiometricSetup(): Promise<boolean> {
    const stored = await AsyncStorage.getItem(KEYS.BIOMETRIC_ENROLLED);
    return stored === 'true';
  }
  
  // Atualiza informações de perfil
  async updateProfile(profile: Partial<BlockchainIdentity['profile']>): Promise<void> {
    if (!this.identity) {
      throw new Error('Identidade não inicializada');
    }
    
    this.identity.profile = {
      ...this.identity.profile,
      ...profile
    };
    
    await this.saveIdentity();
  }
  
  // Recupera informações da identidade atual
  getIdentity(): BlockchainIdentity | null {
    return this.identity;
  }
  
  // Limpar identidade (logout) - não implementado, pois seria um soft logout
  
  // Obter lista de dispositivos
  getDevices(): {id: string, name: string, addedAt: Date, lastSync: Date}[] {
    if (!this.identity) {
      return [];
    }
    
    return Object.entries(this.identity.devices).map(([id, device]) => ({
      id,
      name: device.name,
      addedAt: new Date(device.addedAt),
      lastSync: new Date(device.lastSync)
    }));
  }
  
  // Remover dispositivo
  async removeDevice(deviceId: string): Promise<boolean> {
    if (!this.identity || !this.identity.devices[deviceId]) {
      return false;
    }
    
    // Não permite remover o dispositivo atual
    if (deviceId === this.deviceId) {
      throw new Error('Não é possível remover o dispositivo atual');
    }
    
    delete this.identity.devices[deviceId];
    await this.saveIdentity();
    
    return true;
  }
  
  // Gerenciar permissões de sites
  async grantPermission(
    siteUrl: string, 
    fields: string[], 
    autoLogin: boolean = false,
    expirationDays?: number
  ): Promise<void> {
    if (!this.identity) {
      throw new Error('Identidade não inicializada');
    }
    
    const now = new Date();
    let expiresAt: Date | undefined = undefined;
    
    if (expirationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
    }
    
    this.identity.permissions[siteUrl] = {
      allowedFields: fields,
      grantedAt: now,
      expiresAt,
      autoLogin
    };
    
    await this.saveIdentity();
  }
  
  // Revogar permissão de um site
  async revokePermission(siteUrl: string): Promise<void> {
    if (!this.identity || !this.identity.permissions[siteUrl]) {
      return;
    }
    
    delete this.identity.permissions[siteUrl];
    await this.saveIdentity();
  }
  
  // Obter permissões
  getPermissions(): {site: string, fields: string[], grantedAt: Date, expiresAt?: Date, autoLogin: boolean}[] {
    if (!this.identity) {
      return [];
    }
    
    return Object.entries(this.identity.permissions).map(([site, permission]) => ({
      site,
      fields: permission.allowedFields,
      grantedAt: new Date(permission.grantedAt),
      expiresAt: permission.expiresAt ? new Date(permission.expiresAt) : undefined,
      autoLogin: permission.autoLogin
    }));
  }
}

export const identityManager = new IdentityManager();
