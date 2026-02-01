/**
 * Gossip Epidemic Protocol Module
 * Implements epidemic propagation and anti-entropy
 */

import * as Crypto from 'expo-crypto';
import { Logger } from '../logger';
import P2P_CONFIG from '../../config/p2p';
import { P2PPeer, GossipMessage } from '../../types';
import { GossipInfectionState, AntiEntropyState } from './types';

export class GossipService {
  private nodeId: string;
  private gossipCache: Map<string, GossipMessage> = new Map();
  private infectionStates: Map<string, GossipInfectionState> = new Map();
  private antiEntropyState: AntiEntropyState = {
    lastSync: 0,
    syncPartner: null,
    pendingUpdates: new Map()
  };
  private epidemicTimer?: ReturnType<typeof setInterval>;
  private antiEntropyTimer?: ReturnType<typeof setInterval>;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  /**
   * Initialize Gossip Epidemic Protocol
   */
  async initialize(
    performEpidemicRound: () => Promise<void>,
    performAntiEntropy: () => Promise<void>
  ): Promise<void> {
    this.epidemicTimer = setInterval(async () => {
      await performEpidemicRound();
    }, P2P_CONFIG.GOSSIP.INTERVAL_MS);

    this.antiEntropyTimer = setInterval(async () => {
      await performAntiEntropy();
    }, P2P_CONFIG.GOSSIP.INTERVAL_MS * 3);

    Logger.info('Gossip Epidemic Protocol initialized');
  }

  /**
   * Stop gossip timers
   */
  stop(): void {
    if (this.epidemicTimer) {
      clearInterval(this.epidemicTimer);
    }
    if (this.antiEntropyTimer) {
      clearInterval(this.antiEntropyTimer);
    }
  }

  /**
   * Generate unique message ID
   */
  async generateMessageId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create gossip message
   */
  async createMessage(
    type: string, 
    data: any, 
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
    signValue: (value: any) => Promise<string>
  ): Promise<GossipMessage> {
    const messageId = await this.generateMessageId();
    
    return {
      id: messageId,
      type,
      data,
      timestamp: Date.now(),
      ttl: Date.now() + P2P_CONFIG.GOSSIP.MESSAGE_TTL_MS,
      sender: this.nodeId,
      signature: await signValue({ type, data }),
      hops: 0,
      priority,
      retryCount: 0,
      alternativeRoutes: []
    };
  }

  /**
   * Create infection state for message
   */
  createInfectionState(messageId: string): GossipInfectionState {
    const state: GossipInfectionState = {
      messageId,
      infectedNodes: new Set([this.nodeId]),
      infectionRound: 0,
      lastInfection: Date.now(),
      targetInfectionRate: P2P_CONFIG.GOSSIP.FANOUT
    };
    this.infectionStates.set(messageId, state);
    return state;
  }

  /**
   * Get infection state for message
   */
  getInfectionState(messageId: string): GossipInfectionState | undefined {
    return this.infectionStates.get(messageId);
  }

  /**
   * Cache gossip message
   */
  cacheMessage(message: GossipMessage): void {
    this.gossipCache.set(message.id, message);
  }

  /**
   * Get cached message
   */
  getCachedMessage(messageId: string): GossipMessage | undefined {
    return this.gossipCache.get(messageId);
  }

  /**
   * Check if message is already cached
   */
  isMessageCached(messageId: string): boolean {
    return this.gossipCache.has(messageId);
  }

  /**
   * Clean expired messages from cache
   */
  cleanExpiredMessages(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [messageId, message] of this.gossipCache.entries()) {
      if (message.ttl < now) {
        this.gossipCache.delete(messageId);
        this.infectionStates.delete(messageId);
        cleaned++;
      }
    }
    
    return cleaned;
  }

  /**
   * Select nodes for infection based on epidemic parameters
   */
  selectNodesForInfection(susceptibleNodes: P2PPeer[], targetRate: number): P2PPeer[] {
    const numToInfect = Math.min(targetRate, susceptibleNodes.length);
    const selected: P2PPeer[] = [];
    const available = [...susceptibleNodes];
    
    for (let i = 0; i < numToInfect; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      const selectedNode = available.splice(randomIndex, 1)[0];
      selected.push(selectedNode);
    }
    
    return selected;
  }

  /**
   * Get anti-entropy state
   */
  getAntiEntropyState(): AntiEntropyState {
    return this.antiEntropyState;
  }

  /**
   * Update anti-entropy state
   */
  updateAntiEntropyState(updates: Partial<AntiEntropyState>): void {
    Object.assign(this.antiEntropyState, updates);
  }

  /**
   * Get all cached messages
   */
  getAllMessages(): GossipMessage[] {
    return Array.from(this.gossipCache.values());
  }
}
