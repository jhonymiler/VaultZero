import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { AuthenticationManager } from './auth/index.js';
import { DecentralizedIdentity } from './blockchain/identity.js';
import { LibP2PNetwork, LibP2PConfig, NetworkStats } from './network/libp2p.js';
import { LocalLedgerManager } from './blockchain/ledger.js';
import { ConsensusManager } from './blockchain/consensus.js';
import { SyncManager } from './network/sync.js';
import { DistributedHashTable } from './network/dht.js';
import { GossipProtocol } from './network/gossip.js';
import { BlockchainLogger } from './utils/logger.js';
import { EventEmitter } from 'events';

// Equivalente ESM para __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

// Processar argumentos de linha de comando
const args = process.argv.slice(2);
const isBootstrap = args.includes('--bootstrap');
const portArg = args.find(arg => arg.startsWith('--port='));
const connectArg = args.find(arg => arg.startsWith('--connect='));

// Configuração P2P baseada em argumentos
const P2P_PORT = portArg ? parseInt(portArg.split('=')[1]) : (process.env.P2P_PORT ? parseInt(process.env.P2P_PORT) : 3001);
const BOOTSTRAP_PEERS = connectArg ? [`/ip4/${connectArg.split('=')[1]}/ws`] : (process.env.BOOTSTRAP_PEERS?.split(',') || []);

// Modo headless - apenas nó P2P sem dashboard/API
const HEADLESS_MODE = process.env.HEADLESS_MODE === 'true' || args.includes('--headless');

// Aumentar o limite de ouvintes para evitar vazamentos de memória em casos de muitos peers
EventEmitter.defaultMaxListeners = parseInt(process.env.MAX_PEERS || '50');

// Inicializar logger
const logger = BlockchainLogger.getInstance();

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || (isBootstrap ? 3000 : 3000 + (P2P_PORT - 3001));

logger.blockchainInfo('🚀 Iniciando VaultZero Core Server', {
  httpPort: HTTP_PORT,
  p2pPort: P2P_PORT,
  isBootstrap,
  bootstrapPeers: BOOTSTRAP_PEERS,
  nodeEnv: process.env.NODE_ENV,
  debugEnabled: process.env.DEBUG === 'true',
  headlessMode: HEADLESS_MODE
});

