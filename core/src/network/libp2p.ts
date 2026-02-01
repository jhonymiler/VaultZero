import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { webSockets } from '@libp2p/websockets';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { kadDHT } from '@libp2p/kad-dht';
import { identify } from '@libp2p/identify';
import { ping } from '@libp2p/ping';
import { bootstrap } from '@libp2p/bootstrap';
import { mdns } from '@libp2p/mdns';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { multiaddr } from '@multiformats/multiaddr';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { PeerId } from '@libp2p/interface';
import crypto from 'crypto';
import { BlockchainLogger } from '../utils/logger.js';
import { EventEmitter } from 'events';

/**
 * Interface para estatísticas da rede P2P
 */
export interface NetworkStats {
  connected: boolean;
  nodeId: string;
  port: number | null;
  connectedPeers: number;
  knownNodes: number;
  connections: string[];
  peers?: number;
  multiaddrs?: string[];
  identitiesStored?: number;
}

/**
 * Tipos de mensagens para o sistema de gossip
 */
export interface GossipMessage {
  type: string;
  data: any;
  sender: string;
  timestamp: number;
  signature?: string;
}

/**
 * Interface para a identidade do nó
 */
export interface Identity {
  id: string;
  publicKey: string;
  timestamp: number;
  signature: string;
}

/**
 * Configuração da rede P2P
 */
export interface LibP2PConfig {
  port?: number;
  isBootstrap?: boolean;
  bootstrapPeers?: string[];
  enableMDNS?: boolean;
  maxConnections?: number;
  minConnections?: number;
}

export class LibP2PNetwork extends EventEmitter {
  private libp2p: Libp2p | null = null;
  private nodeId: string = '';
  private config: LibP2PConfig;
  private logger = BlockchainLogger.getInstance();
  private isStarted = false;
  private identityStore: Map<string, Identity> = new Map();

  constructor(config: LibP2PConfig = {}) {
    super();
    this.config = {
      port: 3001,
      isBootstrap: false,
      bootstrapPeers: [],
      enableMDNS: true,
      maxConnections: 100,
      minConnections: 5,
      ...config
    };
  }

  /**
   * Inicializa o nó libp2p
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      this.logger.blockchainWarn('LibP2P já está iniciado');
      return;
    }

    try {
      const listenAddresses = [
        `/ip4/0.0.0.0/tcp/${this.config.port}`, // TCP direto
        `/ip4/0.0.0.0/tcp/${(this.config.port || 3001) + 100}/ws` // WebSocket em porta diferente
      ];

      // Construir array de peer discovery
      const peerDiscovery: any[] = [];
      
      // Adicionar bootstrap se configurado
      if (this.config.bootstrapPeers && this.config.bootstrapPeers.length > 0) {
        this.logger.blockchainInfo(`🚀 Configurando bootstrap peers: ${this.config.bootstrapPeers.join(', ')}`);
        peerDiscovery.push(bootstrap({
          list: this.config.bootstrapPeers,
          timeout: 10000
        }) as any);
      }
      
      // Adicionar MDNS se habilitado
      if (this.config.enableMDNS) {
        peerDiscovery.push(mdns({
          interval: 1000,
          peerName: `vault-node-${this.config.port || 3001}`
        }) as any);
      }

      this.libp2p = await createLibp2p({
        addresses: {
          listen: listenAddresses
        },
        transports: [
          tcp() as any, // TCP para conexões diretas
          webSockets() as any // WebSocket para browsers
        ],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
          pubsub: gossipsub({
            allowPublishToZeroTopicPeers: true,
            emitSelf: false,
            fallbackToFloodsub: true,
            floodPublish: true
          }) as any,
          identify: identify() as any,
          ping: ping() as any
          // DHT temporariamente desabilitado devido a incompatibilidade de versões
          // dht: kadDHT({
          //   clientMode: !this.config.isBootstrap,
          //   validators: {},
          //   selectors: {}
          // }) as any
        },
        peerDiscovery,
        connectionManager: {
          maxConnections: this.config.maxConnections || 100,
          minConnections: this.config.minConnections || 1,
          pollInterval: 2000,
          autoDialInterval: 5000, // Reduzido de 10000 para 5000ms
          autoDialConcurrency: 10,
          autoDialPeerRetryThreshold: 1000,
          autoDialDiscoveredPeersDebounce: 500 // Reduzido de 1000 para 500ms
        } as any,
        transportManager: {
          faultTolerance: 'NO_FATAL' as any // Permite alguns erros de binding
        } as any
      });

      await this.libp2p.start();
      this.nodeId = this.libp2p.peerId.toString();
      this.isStarted = true;

      this.setupEventHandlers();
      this.startProtocolHandlers();

      // BOOTSTRAP MANUAL: Conectar automaticamente aos peers configurados
      if (this.config.bootstrapPeers && this.config.bootstrapPeers.length > 0) {
        this.logger.blockchainInfo(`🚀 Iniciando bootstrap manual para ${this.config.bootstrapPeers.length} peers...`);
        // Conectar após um pequeno delay para garantir que o nó está completamente iniciado
        setTimeout(() => this.connectToBootstrapPeers(), 2000);
      }

      this.logger.blockchainInfo('🚀 LibP2P Network iniciado', {
        nodeId: this.nodeId.substring(0, 16) + '...',
        port: this.config.port,
        isBootstrap: this.config.isBootstrap,
        listenAddresses: this.libp2p.getMultiaddrs().map(ma => ma.toString()),
        dhtEnabled: !!this.libp2p.services.dht
      });

      this.emit('started', {
        nodeId: this.nodeId,
        multiaddrs: this.libp2p.getMultiaddrs()
      });

    } catch (error) {
      this.logger.blockchainError('Erro ao iniciar LibP2P', error);
      throw error;
    }
  }

  /**
   * Para o nó libp2p
   */
  async stop(): Promise<void> {
    if (!this.libp2p || !this.isStarted) {
      return;
    }

    try {
      await this.libp2p.stop();
      this.isStarted = false;
      this.libp2p = null;
      this.logger.blockchainInfo('🛑 LibP2P Network parado');
      this.emit('stopped');
    } catch (error) {
      this.logger.blockchainError('Erro ao parar LibP2P', error);
      throw error;
    }
  }

