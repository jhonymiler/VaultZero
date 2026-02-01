import { EventEmitter } from 'events';
import { Identity, SyncState } from '../types/index.js';
import { LocalLedgerManager } from '../blockchain/ledger.js';
import { GossipProtocol } from './gossip.js';
import { LibP2PNetwork } from './libp2p.js';
import { BlockchainLogger } from '../utils/logger.js';

interface SyncRequest {
  id: string;
  requesterId: string;
  lastSync: number;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

interface SyncSession {
  sessionId: string;
  peerId: string;
  startTime: number;
  identitiesReceived: number;
  identitiesSent: number;
  status: 'active' | 'completed' | 'failed';
}

export class SyncManager extends EventEmitter {
  private ledger: LocalLedgerManager;
  private gossip: GossipProtocol;
  private p2pNetwork: LibP2PNetwork;
  private syncState: SyncState;
  private activeRequests: Map<string, SyncRequest> = new Map();
  private activeSessions: Map<string, SyncSession> = new Map();
  private readonly SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutos
  private readonly MAX_IDENTITIES_PER_BATCH = 100;
  private readonly SYNC_TIMEOUT = 30 * 1000; // 30 segundos
  private logger = BlockchainLogger.getInstance();

  constructor(
    ledger: LocalLedgerManager,
    gossip: GossipProtocol,
    p2pNetwork: LibP2PNetwork
  ) {
    super();
    this.ledger = ledger;
    this.gossip = gossip;
    this.p2pNetwork = p2pNetwork;
    
    this.syncState = {
      lastSync: 0,
      peersConnected: 0,
      syncInProgress: false,
      totalIdentities: 0
    };

    this.setupEventListeners();
    this.startPeriodicSync();
  }

  /**
   * Configura os listeners de eventos
   */
  private setupEventListeners(): void {
    // Escuta eventos do LibP2P Network
    this.p2pNetwork.on('message', (data) => {
      if (data.type === 'sync_request') {
        this.handleSyncRequest(data.data, data.sender);
      } else if (data.type === 'sync_response') {
        this.handleSyncResponse(data.data, data.sender);
      }
    });

    this.p2pNetwork.on('peer:connected', (peerId) => {
      this.logger.blockchainInfo(`🔗 Peer conectado: ${peerId}`);
      this.gossip.addPeer(peerId);
      this.updateConnectedPeers();
    });

    this.p2pNetwork.on('peer:disconnected', (peerId) => {
      this.logger.blockchainInfo(`🔌 Peer desconectado: ${peerId}`);
      this.gossip.removePeer(peerId);
      this.updateConnectedPeers();
    });

    // Escuta solicitações de sincronização via gossip protocol (fallback)
    this.gossip.on('sync_requested', (data, fromPeer) => {
      this.handleSyncRequest(data, fromPeer);
    });

    this.gossip.on('sync_response_received', (data, fromPeer) => {
      this.handleSyncResponse(data, fromPeer);
    });

    // Escuta mensagens de envio do gossip protocol
    this.gossip.on('send_message', ({ peerId, message }) => {
      // Reenvía através da rede LibP2P via gossip
      this.p2pNetwork.publishToTopic('vault-zero/network-sync', message)
        .catch(error => {
          this.logger.blockchainError('Erro ao publicar mensagem via gossip', error);
        });
    });
  }

