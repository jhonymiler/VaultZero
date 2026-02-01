// @ts-nocheck
// filepath: /home/jhony/Projetos/login-se-senha/passwordless-p2p-auth/src/stubs.ts
// Este arquivo contém implementações temporárias para métodos que podem estar faltando
// Nos componentes. Use apenas para testes e substitua por implementações reais.

// Usando @ts-nocheck para evitar problemas de tipagem durante o desenvolvimento

// Stubs para GossipProtocol
if (typeof GossipProtocol !== 'undefined' && 
    typeof GossipProtocol.prototype.announceIdentity !== 'function') {
  GossipProtocol.prototype.announceIdentity = function(identity) {
    console.log('📢 [STUB] Announcing identity:', identity?.id || identity);
    return true;
  };
}

// Stubs para P2PNetwork
if (typeof P2PNetwork !== 'undefined' && 
    typeof P2PNetwork.prototype.getNetworkStats !== 'function') {
  P2PNetwork.prototype.getNetworkStats = function() {
    return {
      nodeId: `node_${Date.now()}`,
      port: 8080,
      isStarted: true,
      connectedPeers: 0,
      knownNodes: 0,
      connections: []
    };
  };
}

// Stubs para DistributedHashTable
if (typeof DistributedHashTable !== 'undefined' && 
    typeof DistributedHashTable.prototype.getStats !== 'function') {
  DistributedHashTable.prototype.getStats = function() {
    return {
      totalNodes: 1,
      storedEntries: 0,
      replicationFactor: 3
    };
  };
}

// Stubs para ConsensusManager
if (typeof ConsensusManager !== 'undefined' && 
    typeof ConsensusManager.prototype.getConsensusStats !== 'function') {
  ConsensusManager.prototype.getConsensusStats = function() {
    return {
      currentVersion: 1,
      totalIdentities: 0,
      totalParticipants: 1,
      pendingProposals: 0,
      lastUpdate: new Date().toISOString(),
      consensusThreshold: '67%'
    };
  };
}

// Stubs para SyncManager
if (typeof SyncManager !== 'undefined' && 
    typeof SyncManager.prototype.getSyncStats !== 'function') {
  SyncManager.prototype.getSyncStats = function() {
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
  };
}

// Stubs para LocalLedgerManager
if (typeof LocalLedgerManager !== 'undefined' && 
    typeof LocalLedgerManager.prototype.getAllIdentities !== 'function') {
  LocalLedgerManager.prototype.getAllIdentities = function() {
    return [];
  };
}

// Stubs para LocalLedgerManager.getStats
if (typeof LocalLedgerManager !== 'undefined' && 
    typeof LocalLedgerManager.prototype.getStats !== 'function') {
  LocalLedgerManager.prototype.getStats = function() {
    return {
      totalIdentities: 0,
      lastUpdate: new Date().toISOString(),
      dbSize: '0 KB'
    };
  };
}

// Stubs para AuthenticationManager
if (typeof AuthenticationManager !== 'undefined' && 
    typeof AuthenticationManager.prototype.getAuthStats !== 'function') {
  AuthenticationManager.prototype.getAuthStats = function() {
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
  };
}
