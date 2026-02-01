/**
 * Configuração P2P para VaultZero Mobile
 * Todas as variáveis vêm do .env para facilitar ajustes sem recompilação
 */

// Helper para converter string env para number com fallback
const getEnvNumber = (key: string, fallback: number): number => {
  const value = process.env[key];
  const parsed = value ? parseInt(value, 10) : NaN;
  return isNaN(parsed) ? fallback : parsed;
};

// Helper para converter string env para boolean com fallback
const getEnvBoolean = (key: string, fallback: boolean): boolean => {
  const value = process.env[key];
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
};

export const P2P_CONFIG = {
  // Core Node Configuration (bootstrap node para entrada na rede DHT)
  CORE_NODE: {
    ID: process.env.EXPO_PUBLIC_CORE_NODE_ID || 'vault-node-core-1',
    HOST: process.env.EXPO_PUBLIC_CORE_NODE_HOST || '192.168.15.7',
    P2P_PORT: getEnvNumber('EXPO_PUBLIC_CORE_NODE_P2P_PORT', 8087),
  },

  // Mobile Node Configuration
  MOBILE_NODE: {
    ID_PREFIX: process.env.EXPO_PUBLIC_MOBILE_NODE_ID_PREFIX || 'mobile',
  },

  // DHT Configuration (otimizado para 2 peers)
  DHT: {
    REPLICATION_FACTOR: getEnvNumber('EXPO_PUBLIC_DHT_REPLICATION_FACTOR', 1), // Apenas 1 replica para 2 peers
    BUCKET_SIZE: getEnvNumber('EXPO_PUBLIC_DHT_BUCKET_SIZE', 5),
    TTL_HOURS: getEnvNumber('EXPO_PUBLIC_DHT_TTL_HOURS', 24),
    QUERY_TIMEOUT_MS: getEnvNumber('EXPO_PUBLIC_DHT_QUERY_TIMEOUT_MS', 8000),
    STORE_TIMEOUT_MS: getEnvNumber('EXPO_PUBLIC_DHT_STORE_TIMEOUT_MS', 10000),
    MAINTENANCE_INTERVAL_MS: getEnvNumber('EXPO_PUBLIC_DHT_MAINTENANCE_INTERVAL_MS', 30000),
  },

  // Gossip Protocol Configuration (otimizado para 2 peers)
  GOSSIP: {
    FANOUT: getEnvNumber('EXPO_PUBLIC_GOSSIP_FANOUT', 1), // Apenas 1 peer para propagar
    INTERVAL_MS: getEnvNumber('EXPO_PUBLIC_GOSSIP_INTERVAL_MS', 15000),
    MESSAGE_TTL_MS: getEnvNumber('EXPO_PUBLIC_GOSSIP_MESSAGE_TTL_MS', 1800000), // 30 min
    MAX_CACHE_SIZE: getEnvNumber('EXPO_PUBLIC_GOSSIP_MAX_CACHE_SIZE', 200),
    HEARTBEAT_INTERVAL_MS: getEnvNumber('EXPO_PUBLIC_GOSSIP_HEARTBEAT_INTERVAL_MS', 10000),
  },

  // DHT Key Space Configuration (como realmente funciona)
  DHT_KEYSPACE: {
    // Espaço de chaves de 160 bits (como no Kademlia/BitTorrent)
    KEYSPACE_SIZE: 160, // bits
    BUCKET_COUNT: 160, // buckets k-ary
    ALPHA: 3, // Parallelismo nas queries
    K: 20, // Tamanho do bucket
    // Distância XOR para encontrar nós mais próximos de uma chave
    DISTANCE_FUNCTION: 'xor' as const,
  },

  // Gossip Epidemic Configuration (propagação epidêmica real)
  GOSSIP_EPIDEMIC: {
    // Número de nós para infectar a cada round
    INFECTION_RATE: 1, // Para 2-peer scenario
    // Probabilidade de propagação
    PROPAGATION_PROBABILITY: 0.8,
    // Anti-entropy: sincronização eventual
    ANTI_ENTROPY_INTERVAL_MS: 30000,
    // Cleanup de mensagens antigas
    EPIDEMIC_CLEANUP_INTERVAL_MS: 60000,
  },

  // Fault Tolerance Configuration (tolerância a falhas real)
  FAULT_TOLERANCE: {
    // Detecção de falhas
    FAILURE_DETECTION_INTERVAL_MS: 5000,
    FAILURE_THRESHOLD: 3, // Tentativas antes de considerar morto
    // Recuperação automática
    AUTO_RECOVERY_ENABLED: true,
    RECOVERY_BACKOFF_MS: 1000,
    // Redundância
    MIN_REPLICAS: 1, // Para 2-peer
    CONSISTENCY_LEVEL: 'eventual' as const,
  },

  // P2P Network Settings (cenário: core node + mobile app = 2 peers)
  NETWORK: {
    MIN_PEERS_FOR_SYNC: getEnvNumber('EXPO_PUBLIC_MIN_PEERS_FOR_SYNC', 1),
    MAX_PEERS_TO_CONNECT: getEnvNumber('EXPO_PUBLIC_MAX_PEERS_TO_CONNECT', 2),
    PEER_DISCOVERY_INTERVAL_MS: getEnvNumber('EXPO_PUBLIC_PEER_DISCOVERY_INTERVAL_MS', 20000),
    PEER_CONNECTION_TIMEOUT_MS: getEnvNumber('EXPO_PUBLIC_PEER_CONNECTION_TIMEOUT_MS', 12000),
    PEER_RECONNECT_DELAY_MS: getEnvNumber('EXPO_PUBLIC_PEER_RECONNECT_DELAY_MS', 5000),
  },

  // Temporary Storage (quando não há peers conectados)
  TEMP_STORAGE: {
    TTL_MS: getEnvNumber('EXPO_PUBLIC_TEMP_STORAGE_TTL_MS', 3600000), // 1 hour
    MAX_ENTRIES: getEnvNumber('EXPO_PUBLIC_TEMP_STORAGE_MAX_ENTRIES', 100),
  },

  // Network Quality Settings
  NETWORK_QUALITY: {
    RETRY_ATTEMPTS: getEnvNumber('EXPO_PUBLIC_NETWORK_RETRY_ATTEMPTS', 3),
    RETRY_DELAY_MS: getEnvNumber('EXPO_PUBLIC_NETWORK_RETRY_DELAY_MS', 2000),
    CONNECTION_HEALTH_CHECK_MS: getEnvNumber('EXPO_PUBLIC_CONNECTION_HEALTH_CHECK_MS', 60000),
  },

  // Development URLs (apenas para debug, NÃO para sincronização)
  DEBUG: {
    CORE_URL: process.env.EXPO_PUBLIC_CORE_DEBUG_URL || 'http://localhost:3000',
    WEBSITE_URL: process.env.EXPO_PUBLIC_WEBSITE_URL || 'http://localhost:3001',
  },

  // Node ID generation
  NODE_ID_PREFIX: 'mobile',
  
  // DHT Keys patterns
  DHT_KEYS: {
    IDENTITY: (address: string) => `identity:${address}`,
    PROFILE: (address: string) => `profile:${address}`,
    DEVICES: (address: string) => `devices:${address}`,
    PERMISSIONS: (address: string) => `permissions:${address}`,
  },

  // Gossip Message Types
  GOSSIP_TYPES: {
    IDENTITY_UPDATE: 'identity_update',
    IDENTITY_QUERY: 'identity_query',
    IDENTITY_RESPONSE: 'identity_response',
    PEER_DISCOVERY: 'peer_discovery',
    DHT_STORE: 'dht_store',
    DHT_QUERY: 'dht_query',
    DHT_RESPONSE: 'dht_response',
  }
} as const;

