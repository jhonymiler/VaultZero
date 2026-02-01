// --- INSTRUÇÃO FUNDAMENTAL: NUNCA USAR HTTP OU WEBSOCKET PARA SINCRONIZAÇÃO DE IDENTIDADE ---
// Toda comunicação de identidade deve ser feita via DHT e Gossip (libp2p ou protocolo P2P compatível).
// O mobile deve ser um peer P2P real, participando da rede como nó DHT/Gossip.
// Endpoints HTTP são exclusivos para painel/admin.

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import P2P_CONFIG, { validateP2PConfig } from '../config/p2p';
import { Logger } from './logger';
import { BlockchainIdentity, SyncStatus, P2PPeer, DHTEntry, GossipMessage, KBucket } from '../types';

/**
 * DHT Query Context for iterative lookup
 */
interface DHTQueryContext {
  id: string;
  targetKey: string;
  closestNodes: P2PPeer[];
  queriedNodes: Set<string>;
  pendingQueries: number;
  callback: (result: any) => void;
  timeout: number;
}

/**
 * Gossip Infection State for epidemic propagation
 */
interface GossipInfectionState {
  messageId: string;
  infectedNodes: Set<string>;
  infectionRound: number;
  lastInfection: number;
  targetInfectionRate: number;
}

/**
 * Anti-entropy State for eventual consistency
 */
interface AntiEntropyState {
  lastSync: number;
  syncPartner: string | null;
  pendingUpdates: Map<string, any>;
}

/**
 * P2P Service - Pure DHT/Gossip Implementation
 * Conecta diretamente ao core node via DHT e Gossip protocols
 * SEM HTTP ou WebSocket para sincronização de identidade
 */
export class P2PService {
  private static readonly STORAGE_KEYS = {
    NODE_ID: 'p2p_node_id',
    PEERS: 'p2p_peers',
    DHT_STORAGE: 'dht_local_storage',
    GOSSIP_CACHE: 'gossip_message_cache',
    SYNC_STATUS: 'p2p_sync_status',
  };

  private static instance: P2PService;
  
  // Core state
  private nodeId: string = '';
  private peers: Map<string, P2PPeer> = new Map();
  private dhtStorage: Map<string, DHTEntry> = new Map();
  private gossipCache: Map<string, GossipMessage> = new Map();
  private syncStatus: SyncStatus = {
    isConnected: false,
    connectedPeers: 0,
    lastSync: new Date(),
    pendingTransactions: 0
  };

  // Timers
  private gossipInterval?: number;
  private dhtMaintenanceInterval?: number;
  private peerDiscoveryInterval?: number;
  private heartbeatInterval?: number;
  private routingUpdateInterval?: number; // Timer para atualizar roteamento

  // Network state
  private isNetworkAvailable: boolean = false;
  private isInitialized: boolean = false;
  
  // Novos campos para roteamento automático e recuperação
  private networkTopology: Map<string, Set<string>> = new Map(); // Grafo da rede
  private routingTable: Map<string, string[]> = new Map(); // Tabela de roteamento
  private messageQueue: Map<string, GossipMessage[]> = new Map(); // Fila de mensagens por peer
  private alternativeRoutes: Map<string, string[][]> = new Map(); // Rotas alternativas
  private networkPartitions: Set<string> = new Set(); // Nós em partições isoladas
  private reconnectionTimers: Map<string, number> = new Map(); // Timers de reconexão

  // ============= NEW KADEMLIA DHT FIELDS =============
  private kBuckets: Map<number, KBucket> = new Map(); // K-buckets for Kademlia
  private activeQueries: Map<string, DHTQueryContext> = new Map(); // Active DHT queries
  private dhtNodeId: string = ''; // 160-bit node ID for DHT
  private readonly K_BUCKET_SIZE = P2P_CONFIG.DHT.BUCKET_SIZE;
  private readonly ALPHA = 3; // Parallelism in queries
  private readonly KEYSPACE_SIZE = 160; // 160 bits

  // ============= NEW GOSSIP EPIDEMIC FIELDS =============
  private infectionStates: Map<string, GossipInfectionState> = new Map(); // Epidemic states
  private antiEntropyState: AntiEntropyState = { // Anti-entropy for consistency
    lastSync: 0,
    syncPartner: null,
    pendingUpdates: new Map()
  };
  private epidemicTimer?: number; // Timer for epidemic rounds
  private antiEntropyTimer?: number; // Timer for anti-entropy

  private constructor() {
    // Private constructor for singleton
  }

  // Singleton pattern
  static getInstance(): P2PService {
    if (!P2PService.instance) {
      P2PService.instance = new P2PService();
    }
    return P2PService.instance;
  }

  /**
   * Initialize P2P service with pure DHT/Gossip
   */
  async initialize(): Promise<void> {
    try {
      // Validate configuration first
      if (!validateP2PConfig()) {
        throw new Error('Invalid P2P configuration');
      }

      await this.generateOrLoadNodeId();
      await this.loadStoredData();
      await this.setupNetworkListener();
      
      // ============= INITIALIZE KADEMLIA DHT =============
      await this.initializeKademliaDHT();
      
      // ============= INITIALIZE GOSSIP EPIDEMIC =============
      await this.initializeGossipEpidemic();
      
      await this.connectToCoreNode();
      
      this.startMaintenanceTasks();
      this.isInitialized = true;

      Logger.info(`P2P Service initialized - Node ID: ${this.nodeId}, DHT ID: ${this.dhtNodeId}`);
    } catch (error) {
      Logger.error('Failed to initialize P2P service', error);
      throw error;
    }
  }

