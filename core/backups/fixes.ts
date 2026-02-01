// This file contains fixes for the P2P authentication system

import './stubs';
import { setupStubs } from './stubsSetup';

export function applyFixesToGlobalScope() {
  console.log('🔧 Applying fixes to global scope...');
  
  // Configura os stubs usando a nova abordagem
  setupStubs();
  
  // Make sure P2PNetwork has start method
  if (typeof globalThis.P2PNetwork !== 'undefined' && 
      typeof globalThis.P2PNetwork.prototype.start !== 'function') {
    globalThis.P2PNetwork.prototype.start = async function() {
      console.log('📡 [STUB] P2P Network starting...');
      this.nodeId = `node_${Date.now()}`;
      this.peers = [];
      this.connections = [];
      return true;
    };
  }
  
  // Make sure P2PNetwork has stop method
  if (typeof globalThis.P2PNetwork !== 'undefined' && 
      typeof globalThis.P2PNetwork.prototype.stop !== 'function') {
    globalThis.P2PNetwork.prototype.stop = async function() {
      console.log('📡 [STUB] P2P Network stopping...');
      this.peers = [];
      this.connections = [];
      return true;
    };
  }
  
  // Make sure P2PNetwork has connectToPeer method
  if (typeof globalThis.P2PNetwork !== 'undefined' && 
      typeof globalThis.P2PNetwork.prototype.connectToPeer !== 'function') {
    globalThis.P2PNetwork.prototype.connectToPeer = async function(address, port) {
      console.log(`📡 [STUB] Connecting to peer: ${address}:${port}`);
      const peerId = `peer_${Date.now()}`;
      this.peers = this.peers || [];
      this.peers.push({ id: peerId, address, port });
      return true;
    };
  }
  
  // Make sure SyncManager has startSync method
  if (typeof globalThis.SyncManager !== 'undefined' && 
      typeof globalThis.SyncManager.prototype.startSync !== 'function') {
    globalThis.SyncManager.prototype.startSync = async function() {
      console.log('🔄 [STUB] Starting synchronization...');
      return true;
    };
  }
  
  console.log('✅ Fixes applied successfully!');
}
