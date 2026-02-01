import { EventEmitter } from 'events';
import { Identity, ConsensusState, P2PNode } from '../types';
import { DecentralizedIdentity } from './identity';

interface ConsensusProposal {
  id: string;
  identities: Identity[];
  votes: number;
  totalParticipants: number;
}

export class ConsensusManager extends EventEmitter {
  private currentState: ConsensusState;
  private participants: Map<string, P2PNode> = new Map();
  private votes: Map<string, Map<string, boolean>> = new Map(); // proposalId -> nodeId -> vote
  private proposals: Map<string, Identity[]> = new Map();
  private consensusThreshold = 0.67; // 67% dos nós devem concordar

  constructor() {
    super();
    this.currentState = {
      version: 1,
      identities: [],
      participants: [],
      timestamp: Date.now()
    };
  }

  /**
   * Adiciona um participante ao consenso
   */
  addParticipant(node: P2PNode): void {
    this.participants.set(node.id, node);
    this.currentState.participants = Array.from(this.participants.keys());
    console.log(`Participante adicionado ao consenso: ${node.id}`);
  }

  /**
   * Remove um participante do consenso
   */
  removeParticipant(nodeId: string): void {
    this.participants.delete(nodeId);
    this.currentState.participants = Array.from(this.participants.keys());
    
    // Remove votos pendentes deste nó
    for (const [proposalId, votes] of this.votes.entries()) {
      votes.delete(nodeId);
    }
    
    console.log(`Participante removido do consenso: ${nodeId}`);
  }

  /**
   * Propõe uma nova identidade para consenso
   */
  proposeIdentity(identity: Identity, proposerId: string): string {
    // Verifica se a identidade é válida
    if (!DecentralizedIdentity.verifyIdentity(identity)) {
      throw new Error('Identidade inválida para proposição');
    }

    const proposalId = this.generateProposalId(identity);
    
    // Verifica se já existe uma proposta para esta identidade
    if (this.proposals.has(proposalId)) {
      console.log(`Proposta já existe para identidade: ${identity.id}`);
      return proposalId;
    }

    // Cria nova proposta
    this.proposals.set(proposalId, [identity]);
    this.votes.set(proposalId, new Map());
    
    // Voto automático do propositor
    this.vote(proposalId, proposerId, true);
    
    console.log(`Nova proposta de identidade: ${proposalId} por ${proposerId}`);
    this.emit('proposal_created', { proposalId, identity, proposerId });
    
    return proposalId;
  }

  /**
   * Propõe múltiplas identidades para consenso
   */
  proposeIdentities(identities: Identity[], proposerId: string): string {
    // Verifica se todas as identidades são válidas
    for (const identity of identities) {
      if (!DecentralizedIdentity.verifyIdentity(identity)) {
        throw new Error(`Identidade inválida: ${identity.id}`);
      }
    }

    const proposalId = this.generateBatchProposalId(identities);
    
    // Cria nova proposta em lote
    this.proposals.set(proposalId, identities);
    this.votes.set(proposalId, new Map());
    
    // Voto automático do propositor
    this.vote(proposalId, proposerId, true);
    
    console.log(`Nova proposta de lote: ${proposalId} com ${identities.length} identidades`);
    this.emit('batch_proposal_created', { proposalId, identities, proposerId });
    
    return proposalId;
  }

  /**
   * Registra um voto para uma proposta
   */
  vote(proposalId: string, voterId: string, approve: boolean): boolean {
    // Verifica se a proposta existe
    if (!this.proposals.has(proposalId)) {
      console.error(`Proposta não encontrada: ${proposalId}`);
      return false;
    }

    // Verifica se o votante é um participante válido
    if (!this.participants.has(voterId)) {
      console.error(`Votante não é participante válido: ${voterId}`);
      return false;
    }

    // Registra o voto
    const proposalVotes = this.votes.get(proposalId)!;
    proposalVotes.set(voterId, approve);
    
    console.log(`Voto registrado: ${voterId} -> ${approve ? 'SIM' : 'NÃO'} para ${proposalId}`);
    
    // Verifica se o consenso foi alcançado
    this.checkConsensus(proposalId);
    
    return true;
  }

  /**
   * Verifica se o consenso foi alcançado para uma proposta
   */
  private checkConsensus(proposalId: string): void {
    const proposalVotes = this.votes.get(proposalId);
    const identities = this.proposals.get(proposalId);
    
    if (!proposalVotes || !identities) {
      return;
    }

    const totalParticipants = this.participants.size;
    const totalVotes = proposalVotes.size;
    const approvalVotes = Array.from(proposalVotes.values()).filter(vote => vote).length;
    
    // Calcula percentuais
    const participationRate = totalVotes / totalParticipants;
    const approvalRate = approvalVotes / totalVotes;
    
    console.log(`Consenso check para ${proposalId}:`, {
      totalParticipants,
      totalVotes,
      approvalVotes,
      participationRate: (participationRate * 100).toFixed(1) + '%',
      approvalRate: (approvalRate * 100).toFixed(1) + '%'
    });

    // Consenso alcançado: >67% dos participantes votaram e >67% aprovaram
    if (participationRate >= this.consensusThreshold && approvalRate >= this.consensusThreshold) {
      this.applyConsensus(proposalId, identities);
    }
    // Consenso negado: >50% dos participantes votaram e <34% aprovaram
    else if (participationRate > 0.5 && approvalRate < (1 - this.consensusThreshold)) {
      this.rejectProposal(proposalId);
    }
  }