  /**
   * Configura handlers de eventos
   */
  private setupEventHandlers(): void {
    if (!this.libp2p) return;

    // Peer discovery - com logs detalhados
    this.libp2p.addEventListener('peer:discovery', (evt) => {
      const peerId = evt.detail.id.toString();
      const multiaddrs = evt.detail.multiaddrs?.map(ma => ma.toString()) || [];
      this.logger.blockchainInfo(`🔍 DESCOBERTA: Peer ${peerId.substring(0, 16)}...`);
      this.logger.blockchainInfo(`📍 ENDEREÇOS: ${multiaddrs.join(', ')}`);
      this.emit('peer:discovery', { peerId, multiaddrs });
      
      // Tentar conectar automaticamente ao peer descoberto
      setTimeout(() => this.tryConnectToPeer(peerId, multiaddrs), 100);
    });

    // Peer connection - com logs detalhados
    this.libp2p.addEventListener('peer:connect', (evt) => {
      const peerId = evt.detail.toString();
      this.logger.blockchainInfo(`🤝 SUCESSO: Conectado ao peer ${peerId.substring(0, 16)}...`);
      this.emit('peer:connected', { peerId });
      
      // Solicitar sincronização de identidades
      this.requestIdentitySync(peerId);
    });

    // Peer disconnection
    this.libp2p.addEventListener('peer:disconnect', (evt) => {
      const peerId = evt.detail.toString();
      this.logger.blockchainWarn(`💔 DESCONEXÃO: Peer ${peerId.substring(0, 16)}...`);
      this.emit('peer:disconnected', { peerId });
    });

    // Connection events - mais detalhados
    this.libp2p.addEventListener('connection:open', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      const direction = evt.detail.direction;
      const remoteAddr = evt.detail.remoteAddr.toString();
      this.logger.blockchainInfo(`🔗 CONEXÃO ABERTA: ${direction} com ${peerId.substring(0, 16)}... em ${remoteAddr}`);
    });