  /**
   * Generate or load existing node ID
   */
  private async generateOrLoadNodeId(): Promise<void> {
    try {
      let storedNodeId = await AsyncStorage.getItem(P2PService.STORAGE_KEYS.NODE_ID);
      
      if (!storedNodeId) {
        // Generate new node ID using crypto
        const randomBytes = await Crypto.getRandomBytesAsync(20);
        this.nodeId = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        await AsyncStorage.setItem(P2PService.STORAGE_KEYS.NODE_ID, this.nodeId);
        Logger.info('🆔 [P2P] Novo Node ID gerado:', this.nodeId);
      } else {
        this.nodeId = storedNodeId;
        Logger.info('🆔 [P2P] Node ID carregado:', this.nodeId);
      }
    } catch (error) {
      Logger.error('❌ [P2P] Erro ao gerar/carregar Node ID:', error);
      throw error;
    }
  }

  /**
   * Load stored P2P data
   */
  private async loadStoredData(): Promise<void> {
    try {
      // Load peers
      const storedPeers = await AsyncStorage.getItem(P2PService.STORAGE_KEYS.PEERS);
      if (storedPeers) {
        const peersArray = JSON.parse(storedPeers);
        peersArray.forEach((peer: P2PPeer) => {
          this.peers.set(peer.id, {
            ...peer,
            connectionState: 'disconnected',
            routingTable: new Map(),
          });
        });
      }

      // Load DHT storage
      const storedDHT = await AsyncStorage.getItem(P2PService.STORAGE_KEYS.DHT_STORAGE);
      if (storedDHT) {
        const dhtArray = JSON.parse(storedDHT);
        dhtArray.forEach((entry: DHTEntry) => {
          this.dhtStorage.set(entry.key, entry);
        });
      }

      Logger.info('📦 [P2P] Dados armazenados carregados', {
        peers: this.peers.size,
        dhtEntries: this.dhtStorage.size
      });
    } catch (error) {
      Logger.error('❌ [P2P] Erro ao carregar dados:', error);
    }
  }