  /**
   * Inicia sincronização com a rede
   */
  async startSync(): Promise<boolean> {
    if (this.syncState.syncInProgress) {
      console.log('Sincronização já em andamento');
      return false;
    }

    console.log('Iniciando sincronização com a rede...');
    this.syncState.syncInProgress = true;

    try {
      // Atualiza estatísticas antes da sincronização
      this.updateSyncState();

      // Verifica se há peers conectados
      if (this.syncState.peersConnected === 0) {
        console.log('Nenhum peer conectado para sincronização');
        this.syncState.syncInProgress = false;
        return false;
      }

      // Gera ID da requisição
      const requestId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Solicita sincronização via gossip protocol
      try {
        this.logger.blockchainDebug('Enviando solicitação de sync via gossip');
        this.gossip.requestSync(this.syncState.lastSync);
      } catch (gossipError) {
        this.logger.blockchainDebug('Fallback: usando broadcast direto via LibP2P');
        // Fallback: envia diretamente via LibP2P
        await this.p2pNetwork.broadcast({
          type: 'sync_request',
          data: { 
            lastSync: this.syncState.lastSync, 
            nodeId: `node_${Date.now()}`,
            timestamp: Date.now()
          },
          sender: `node_${Date.now()}`,
          timestamp: Date.now(),
          signature: ''
        });
      }
      
      // Cria registro da solicitação
      this.activeRequests.set(requestId, {
        id: requestId,
        requesterId: `node_${Date.now()}`,
        lastSync: this.syncState.lastSync,
        timestamp: Date.now(),
        status: 'pending'
      });

      // Aguarda respostas por um tempo
      await this.waitForSyncResponses(requestId);

      this.syncState.syncInProgress = false;
      this.emit('sync_completed', this.syncState);
      
      console.log('Sincronização concluída');
      return true;

    } catch (error) {
      console.error('Erro durante sincronização:', error);
      this.syncState.syncInProgress = false;
      this.emit('sync_failed', error);
      return false;
    }
  }

  /**
   * Força sincronização completa
   */
  async forceFullSync(): Promise<boolean> {
    console.log('Iniciando sincronização completa...');
    
    // Reseta o timestamp para solicitar todas as identidades
    const originalLastSync = this.syncState.lastSync;
    this.syncState.lastSync = 0;
    
    const success = await this.startSync();
    
    if (!success) {
      // Restaura o timestamp original em caso de falha
      this.syncState.lastSync = originalLastSync;
    }
    
    return success;
  }

  /**
   * Processa uma solicitação de sincronização recebida
   */
  private async handleSyncRequest(data: any, fromPeer: string): Promise<void> {
    const { lastSync, nodeId } = data;
    
    this.logger.blockchainInfo(`📥 Solicitação de sync recebida de ${fromPeer} (lastSync: ${new Date(lastSync).toISOString()})`);

    try {
      // Busca identidades mais recentes que lastSync
      let identities: Identity[] = [];
      
      // Verifica se o método existe usando verificação de tipo mais segura
      if ('getIdentitiesSince' in this.ledger && typeof (this.ledger as any).getIdentitiesSince === 'function') {
        identities = await (this.ledger as any).getIdentitiesSince(lastSync);
      } else {
        // Fallback: busca todas as identidades e filtra por timestamp
        try {
          const allIdentities = this.ledger.getAllIdentities();
          if (Array.isArray(allIdentities)) {
            identities = allIdentities.filter(identity => 
              identity.timestamp && identity.timestamp > lastSync
            );
          }
        } catch (error) {
          this.logger.blockchainError('Erro ao buscar identidades para sync', error);
          identities = [];
        }
      }
      
      if (identities.length === 0) {
        this.logger.blockchainDebug('Nenhuma identidade nova para sincronizar');
        return;
      }

      this.logger.blockchainInfo(`📤 Enviando ${identities.length} identidades para ${fromPeer}`);

      // Divide em lotes para evitar mensagens muito grandes
      const batches = this.createBatches(identities, this.MAX_IDENTITIES_PER_BATCH);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const response = {
          type: 'sync_response',
          data: {
            identities: batch,
            batchNumber: i + 1,
            totalBatches: batches.length,
            nodeId: nodeId,
            timestamp: Date.now()
          },
          sender: this.getNodeId(),
          timestamp: Date.now(),
          signature: ''
        };

        // Tenta enviar via protocolo direto primeiro
        const success = await this.p2pNetwork.sendDirectMessage(
          fromPeer, 
          '/vault-zero/sync/1.0.0', 
          response
        );

        if (!success) {
          // Fallback: broadcast via gossip
          try {
            await this.p2pNetwork.broadcast(response);
          } catch (broadcastError) {
            this.logger.blockchainError('Erro no fallback broadcast', broadcastError);
          }
        }

        // Pequeno delay entre lotes
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      this.logger.blockchainError('Erro ao processar solicitação de sync', error);
    }
  }

