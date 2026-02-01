import { EventEmitter } from 'events';
import { GossipMessage, Identity } from '../types';
import { createHash } from 'crypto';

interface GossipPeer {
  id: string;
  lastContact: number;
  messagesSent: number;
  messagesReceived: number;
  trustScore: number;
}

interface MessageCache {
  id: string;
  message: GossipMessage;
  firstSeen: number;
  propagationCount: number;
}

export class GossipProtocol extends EventEmitter {
  private peers: Map<string, GossipPeer> = new Map();
  private messageCache: Map<string, MessageCache> = new Map();
  private nodeId: string;
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly MESSAGE_TTL = 30 * 60 * 1000; // 30 minutos
  private readonly GOSSIP_INTERVAL = 5000; // 5 segundos
  private readonly GOSSIP_FANOUT = 3; // Número de peers para propagação

  constructor(nodeId: string) {
    super();
    this.nodeId = nodeId;
    this.startGossipLoop();
    this.startMaintenanceTasks();
  }

  /**
   * Adiciona um peer ao protocolo gossip
   */
  addPeer(peerId: string): void {
    if (!this.peers.has(peerId) && peerId !== this.nodeId) {
      this.peers.set(peerId, {
        id: peerId,
        lastContact: Date.now(),
        messagesSent: 0,
        messagesReceived: 0,
        trustScore: 0.5
      });
      
      console.log(`Peer adicionado ao gossip: ${peerId}`);
    }
  }

  /**
   * Remove um peer do protocolo
   */
  removePeer(peerId: string): void {
    this.peers.delete(peerId);
    console.log(`Peer removido do gossip: ${peerId}`);
  }

  /**
   * Processa uma mensagem recebida
   */
  processMessage(message: GossipMessage, fromPeer: string): boolean {
    const messageId = this.generateMessageId(message);
    
    // Verifica se já processamos esta mensagem
    if (this.messageCache.has(messageId)) {
      const cached = this.messageCache.get(messageId)!;
      cached.propagationCount++;
      return false; // Mensagem duplicada
    }
    
    // Valida a mensagem
    if (!this.validateMessage(message)) {
      console.error('Mensagem inválida recebida:', messageId);
      return false;
    }
    
    // Adiciona ao cache
    this.addToCache(messageId, message);
    
    // Atualiza estatísticas do peer
    const peer = this.peers.get(fromPeer);
    if (peer) {
      peer.messagesReceived++;
      peer.lastContact = Date.now();
      this.updateTrustScore(fromPeer, true);
    }
    
    // Processa baseado no tipo da mensagem
    this.handleMessageByType(message, fromPeer);
    
    // Propaga para outros peers
    this.propagateMessage(message, fromPeer);
    
    return true;
  }

  /**
   * Envia uma nova mensagem para a rede
   */
  broadcastMessage(type: GossipMessage['type'], data: any): string {
    const message: GossipMessage = {
      type,
      data,
      sender: this.nodeId,
      timestamp: Date.now(),
      signature: this.signMessage(data) // Implementação simplificada
    };
    
    const messageId = this.generateMessageId(message);
    this.addToCache(messageId, message);
    
    // Propaga imediatamente
    this.propagateMessage(message);
    
    console.log(`Mensagem broadcast: ${type} (${messageId})`);
    return messageId;
  }

  /**
   * Anuncia uma nova identidade
   */
  announceIdentity(identity: Identity): string {
    return this.broadcastMessage('identity_announcement', identity);
  }

  /**
   * Solicita verificação de identidade
   */
  requestIdentityVerification(identityId: string): string {
    return this.broadcastMessage('identity_verification', { identityId });
  }

  /**
   * Solicita sincronização
   */
  requestSync(lastSync: number): string {
    return this.broadcastMessage('sync_request', { 
      lastSync, 
      nodeId: this.nodeId,
      timestamp: Date.now()
    });
  }

  /**
   * Responde com dados de sincronização
   */
  respondSync(requesterId: string, identities: Identity[]): string {
    return this.broadcastMessage('sync_response', {
      requesterId,
      identities,
      timestamp: Date.now()
    });
  }