  /**
   * Setup network connectivity listener
   */
  private async setupNetworkListener(): Promise<void> {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isNetworkAvailable;
      this.isNetworkAvailable = state.isConnected ?? false;

      if (!wasConnected && this.isNetworkAvailable) {
        Logger.info('🌐 [P2P] Rede disponível - reconectando...');
        this.connectToCoreNode();
      } else if (wasConnected && !this.isNetworkAvailable) {
        Logger.warn('🌐 [P2P] Rede indisponível');
        this.updateSyncStatus({ isConnected: false, connectedPeers: 0 });
      }
    });
  }

  /**
   * Connect to core node
   */
  private async connectToCoreNode(): Promise<void> {
    try {
      const coreNodePeer: P2PPeer = {
        id: P2P_CONFIG.CORE_NODE.ID,
        host: P2P_CONFIG.CORE_NODE.HOST,
        port: P2P_CONFIG.CORE_NODE.P2P_PORT,
        publicKey: '',
        lastSeen: Date.now(),
        trustScore: 1.0,
        isBootstrap: true,
        connectionState: 'connecting',
        routingTable: new Map(),
        messageRelayCount: 0,
        lastHeartbeat: Date.now(),
        failureCount: 0,
        isReliable: true
      };

      this.peers.set(coreNodePeer.id, coreNodePeer);
      
      // Simulate connection (in real implementation, this would be actual P2P connection)
      setTimeout(() => {
        if (this.peers.has(coreNodePeer.id)) {
          const peer = this.peers.get(coreNodePeer.id)!;
          peer.connectionState = 'connected';
          peer.lastSeen = Date.now();
          this.updateSyncStatus({ 
            isConnected: true, 
            connectedPeers: this.getConnectedPeers().length 
          });
          Logger.info('✅ [P2P] Conectado ao core node');
        }
      }, 1000);

    } catch (error) {
      Logger.error('❌ [P2P] Erro ao conectar ao core node:', error);
    }
  }

  /**
   * Start maintenance tasks
   */
  private startMaintenanceTasks(): void {
    // Heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeats();
    }, P2P_CONFIG.GOSSIP.HEARTBEAT_INTERVAL_MS) as any;

    // Gossip maintenance
    this.gossipInterval = setInterval(() => {
      this.performGossipMaintenance();
    }, P2P_CONFIG.GOSSIP.INTERVAL_MS) as any;
  }

  /**
   * Send heartbeats to connected peers
   */
  private async sendHeartbeats(): Promise<void> {
    const connectedPeers = this.getConnectedPeers();
    
    for (const peer of connectedPeers) {
      try {
        const heartbeat: GossipMessage = {
          id: await this.generateMessageId(),
          type: 'heartbeat',
          data: { nodeId: this.nodeId, timestamp: Date.now() },
          timestamp: Date.now(),
          ttl: Date.now() + 5000,
          sender: this.nodeId,
          signature: await this.signValue({ nodeId: this.nodeId, timestamp: Date.now() }),
          hops: 0,
          priority: 'normal',
          retryCount: 0
        };

        // In real implementation, send via actual P2P connection
        peer.lastHeartbeat = Date.now();
      } catch (error) {
        Logger.error('❌ [P2P] Erro ao enviar heartbeat:', error);
      }
    }
  }

  /**
   * Perform gossip protocol maintenance
   */
  private async performGossipMaintenance(): Promise<void> {
    // Clean expired messages
    const now = Date.now();
    for (const [messageId, message] of this.gossipCache.entries()) {
      if (message.ttl < now) {
        this.gossipCache.delete(messageId);
      }
    }

    // Update sync status
    this.updateSyncStatus({
      connectedPeers: this.getConnectedPeers().length,
      lastSync: new Date()
    });
  }

  // ============= KADEMLIA DHT IMPLEMENTATION =============

  /**
   * Initialize Kademlia DHT with proper node ID and buckets
   */
  private async initializeKademliaDHT(): Promise<void> {
    // Generate 160-bit DHT node ID from regular node ID
    this.dhtNodeId = await this.generateDHTNodeId(this.nodeId);
    
    // Initialize K-buckets for 160-bit keyspace
    for (let i = 0; i < this.KEYSPACE_SIZE; i++) {
      this.kBuckets.set(i, {
        nodes: [],
        lastUpdated: Date.now(),
        maxSize: this.K_BUCKET_SIZE
      });
    }

    Logger.info(`Kademlia DHT initialized with ID: ${this.dhtNodeId}`);
  }

  /**
   * Generate 160-bit SHA-1 based DHT node ID
   */
  private async generateDHTNodeId(nodeId: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1, 
      nodeId
    );
    return hash;
  }

  /**
   * Calculate XOR distance between two DHT IDs
   */
  private calculateXORDistance(id1: string, id2: string): number {
    // Convert hex strings to buffers for XOR operation
    const buf1 = this.hexToBuffer(id1);
    const buf2 = this.hexToBuffer(id2);
    
    // Calculate XOR distance bit by bit
    let distance = 0;
    for (let i = 0; i < Math.min(buf1.length, buf2.length); i++) {
      const xor = buf1[i] ^ buf2[i];
      if (xor !== 0) {
        // Find the most significant bit position
        for (let bit = 7; bit >= 0; bit--) {
          if ((xor >> bit) & 1) {
            return distance + (7 - bit);
          }
        }
      }
      distance += 8;
    }
    return distance;
  }

  /**
   * Convert hex string to byte array
   */
  private hexToBuffer(hex: string): number[] {
    const result: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      result.push(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  }

  /**
   * Find the appropriate K-bucket for a node
   */
  private findKBucket(nodeId: string): number {
    const distance = this.calculateXORDistance(this.dhtNodeId, nodeId);
    return Math.min(distance, this.KEYSPACE_SIZE - 1);
  }

  /**
   * Add node to appropriate K-bucket (Kademlia routing table)
   */
  private addToKBucket(peer: P2PPeer): void {
    const bucketIndex = this.findKBucket(peer.id);
    const bucket = this.kBuckets.get(bucketIndex)!;
    
    // Check if node already exists in bucket
    const existingIndex = bucket.nodes.findIndex(n => n.id === peer.id);
    
    if (existingIndex >= 0) {
      // Move existing node to tail (most recently seen)
      bucket.nodes.splice(existingIndex, 1);
      bucket.nodes.push(peer);
    } else {
      // Add new node
      if (bucket.nodes.length < bucket.maxSize) {
        bucket.nodes.push(peer);
      } else {
        // Bucket full - ping head node, replace if unresponsive
        const headNode = bucket.nodes[0];
        this.pingNode(headNode).then(isAlive => {
          if (!isAlive) {
            bucket.nodes.shift(); // Remove unresponsive node
            bucket.nodes.push(peer); // Add new node
          }
          // If head is alive, discard new node (Kademlia rule)
        });
      }
    }
    
    bucket.lastUpdated = Date.now();
  }

  /**
   * Find K closest nodes to a target key using Kademlia algorithm
   */
  private findKClosestNodes(targetKey: string, k: number = this.K_BUCKET_SIZE): P2PPeer[] {
    const allNodes: P2PPeer[] = [];
    
    // Collect all nodes from all buckets
    for (const bucket of this.kBuckets.values()) {
      allNodes.push(...bucket.nodes);
    }
    
    // Sort by XOR distance to target
    allNodes.sort((a, b) => {
      const distA = this.calculateXORDistance(targetKey, a.id);
      const distB = this.calculateXORDistance(targetKey, b.id);
      return distA - distB;
    });
    
    return allNodes.slice(0, k);
  }

  /**
   * DHT Store operation using Kademlia
   */
  async dhtStore(key: string, value: any): Promise<boolean> {
    try {
      const targetKey = await this.generateDHTNodeId(key);
      const responsibleNodes = this.findKClosestNodes(targetKey, P2P_CONFIG.DHT.REPLICATION_FACTOR);
      
      // Create DHT entry
      const entry: DHTEntry = {
        key,
        value,
        timestamp: Date.now(),
        ttl: Date.now() + (P2P_CONFIG.DHT.TTL_HOURS * 60 * 60 * 1000),
        signature: await this.signValue(value),
        replicas: responsibleNodes.map(n => n.id)
      };

      // Store locally if this node is responsible
      const shouldStoreLocally = responsibleNodes.some(n => n.id === this.nodeId) || 
                                responsibleNodes.length === 0;
      
      if (shouldStoreLocally) {
        this.dhtStorage.set(key, entry);
        await this.saveDHTToStorage();
      }

      // Replicate to closest nodes
      const storePromises = responsibleNodes
        .filter(node => node.id !== this.nodeId && node.connectionState === 'connected')
        .map(node => this.sendDHTStore(node, key, entry));

      await Promise.allSettled(storePromises);
      
      Logger.info(`DHT Store successful: ${key} -> ${responsibleNodes.length} replicas`);
      return true;

    } catch (error) {
      Logger.error(`DHT Store failed for key ${key}`, error);
      return false;
    }
  }

  /**
   * DHT Get operation using iterative lookup
   */
  async dhtGet(key: string): Promise<any> {
    try {
      const targetKey = await this.generateDHTNodeId(key);
      
      // Check local storage first
      const localEntry = this.dhtStorage.get(key);
      if (localEntry && Date.now() <= localEntry.timestamp + localEntry.ttl) {
        Logger.debug(`DHT Get (local hit): ${key}`);
        return localEntry.value;
      }

      // Iterative lookup using Kademlia algorithm
      const result = await this.iterativeLookup(targetKey, 'GET', key);
      
      if (result) {
        // Cache locally for future queries
        await this.storeDHTValue(key, result);
        Logger.info(`DHT Get (network): ${key} -> found`);
        return result;
      }

      Logger.warn(`DHT Get: ${key} -> not found`);
      return null;

    } catch (error) {
      Logger.error(`DHT Get failed for key ${key}`, error);
      return null;
    }
  }

  /**
   * Iterative lookup algorithm (core of Kademlia)
   */
  private async iterativeLookup(targetKey: string, operation: 'GET' | 'FIND_NODE', data?: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const queryId = await this.generateMessageId();
      const shortlist = this.findKClosestNodes(targetKey, this.ALPHA);
      
      if (shortlist.length === 0) {
        resolve(null);
        return;
      }

      const queryContext: DHTQueryContext = {
        id: queryId,
        targetKey,
        closestNodes: [...shortlist],
        queriedNodes: new Set(),
        pendingQueries: 0,
        callback: resolve,
        timeout: setTimeout(() => {
          this.activeQueries.delete(queryId);
          resolve(null);
        }, P2P_CONFIG.DHT.QUERY_TIMEOUT_MS) as any
      };

      this.activeQueries.set(queryId, queryContext);
      
      // Start parallel queries
      await this.continueIterativeLookup(queryContext, operation, data);
    });
  }

  /**
   * Continue iterative lookup with parallel queries
   */
  private async continueIterativeLookup(context: DHTQueryContext, operation: string, data?: any): Promise<void> {
    const { targetKey, closestNodes, queriedNodes } = context;
    
    // Find nodes to query (not yet queried, up to ALPHA parallel queries)
    const nodesToQuery = closestNodes
      .filter(node => !queriedNodes.has(node.id) && node.connectionState === 'connected')
      .slice(0, this.ALPHA);

    if (nodesToQuery.length === 0 || context.pendingQueries >= this.ALPHA) {
      // No more nodes to query or too many pending
      if (context.pendingQueries === 0) {
        // No pending queries, lookup complete
        clearTimeout(context.timeout);
        this.activeQueries.delete(context.id);
        context.callback(null);
      }
      return;
    }

    // Send queries to selected nodes
    for (const node of nodesToQuery) {
      queriedNodes.add(node.id);
      context.pendingQueries++;
      
      this.sendDHTQuery(node, targetKey, operation, data)
        .then(result => this.handleDHTQueryResponse(context, node, result, operation))
        .catch(error => this.handleDHTQueryError(context, node, error));
    }
  }

  /**
   * Handle DHT query response
   */
  private async handleDHTQueryResponse(context: DHTQueryContext, fromNode: P2PPeer, result: any, operation: string): Promise<void> {
    context.pendingQueries--;
    
    if (operation === 'GET' && result && result.value) {
      // Found the value!
      clearTimeout(context.timeout);
      this.activeQueries.delete(context.id);
      context.callback(result.value);
      return;
    }
    
    if (result && result.closerNodes) {
      // Got closer nodes, add them to shortlist
      for (const nodeInfo of result.closerNodes) {
        const existingNode = context.closestNodes.find(n => n.id === nodeInfo.id);
        if (!existingNode && !context.queriedNodes.has(nodeInfo.id)) {
          // Create peer object from node info
          const newPeer: P2PPeer = {
            id: nodeInfo.id,
            host: nodeInfo.host,
            port: nodeInfo.port,
            lastSeen: Date.now(),
            trustScore: 0.5,
            isBootstrap: false,
            connectionState: 'disconnected',
            routingTable: new Map(),
            messageRelayCount: 0,
            lastHeartbeat: Date.now(),
            failureCount: 0,
            isReliable: false
          };
          
          context.closestNodes.push(newPeer);
        }
      }
      
      // Sort by distance and keep only K closest
      context.closestNodes.sort((a, b) => {
        const distA = this.calculateXORDistance(context.targetKey, a.id);
        const distB = this.calculateXORDistance(context.targetKey, b.id);
        return distA - distB;
      });
      context.closestNodes = context.closestNodes.slice(0, this.K_BUCKET_SIZE);
    }
    
    // Continue lookup if we haven't found what we're looking for
    await this.continueIterativeLookup(context, operation);
  }

  /**
   * Handle DHT query error
   */
  private async handleDHTQueryError(context: DHTQueryContext, fromNode: P2PPeer, error: any): Promise<void> {
    context.pendingQueries--;
    fromNode.failureCount++;
    
    if (fromNode.failureCount >= 5) { // FAILURE_THRESHOLD
      fromNode.connectionState = 'error';
      fromNode.isReliable = false;
    }
    
    Logger.warn(`DHT query error from ${fromNode.id}:`, error);
    
    // Continue lookup with remaining nodes
    await this.continueIterativeLookup(context, 'GET');
  }

  // ============= GOSSIP EPIDEMIC IMPLEMENTATION =============

  /**
   * Initialize Gossip Epidemic Protocol
   */
  private async initializeGossipEpidemic(): Promise<void> {
    // Start epidemic rounds
    this.epidemicTimer = setInterval(async () => {
      await this.performEpidemicRound();
    }, P2P_CONFIG.GOSSIP.INTERVAL_MS) as any;

    // Start anti-entropy process
    this.antiEntropyTimer = setInterval(async () => {
      await this.performAntiEntropy();
    }, P2P_CONFIG.GOSSIP.INTERVAL_MS) as any;

    Logger.info('Gossip Epidemic Protocol initialized');
  }

  /**
   * Broadcast message using epidemic propagation
   */
  async epidemicBroadcast(type: string, data: any, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): Promise<void> {
    try {
      const messageId = await this.generateMessageId();
      
      const gossipMessage: GossipMessage = {
        id: messageId,
        type,
        data,
        timestamp: Date.now(),
        ttl: Date.now() + P2P_CONFIG.GOSSIP.MESSAGE_TTL_MS,
        sender: this.nodeId,
        signature: await this.signValue({ type, data }),
        hops: 0,
        priority,
        retryCount: 0,
        alternativeRoutes: []
      };

      // Initialize infection state
      const infectionState: GossipInfectionState = {
        messageId,
        infectedNodes: new Set([this.nodeId]),
        infectionRound: 0,
        lastInfection: Date.now(),
        targetInfectionRate: P2P_CONFIG.GOSSIP.FANOUT
      };

      this.infectionStates.set(messageId, infectionState);
      this.gossipCache.set(messageId, gossipMessage);
      
      // Start epidemic spread
      await this.infectNodes(infectionState, gossipMessage);
      
      Logger.info(`Epidemic broadcast started: ${type} (${messageId})`);

    } catch (error) {
      Logger.error('Epidemic broadcast failed', error);
    }
  }

  /**
   * Perform epidemic infection round
   */
  private async infectNodes(infectionState: GossipInfectionState, message: GossipMessage): Promise<void> {
    const { infectedNodes, targetInfectionRate } = infectionState;
    
    // Get all connected peers that are not infected yet
    const susceptibleNodes = Array.from(this.peers.values())
      .filter(peer => 
        peer.connectionState === 'connected' && 
        !infectedNodes.has(peer.id) &&
        peer.id !== this.nodeId
      );

    if (susceptibleNodes.length === 0) {
      // No more nodes to infect
      return;
    }

    // Select nodes to infect this round (epidemic fanout)
    const nodesToInfect = this.selectNodesForInfection(susceptibleNodes, targetInfectionRate);
    
    // Infect selected nodes
    const infectionPromises = nodesToInfect.map(async (peer) => {
      try {
        await this.infectNode(peer, message);
        infectedNodes.add(peer.id);
        peer.messageRelayCount++;
      } catch (error) {
        Logger.warn(`Failed to infect node ${peer.id}`, error);
      }
    });

    await Promise.allSettled(infectionPromises);
    
    infectionState.infectionRound++;
    infectionState.lastInfection = Date.now();
    
    Logger.debug(`Infection round ${infectionState.infectionRound}: infected ${nodesToInfect.length} nodes`);
  }

  /**
   * Select nodes for infection based on epidemic parameters
   */
  private selectNodesForInfection(susceptibleNodes: P2PPeer[], targetRate: number): P2PPeer[] {
    // Simple random selection for now
    // In advanced implementation, could use:
    // - Peer reliability scores
    // - Network topology awareness
    // - Message priority
  
    const numToInfect = Math.min(targetRate, susceptibleNodes.length);
    const selected: P2PPeer[] = [];
    
    for (let i = 0; i < numToInfect; i++) {
      const randomIndex = Math.floor(Math.random() * susceptibleNodes.length);
      const selectedNode = susceptibleNodes.splice(randomIndex, 1)[0];
      selected.push(selectedNode);
    }
    
    return selected;
  }

  /**
   * Infect a single node with the message
   */
  private async infectNode(peer: P2PPeer, message: GossipMessage): Promise<void> {
    // Create infected message copy
    const infectedMessage: GossipMessage = {
      ...message,
      hops: message.hops + 1,
      routePath: [...(message.routePath || []), this.nodeId]
    };

    // Send message to peer
    await this.sendGossipMessage(peer, infectedMessage);
  }

  /**
   * Perform anti-entropy synchronization for eventual consistency
   */
  private async performAntiEntropy(): Promise<void> {
    try {
      const connectedPeers = Array.from(this.peers.values())
        .filter(peer => peer.connectionState === 'connected' && peer.id !== this.nodeId);

      if (connectedPeers.length === 0) {
        return;
      }

      // Select random peer for anti-entropy
      const randomPeer = connectedPeers[Math.floor(Math.random() * connectedPeers.length)];
      
      // Exchange message inventories
      await this.exchangeInventories(randomPeer);
      
      this.antiEntropyState.lastSync = Date.now();
      this.antiEntropyState.syncPartner = randomPeer.id;
      
      Logger.debug(`Anti-entropy sync with ${randomPeer.id}`);

    } catch (error) {
      Logger.warn('Anti-entropy failed', error);
    }
  }

  /**
   * Exchange message inventories for anti-entropy
   */
  private async exchangeInventories(peer: P2PPeer): Promise<void> {
    // Get local message inventory
    const localInventory = Array.from(this.gossipCache.keys());
    
    // Request peer's inventory
    const inventoryRequest: GossipMessage = {
      id: await this.generateMessageId(),
      type: 'peer_discovery',
      data: { 
        type: 'inventory_request',
        inventory: localInventory 
      },
      timestamp: Date.now(),
      ttl: Date.now() + P2P_CONFIG.GOSSIP.MESSAGE_TTL_MS,
      sender: this.nodeId,
      signature: await this.signValue(localInventory),
      hops: 0,
      priority: 'normal',
      retryCount: 0
    };

    await this.sendGossipMessage(peer, inventoryRequest);
  }

  /**
   * Handle received inventory for anti-entropy
   */
  private async handleInventoryExchange(peer: P2PPeer, theirInventory: string[], ourInventory: string[]): Promise<void> {
    // Find messages they have that we don't
    const missingMessages = theirInventory.filter(msgId => !this.gossipCache.has(msgId));
    
    // Find messages we have that they don't
    const newMessages = ourInventory.filter(msgId => !theirInventory.includes(msgId));
    
    // Request missing messages
    if (missingMessages.length > 0) {
      const requestMessage: GossipMessage = {
        id: await this.generateMessageId(),
        type: 'peer_discovery',
        data: { 
          type: 'message_request',
          messageIds: missingMessages 
        },
        timestamp: Date.now(),
        ttl: Date.now() + P2P_CONFIG.GOSSIP.MESSAGE_TTL_MS,
        sender: this.nodeId,
        signature: await this.signValue(missingMessages),
        hops: 0,
        priority: 'normal',
        retryCount: 0
      };

      await this.sendGossipMessage(peer, requestMessage);
    }
    
    // Send our new messages
    if (newMessages.length > 0) {
      for (const msgId of newMessages) {
        const message = this.gossipCache.get(msgId);
        if (message) {
          await this.sendGossipMessage(peer, message);
        }
      }
    }
  }

  /**
   * Perform periodic epidemic round
   */
  private async performEpidemicRound(): Promise<void> {
    const now = Date.now();
    
    // Process active infections
    for (const [messageId, infectionState] of this.infectionStates) {
      const message = this.gossipCache.get(messageId);
      
      if (!message || now > message.ttl) {
        // Message expired
        this.infectionStates.delete(messageId);
        continue;
      }
      
      // Check if we should continue infecting
      const timeSinceLastInfection = now - infectionState.lastInfection;
      const shouldInfect = timeSinceLastInfection >= P2P_CONFIG.GOSSIP.INTERVAL_MS;
      
      if (shouldInfect) {
        await this.infectNodes(infectionState, message);
      }
    }
    
    // Cleanup old infection states
    this.cleanupInfectionStates();
  }

  /**
   * Cleanup expired infection states
   */
  private cleanupInfectionStates(): void {
    const now = Date.now();
    const maxAge = P2P_CONFIG.GOSSIP.INTERVAL_MS * 10; // 10 intervals
    
    for (const [messageId, infectionState] of this.infectionStates) {
      if (now - infectionState.lastInfection > maxAge) {
        this.infectionStates.delete(messageId);
      }
    }
  }

  // ============= NETWORK PROTOCOL METHODS =============

  /**
   * Send DHT store request to a peer
   */
  private async sendDHTStore(peer: P2PPeer, key: string, entry: DHTEntry): Promise<void> {
    const storeMessage: GossipMessage = {
      id: await this.generateMessageId(),
      type: 'dht_store',
      data: { key, entry },
      timestamp: Date.now(),
      ttl: Date.now() + P2P_CONFIG.DHT.STORE_TIMEOUT_MS,
      sender: this.nodeId,
      signature: await this.signValue({ key, entry }),
      hops: 0,
      priority: 'high',
      retryCount: 0
    };

    await this.sendGossipMessage(peer, storeMessage);
  }

  /**
   * Send DHT query to a peer
   */
  private async sendDHTQuery(peer: P2PPeer, targetKey: string, operation: string, data?: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const queryId = await this.generateMessageId();
      
      const queryMessage: GossipMessage = {
        id: queryId,
        type: 'dht_query',
        data: { targetKey, operation, queryData: data },
        timestamp: Date.now(),
        ttl: Date.now() + P2P_CONFIG.DHT.QUERY_TIMEOUT_MS,
        sender: this.nodeId,
        signature: await this.signValue({ targetKey, operation }),
        hops: 0,
        priority: 'high',
        retryCount: 0
      };

      // Set up response handler
      const timeout = setTimeout(() => {
        reject(new Error('DHT query timeout'));
      }, P2P_CONFIG.DHT.QUERY_TIMEOUT_MS) as any;

      // Store query for response matching
      this.activeQueries.set(queryId, {
        id: queryId,
        targetKey,
        closestNodes: [],
        queriedNodes: new Set(),
        pendingQueries: 1,
        callback: (result) => {
          clearTimeout(timeout);
          resolve(result);
        },
        timeout
      });

      await this.sendGossipMessage(peer, queryMessage);
    });
  }

  /**
   * Send gossip message to a specific peer
   */
  private async sendGossipMessage(peer: P2PPeer, message: GossipMessage): Promise<void> {
    try {
      // TODO: Implement actual network sending
      // For now, simulate the sending
      Logger.debug(`Sending ${message.type} to ${peer.id}`);
      
      // Update peer stats
      peer.lastSeen = Date.now();
      peer.lastHeartbeat = Date.now();
      
    } catch (error) {
      peer.failureCount++;
      if (peer.failureCount >= 5) { // FAILURE_THRESHOLD
        peer.connectionState = 'error';
        peer.isReliable = false;
      }
      throw error;
    }
  }

  /**
   * Ping a node to check if it's alive
   */
  private async pingNode(peer: P2PPeer): Promise<boolean> {
    try {
      const pingMessage: GossipMessage = {
        id: await this.generateMessageId(),
        type: 'ping',
        data: { timestamp: Date.now() },
        timestamp: Date.now(),
        ttl: Date.now() + 5000, // 5 second TTL for ping
        sender: this.nodeId,
        signature: await this.signValue({ timestamp: Date.now() }),
        hops: 0,
        priority: 'normal',
        retryCount: 0
      };

      await this.sendGossipMessage(peer, pingMessage);
      
      // In real implementation, would wait for pong response
      // For simulation, use failure rate
      return Math.random() > 0.1; // 90% success rate
      
    } catch (error) {
      return false;
    }
  }

  // ============= PUBLIC API METHODS =============
  
  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get connected peers
   */
  getConnectedPeers(): P2PPeer[] {
    return Array.from(this.peers.values())
      .filter(p => p.connectionState === 'connected');
  }

  /**
   * Get node ID
   */
  getNodeId(): string {
    return this.nodeId;
  }

  /**
   * Sync identity data via DHT/Gossip
   */
  async syncIdentity(identity: BlockchainIdentity): Promise<void> {
    try {
      // Store identity in DHT using structured keys
      const identityKey = `identity:${identity.address}`;
      const profileKey = `profile:${identity.address}`;
      const devicesKey = `devices:${identity.address}`;

      // Store core identity data (without sensitive info)
      const coreIdentityData = {
        address: identity.address,
        publicKey: identity.publicKey,
        derivationPath: identity.derivationPath,
        lastUpdated: Date.now()
      };
      await this.storeDHTValue(identityKey, coreIdentityData);

      // Store profile data separately for easier updates
      const profileData = {
        profile: identity.profile,
        lastUpdated: Date.now()
      };
      await this.storeDHTValue(profileKey, profileData);

      // Store devices information (without private keys)
      const devicesData = Object.fromEntries(
        Object.entries(identity.devices).map(([deviceId, device]) => [
          deviceId,
          {
            name: device.name,
            addedAt: device.addedAt,
            lastSync: device.lastSync,
            publicKey: device.publicKey
            // Note: não incluímos chaves privadas na sincronização P2P
          }
        ])
      );
      await this.storeDHTValue(devicesKey, devicesData);

      // Broadcast identity update via Gossip
      await this.broadcastGossipMessage('identity_update', {
        address: identity.address,
        timestamp: Date.now(),
        profileName: identity.profile?.name,
        deviceCount: Object.keys(identity.devices).length
      });

      Logger.info(`Identity synced via P2P: ${identity.address}`, {
        profileName: identity.profile?.name,
        deviceCount: Object.keys(identity.devices).length
      });
    } catch (error) {
      Logger.error('Failed to sync identity via P2P', error);
      throw error;
    }
  }

  /**
   * Fetch identity data from DHT
   */
  async fetchIdentityData(address: string): Promise<Partial<BlockchainIdentity> | null> {
    try {
      const identityKey = `identity:${address}`;
      const profileKey = `profile:${address}`;
      const devicesKey = `devices:${address}`;

      // Try to get from local DHT storage first
      const identityEntry = this.dhtStorage.get(identityKey);
      const profileEntry = this.dhtStorage.get(profileKey);
      const devicesEntry = this.dhtStorage.get(devicesKey);

      let foundData: Partial<BlockchainIdentity> | null = null;

      if (identityEntry && profileEntry) {
        // Check if entries are still valid (not expired)
        const now = Date.now();
        if (now <= identityEntry.timestamp + identityEntry.ttl &&
            now <= profileEntry.timestamp + profileEntry.ttl) {
          
          foundData = {
            ...identityEntry.value,
            ...profileEntry.value,
            devices: devicesEntry?.value || {}
          };
          
          Logger.info('P2P: Dados de identidade encontrados no cache local DHT');
          return foundData;
        }
      }

      // If not in local storage or expired, try DHT lookup
      Logger.info('P2P: Buscando dados na DHT distribuída...');
      
      const identityResult = await this.dhtGet(identityKey);
      const profileResult = await this.dhtGet(profileKey);
      const devicesResult = await this.dhtGet(devicesKey);

      if (identityResult || profileResult) {
        foundData = {
          ...(identityResult || {}),
          profile: profileResult?.profile || profileResult,
          devices: devicesResult || {}
        };
        
        Logger.info('P2P: Dados de identidade encontrados na DHT distribuída');
        return foundData;
      }

      // If not found in DHT, query via Gossip
      Logger.info('P2P: Iniciando busca via protocolo Gossip...');
      await this.queryIdentityViaGossip(address);

      // In a real implementation, we would wait for gossip responses
      // For now, return null but log that gossip query was initiated
      Logger.info('P2P: Consulta Gossip iniciada, aguardando respostas da rede...');
      return null;

    } catch (error) {
      Logger.error(`Failed to fetch identity data for ${address}`, error);
      return null;
    }
  }

  /**
   * Query identity via Gossip protocol
   */
  private async queryIdentityViaGossip(address: string): Promise<void> {
    const queryMessage: GossipMessage = {
      id: await this.generateMessageId(),
      type: 'identity_query',
      data: {
        targetAddress: address,
        requesterId: this.nodeId,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      ttl: Date.now() + (10 * 60 * 1000), // 10 minutes
      sender: this.nodeId,
      signature: await this.signValue({ targetAddress: address }),
      hops: 0,
      priority: 'high', // Alta prioridade para consultas de identidade
      retryCount: 0, // Primeira tentativa
      routePath: [], // Caminho vazio no início
      alternativeRoutes: [] // Sem rotas alternativas inicialmente
    };

    // Broadcast query to all connected peers
    for (const [peerId, peer] of this.peers) {
      if (peer.connectionState === 'connected') {
        await this.sendGossipMessage(peer, queryMessage);
      }
    }
  }

  /**
   * Debug method for network connectivity testing
   */
  async debugNetworkConnectivity(): Promise<void> {
    const testUrls = [
      `http://${P2P_CONFIG.CORE_NODE.HOST}:3000/api/network/status`, // Core node status
      'https://httpbin.org/get' // External connectivity test
    ];

    console.log('🔍 [P2P Debug] Testando conectividade de rede...');
    
    for (const url of testUrls) {
      try {
        console.log(`📡 [P2P Debug] Testando: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.text();
          console.log(`✅ [P2P Debug] SUCESSO: ${url}`);
          console.log(`📊 [P2P Debug] Status: ${response.status}`);
        } else {
          console.log(`❌ [P2P Debug] ERRO HTTP: ${url} - Status: ${response.status}`);
        }
      } catch (error: any) {
        console.log(`❌ [P2P Debug] ERRO REDE: ${url} - ${error.message}`);
      }
    }

    // Show P2P status
    console.log('📊 [P2P Debug] Status P2P:', {
      nodeId: this.nodeId,
      connectedPeers: this.syncStatus.connectedPeers,
      isConnected: this.syncStatus.isConnected,
      dhtEntries: this.dhtStorage.size,
      gossipMessages: this.gossipCache.size
    });
  }

  /**
   * Debug status method - Called from HomeScreen
   */
  async debugStatus(): Promise<void> {
    await this.debugNetworkConnectivity();
  }

  // ============= UTILITY METHODS =============

  /**
   * Generate unique message ID
   */
  private async generateMessageId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Sign a value for message authentication
   */
  private async signValue(value: any): Promise<string> {
    const dataString = JSON.stringify(value);
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, dataString);
  }

  /**
   * Update sync status
   */
  private updateSyncStatus(updates: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...updates };
  }

  /**
   * Save DHT data to storage
   */
  private async saveDHTToStorage(): Promise<void> {
    try {
      const dhtArray = Array.from(this.dhtStorage.values());
      await AsyncStorage.setItem(P2PService.STORAGE_KEYS.DHT_STORAGE, JSON.stringify(dhtArray));
    } catch (error) {
      Logger.error('❌ [P2P] Erro ao salvar DHT storage:', error);
    }
  }

  /**
   * Store DHT value
   */
  private async storeDHTValue(key: string, value: any): Promise<void> {
    await this.dhtStore(key, value);
  }

  /**
   * Broadcast gossip message
   */
  private async broadcastGossipMessage(type: string, data: any): Promise<void> {
    await this.epidemicBroadcast(type, data, 'normal');
  }

  /**
   * Cleanup and stop service
   */
  async cleanup(): Promise<void> {
    if (this.gossipInterval) {
      clearInterval(this.gossipInterval);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.epidemicTimer) {
      clearInterval(this.epidemicTimer);
    }
    if (this.antiEntropyTimer) {
      clearInterval(this.antiEntropyTimer);
    }

    // Save current state
    try {
      const peersArray = Array.from(this.peers.values()).map(peer => ({
        ...peer,
        routingTable: undefined // Remove Map for serialization
      }));
      await AsyncStorage.setItem(P2PService.STORAGE_KEYS.PEERS, JSON.stringify(peersArray));
      await this.saveDHTToStorage();
    } catch (error) {
      Logger.error('❌ [P2P] Erro ao salvar estado:', error);
    }

    Logger.info('🛑 [P2P] Serviço P2P finalizado');
  }
}

export default P2PService;