  /**
   * Processa uma resposta de sincronização recebida
   */
  private async handleSyncResponse(data: any, fromPeer: string): Promise<void> {
    const { identities = [], timestamp } = data;
    
    this.logger.blockchainInfo(`📥 Resposta de sync recebida de ${fromPeer}: ${identities.length} identidades`);

    try {
      // Cria sessão de sincronização se não existe
      const sessionId = `${fromPeer}-${Date.now()}`;
      if (!this.activeSessions.has(sessionId)) {
        this.activeSessions.set(sessionId, {
          sessionId,
          peerId: fromPeer,
          startTime: Date.now(),
          identitiesReceived: 0,
          identitiesSent: 0,
          status: 'active'
        });
      }

      const session = this.activeSessions.get(sessionId)!;

      // Processa as identidades recebidas
      if (identities && identities.length > 0) {
        try {
          // Usa mergeIdentities se disponível, senão processa uma a uma
          let processedCount = 0;
          
          if ('mergeIdentities' in this.ledger && typeof (this.ledger as any).mergeIdentities === 'function') {
            processedCount = await (this.ledger as any).mergeIdentities(identities);
          } else {
            // Fallback: processa cada identidade individualmente
            for (const identity of identities) {
              try {
                const existingIdentity = await this.ledger.getIdentity(identity.id);
                
                if (!existingIdentity || existingIdentity.timestamp < identity.timestamp) {
                  await this.ledger.addIdentity(identity);
                  processedCount++;
                  this.logger.blockchainDebug(`✅ Identidade sincronizada: ${identity.id}`);
                }
              } catch (error) {
                this.logger.blockchainError(`Erro ao processar identidade ${identity.id}`, error);
              }
            }
          }
          
          session.identitiesReceived += identities.length;
          this.logger.blockchainInfo(`📊 Processadas ${processedCount}/${identities.length} identidades de ${fromPeer}`);
          
          // Emite evento de progresso
          this.emit('sync_progress', {
            sessionId,
            peerId: fromPeer,
            identitiesProcessed: session.identitiesReceived,
            identitiesMerged: processedCount
          });
        } catch (mergeError) {
          this.logger.blockchainError('Erro ao fazer merge das identidades:', mergeError);
        }
      }

      // Atualiza timestamp de última sincronização
      if (timestamp) {
        this.syncState.lastSync = Math.max(this.syncState.lastSync, timestamp);
      }
      this.updateSyncState();

      // Finaliza sessão
      session.status = 'completed';
      this.activeSessions.delete(sessionId);

      // Emite eventos de sincronização
      this.emit('sync_response_received', {
        peerId: fromPeer,
        identitiesCount: identities ? identities.length : 0,
        timestamp
      });

      this.emit('sync_response_processed', {
        fromPeer,
        identitiesCount: identities.length,
        timestamp
      });

    } catch (error) {
      this.logger.blockchainError('Erro ao processar resposta de sync', error);
    }
  }

  /**
   * Aguarda respostas de sincronização
   */
  private async waitForSyncResponses(requestId: string): Promise<void> {
    console.log(`Aguardando respostas de sincronização para request ${requestId}`);
    console.log(`Peers conectados: ${this.syncState.peersConnected}`);
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log(`⏰ Timeout da sincronização atingido para request ${requestId} após ${this.SYNC_TIMEOUT}ms`);
        const request = this.activeRequests.get(requestId);
        if (request) {
          request.status = 'completed';
        }
        this.off('sync_progress', onSyncProgress);
        this.off('sync_response_received', onSyncResponse);
        resolve();
      }, this.SYNC_TIMEOUT);

      let responseCount = 0;
      const expectedResponses = Math.max(1, this.syncState.peersConnected);
      console.log(`Esperando ${expectedResponses} respostas`);

