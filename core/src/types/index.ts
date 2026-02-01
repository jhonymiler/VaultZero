// Tipos principais para o sistema P2P de identidade descentralizada
export interface Identity {
  id: string;
  publicKey: string;
  timestamp: number;
  signature: string;
  metadata?: {
    deviceInfo?: string;
    location?: string;
    userAgent?: string;
  };
}

export interface LocalLedger {
  identities: Map<string, Identity>;
  lastSync: number;
  version: number;
}

export interface P2PNode {
  id: string;
  address: string;
  port: number;
  publicKey: string;
  lastSeen: number;
  trustScore: number;
}

export interface GossipMessage {
  type: 'identity_announcement' | 'identity_verification' | 'sync_request' | 'sync_response';
  data: any;
  sender: string;
  timestamp: number;
  signature: string;
}

export interface ConsensusState {
  version: number;
  identities: Identity[];
  participants: string[];
  timestamp: number;
}

export interface AuthChallenge {
  id: string;
  challenge: string;
  timestamp: number;
  expiry: number;
}

export interface BiometricCredential {
  id: string;
  type: 'fingerprint' | 'face' | 'voice' | 'iris';
  publicKey: string;
  created: number;
}

export interface PasskeyCredential {
  id: string;
  publicKey: string;
  algorithm: string;
  userHandle: string;
  transports: string[];
}

// Tipos de autenticação
export interface AuthMethod {
  type: 'passkey' | 'biometric';
  credentials: PasskeyCredential[] | BiometricCredential[];
}

export interface DHT {
  store: (key: string, value: any) => Promise<void>;
  get: (key: string) => Promise<any>;
  find: (pattern: string) => Promise<any[]>;
}

export interface SyncState {
  lastSync: number;
  peersConnected: number;
  syncInProgress: boolean;
  totalIdentities: number;
}
