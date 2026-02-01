import express from 'express';
import { LibP2PNetwork } from '../network/libp2p.js';
import { DistributedHashTable } from '../network/dht.js';
import { GossipProtocol } from '../network/gossip.js';
import { SyncManager } from '../network/sync.js';
import { LocalLedgerManager } from '../blockchain/ledger.js';
import { BlockchainLogger } from '../utils/logger.js';

const logger = BlockchainLogger.getInstance();

export function createNetworkRoutes(
  p2pNetwork: LibP2PNetwork,
  dht: DistributedHashTable,
  gossipProtocol: GossipProtocol,
  syncManager: SyncManager | null,
  localLedger: LocalLedgerManager,
  httpPort: number | string,
  p2pPort: number
) {
  const router = express.Router();

  // Network status
  router.get('/status', (req, res) => {
    try {
      const networkStats = p2pNetwork ? p2pNetwork.getNetworkStats() : null;
      const dhtStats = dht ? dht.getStats() : null;
      const gossipStats = gossipProtocol ? gossipProtocol.getStats() : null;
      
      const status = {
        status: 'active',
        peers: networkStats?.connectedPeers || 0,
        nodeId: networkStats?.nodeId || 'unknown',
        p2pPort: p2pPort,
        httpPort: httpPort,
        dhtNodes: dhtStats?.totalNodes || 0,
        gossipPeers: gossipStats?.totalPeers || 0,
        connections: p2pNetwork.getConnectedPeers() || []
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get network status' });
    }
  });

  // Connect to peer
  router.post('/connect', async (req, res) => {
    try {
      const { address, port } = req.body;
      
      if (port >= 3000 && port <= 3010) {
        try {
          const statusResponse = await fetch(`http://${address}:${port}/api/network/status`);
          const statusData = await statusResponse.json();
          
          if (statusData && statusData.p2pPort) {
            const webSocketPort = statusData.p2pPort;
            console.log(`🌐 Conectando via WebSocket na porta descoberta: ${address}:${webSocketPort}`);
            
            const success = await p2pNetwork.connectToPeer(`/ip4/${address}/tcp/${webSocketPort}/ws`);
            res.json({ 
              success, 
              message: success ? `Conectado ao peer ${address}:${webSocketPort}` : 'Falha na conexão',
              p2pPort: webSocketPort
            });
          } else {
            throw new Error('Não foi possível descobrir a porta WebSocket');
          }
        } catch (discoveryError) {
          console.error('❌ Erro na descoberta automática:', discoveryError);
          res.status(400).json({ 
            error: 'Não foi possível descobrir a porta WebSocket do peer' 
          });
        }
      } else {
        console.log(`🌐 Conectando diretamente via WebSocket: ${address}:${port}`);
        const success = await p2pNetwork.connectToPeer(`/ip4/${address}/tcp/${port}/ws`);
        res.json({ success, message: success ? 'Conectado ao peer' : 'Falha na conexão' });
      }
    } catch (error) {
      console.error('❌ Connection failed:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Auto-connect
  router.post('/connect-auto', async (req, res) => {
    try {
      const { httpPort: targetHttpPort } = req.body;
      const address = 'localhost';
      
      try {
        const statusResponse = await fetch(`http://${address}:${targetHttpPort}/api/network/status`);
        const statusData = await statusResponse.json();
        
        if (statusData && statusData.p2pPort) {
          const webSocketPort = statusData.p2pPort;
          console.log(`🔍 Auto-descoberta: HTTP:${targetHttpPort} → WebSocket:${webSocketPort}`);
          
          const success = await p2pNetwork.connectToPeer(`/ip4/${address}/tcp/${webSocketPort}/ws`);
          res.json({ 
            success, 
            message: success ? `✅ Conectado automaticamente ao peer` : '❌ Falha na conexão automática',
            discoveredPorts: { http: targetHttpPort, websocket: webSocketPort },
            nodeInfo: {
              localNodeId: p2pNetwork.getNetworkStats().nodeId,
              remoteNodeId: statusData.nodeId
            }
          });
        } else {
          throw new Error('Peer não retornou informações de porta WebSocket');
        }
      } catch (discoveryError) {
        console.error('❌ Falha na descoberta automática:', discoveryError);
        res.status(400).json({ 
          error: `Não foi possível conectar automaticamente ao peer na porta HTTP ${targetHttpPort}`,
          details: discoveryError instanceof Error ? discoveryError.message : String(discoveryError)
        });
      }
    } catch (error) {
      console.error('❌ Erro na conexão automática:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get peers
  router.get('/peers', (req, res) => {
    try {
      const peers = {
        networkPeers: p2pNetwork ? p2pNetwork.getNetworkStats() : null,
        dhtPeers: dht ? dht.getStats() : null,
        gossipPeers: gossipProtocol ? gossipProtocol.getStats() : null
      };
      res.json(peers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get peers' });
    }
  });

  // Get network nodes (for dashboard)
  router.get('/nodes', (req, res) => {
    try {
      const networkStats = p2pNetwork ? p2pNetwork.getNetworkStats() : null;
      const dhtStats = dht ? dht.getStats() : null;
      const gossipStats = gossipProtocol ? gossipProtocol.getStats() : null;
      
      const nodeInfo = {
        nodeId: networkStats?.nodeId || 'unknown',
        nodeType: 'vault-core',
        nodeVersion: '1.0.0',
        status: 'online',
        uptime: process.uptime(),
        lastSeen: new Date().toISOString(),
        endpoints: {
          http: `http://localhost:${httpPort}`,
          p2p: networkStats?.port || null,
          websocket: `ws://localhost:${networkStats?.port || 'unknown'}`
        },
        networkStatus: {
          connectedPeers: networkStats?.connectedPeers || 0,
          knownNodes: networkStats?.knownNodes || 0,
          dhtNodes: dhtStats?.totalNodes || 0,
          gossipPeers: gossipStats?.totalPeers || 0,
          activeConnections: networkStats?.connections || []
        },
        performance: {
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          systemUptime: process.uptime()
        },
        distributedData: {
          dhtEntries: dhtStats?.totalEntries || 0,
          identitiesManaged: localLedger?.getAllIdentities()?.length || 0,
          syncStatus: syncManager ? syncManager.getSyncStats() : null
        }
      };
      
      res.json({
        success: true,
        node: nodeInfo,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to get network nodes info:', error);
      res.status(500).json({ success: false, error: 'Failed to get network nodes information' });
    }
  });

  // Discover nodes
  router.get('/discover', async (req, res) => {
    try {
      const networkStats = p2pNetwork ? p2pNetwork.getNetworkStats() : null;
      const connectedPeers = networkStats?.connections || [];
      
      const discoveredNodes = [
        {
          nodeId: networkStats?.nodeId || 'local-node',
          address: 'localhost',
          httpPort: httpPort,
          p2pPort: networkStats?.port || null,
          status: 'self',
          type: 'vault-core',
          lastContact: new Date().toISOString()
        }
      ];
      
      for (const peerId of connectedPeers) {
        discoveredNodes.push({
          nodeId: peerId,
          address: 'unknown',
          httpPort: 'unknown',
          p2pPort: null,
          status: 'connected',
          type: 'vault-peer',
          lastContact: new Date().toISOString()
        });
      }
      
      res.json({
        success: true,
        totalNodes: discoveredNodes.length,
        nodes: discoveredNodes,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Failed to discover network nodes:', error);
      res.status(500).json({ success: false, error: 'Failed to discover network nodes' });
    }
  });

  return router;
}
