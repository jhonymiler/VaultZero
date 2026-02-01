// Este arquivo contém implementações temporárias para métodos que podem estar faltando
// Nos componentes. Use apenas para testes e substitua por implementações reais.

// Definição de stubs mais simples usando funções utilitárias globais
export function setupStubs() {
  console.log('📦 Configurando stubs para componentes ausentes...');

  // Cria um stub global para um método de classe
  function createMethodStub(objectName, methodName, implementation) {
    try {
      const obj = globalThis[objectName];
      if (obj && obj.prototype && typeof obj.prototype[methodName] !== 'function') {
        console.log(`📌 Criando stub para ${objectName}.prototype.${methodName}`);
        obj.prototype[methodName] = implementation;
      }
    } catch (error) {
      console.error(`❌ Erro ao criar stub para ${objectName}.${methodName}:`, error);
    }
  }

  // Stubs para GossipProtocol
  createMethodStub('GossipProtocol', 'announceIdentity', function(identity) {
    console.log('📢 [STUB] Announcing identity:', identity.id || identity);
    return true;
  });
  
  createMethodStub('GossipProtocol', 'getStats', function() {
    return {
      totalPeers: 1,
      activeConnections: 1,
      messagesSent: 0,
      messagesReceived: 0,
      lastActive: new Date().toISOString()
    };
  });

  // Stubs para P2PNetwork
  createMethodStub('P2PNetwork', 'getNetworkStats', function() {
    return {
      nodeId: `node_${Date.now()}`,
      port: 8080,
      isStarted: true,
      connectedPeers: 0,
      knownNodes: 0,
      connections: []
    };
  });

  // Stubs para DistributedHashTable
  createMethodStub('DistributedHashTable', 'getStats', function() {
    return {
      totalNodes: 1,
      storedEntries: 0,
      replicationFactor: 3
    };
  });

  // Stubs para ConsensusManager
  createMethodStub('ConsensusManager', 'getConsensusStats', function() {
    return {
      currentVersion: 1,
      totalIdentities: 0,
      totalParticipants: 1,
      pendingProposals: 0,
      lastUpdate: new Date().toISOString(),
      consensusThreshold: '67%'
    };
  });

  // Stubs para SyncManager
  createMethodStub('SyncManager', 'getSyncStats', function() {
    return {
      lastSyncFormatted: new Date().toISOString(),
      activeSessions: 0,
      activeRequests: 0,
      totalIdentitiesReceived: 0,
      totalIdentitiesSent: 0,
      sessionsDetail: [],
      lastSync: Date.now(),
      peersConnected: 0
    };
  });

  // Stubs para LocalLedgerManager
  createMethodStub('LocalLedgerManager', 'getAllIdentities', function() {
    return [];
  });
  
  createMethodStub('LocalLedgerManager', 'getStats', function() {
    return {
      totalIdentities: 0,
      lastUpdate: new Date().toISOString(),
      dbSize: '0 KB'
    };
  });

  // Stubs para AuthenticationManager
  createMethodStub('AuthenticationManager', 'getAuthStats', function() {
    return {
      passkeys: {
        totalCredentials: 0,
        totalUsers: 0,
        activeChallenges: 0,
        credentialsPerUser: {},
        averageCredentialsPerUser: 0
      },
      biometrics: {
        totalTemplates: 0,
        templatesByType: {},
        templatesByUser: {},
        activeChallenges: 0
      },
      totalUsers: 0,
      identityDID: null
    };
  });

  console.log('✅ Stubs configurados com sucesso!');
}
