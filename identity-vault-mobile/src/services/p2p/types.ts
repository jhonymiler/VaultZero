/**
 * P2P Types for Mobile Service
 * Extracted from p2p.ts for modularization
 */

import { P2PPeer, GossipMessage } from '../../types';

/**
 * DHT Query Context for iterative lookup
 */
export interface DHTQueryContext {
  id: string;
  targetKey: string;
  closestNodes: P2PPeer[];
  queriedNodes: Set<string>;
  pendingQueries: number;
  callback: (result: any) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * Gossip Infection State for epidemic propagation
 */
export interface GossipInfectionState {
  messageId: string;
  infectedNodes: Set<string>;
  infectionRound: number;
  lastInfection: number;
  targetInfectionRate: number;
}

/**
 * Anti-entropy State for eventual consistency
 */
export interface AntiEntropyState {
  lastSync: number;
  syncPartner: string | null;
  pendingUpdates: Map<string, any>;
}

/**
 * K-Bucket for Kademlia routing table
 */
export interface KBucket {
  nodes: P2PPeer[];
  lastUpdated: number;
  maxSize: number;
}

/**
 * Constants for P2P operations
 */
export const P2P_CONSTANTS = {
  K_BUCKET_SIZE: 20,
  ALPHA: 3, // Parallelism in queries
  KEYSPACE_SIZE: 160, // 160 bits
  FAILURE_THRESHOLD: 5,
} as const;
