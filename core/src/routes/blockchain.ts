import express from 'express';
import { DistributedHashTable } from '../network/dht.js';
import { LocalLedgerManager } from '../blockchain/ledger.js';
import { ConsensusManager } from '../blockchain/consensus.js';
import { LibP2PNetwork } from '../network/libp2p.js';
import { GossipProtocol } from '../network/gossip.js';
import { SyncManager } from '../network/sync.js';
import { BlockchainLogger } from '../utils/logger.js';

const logger = BlockchainLogger.getInstance();

export function createBlockchainRoutes(
  dht: DistributedHashTable,
  localLedger: LocalLedgerManager,
  consensusManager: ConsensusManager,
  p2pNetwork: LibP2PNetwork,
  gossipProtocol: GossipProtocol,
  syncManager: SyncManager | null
) {
  const router = express.Router();

  // Blockchain status
  router.get('/status', async (req, res) => {
    try {
      const status = {
        dht: {
          totalNodes: dht ? Object.keys((dht as any).nodes || {}).length : 0,
          storedEntries: dht ? Object.keys((dht as any).storage || {}).length : 0
        },
        p2p: {
          connectedPeers: p2pNetwork ? (p2pNetwork as any).connectedPeers || 0 : 0,
          isActive: !!p2pNetwork
        },
        consensus: {
          isActive: !!consensusManager
        },
        ledger: {
          totalIdentities: localLedger?.getAllIdentities()?.length || 0
        },
        gossip: {
          isActive: !!gossipProtocol
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(status);
    } catch (error) {
      console.error('❌ Failed to get blockchain status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  // DHT sync endpoint
  router.post('/dht/sync', async (req, res) => {
    try {
      const { key, data, nodeId } = req.body;
      
      if (!key || !data || !nodeId) {
        return res.status(400).json({ error: 'Parâmetros inválidos para sincronização DHT' });
      }

      logger.blockchainInfo('📤 Recebendo sincronização DHT de outro node', {
        keyPrefix: key.substring(0, 20) + '...',
        nodeId: nodeId.substring(0, 10) + '...'
      });

      if (dht) {
        await dht.store(key, data);
        logger.blockchainInfo('✅ Dados DHT armazenados localmente');
      }

      res.json({ 
        success: true, 
        message: 'Dados sincronizados na DHT',
        timestamp: Date.now()
      });
    } catch (error) {
      logger.blockchainError('❌ Erro na sincronização DHT', error);
      res.status(500).json({ 
        error: 'Erro na sincronização DHT',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Ledger entries
  router.get('/ledger/entries', async (req, res) => {
    try {
      const entries = localLedger.getAllIdentities();
      res.json({ entries, count: entries.length });
    } catch (error) {
      console.error('❌ Failed to get ledger entries:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Consensus status
  router.get('/consensus/status', (req, res) => {
    try {
      const status = consensusManager ? consensusManager.getConsensusStats() : {
        consensusThreshold: 0.67,
        activeValidators: 0,
        lastConsensus: null,
        consensusRounds: 0
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get consensus status' });
    }
  });

  // Start sync
  router.post('/sync/start', async (req, res) => {
    try {
      console.log('🔄 Starting synchronization...');
      res.json({ 
        success: true,
        message: 'Sync will be implemented with LibP2P integration' 
      });
    } catch (error) {
      console.error('❌ Sync start failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Sync status
  router.get('/sync/status', (req, res) => {
    try {
      const status = {
        isSyncing: false,
        lastSync: null,
        syncProgress: 0,
        pendingOperations: 0
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  });

  return router;
}