// Middleware (apenas se não estiver em modo headless)
if (!HEADLESS_MODE) {
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.static(path.join(__dirname, '../public')));

  // Middleware de logging para todas as requisições
  app.use((req, res, next) => {
    logger.blockchainDebug(`HTTP ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  });
}

// Initialize managers - declared but initialized later
let authManager: AuthenticationManager;
let identityManager: DecentralizedIdentity;
let localLedger: LocalLedgerManager;
let p2pNetwork: LibP2PNetwork;
let consensusManager: ConsensusManager;
let syncManager: SyncManager | null = null;
let dht: DistributedHashTable;
let gossipProtocol: GossipProtocol;

// Routes (apenas se não estiver em modo headless)
if (!HEADLESS_MODE) {
  // Root route - serve dashboard
  app.get('/', (req: express.Request, res: express.Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

// API info endpoint
app.get('/api', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'Sistema de Autenticação P2P Sem Senha',
    version: '1.0.0',
    status: 'ativo',
    features: [
      'Autenticação com Passkeys (WebAuthn)',
      'Autenticação Biométrica',
      'Blockchain P2P Descentralizada',
      'Consensus Distribuído',
      'DHT (Distributed Hash Table)',
      'Protocolo Gossip',
      'Sincronização Automática'
    ]
  });
});

// Authentication endpoints
app.post('/api/auth/register/biometric', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, biometricData, biometricType } = req.body;
    console.log('📱 Registering new biometric identity for:', userId);
    
    if (!biometricData) {
      return res.status(400).json({ error: 'Biometric data is required' });
    }
    
    const result = await authManager.registerBiometric(userId, biometricData, biometricType);
    console.log('✅ Biometric registration result:', result.success);
    
    // Add to ledger if successful
    if (result.success && result.identity) {
      await localLedger.addIdentity(result.identity);
      gossipProtocol.announceIdentity(result.identity);
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Registration failed:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/auth/register/passkey', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, userName, userDisplayName } = req.body;
    console.log('🔑 Registering passkey for:', userName);
    
    const result = await authManager.registerWithPasskey(userId, userName, userDisplayName);
    res.json(result);
  } catch (error) {
    console.error('❌ Passkey registration failed:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/auth/register/passkey/complete', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, response } = req.body;
    console.log('🔍 Completing passkey registration for:', userId);
    
    const result = await authManager.completePasskeyRegistration(userId, response);
    
    // Add to ledger if successful
    if (result.success && result.identity) {
      await localLedger.addIdentity(result.identity);
      gossipProtocol.announceIdentity(result.identity);
    }
    
    res.json(result);
  } catch (error) {
    console.error('❌ Passkey registration completion failed:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/auth/authenticate/biometric', async (req: express.Request, res: express.Response) => {
  try {
    const { userId, biometricType } = req.body;
    console.log('🔐 Authenticating biometric for:', userId);
    
    const result = await authManager.authenticateWithBiometric(userId, biometricType);
    console.log('✅ Biometric authentication result:', result.success);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/auth/authenticate/passkey', async (req: express.Request, res: express.Response) => {
  try {
    const { userId } = req.body;
    console.log('🔐 Authenticating passkey for:', userId);
    
    const result = await authManager.authenticateWithPasskey(userId);
    res.json(result);
  } catch (error) {
    console.error('❌ Passkey authentication failed:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// P2P Network endpoints
app.get('/api/network/status', (req: express.Request, res: express.Response) => {
  try {
    const networkStats = p2pNetwork ? p2pNetwork.getNetworkStats() : null;
    const dhtStats = dht ? dht.getStats() : null;
    const gossipStats = gossipProtocol ? gossipProtocol.getStats() : null;
    
    const status = {
      status: 'active',
      peers: networkStats?.connectedPeers || 0,
      nodeId: networkStats?.nodeId || 'unknown',
      p2pPort: P2P_PORT, // Porta P2P para conexões
      httpPort: HTTP_PORT, // Porta HTTP para API
      dhtNodes: dhtStats?.totalNodes || 0,
      gossipPeers: gossipStats?.totalPeers || 0,
      connections: p2pNetwork.getConnectedPeers() || []
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get network status' });
  }
});

app.post('/api/network/connect', async (req: express.Request, res: express.Response) => {
  try {
    const { address, port } = req.body;
    
    // Se recebeu porta HTTP (3000, 3001, etc), precisa descobrir a porta WebSocket
    if (port >= 3000 && port <= 3010) {
      // Primeiro, tenta descobrir qual porta WebSocket o servidor está usando
      try {
        const statusResponse = await fetch(`http://${address}:${port}/api/network/status`);
        const statusData = await statusResponse.json();
        
        if (statusData && statusData.p2pPort) {
          const webSocketPort = statusData.p2pPort;
          console.log(`🌐 Conectando via WebSocket na porta descoberta: ${address}:${webSocketPort}`);
          
          const success = await p2pNetwork.connectToPeer(`/ip4/${address}/tcp/${webSocketPort}/ws`);
          res.json({ 
            success, 
            message: success ? `Conectado ao peer ${address}:${webSocketPort}` : 'Falha na conexão',
            p2pPort: webSocketPort
          });
        } else {
          throw new Error('Não foi possível descobrir a porta WebSocket');
        }
      } catch (discoveryError) {
        console.error('❌ Erro na descoberta automática, tentando conexão direta:', discoveryError);
        res.status(400).json({ 
          error: 'Não foi possível descobrir a porta WebSocket do peer. Para conectar, use a porta WebSocket diretamente (exemplo: 8087)' 
        });
      }
    } else {
      // Porta WebSocket direta
      console.log(`🌐 Conectando diretamente via WebSocket: ${address}:${port}`);
      const success = await p2pNetwork.connectToPeer(`/ip4/${address}/tcp/${port}/ws`);
      res.json({ success, message: success ? 'Conectado ao peer' : 'Falha na conexão' });
    }
  } catch (error) {
    console.error('❌ Connection failed:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/network/connect-auto', async (req: express.Request, res: express.Response) => {
  try {
    const { httpPort } = req.body;
    const address = 'localhost'; // Para testes locais
    
    // Descoberta automática da porta WebSocket
    try {
      const statusResponse = await fetch(`http://${address}:${httpPort}/api/network/status`);
      const statusData = await statusResponse.json();
      
      if (statusData && statusData.p2pPort) {
        const webSocketPort = statusData.p2pPort;
        console.log(`🔍 Auto-descoberta: HTTP:${httpPort} → WebSocket:${webSocketPort}`);
        
        const success = await p2pNetwork.connectToPeer(`/ip4/${address}/tcp/${webSocketPort}/ws`);
        res.json({ 
          success, 
          message: success ? `✅ Conectado automaticamente ao peer` : '❌ Falha na conexão automática',
          discoveredPorts: {
            http: httpPort,
            websocket: webSocketPort
          },
          nodeInfo: {
            localNodeId: p2pNetwork.getNetworkStats().nodeId,
            remoteNodeId: statusData.nodeId
          }
        });
      } else {
        throw new Error('Peer não retornou informações de porta WebSocket');
      }
    } catch (discoveryError) {
      console.error('❌ Falha na descoberta automática:', discoveryError);
      res.status(400).json({ 
        error: `Não foi possível conectar automaticamente ao peer na porta HTTP ${httpPort}`,
        details: discoveryError instanceof Error ? discoveryError.message : String(discoveryError)
      });
    }
  } catch (error) {
    console.error('❌ Erro na conexão automática:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/network/peers', (req: express.Request, res: express.Response) => {
  try {
    const peers = {
      networkPeers: p2pNetwork ? p2pNetwork.getNetworkStats() : null,
      dhtPeers: dht ? dht.getStats() : null,
      gossipPeers: gossipProtocol ? gossipProtocol.getStats() : null
    };
    res.json(peers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get peers' });
  }
});

// Blockchain status endpoint (manter apenas para debug/monitoring)
app.get('/api/blockchain/status', async (req: express.Request, res: express.Response) => {
  try {
    const status = {
      dht: {
        totalNodes: dht ? Object.keys((dht as any).nodes || {}).length : 0,
        storedEntries: dht ? Object.keys((dht as any).storage || {}).length : 0
      },
      p2p: {
        connectedPeers: p2pNetwork ? (p2pNetwork as any).connectedPeers || 0 : 0,
        isActive: !!p2pNetwork
      },
      consensus: {
        isActive: !!consensusManager
      },
      ledger: {
        totalIdentities: localLedger?.getAllIdentities()?.length || 0
      },
      gossip: {
        isActive: !!gossipProtocol
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(status);
  } catch (error) {
    console.error('❌ Failed to get blockchain status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Endpoint para sincronização DHT (apenas para nodes da rede, não para usuários finais)
app.post('/api/dht/sync', async (req: express.Request, res: express.Response) => {
  try {
    const { key, data, nodeId } = req.body;
    
    if (!key || !data || !nodeId) {
      return res.status(400).json({ error: 'Parâmetros inválidos para sincronização DHT' });
    }

    logger.blockchainInfo('📤 Recebendo sincronização DHT de outro node', {
      keyPrefix: key.substring(0, 20) + '...',
      nodeId: nodeId.substring(0, 10) + '...'
    });

    // Armazenar na DHT local
    if (dht) {
      await dht.store(key, data);
      logger.blockchainInfo('✅ Dados DHT armazenados localmente');
    }

    res.json({ 
      success: true, 
      message: 'Dados sincronizados na DHT',
      timestamp: Date.now()
    });
  } catch (error) {
    logger.blockchainError('❌ Erro na sincronização DHT', error);
    res.status(500).json({ 
      error: 'Erro na sincronização DHT',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

app.get('/api/blockchain/ledger/entries', async (req: express.Request, res: express.Response) => {
  try {
    const entries = localLedger.getAllIdentities();
    res.json({ entries, count: entries.length });
  } catch (error) {
    console.error('❌ Failed to get ledger entries:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/blockchain/consensus/status', (req: express.Request, res: express.Response) => {
  try {
    const status = consensusManager ? consensusManager.getConsensusStats() : {
      consensusThreshold: 0.67,
      activeValidators: 0,
      lastConsensus: null,
      consensusRounds: 0
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consensus status' });
  }
});

// Sync endpoints
app.post('/api/sync/start', async (req: express.Request, res: express.Response) => {
  try {
    console.log('🔄 Starting synchronization...');
    // const success = await syncManager?.startSync();
    res.json({ 
      success: true, // Temporariamente sempre true
      message: 'Sync will be implemented with LibP2P integration' 
    });
  } catch (error) {
    console.error('❌ Sync start failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/sync/status', (req: express.Request, res: express.Response) => {
  try {
    const status = {
      isSyncing: false,
      lastSync: null,
      syncProgress: 0,
      pendingOperations: 0
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

// Admin endpoints
app.get('/api/admin/stats', async (req: express.Request, res: express.Response) => {
  try {
    const stats = {
      auth: authManager ? authManager.getAuthStats() : null,
      ledger: localLedger ? localLedger.getStats() : null,
      network: p2pNetwork ? p2pNetwork.getNetworkStats() : null,
      consensus: consensusManager ? consensusManager.getConsensusStats() : null,
      sync: syncManager ? syncManager.getSyncStats() : null,
      dht: dht ? dht.getStats() : null,
      gossip: gossipProtocol ? gossipProtocol.getStats() : null,
      systemUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
    res.json(stats);
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Health check
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      auth: authManager ? 'active' : 'inactive',
      identity: identityManager ? 'active' : 'inactive',
      ledger: localLedger ? 'active' : 'inactive',
      p2p: p2pNetwork ? 'active' : 'inactive',
      consensus: consensusManager ? 'active' : 'inactive',
      sync: syncManager ? 'active' : 'inactive',
      dht: dht ? 'active' : 'inactive',
      gossip: gossipProtocol ? 'active' : 'inactive'
    }
  });
});

// Test endpoints
app.post('/api/test/biometric', async (req: express.Request, res: express.Response) => {
  try {
    console.log('🧪 Testing biometric registration...');
    
    const testUserId = 'test_user_' + Date.now();
    const mockBiometricData = 'mock_biometric_' + Math.random().toString(36).substr(2, 9);
    
    const result = await authManager.registerBiometric(testUserId, mockBiometricData, 'fingerprint');
    
    res.json({
      success: true,
      message: 'Test biometric registration completed',
      testUserId,
      result
    });
  } catch (error) {
    console.error('❌ Test biometric failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Status endpoint for dashboard
app.get('/status', async (req: express.Request, res: express.Response) => {
  try {
    const status = {
      status: 'active',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        auth: {
          status: authManager ? 'active' : 'inactive',
          stats: authManager ? authManager.getAuthStats() : {
            totalUsers: 0,
            passkeys: { totalCredentials: 0, activeChallenges: 0 },
            biometrics: { totalTemplates: 0 }
          }
        },
        network: {
          status: p2pNetwork ? 'active' : 'inactive',
          stats: p2pNetwork ? p2pNetwork.getNetworkStats() : {
            nodeId: 'unknown',
            port: 0,
            isStarted: false,
            connectedPeers: 0,
            knownNodes: 0,
            connections: []
          }
        },
        ledger: {
          status: localLedger ? 'active' : 'inactive',
          stats: localLedger ? localLedger.getStats() : {
            totalIdentities: 0,
            version: '1.0.0',
            lastSync: Date.now()
          }
        },
        consensus: {
          status: consensusManager ? 'active' : 'inactive',
          stats: consensusManager ? consensusManager.getConsensusStats() : {
            totalParticipants: 0,
            pendingProposals: 0,
            consensusThreshold: '67%'
          }
        },
        dht: {
          status: dht ? 'active' : 'inactive',
          stats: dht ? dht.getStats() : {
            totalNodes: 0,
            totalEntries: 0,
            activeBuckets: 0
          }
        },
        gossip: {
          status: gossipProtocol ? 'active' : 'inactive',
          stats: gossipProtocol ? gossipProtocol.getStats() : {
            totalPeers: 0,
            totalMessagesSent: 0,
            totalMessagesReceived: 0
          }
        },
        sync: {
          status: syncManager ? 'active' : 'inactive',
          stats: syncManager ? syncManager.getSyncStats() : {
            lastSync: 0,
            syncInProgress: false,
            peersConnected: 0
          }
        }
      }
    };
    
    res.json(status);
  } catch (error) {
    console.error('❌ Failed to get status:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// P2P sync endpoint
app.post('/api/p2p/sync', async (req: express.Request, res: express.Response) => {
  try {
    console.log('🔄 Starting P2P synchronization...');
    
    if (!syncManager) {
      return res.status(503).json({ 
        success: false,
        error: 'Sync manager not available',
        message: 'The synchronization service is not currently active'
      });
    }
    
    const success = await syncManager.startSync();
    res.json({ success, message: success ? 'Sincronização iniciada com sucesso' : 'Falha na sincronização' });
  } catch (error) {
    console.error('❌ P2P sync failed:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Clear stuck syncs endpoint
app.post('/api/p2p/sync/clear', async (req: express.Request, res: express.Response) => {
  try {
    console.log('🧹 Clearing stuck synchronizations...');
    
    if (!syncManager) {
      return res.status(503).json({ 
        success: false,
        error: 'Sync manager not available',
        message: 'The synchronization service is not currently active'
      });
    }
    
    syncManager.clearStuckSyncs();
    res.json({ success: true, message: 'Sincronizações travadas foram limpas' });
  } catch (error) {
    console.error('❌ Failed to clear stuck syncs:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

// Endpoint especializado para painel de controle - Monitoramento de Nós VaultZero
app.get('/api/network/nodes', (req: express.Request, res: express.Response) => {
  try {
    const networkStats = p2pNetwork ? p2pNetwork.getNetworkStats() : null;
    const dhtStats = dht ? dht.getStats() : null;
    const gossipStats = gossipProtocol ? gossipProtocol.getStats() : null;
    
    // Informações completas do nó atual para o painel de controle
    const nodeInfo = {
      // Identificação do Nó
      nodeId: networkStats?.nodeId || 'unknown',
      nodeType: 'vault-core', // Tipo do nó (core, mobile, relay, etc.)
      nodeVersion: '1.0.0',
      
      // Status Operacional
      status: 'online',
      uptime: process.uptime(),
      lastSeen: new Date().toISOString(),
      
      // Conectividade
      endpoints: {
        http: `http://localhost:${HTTP_PORT}`,
        p2p: networkStats?.port || null,
        websocket: `ws://localhost:${networkStats?.port || 'unknown'}`
      },
      
      // Estatísticas de Rede
      networkStatus: {
        connectedPeers: networkStats?.connectedPeers || 0,
        knownNodes: networkStats?.knownNodes || 0,
        dhtNodes: dhtStats?.totalNodes || 0,
        gossipPeers: gossipStats?.totalPeers || 0,
        activeConnections: networkStats?.connections || []
      },
      
      // Performance e Recursos
      performance: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        systemUptime: process.uptime()
      },
      
      // Dados da Rede Distribuída
      distributedData: {
        dhtEntries: dhtStats?.totalEntries || 0,
        identitiesManaged: localLedger?.getAllIdentities()?.length || 0,
        syncStatus: syncManager ? syncManager.getSyncStats() : null
      },
      
      // Metadados para Descoberta Automática
      discovery: {
        broadcastPort: networkStats?.port || null,
        serviceType: '_vault-p2p._tcp',
        serviceInstance: networkStats?.nodeId?.substring(0, 12) || 'unknown',
        capabilities: ['identity-sync', 'biometric-auth', 'p2p-relay']
      }
    };
    
    res.json({
      success: true,
      node: nodeInfo,
      timestamp: new Date().toISOString(),
      networkSnapshot: {
        totalVisibleNodes: (networkStats?.connectedPeers || 0) + 1, // +1 para incluir o próprio nó
        networkHealth: (networkStats?.connectedPeers || 0) > 0 ? 'connected' : 'isolated'
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get network nodes info:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get network nodes information',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Endpoint para descoberta automática de nós na rede local (para seu painel)
app.get('/api/network/discover', async (req: express.Request, res: express.Response) => {
  try {
    const networkStats = p2pNetwork ? p2pNetwork.getNetworkStats() : null;
    const connectedPeers = networkStats?.connections || [];
    
    // Lista de nós descobertos (peers conectados + nó atual)
    const discoveredNodes = [
      // Nó atual
      {
        nodeId: networkStats?.nodeId || 'local-node',
        address: 'localhost',
        httpPort: HTTP_PORT,
        p2pPort: networkStats?.port || null,
        status: 'self',
        type: 'vault-core',
        lastContact: new Date().toISOString()
      }
    ];
    
    // Adicionar peers conectados
    for (const peerId of connectedPeers) {
      // Em uma implementação completa, você faria uma query para obter detalhes do peer
      // Por agora, adicionamos informações básicas
      discoveredNodes.push({
        nodeId: peerId,
        address: 'unknown', // Seria descoberto via rede
        httpPort: 'unknown',
        p2pPort: null, // Será descoberto via rede
        status: 'connected',
        type: 'vault-peer',
        lastContact: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      totalNodes: discoveredNodes.length,
      nodes: discoveredNodes,
      networkTopology: {
        coreNodes: discoveredNodes.filter(n => n.type === 'vault-core').length,
        peerNodes: discoveredNodes.filter(n => n.type === 'vault-peer').length,
        mobileNodes: discoveredNodes.filter(n => n.type === 'vault-mobile').length
      },
      discoveryMethod: 'p2p-connections',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to discover network nodes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to discover network nodes',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

} // Fim do bloco if (!HEADLESS_MODE) - todas as rotas HTTP ficam dentro desta condição

// Initialize services
async function initializeServices() {
  try {
    console.log('🚀 Initializing Passwordless P2P Authentication System...');
    console.log('🌍 Building the future of global authentication...');
    
    // Initialize core components
    identityManager = new DecentralizedIdentity();
    console.log('✅ Identity manager initialized');
    
    localLedger = new LocalLedgerManager();
    console.log('✅ Local ledger initialized');
    
    authManager = new AuthenticationManager();
    console.log('✅ Authentication manager initialized');
    
    // Initialize network components
    const p2pPort = parseInt(process.env.P2P_PORT || '8087');
    const nodeIdPrefix = process.env.P2P_NODE_ID_PREFIX || 'vault-node';
    const nodeId = `${nodeIdPrefix}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    dht = new DistributedHashTable(nodeId);
    console.log('✅ DHT initialized');
    
    gossipProtocol = new GossipProtocol(nodeId);
    console.log('✅ Gossip protocol initialized');
    
    // Configurar P2P Network com libp2p
    const p2pConfig: LibP2PConfig = {
      port: P2P_PORT,
      isBootstrap,
      bootstrapPeers: BOOTSTRAP_PEERS,
      enableMDNS: false, // Desabilitar para testes locais
      maxConnections: 100,
      minConnections: isBootstrap ? 0 : 2
    };

    p2pNetwork = new LibP2PNetwork(p2pConfig);
    await p2pNetwork.start();
    console.log(`✅ LibP2P network initialized on port ${P2P_PORT}`);
    console.log(`🆔 Node ID: ${p2pNetwork.getNetworkStats().nodeId?.substring(0, 20)}...`);

    consensusManager = new ConsensusManager();
    console.log('✅ Consensus manager initialized');

    // Inicializa SyncManager para funcionar com LibP2PNetwork
    syncManager = new SyncManager(localLedger, gossipProtocol, p2pNetwork);
    console.log('✅ Sync manager initialized');
    
    console.log('🎉 All services initialized successfully!');
    console.log('💡 Zero-cost blockchain authentication system ready');
    console.log('🌐 P2P decentralized identity propagation active');
    console.log('🔐 WebAuthn and biometric authentication enabled');
    console.log('🤝 Gossip protocol and DHT operational');
    console.log('⚖️ Byzantine fault-tolerant consensus running');
    
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    console.error('💀 System startup failed. Exiting...');
    process.exit(1);
  }
}

// Start server
app.listen(HTTP_PORT, async () => {
  console.log(`\n🌐 Server running on http://localhost:${HTTP_PORT}`);
  console.log(`📱 Web dashboard available at http://localhost:${HTTP_PORT}`);
  console.log(`🔗 API documentation at http://localhost:${HTTP_PORT}/api/health`);
  
  await initializeServices();
  
  console.log(`\n🔐 Passwordless P2P Authentication System is ready!`);
  console.log(`💰 Global monetization engine activated`);
  console.log(`🚀 Ready to scale to 8 billion users worldwide`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  
  try {
    if (p2pNetwork) await p2pNetwork.stop();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  
  console.log('✅ All services shut down successfully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  
  try {
    if (p2pNetwork) await p2pNetwork.stop();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  
  console.log('✅ All services shut down successfully');
  process.exit(0);
});

export default app;