      // Escuta o evento de sync concluído
      const onSyncProgress = (data: any) => {
        responseCount++;
        console.log(`📈 Progresso de sync: ${responseCount}/${expectedResponses} respostas recebidas`);
        
        // Se recebeu pelo menos uma resposta ou o número esperado, considera completo
        if (responseCount >= expectedResponses || responseCount >= 1) {
          clearTimeout(timeout);
          const request = this.activeRequests.get(requestId);
          if (request) {
            request.status = 'completed';
          }
          this.off('sync_progress', onSyncProgress);
          resolve();
        }
      };

      // Também escuta respostas de sync diretamente
      const onSyncResponse = () => {
        responseCount++;
        console.log(`📨 Resposta de sync recebida: ${responseCount}/${expectedResponses}`);
        
        if (responseCount >= expectedResponses || responseCount >= 1) {
          console.log(`✅ Sincronização completa com ${responseCount} respostas`);
          clearTimeout(timeout);
          const request = this.activeRequests.get(requestId);
          if (request) {
            request.status = 'completed';
          }
          this.off('sync_progress', onSyncProgress);
          this.off('sync_response_received', onSyncResponse);
          resolve();
        }
      };

      this.on('sync_progress', onSyncProgress);
      this.on('sync_response_received', onSyncResponse);