  /**
   * Propaga uma mensagem para peers selecionados
   */
  private propagateMessage(message: GossipMessage, excludePeer?: string): void {
    const eligiblePeers = Array.from(this.peers.values())
      .filter(peer => peer.id !== excludePeer)
      .sort((a, b) => b.trustScore - a.trustScore); // Ordena por trust score
    
    // Seleciona peers para propagação
    const selectedPeers = this.selectPeersForPropagation(eligiblePeers);
    
    for (const peer of selectedPeers) {
      this.sendMessageToPeer(peer.id, message);
    }
  }

  /**
   * Seleciona peers para propagação baseado em algoritmo de gossip
   */
  private selectPeersForPropagation(peers: GossipPeer[]): GossipPeer[] {
    if (peers.length <= this.GOSSIP_FANOUT) {
      return peers;
    }
    
    // Algoritmo híbrido: melhores peers + randomização
    const topPeers = peers.slice(0, Math.floor(this.GOSSIP_FANOUT / 2));
    const remainingPeers = peers.slice(Math.floor(this.GOSSIP_FANOUT / 2));
    
    // Seleciona peers aleatórios dos restantes
    const randomPeers: GossipPeer[] = [];
    const randomCount = this.GOSSIP_FANOUT - topPeers.length;
    
    for (let i = 0; i < randomCount && remainingPeers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * remainingPeers.length);
      randomPeers.push(remainingPeers.splice(randomIndex, 1)[0]);
    }
    