  /**
   * Aplica o consenso aprovado
   */
  private applyConsensus(proposalId: string, identities: Identity[]): void {
    // Atualiza o estado atual
    for (const identity of identities) {
      // Verifica se a identidade já existe
      const existingIndex = this.currentState.identities.findIndex(id => id.id === identity.id);
      
      if (existingIndex >= 0) {
        // Atualiza se for mais recente
        if (identity.timestamp > this.currentState.identities[existingIndex].timestamp) {
          this.currentState.identities[existingIndex] = identity;
        }
      } else {
        // Adiciona nova identidade
        this.currentState.identities.push(identity);
      }
    }

    this.currentState.version++;
    this.currentState.timestamp = Date.now();

    // Remove a proposta das pendências
    this.proposals.delete(proposalId);
    this.votes.delete(proposalId);

    console.log(`Consenso aplicado para proposta ${proposalId} - ${identities.length} identidades`);
    this.emit('consensus_reached', { 
      proposalId, 
      identities, 
      newState: this.currentState 
    });
  }

  /**
   * Rejeita uma proposta
   */
  private rejectProposal(proposalId: string): void {
    const identities = this.proposals.get(proposalId);
    
    // Remove a proposta das pendências
    this.proposals.delete(proposalId);
    this.votes.delete(proposalId);

    console.log(`Proposta rejeitada: ${proposalId}`);
    this.emit('proposal_rejected', { proposalId, identities });
  }

  /**
   * Força a verificação de consenso para todas as propostas pendentes
   */
  checkAllPendingConsensus(): void {
    for (const proposalId of this.proposals.keys()) {
      this.checkConsensus(proposalId);
    }
  }

  /**
   * Gera ID único para uma proposta
   */
  private generateProposalId(identity: Identity): string {
    const data = `${identity.id}-${identity.timestamp}-${identity.publicKey}`;
    return require('crypto').createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Gera ID único para uma proposta em lote
   */
  private generateBatchProposalId(identities: Identity[]): string {
    const data = identities.map(id => `${id.id}-${id.timestamp}`).join('|');
    return require('crypto').createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Retorna o estado atual do consenso
   */
  getCurrentState(): ConsensusState {
    return { ...this.currentState };
  }

  /**
   * Retorna todas as propostas pendentes
   */
  getPendingProposals(): Array<{ id: string, identities: Identity[], votes: number, totalParticipants: number }> {
    const pending: Array<{ id: string, identities: Identity[], votes: number, totalParticipants: number }> = [];
    
    for (const [proposalId, identities] of this.proposals.entries()) {
      const votes = this.votes.get(proposalId)?.size || 0;
      
      pending.push({
        id: proposalId,
        identities,
        votes,
        totalParticipants: this.participants.size
      });
    }
    
    return pending;
  }

  /**
   * Retorna estatísticas do consenso
   */
  getConsensusStats() {
    return {
      currentVersion: this.currentState.version,
      totalIdentities: this.currentState.identities.length,
      totalParticipants: this.participants.size,
      pendingProposals: this.proposals.size,
      lastUpdate: new Date(this.currentState.timestamp).toISOString(),
      consensusThreshold: (this.consensusThreshold * 100) + '%'
    };
  }

  /**
   * Atualiza o threshold de consenso
   */
  setConsensusThreshold(threshold: number): void {
    if (threshold >= 0.5 && threshold <= 1.0) {
      this.consensusThreshold = threshold;
      console.log(`Threshold de consenso atualizado para: ${(threshold * 100)}%`);
    } else {
      throw new Error('Threshold deve estar entre 0.5 e 1.0');
    }
  }

  /**
   * Sincroniza com estado externo (para quando um nó se reconecta)
   */
  syncWithExternalState(externalState: ConsensusState): boolean {
    // Verifica se o estado externo é mais recente
    if (externalState.version > this.currentState.version) {
      // Valida todas as identidades do estado externo
      const validIdentities = externalState.identities.filter(identity => 
        DecentralizedIdentity.verifyIdentity(identity)
      );

      if (validIdentities.length === externalState.identities.length) {
        this.currentState = {
          ...externalState,
          identities: validIdentities
        };
        
        console.log(`Estado sincronizado com versão ${externalState.version}`);
        this.emit('state_synchronized', this.currentState);
        return true;
      } else {
        console.error('Estado externo contém identidades inválidas');
        return false;
      }
    }
    
    return false;
  }

  /**
   * Reseta o estado do consenso (apenas para testes ou emergências)
   */
  resetConsensusState(): void {
    this.currentState = {
      version: 1,
      identities: [],
      participants: Array.from(this.participants.keys()),
      timestamp: Date.now()
    };
    
    this.proposals.clear();
    this.votes.clear();
    
    console.log('Estado do consenso resetado');
    this.emit('consensus_reset');
  }
}