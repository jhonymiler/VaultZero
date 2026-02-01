/**
 * P2P Service Module
 * Main export file for modularized P2P components
 */

export * from './types';
export { KademliaService } from './kademlia';
export { GossipService } from './gossip';

// Re-export the main P2PService for backward compatibility
// The original p2p.ts can import these modules to reduce its size
