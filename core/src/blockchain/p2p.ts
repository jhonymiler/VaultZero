import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';
import { P2PNode, GossipMessage, Identity } from '../types';
import { nanoid } from 'nanoid';
import { createHash } from 'crypto';

export class P2PNetwork extends EventEmitter {
  private nodes: Map<string, P2PNode> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private server: WebSocketServer;
  private nodeId: string;
  private port: number;
  private isStarted = false;

  constructor(port: number = 8080) {
    super();
    this.port = port;
    this.nodeId = this.generateNodeId();
    this.server = new WebSocketServer({ port: this.port });
    this.setupServer();
  }

  /**
   * Gera um ID único para o nó
   */
  private generateNodeId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36);
    return createHash('sha256').update(timestamp + random).digest('hex').substring(0, 16);
  }

  /**
   * Configura o servidor WebSocket
   */
  private setupServer(): void {
    this.server.on('connection', (ws: WebSocket, req) => {
      const clientId = nanoid();
      console.log(`Nova conexão P2P: ${clientId}`);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message, ws);
        } catch (error) {
          console.error('Erro ao processar mensagem P2P:', error);
        }
      });

      ws.on('close', () => {
        console.log(`Conexão P2P fechada: ${clientId}`);
        this.connections.delete(clientId);
        this.removeNode(clientId);
        
        // Emite evento de peer desconectado
        this.emit('peer_disconnected', clientId);
      });

      ws.on('error', (error) => {
        console.error(`Erro na conexão P2P ${clientId}:`, error);
        this.connections.delete(clientId);
        this.removeNode(clientId);
        
        // Emite evento de peer desconectado
        this.emit('peer_disconnected', clientId);
      });

      this.connections.set(clientId, ws);
      
      // Emite evento de peer conectado
      this.emit('peer_connected', clientId);
      
      // Envia mensagem de boas-vindas
      this.sendToConnection(clientId, {
        type: 'welcome',
        nodeId: this.nodeId,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Inicia o nó P2P
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isStarted) {
        resolve();
        return;
      }

      this.server.on('listening', () => {
        this.isStarted = true;
        console.log(`Nó P2P iniciado na porta ${this.port} - ID: ${this.nodeId}`);
        
        // Inicia descoberta de peers
        this.startPeerDiscovery();
        resolve();
      });

      this.server.on('error', (error) => {
        console.error('Erro ao iniciar servidor P2P:', error);
        reject(error);
      });
    });
  }

  /**
   * Para o nó P2P
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Fecha todas as conexões
      for (const [id, ws] of this.connections.entries()) {
        ws.close();
        this.connections.delete(id);
      }

      // Para o servidor
      this.server.close(() => {
        this.isStarted = false;
        console.log('Nó P2P parado');
        resolve();
      });
    });
  }

  /**
   * Conecta a um peer específico
   */
  async connectToPeer(address: string, port: number): Promise<boolean> {
    try {
      const peerId = `${address}:${port}`;
      
      // Verifica se já está conectado
      if (this.connections.has(peerId)) {
        console.log(`Já conectado ao peer: ${peerId}`);
        return true;
      }

      // Evita auto-conexão
      if (port === this.port && address === 'localhost') {
        console.log(`Evitando auto-conexão na porta ${port}`);
        return false;
      }

      console.log(`🌐 Tentando conectar ao peer: ${peerId}`);
      const ws = new WebSocket(`ws://${address}:${port}`);

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log(`⏰ Timeout ao conectar com ${peerId}`);
          ws.close();
          resolve(false);
        }, 10000); // 10 segundos timeout

        ws.on('open', () => {
          clearTimeout(timeout);
          console.log(`✅ Conectado ao peer: ${peerId}`);
          this.connections.set(peerId, ws);
          
          // Adiciona o peer à lista de nós conhecidos
          this.addNode({
            id: peerId,
            address,
            port,
            publicKey: '', // Será preenchido após handshake
            lastSeen: Date.now(),
            trustScore: 0.5
          });

          // Emite evento de peer conectado
          this.emit('peer_connected', peerId);

          resolve(true);
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(peerId, message, ws);
          } catch (error) {
            console.error(`Erro ao processar mensagem do peer ${peerId}:`, error);
          }
        });

        ws.on('close', () => {
          clearTimeout(timeout);
          console.log(`🔌 Conexão com peer fechada: ${peerId}`);
          this.connections.delete(peerId);
          this.removeNode(peerId);
          
          // Emite evento de peer desconectado
          this.emit('peer_disconnected', peerId);
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          // Log menos verboso para erros de conexão
          if (error.message.includes('ECONNREFUSED')) {
            console.log(`🔍 Peer ${peerId} indisponível`);
          } else {
            console.error(`Erro na conexão com peer ${peerId}:`, error.message);
          }
          resolve(false);
        });
      });
    } catch (error) {
      console.error('Erro ao conectar ao peer:', error);
      return false;
    }
  }

  /**
   * Processa mensagens recebidas
   */
  private handleMessage(senderId: string, message: any, ws: WebSocket): void {
    switch (message.type) {
      case 'welcome':
        console.log(`Recebida mensagem de boas-vindas de ${message.nodeId}`);
        break;

      case 'identity_announcement':
        this.handleIdentityAnnouncement(senderId, message);
        break;

      case 'identity_verification':
        this.handleIdentityVerification(senderId, message);
        break;

      case 'sync_request':
        this.handleSyncRequest(senderId, message);
        break;

      case 'sync_response':
        this.handleSyncResponse(senderId, message);
        break;

      case 'peer_discovery':
        this.handlePeerDiscovery(senderId, message);
        break;

      default:
        console.log(`Tipo de mensagem desconhecido: ${message.type}`);
    }
  }

  /**
   * Manipula anúncios de identidade
   */
  private handleIdentityAnnouncement(senderId: string, message: GossipMessage): void {
    console.log(`Identidade anunciada por ${senderId}:`, message.data);
    this.emit('identity_announced', message.data, senderId);
  }

  /**
   * Manipula verificações de identidade
   */
  private handleIdentityVerification(senderId: string, message: GossipMessage): void {
    console.log(`Verificação de identidade de ${senderId}:`, message.data);
    this.emit('identity_verification', message.data, senderId);
  }

  /**
   * Manipula solicitações de sincronização
   */
  private handleSyncRequest(senderId: string, message: GossipMessage): void {
    console.log(`Solicitação de sync de ${senderId}`);
    this.emit('sync_request', message.data, senderId);
  }

  /**
   * Manipula respostas de sincronização
   */
  private handleSyncResponse(senderId: string, message: GossipMessage): void {
    console.log(`Resposta de sync de ${senderId}`);
    this.emit('sync_response', message.data, senderId);
  }

  /**
   * Manipula descoberta de peers
   */
  private handlePeerDiscovery(senderId: string, message: any): void {
    console.log(`Descoberta de peers de ${senderId}:`, message.peers);
    
    // Tenta conectar aos novos peers
    if (message.peers && Array.isArray(message.peers)) {
      for (const peer of message.peers) {
        if (!this.connections.has(peer.id) && peer.id !== this.nodeId) {
          this.connectToPeer(peer.address, peer.port);
        }
      }
    }
  }

  /**
   * Envia mensagem para uma conexão específica
   */
  private sendToConnection(connectionId: string, message: any): boolean {
    const connection = this.connections.get(connectionId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      try {
        connection.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`Erro ao enviar mensagem para ${connectionId}:`, error);
        return false;
      }
    }
    return false;
  }

  /**
   * Broadcasts uma mensagem para todos os peers conectados
   */
  broadcast(message: GossipMessage): number {
    let sent = 0;
    
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.readyState === WebSocket.OPEN) {
        try {
          connection.send(JSON.stringify(message));
          sent++;
        } catch (error) {
          console.error(`Erro ao fazer broadcast para ${connectionId}:`, error);
        }
      }
    }
    
    console.log(`Broadcast enviado para ${sent} peers`);
    return sent;
  }

  /**
   * Anuncia uma nova identidade na rede
   */
  announceIdentity(identity: Identity): void {
    const message: GossipMessage = {
      type: 'identity_announcement',
      data: identity,
      sender: this.nodeId,
      timestamp: Date.now(),
      signature: '' // TODO: Implementar assinatura
    };
    
    this.broadcast(message);
  }

  /**
   * Solicita sincronização com todos os peers
   */
  requestSync(): void {
    const message: GossipMessage = {
      type: 'sync_request',
      data: { version: 1, lastSync: Date.now() },
      sender: this.nodeId,
      timestamp: Date.now(),
      signature: ''
    };
    
    this.broadcast(message);
  }

  /**
   * Adiciona um nó conhecido
   */
  private addNode(node: P2PNode): void {
    this.nodes.set(node.id, node);
    console.log(`Nó adicionado: ${node.id}`);
  }

  /**
   * Remove um nó conhecido
   */
  private removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    console.log(`Nó removido: ${nodeId}`);
  }

  /**
   * Inicia descoberta automática de peers
   */
  private startPeerDiscovery(): void {
    // Não tenta conectar automaticamente a peers hardcoded
    // Discovery será feito através de:
    // 1. Conexões manuais via API
    // 2. Broadcast local (se implementado)
    // 3. DHT discovery (se implementado)
    
    console.log(`🔍 Peer discovery iniciado para nó ${this.nodeId} na porta ${this.port}`);
    console.log(`📡 Para conectar peers, use: POST /api/network/connect`);

    // Periodicamente anuncia peers conhecidos (apenas se tiver peers)
    setInterval(() => {
      if (this.connections.size > 0) {
        this.announcePeers();
      }
    }, 30000); // A cada 30 segundos
  }

  /**
   * Anuncia peers conhecidos para descoberta
   */
  private announcePeers(): void {
    const peerList = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      address: node.address,
      port: node.port,
      trustScore: node.trustScore
    }));

    const message = {
      type: 'peer_discovery',
      peers: peerList,
      sender: this.nodeId,
      timestamp: Date.now()
    };

    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.readyState === WebSocket.OPEN) {
        try {
          connection.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Erro ao anunciar peers para ${connectionId}:`, error);
        }
      }
    }
  }

  /**
   * Retorna estatísticas da rede
   */
  getNetworkStats() {
    return {
      nodeId: this.nodeId,
      port: this.port,
      isStarted: this.isStarted,
      connectedPeers: this.connections.size,
      knownNodes: this.nodes.size,
      connections: Array.from(this.connections.keys())
    };
  }

  /**
   * Retorna lista de peers conectados
   */
  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Retorna informações de um peer específico
   */
  getPeerInfo(peerId: string): P2PNode | undefined {
    return this.nodes.get(peerId);
  }
}