    this.libp2p.addEventListener('connection:close', (evt) => {
      const peerId = evt.detail.remotePeer.toString();
      const remoteAddr = evt.detail.remoteAddr.toString();
      this.logger.blockchainWarn(`❌ CONEXÃO FECHADA: ${peerId.substring(0, 16)}... em ${remoteAddr}`);
    });

    // Transport events
    this.libp2p.addEventListener('transport:listening', (evt) => {
      const addr = evt.detail.toString();
      this.logger.blockchainInfo(`🎧 LISTENING: ${addr}`);
    });

    this.libp2p.addEventListener('transport:close', (evt) => {
      const addr = evt.detail.toString();
      this.logger.blockchainWarn(`🔇 TRANSPORT CLOSED: ${addr}`);
    });
  }

  /**
   * Tenta conectar a um peer descoberto com retry e logs detalhados
   */
  private async tryConnectToPeer(peerId: string, multiaddrs: string[]): Promise<void> {
    if (!this.libp2p) return;

    this.logger.blockchainInfo(`🔄 TENTATIVA CONEXÃO: ${peerId.substring(0, 16)}...`);
    this.logger.blockchainInfo(`📍 ENDEREÇOS DISPONÍVEIS: ${multiaddrs.length}`);

    for (let i = 0; i < multiaddrs.length; i++) {
      const addr = multiaddrs[i];
      try {
        this.logger.blockchainInfo(`🔗 TENTANDO [${i + 1}/${multiaddrs.length}]: ${addr}`);
        
        // Verificar se não estamos já conectados
        const connections = this.libp2p.getConnections();
        const alreadyConnected = connections.some(conn => conn.remotePeer.toString() === peerId);
        
        if (alreadyConnected) {
          this.logger.blockchainInfo(`✅ JÁ CONECTADO: ${peerId.substring(0, 16)}...`);
          return;
        }

        await this.libp2p.dial(multiaddr(addr));
        this.logger.blockchainInfo(`🎉 CONEXÃO ESTABELECIDA: ${peerId.substring(0, 16)}... via ${addr}`);
        return;
        
      } catch (error: any) {
        this.logger.blockchainWarn(`❌ FALHA [${i + 1}/${multiaddrs.length}]: ${addr}`);
        this.logger.blockchainDebug(`ERRO: ${error.message || error}`);
        
        // Se é erro de "já conectado", consideramos sucesso
        if (error.message && error.message.includes('already connected')) {
          this.logger.blockchainInfo(`✅ JÁ CONECTADO (via erro): ${peerId.substring(0, 16)}...`);
          return;
        }
      }
    }
    
    this.logger.blockchainError(`💥 TODAS TENTATIVAS FALHARAM: ${peerId.substring(0, 16)}...`);
  }

  /**
   * Inicia handlers de protocolos personalizados
   */
  private startProtocolHandlers(): void {
    if (!this.libp2p) return;

    // Handler para sincronização de identidades
    this.libp2p.handle('/vault-zero/identity-sync/1.0.0', async ({ stream }) => {
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      try {
        for await (const chunk of stream.source) {
          const data = decoder.decode(chunk.subarray());
          const message = JSON.parse(data);
          
          if (message.type === 'identity-request') {
            // Responder com identidades conhecidas
            const identities = Array.from(this.identityStore.values());
            const response = JSON.stringify({ type: 'identity-response', identities });
            await stream.sink([encoder.encode(response)]);
          }
        }
      } catch (error) {
        this.logger.blockchainError('Erro no handler de sincronização', error);
      }
    });

    // Handler para autenticação
    this.libp2p.handle('/vault-zero/auth/1.0.0', async ({ stream }) => {
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      try {
        for await (const chunk of stream.source) {
          const data = decoder.decode(chunk.subarray());
          const message = JSON.parse(data);
          
          // Processar mensagem de autenticação
          const response = JSON.stringify({ type: 'auth-response', success: true });
          await stream.sink([encoder.encode(response)]);
        }
      } catch (error) {
        this.logger.blockchainError('Erro no handler de autenticação', error);
      }
    });

    // Handler para mensagens diretas
    this.libp2p.handle('/vault-zero/direct-message/1.0.0', async ({ stream, connection }) => {
      const decoder = new TextDecoder();
      const peerId = connection.remotePeer.toString();

      try {
        for await (const chunk of stream.source) {
          const data = decoder.decode(chunk.subarray());
          const message = JSON.parse(data);
          
          this.logger.blockchainDebug(`📨 Mensagem direta recebida de ${peerId.substring(0, 16)}...`);
          this.emit('message', { ...message, sender: peerId });
        }
      } catch (error) {
        this.logger.blockchainError('Erro no handler de mensagem direta', error);
      }
    });

    // Handler para sincronização via protocolo customizado
    this.libp2p.handle('/vault-zero/sync/1.0.0', async ({ stream, connection }) => {
      const decoder = new TextDecoder();
      const peerId = connection.remotePeer.toString();

      try {
        for await (const chunk of stream.source) {
          const data = decoder.decode(chunk.subarray());
          const message = JSON.parse(data);
          
          this.logger.blockchainDebug(`🔄 Sync message recebida de ${peerId.substring(0, 16)}...`);
          this.emit('message', { ...message, sender: peerId });
        }
      } catch (error) {
        this.logger.blockchainError('Erro no handler de sync', error);
      }
    });

    this.subscribeToGossipTopics();
  }

  /**
   * Subscreve aos tópicos de gossip
   */
  private async subscribeToGossipTopics(): Promise<void> {
    if (!this.libp2p?.services.pubsub) return;

    const topics = ['vault-zero-identities', 'vault-zero-auth', 'vault-zero-sync', 'vault-zero-broadcast', 'vault-zero/network-sync'];
    
    for (const topic of topics) {
      try {
        await (this.libp2p.services.pubsub as any).subscribe(topic);
        this.logger.blockchainDebug(`📡 Subscrito ao tópico: ${topic}`);
      } catch (error) {
        this.logger.blockchainError(`Erro ao subscrever ao tópico ${topic}`, error);
      }
    }

    // Handler para mensagens recebidas
    (this.libp2p.services.pubsub as any).addEventListener('message', (evt: any) => {
      const { topic, data } = evt.detail;
      try {
        const message = JSON.parse(new TextDecoder().decode(data));
        this.handleGossipMessage(topic, message);
      } catch (error) {
        this.logger.blockchainError('Erro ao processar mensagem gossip', error);
      }
    });
  }

  /**
   * Processa mensagens de gossip
   */
  private handleGossipMessage(topic: string, message: GossipMessage): void {
    this.logger.blockchainDebug(`📢 Mensagem gossip recebida no tópico ${topic}:`, message);
    
    switch (message.type) {
      case 'identity-announcement':
        // Processar anúncio de identidade
        break;
      case 'auth-challenge':
        // Processar desafio de autenticação
        break;
      default:
        this.logger.blockchainDebug(`Tipo de mensagem gossip desconhecido: ${message.type}`);
    }
  }

  /**
   * Armazena identidade no DHT
   */
  async storeIdentity(identity: Identity): Promise<boolean> {
    try {
      const key = new TextEncoder().encode(`identity:${identity.id}`);
      const value = new TextEncoder().encode(JSON.stringify(identity));
      
      // Verifica se DHT está disponível
      const dht = this.libp2p?.services?.dht as any;
      if (dht && typeof dht.put === 'function') {
        await dht.put(key, value);
        this.logger.blockchainInfo(`🔐 DHT: Identidade armazenada no DHT: ${identity.id}`);
      } else {
        this.logger.blockchainWarn(`DHT não disponível para armazenar identidade ${identity.id}`);
      }
      
      // Armazenar localmente também
      this.identityStore.set(identity.id, identity);
      
      // Anunciar via gossip
      await this.announceIdentity(identity);
      
      this.logger.blockchainInfo(`🔐 Identidade armazenada localmente: ${identity.id}`);
      return true;
      
    } catch (error) {
      this.logger.blockchainError('Erro ao armazenar identidade', error);
      return false;
    }
  }

  /**
   * Recupera identidade do DHT
   */
  async getIdentity(identityId: string): Promise<Identity | null> {
    // Verificar cache local primeiro
    if (this.identityStore.has(identityId)) {
      return this.identityStore.get(identityId)!;
    }

    try {
      const key = new TextEncoder().encode(`identity:${identityId}`);
      
      // Verifica se DHT está disponível
      const dht = this.libp2p?.services?.dht as any;
      if (dht && typeof dht.get === 'function') {
        const result = await dht.get(key);
        
        if (result) {
          const identity = JSON.parse(new TextDecoder().decode(result)) as Identity;
          this.identityStore.set(identityId, identity); // Cache local
          this.logger.blockchainInfo(`🔍 Identidade recuperada do DHT: ${identityId}`);
          return identity;
        }
      } else {
        this.logger.blockchainWarn(`DHT não disponível para buscar identidade ${identityId}`);
      }
      
      return null;
    } catch (error) {
      this.logger.blockchainError('Erro ao recuperar identidade do DHT', error);
      return null;
    }
  }

  /**
   * Anuncia identidade via gossip
   */
  private async announceIdentity(identity: Identity): Promise<void> {
    if (!this.libp2p?.services.pubsub) return;

    const announcement: GossipMessage = {
      type: 'identity-announcement',
      data: identity,
      sender: this.nodeId,
      timestamp: Date.now()
    };

    try {
      const message = new TextEncoder().encode(JSON.stringify(announcement));
      await (this.libp2p.services.pubsub as any).publish('vault-zero-identities', message);
      this.logger.blockchainDebug(`📢 Identidade anunciada via gossip: ${identity.id}`);
    } catch (error) {
      this.logger.blockchainError('Erro ao anunciar identidade', error);
    }
  }

  /**
   * Solicita sincronização de identidades
   */
  private async requestIdentitySync(peerId: string): Promise<void> {
    if (!this.libp2p) return;

    try {
      const stream = await this.libp2p.dialProtocol(multiaddr(`/p2p/${peerId}`), '/vault-zero/identity-sync/1.0.0');
      const request = JSON.stringify({ type: 'identity-request', timestamp: Date.now() });
      await stream.sink([new TextEncoder().encode(request)]);
      await stream.close();
    } catch (error) {
      this.logger.blockchainError(`Erro ao solicitar sincronização de ${peerId}`, error);
    }
  }

  /**
   * Conecta manualmente a um peer
   */
  async connectToPeer(multiaddrStr: string): Promise<boolean> {
    if (!this.libp2p) {
      this.logger.blockchainError('LibP2P não iniciado');
      return false;
    }

    try {
      await this.libp2p.dial(multiaddr(multiaddrStr));
      this.logger.blockchainInfo(`✅ Conectado manualmente a: ${multiaddrStr}`);
      return true;
    } catch (error) {
      this.logger.blockchainError(`Erro ao conectar a ${multiaddrStr}`, error);
      return false;
    }
  }

  /**
   * Conecta automaticamente aos peers de bootstrap configurados
   */
  private async connectToBootstrapPeers(): Promise<void> {
    if (!this.config.bootstrapPeers || this.config.bootstrapPeers.length === 0) {
      return;
    }

    this.logger.blockchainInfo(`🔗 Conectando manualmente aos ${this.config.bootstrapPeers.length} bootstrap peers...`);

    for (const bootstrapAddr of this.config.bootstrapPeers) {
      try {
        this.logger.blockchainInfo(`🔗 Tentando conectar ao bootstrap: ${bootstrapAddr}`);
        await this.connectToPeer(bootstrapAddr);
        this.logger.blockchainInfo(`✅ Conectado com sucesso ao bootstrap: ${bootstrapAddr}`);
        
        // Aguardar um pouco entre conexões para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error: any) {
        this.logger.blockchainWarn(`⚠️ Falha ao conectar ao bootstrap ${bootstrapAddr}:`, error.message || error);
        // Não parar se um bootstrap falhar, tentar o próximo
      }
    }

    // Verificar conexões estabelecidas
    const connections = this.getConnections();
    this.logger.blockchainInfo(`🎯 Bootstrap manual concluído. Conexões estabelecidas: ${connections.length}`);
    
    if (connections.length > 0) {
      this.logger.blockchainInfo(`🎉 Conectado com sucesso via bootstrap manual!`);
    } else {
      this.logger.blockchainWarn(`⚠️ Nenhuma conexão bootstrap estabelecida`);
    }
  }

  /**
   * Obtém estatísticas da rede
   */
  getNetworkStats(): NetworkStats {
    if (!this.libp2p || !this.isStarted) {
      return {
        connected: false,
        nodeId: '',
        port: null,
        connectedPeers: 0,
        knownNodes: 0,
        connections: [],
        identitiesStored: 0
      };
    }

    const connections = this.libp2p.getConnections();
    const peers = this.libp2p.getPeers();

    return {
      connected: this.isStarted,
      nodeId: this.nodeId,
      port: this.config.port || null,
      connectedPeers: connections.length,
      knownNodes: peers.length,
      connections: connections.map(conn => conn.remotePeer.toString()),
      peers: peers.length,
      multiaddrs: this.libp2p.getMultiaddrs().map(ma => ma.toString()),
      identitiesStored: this.identityStore.size
    };
  }

  /**
   * Obtém o ID do nó
   */
  getNodeId(): string {
    return this.nodeId;
  }

  /**
   * Verifica se o nó está iniciado
   */
  isReady(): boolean {
    return this.isStarted && this.libp2p !== null;
  }

  /**
   * Obtém os multiaddrs do nó
   */
  getMultiaddrs(): string[] {
    if (!this.libp2p) return [];
    return this.libp2p.getMultiaddrs().map(ma => ma.toString());
  }

  /**
   * Obtém conexões ativas
   */
  getConnections(): string[] {
    if (!this.libp2p) return [];
    return this.libp2p.getConnections().map(conn => conn.remotePeer.toString());
  }

  /**
   * Obtém peers conhecidos
   */
  getPeers(): string[] {
    if (!this.libp2p) return [];
    return this.libp2p.getPeers().map(peer => peer.toString());
  }

  /**
   * Obtém peers conectados
   */
  getConnectedPeers(): string[] {
    return this.getConnections();
  }

  /**
   * Publica mensagem em um tópico específico
   */
  async publishToTopic(topic: string, message: any): Promise<boolean> {
    if (!this.libp2p?.services.pubsub) {
      this.logger.blockchainError('PubSub não disponível');
      return false;
    }

    try {
      const encoded = new TextEncoder().encode(JSON.stringify(message));
      await (this.libp2p.services.pubsub as any).publish(topic, encoded);
      this.logger.blockchainDebug(`📡 Mensagem publicada no tópico ${topic}`);
      return true;
    } catch (error) {
      this.logger.blockchainError(`Erro ao publicar no tópico ${topic}`, error);
      return false;
    }
  }

  /**
   * Faz broadcast de mensagem para todos os peers conectados
   */
  async broadcast(message: GossipMessage): Promise<boolean> {
    if (!this.libp2p?.services.pubsub) {
      this.logger.blockchainError('PubSub não disponível para broadcast');
      return false;
    }

    try {
      const encoded = new TextEncoder().encode(JSON.stringify(message));
      await (this.libp2p.services.pubsub as any).publish('vault-zero-broadcast', encoded);
      this.logger.blockchainDebug(`📢 Broadcast enviado: ${message.type}`);
      return true;
    } catch (error) {
      this.logger.blockchainError('Erro no broadcast', error);
      return false;
    }
  }

  /**
   * Envia mensagem direta para um peer específico
   */
  async sendDirectMessage(peerId: string, protocolOrMessage: string | any, message?: any): Promise<boolean> {
    if (!this.libp2p) {
      this.logger.blockchainError('LibP2P não iniciado');
      return false;
    }

    try {
      let protocol = '/vault-zero/direct-message/1.0.0';
      let data = protocolOrMessage;
      
      // Se foram passados 3 argumentos, o segundo é o protocolo
      if (message !== undefined) {
        protocol = protocolOrMessage as string;
        data = message;
      }
      
      // Usar protocolo customizado para mensagens diretas
      const stream = await this.libp2p.dialProtocol(
        multiaddr(`/p2p/${peerId}`), 
        protocol
      );
      
      const encoded = new TextEncoder().encode(JSON.stringify(data));
      await stream.sink([encoded]);
      await stream.close();
      
      this.logger.blockchainDebug(`📨 Mensagem direta enviada para ${peerId.substring(0, 16)}... via ${protocol}`);
      return true;
    } catch (error) {
      this.logger.blockchainError(`Erro ao enviar mensagem direta para ${peerId}`, error);
      return false;
    }
  }
}