// Types for VaultZero Mobile App

export interface BlockchainIdentity {
  address: string;           // "0x742d35Cc..." (chave pública derivada)
  mnemonic?: string;         // 12 palavras BIP39 (apenas local, criptografado)
  derivationPath: string;    // "m/44'/60'/0'/0/0" (padrão Ethereum)
  publicKey: string;         // Para verificação de assinaturas
  privateKey?: string;       // Chave privada (apenas local, criptografado)
  
  devices: {
    [deviceId: string]: {
      name: string;           // "iPhone-João", "PC-Casa"
      addedAt: Date;
      lastSync: Date;
      publicKey: string;
    }
  };
  
  profile: {
    [key: string]: string | undefined;    // Permite campos dinâmicos
    name?: string;
    email?: string;
    phone?: string;
    document?: string;        // CPF/Passport (criptografado)
    address?: string;         // Endereço físico (criptografado)
    cpf?: string;
    birthDate?: string;
    gender?: string;
    occupation?: string;
  };
  
  permissions: {
    [siteUrl: string]: {
      allowedFields: string[];
      fields?: string[];        // Compatibilidade
      grantedAt: string;        // Mudado para string
      lastUsed?: string;        // Novo campo
      expiresAt?: Date;
      autoLogin: boolean;
      siteMetadata?: any;       // Metadados do site
    }
  };
}

export interface BiometricTemplate {
  id: string;
  template: string;         // Template biométrico criptografado
  type: 'fingerprint' | 'face';
  deviceId: string;
  createdAt: Date;
}

export interface P2PNode {
  id: string;
  address: string;
  port: number;
  publicKey: string;
  isBootstrap: boolean;
  lastSeen: Date;
}

export interface AuthenticationSession {
  sessionId: string;
  siteUrl: string;
  challenge: string;
  expiresAt: Date;
  requiredFields: string[];
}

export interface QRCodeData {
  type: 'auth' | 'device-pair' | 'identity-share';
  data: {
    sessionId?: string;
    challenge?: string;
    siteUrl?: string;
    deviceName?: string;
    publicKey?: string;
    nodeEndpoint?: string;
  };
}

export interface SyncStatus {
  isConnected: boolean;
  connectedPeers: number;
  lastSync: Date | null;
  pendingTransactions: number;
}

export interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'web';
  addedAt: Date;
  lastSync: Date;
  publicKey: string;
  isCurrentDevice?: boolean;
}

export interface AuthRequest {
  siteUrl: string;
  requestId: string;
  challenge: string;
  requestedFields: string[];
}