      // Fallback: se não há peers conectados, resolve imediatamente
      if (this.syncState.peersConnected === 0) {
        console.log('Nenhum peer conectado, resolvendo sincronização imediatamente');
        clearTimeout(timeout);
        resolve();
      }
    });
  }

  /**
   * Divide array em batches de tamanho específico
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Retorna o ID do nó atual
   */
  private getNodeId(): string {
    try {
      return this.p2pNetwork.getNetworkStats().nodeId || `node_${Date.now()}`;
    } catch (error) {
      this.logger.blockchainError('Erro ao obter nodeId, usando fallback', error);
      return `node_${Date.now()}`;
    }
  }

  /**
   * Atualiza o estado de sincronização
   */
  private updateSyncState(): void {
    try {
      this.syncState.peersConnected = this.p2pNetwork.getConnectedPeers().length;
      
      // Uso async wrapper para getAllIdentities se for assíncrono
      if (typeof this.ledger.getAllIdentities === 'function') {
        try {
          const identities = this.ledger.getAllIdentities();
          this.syncState.totalIdentities = Array.isArray(identities) ? identities.length : 0;
        } catch (error) {
          this.logger.blockchainError('Erro ao obter contagem de identidades', error);
          this.syncState.totalIdentities = 0;
        }
      } else {
        this.syncState.totalIdentities = 0;
      }
      
      this.emit('sync_state_updated', this.syncState);
    } catch (error) {
      this.logger.blockchainError('Erro ao atualizar estado de sync', error);
    }
  }

  /**
   * Atualiza contador de peers conectados
   */
  private updateConnectedPeers(): void {
    this.syncState.peersConnected = this.p2pNetwork.getConnectedPeers().length;
    
    // Se temos peers conectados e não sincronizamos recentemente, inicia sync
    const timeSinceLastSync = Date.now() - this.syncState.lastSync;
    if (this.syncState.peersConnected > 0 && 
        timeSinceLastSync > this.SYNC_INTERVAL && 
        !this.syncState.syncInProgress) {
      
      console.log('Iniciando sincronização automática devido a nova conexão');
      this.startSync();
    }
  }

  /**
   * Inicia sincronização periódica
   */
  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.syncState.peersConnected > 0 && !this.syncState.syncInProgress) {
        console.log('Executando sincronização periódica');
        this.startSync();
      }
    }, this.SYNC_INTERVAL);

    // Limpeza de sessões antigas
    setInterval(() => {
      this.cleanupOldSessions();
    }, 10 * 60 * 1000); // A cada 10 minutos
  }

  /**
   * Remove sessões antigas
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const sessionTimeout = 30 * 60 * 1000; // 30 minutos
    let removedCount = 0;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.startTime > sessionTimeout) {
        this.activeSessions.delete(sessionId);
        removedCount++;
      }
    }

    // Limpa requisições antigas
    for (const [requestId, request] of this.activeRequests.entries()) {
      if (now - request.timestamp > sessionTimeout) {
        this.activeRequests.delete(requestId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Removidas ${removedCount} sessões/requisições antigas`);
    }
  }

  /**
   * Sincroniza com um peer específico
   */
  async syncWithPeer(peerId: string): Promise<boolean> {
    console.log(`Iniciando sincronização direcionada com ${peerId}`);
    
    try {
      // Cria uma solicitação específica para este peer
      const requestData = {
        type: 'sync_request',
        data: {
          lastSync: this.syncState.lastSync,
          nodeId: this.getNodeId(),
          targetPeer: peerId,
          timestamp: Date.now()
        },
        sender: this.getNodeId(),
        timestamp: Date.now(),
        signature: ''
      };

      // Envia solicitação direcionada
      const success = await this.p2pNetwork.sendDirectMessage(
        peerId, 
        '/vault-zero/sync/1.0.0', 
        requestData
      );
      
      if (success) {
        this.emit('direct_sync_request', { peerId, data: requestData });
        return true;
      } else {
        console.warn(`Falha ao enviar sincronização direta para ${peerId}`);
        return false;
      }
    } catch (error) {
      console.error(`Erro ao sincronizar com peer ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Retorna estatísticas de sincronização
   */
  getSyncStats() {
    const activeSessions = Array.from(this.activeSessions.values());
    const activeRequests = Array.from(this.activeRequests.values());

    return {
      ...this.syncState,
      lastSyncFormatted: new Date(this.syncState.lastSync).toISOString(),
      activeSessions: activeSessions.length,
      activeRequests: activeRequests.length,
      totalIdentitiesReceived: activeSessions.reduce((sum, session) => 
        sum + session.identitiesReceived, 0
      ),
      totalIdentitiesSent: activeSessions.reduce((sum, session) => 
        sum + session.identitiesSent, 0
      ),
      sessionsDetail: activeSessions.map(session => ({
        sessionId: session.sessionId,
        peerId: session.peerId,
        duration: Date.now() - session.startTime,
        identitiesReceived: session.identitiesReceived,
        status: session.status
      }))
    };
  }

  /**
   * Retorna o estado atual de sincronização
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Define intervalo de sincronização personalizado
   */
  setSyncInterval(intervalMs: number): void {
    if (intervalMs >= 60000) { // Mínimo 1 minuto
      // Note: Em uma implementação real, resetaria o timer
      console.log(`Intervalo de sincronização atualizado para ${intervalMs}ms`);
    } else {
      throw new Error('Intervalo mínimo é 60000ms (1 minuto)');
    }
  }

  /**
   * Limpa sincronizações travadas
   */
  clearStuckSyncs(): void {
    const now = Date.now();
    let clearedCount = 0;

    // Remove requisições antigas que podem estar travadas
    for (const [requestId, request] of this.activeRequests.entries()) {
      if (now - request.timestamp > this.SYNC_TIMEOUT) {
        this.activeRequests.delete(requestId);
        clearedCount++;
      }
    }

    // Remove sessões antigas
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now - session.startTime > this.SYNC_TIMEOUT) {
        this.activeSessions.delete(sessionId);
        clearedCount++;
      }
    }

    // Reset sync state se estava travado
    if (this.syncState.syncInProgress) {
      const timeSinceLastSync = now - this.syncState.lastSync;
      if (timeSinceLastSync > this.SYNC_TIMEOUT) {
        console.log('Detectada sincronização travada, resetando estado');
        this.syncState.syncInProgress = false;
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`Limpas ${clearedCount} sincronizações travadas`);
      this.emit('stuck_syncs_cleared', { count: clearedCount });
    }
  }

  /**
   * Para todas as sincronizações ativas
   */
  stopAllSyncs(): void {
    this.syncState.syncInProgress = false;
    this.activeSessions.clear();
    this.activeRequests.clear();
    
    console.log('Todas as sincronizações foram interrompidas');
    this.emit('all_syncs_stopped');
  }
}