/*
 * === COMO DHT E GOSSIP REALMENTE FUNCIONAM ===
 * 
 * DHT (Distributed Hash Table):
 * - Cada nó é responsável por uma faixa de chaves hash
 * - Dados são armazenados baseado no hash da chave, não no conteúdo
 * - Quando um nó cai, vizinhos assumem suas responsabilidades automaticamente
 * - Replicação em múltiplos nós garante redundância
 * 
 * Exemplo com identidade "user123":
 * 1. Hash("user123") = 0x7A3F...
 * 2. Nó responsável por 0x7000-0x7FFF armazena os dados
 * 3. Réplicas são feitas em nós vizinhos
 * 4. Se o nó cair, vizinhos assumem a responsabilidade
 * 
 * Gossip Protocol:
 * - Propagação epidêmica de informações
 * - Cada nó repassa para alguns vizinhos aleatórios
 * - Informação se espalha pela rede inteira rapidamente
 * - Tolerante a falhas - encontra rotas alternativas automaticamente
 * 
 * Exemplo de propagação:
 * 1. Nó A tem atualização para propagar
 * 2. A envia para fanout=3 vizinhos aleatórios
 * 3. Cada um desses propaga para seus 3 vizinhos
 * 4. Em ~log(N) hops, toda a rede tem a informação
 * 
 * Tolerância a Falhas:
 * - Não há "roteamento" tradicional, mas sim descoberta dinâmica
 * - Se um caminho falha, o gossip encontra outro automaticamente
 * - DHT se reorganiza quando nós entram/saem da rede
 * - Dados permanecem disponíveis através de réplicas
 */

// Validação da configuração para cenário 2-peer
export const validateP2PConfig = (): boolean => {
  const config = P2P_CONFIG;
  
  // Validações básicas
  if (config.DHT.REPLICATION_FACTOR < 1) {
    console.warn('⚠️ DHT_REPLICATION_FACTOR deve ser >= 1');
    return false;
  }
  
  if (config.GOSSIP.FANOUT < 1) {
    console.warn('⚠️ GOSSIP_FANOUT deve ser >= 1');
    return false;
  }
  
  if (config.NETWORK.MIN_PEERS_FOR_SYNC < 1) {
    console.warn('⚠️ MIN_PEERS_FOR_SYNC deve ser >= 1');
    return false;
  }

  // Validações específicas para 2-peer
  if (config.NETWORK.MAX_PEERS_TO_CONNECT > 2) {
    console.warn('⚠️ Para cenário 2-peer, MAX_PEERS_TO_CONNECT deve ser <= 2');
  }

  if (config.DHT.REPLICATION_FACTOR > 1) {
    console.warn('⚠️ Para cenário 2-peer, DHT_REPLICATION_FACTOR deve ser 1');
  }

  if (config.GOSSIP.FANOUT > 1) {
    console.warn('⚠️ Para cenário 2-peer, GOSSIP_FANOUT deve ser 1');
  }

  // Validação do core node
  if (!config.CORE_NODE.HOST || !config.CORE_NODE.ID) {
    console.error('❌ Configuração do core node inválida');
    return false;
  }
  
  console.log('✅ Configuração P2P validada para cenário 2-peer');
  console.log('📊 Config:', {
    coreNode: `${config.CORE_NODE.ID}@${config.CORE_NODE.HOST}:${config.CORE_NODE.P2P_PORT}`,
    dhtReplicas: config.DHT.REPLICATION_FACTOR,
    gossipFanout: config.GOSSIP.FANOUT,
    minPeers: config.NETWORK.MIN_PEERS_FOR_SYNC,
    maxPeers: config.NETWORK.MAX_PEERS_TO_CONNECT
  });
  
  return true;
};

export default P2P_CONFIG;