    return [...topPeers, ...randomPeers];
  }

  /**
   * Envia mensagem para um peer específico
   */
  private sendMessageToPeer(peerId: string, message: GossipMessage): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.messagesSent++;
      peer.lastContact = Date.now();
      
      // Emite evento para ser capturado pela camada de rede
      this.emit('send_message', { peerId, message });
      
      console.log(`Mensagem enviada para ${peerId}: ${message.type}`);
    }
  }

  /**
   * Valida uma mensagem recebida
   */
  private validateMessage(message: GossipMessage): boolean {
    // Verificações básicas
    if (!message.type || !message.sender || !message.timestamp) {
      return false;
    }
    
    // Verifica se a mensagem não é muito antiga
    const maxAge = 60 * 60 * 1000; // 1 hora
    if (Date.now() - message.timestamp > maxAge) {
      return false;
    }
    
    // Verifica se a mensagem não é do futuro
    if (message.timestamp > Date.now() + 60000) { // 1 minuto de tolerância
      return false;
    }
    
    // TODO: Verificar assinatura da mensagem
    
    return true;
  }

  /**
   * Processa mensagem baseado no tipo
   */
  private handleMessageByType(message: GossipMessage, fromPeer: string): void {
    switch (message.type) {
      case 'identity_announcement':
        this.emit('identity_announced', message.data, fromPeer);
        break;
        
      case 'identity_verification':
        this.emit('identity_verification_requested', message.data, fromPeer);
        break;
        
      case 'sync_request':
        this.emit('sync_requested', message.data, fromPeer);
        break;
        
      case 'sync_response':
        this.emit('sync_response_received', message.data, fromPeer);
        break;
        
      default:
        console.log(`Tipo de mensagem não reconhecido: ${message.type}`);
    }
  }

  /**
   * Gera ID único para uma mensagem
   */
  private generateMessageId(message: GossipMessage): string {
    const content = JSON.stringify({
      type: message.type,
      data: message.data,
      sender: message.sender,
      timestamp: message.timestamp
    });
    
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Adiciona mensagem ao cache
   */
  private addToCache(messageId: string, message: GossipMessage): void {
    // Remove mensagens antigas se o cache estiver cheio
    if (this.messageCache.size >= this.MAX_CACHE_SIZE) {
      this.cleanupOldMessages();
    }
    
    this.messageCache.set(messageId, {
      id: messageId,
      message,
      firstSeen: Date.now(),
      propagationCount: 1
    });
  }

  /**
   * Assina uma mensagem (implementação simplificada)
   */
  private signMessage(data: any): string {
    // Em uma implementação real, usaria chaves criptográficas
    const content = JSON.stringify(data) + this.nodeId;
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Atualiza o trust score de um peer
   */
  private updateTrustScore(peerId: string, positive: boolean): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      const adjustment = positive ? 0.01 : -0.05;
      peer.trustScore = Math.max(0, Math.min(1, peer.trustScore + adjustment));
    }
  }

  /**
   * Inicia o loop principal do gossip
   */
  private startGossipLoop(): void {
    setInterval(() => {
      this.performPeriodicGossip();
    }, this.GOSSIP_INTERVAL);
  }

  /**
   * Executa gossip periódico
   */
  private performPeriodicGossip(): void {
    // Seleciona algumas mensagens recentes para re-propagar
    const recentMessages = Array.from(this.messageCache.values())
      .filter(cached => Date.now() - cached.firstSeen < 60000) // Últimos 60 segundos
      .sort((a, b) => b.firstSeen - a.firstSeen)
      .slice(0, 3); // Top 3 mensagens mais recentes
    
    for (const cached of recentMessages) {
      if (cached.propagationCount < 5) { // Limita re-propagação
        this.propagateMessage(cached.message);
        cached.propagationCount++;
      }
    }
  }

  /**
   * Inicia tarefas de manutenção
   */
  private startMaintenanceTasks(): void {
    // Limpeza a cada 10 minutos
    setInterval(() => {
      this.cleanupOldMessages();
      this.cleanupInactivePeers();
    }, 10 * 60 * 1000);
  }

  /**
   * Remove mensagens antigas do cache
   */
  private cleanupOldMessages(): void {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [messageId, cached] of this.messageCache.entries()) {
      if (now - cached.firstSeen > this.MESSAGE_TTL) {
        this.messageCache.delete(messageId);
        removedCount++;
      }
    }
    
    // Se ainda há muitas mensagens, remove as mais antigas
    if (this.messageCache.size > this.MAX_CACHE_SIZE * 0.8) {
      const sortedMessages = Array.from(this.messageCache.entries())
        .sort(([,a], [,b]) => a.firstSeen - b.firstSeen);
      
      const toRemove = Math.floor(this.MAX_CACHE_SIZE * 0.2);
      for (let i = 0; i < toRemove && i < sortedMessages.length; i++) {
        this.messageCache.delete(sortedMessages[i][0]);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removidas ${removedCount} mensagens antigas do cache`);
    }
  }

  /**
   * Remove peers inativos
   */
  private cleanupInactivePeers(): void {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutos
    let removedCount = 0;
    
    for (const [peerId, peer] of this.peers.entries()) {
      if (now - peer.lastContact > inactiveThreshold) {
        this.peers.delete(peerId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removidos ${removedCount} peers inativos`);
    }
  }

  /**
   * Retorna estatísticas do protocolo gossip
   */
  getStats() {
    const peerStats = Array.from(this.peers.values()).map(peer => ({
      id: peer.id,
      trustScore: peer.trustScore,
      messagesSent: peer.messagesSent,
      messagesReceived: peer.messagesReceived,
      lastContact: new Date(peer.lastContact).toISOString()
    }));

    return {
      nodeId: this.nodeId,
      totalPeers: this.peers.size,
      cachedMessages: this.messageCache.size,
      gossipInterval: this.GOSSIP_INTERVAL,
      gossipFanout: this.GOSSIP_FANOUT,
      averageTrustScore: peerStats.length > 0 
        ? peerStats.reduce((sum, peer) => sum + peer.trustScore, 0) / peerStats.length 
        : 0,
      totalMessagesSent: peerStats.reduce((sum, peer) => sum + peer.messagesSent, 0),
      totalMessagesReceived: peerStats.reduce((sum, peer) => sum + peer.messagesReceived, 0),
      peers: peerStats
    };
  }

  /**
   * Força a sincronização com a rede
   */
  forceSync(): string {
    return this.requestSync(0); // Solicita tudo desde o início
  }

  /**
   * Retorna peers ativos
   */
  getActivePeers(): GossipPeer[] {
    const now = Date.now();
    const activeThreshold = 10 * 60 * 1000; // 10 minutos
    
    return Array.from(this.peers.values())
      .filter(peer => now - peer.lastContact < activeThreshold);
  }

  /**
   * Retorna mensagens em cache
   */
  getCachedMessages(): MessageCache[] {
    return Array.from(this.messageCache.values());
  }
}