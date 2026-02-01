/**
 * Kademlia DHT Module
 * Implements distributed hash table operations
 */

import * as Crypto from 'expo-crypto';
import { Logger } from '../logger';
import P2P_CONFIG from '../../config/p2p';
import { P2PPeer, DHTEntry } from '../../types';
import { DHTQueryContext, KBucket, P2P_CONSTANTS } from './types';

export class KademliaService {
  private dhtNodeId: string = '';
  private kBuckets: Map<number, KBucket> = new Map();
  private activeQueries: Map<string, DHTQueryContext> = new Map();
  private dhtStorage: Map<string, DHTEntry> = new Map();
  private nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  /**
   * Initialize Kademlia DHT with proper node ID and buckets
   */
  async initialize(): Promise<void> {
    this.dhtNodeId = await this.generateDHTNodeId(this.nodeId);
    
    for (let i = 0; i < P2P_CONSTANTS.KEYSPACE_SIZE; i++) {
      this.kBuckets.set(i, {
        nodes: [],
        lastUpdated: Date.now(),
        maxSize: P2P_CONSTANTS.K_BUCKET_SIZE
      });
    }

    Logger.info(`Kademlia DHT initialized with ID: ${this.dhtNodeId}`);
  }

  /**
   * Generate 160-bit SHA-1 based DHT node ID
   */
  async generateDHTNodeId(nodeId: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1, 
      nodeId
    );
    return hash;
  }

  getDHTNodeId(): string {
    return this.dhtNodeId;
  }

  /**
   * Calculate XOR distance between two DHT IDs
   */
  calculateXORDistance(id1: string, id2: string): number {
    const buf1 = this.hexToBuffer(id1);
    const buf2 = this.hexToBuffer(id2);
    
    let distance = 0;
    for (let i = 0; i < Math.min(buf1.length, buf2.length); i++) {
      const xor = buf1[i] ^ buf2[i];
      if (xor !== 0) {
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
  findKBucket(nodeId: string): number {
    const distance = this.calculateXORDistance(this.dhtNodeId, nodeId);
    return Math.min(distance, P2P_CONSTANTS.KEYSPACE_SIZE - 1);
  }

  /**
   * Add node to appropriate K-bucket (Kademlia routing table)
   */
  addToKBucket(peer: P2PPeer, pingNode: (peer: P2PPeer) => Promise<boolean>): void {
    const bucketIndex = this.findKBucket(peer.id);
    const bucket = this.kBuckets.get(bucketIndex)!;
    
    const existingIndex = bucket.nodes.findIndex(n => n.id === peer.id);
    
    if (existingIndex >= 0) {
      bucket.nodes.splice(existingIndex, 1);
      bucket.nodes.push(peer);
    } else {
      if (bucket.nodes.length < bucket.maxSize) {
        bucket.nodes.push(peer);
      } else {
        const headNode = bucket.nodes[0];
        pingNode(headNode).then(isAlive => {
          if (!isAlive) {
            bucket.nodes.shift();
            bucket.nodes.push(peer);
          }
        });
      }
    }
    
    bucket.lastUpdated = Date.now();
  }

  /**
   * Find K closest nodes to a target key using Kademlia algorithm
   */
  findKClosestNodes(targetKey: string, k: number = P2P_CONSTANTS.K_BUCKET_SIZE): P2PPeer[] {
    const allNodes: P2PPeer[] = [];
    
    for (const bucket of this.kBuckets.values()) {
      allNodes.push(...bucket.nodes);
    }
    
    allNodes.sort((a, b) => {
      const distA = this.calculateXORDistance(targetKey, a.id);
      const distB = this.calculateXORDistance(targetKey, b.id);
      return distA - distB;
    });
    
    return allNodes.slice(0, k);
  }

  /**
   * Store value in local DHT storage
   */
  storeLocally(key: string, entry: DHTEntry): void {
    this.dhtStorage.set(key, entry);
  }

  /**
   * Get value from local DHT storage
   */
  getLocally(key: string): DHTEntry | undefined {
    return this.dhtStorage.get(key);
  }

  /**
   * Get all local DHT entries
   */
  getAllLocalEntries(): DHTEntry[] {
    return Array.from(this.dhtStorage.values());
  }

  /**
   * Check if node is responsible for key
   */
  isResponsibleFor(key: string, responsibleNodes: P2PPeer[]): boolean {
    return responsibleNodes.some(n => n.id === this.nodeId) || responsibleNodes.length === 0;
  }

  /**
   * Get active queries
   */
  getActiveQueries(): Map<string, DHTQueryContext> {
    return this.activeQueries;
  }
}
