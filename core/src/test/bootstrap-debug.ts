import { LibP2PNetwork, LibP2PConfig } from '../network/libp2p.js';
import { BlockchainLogger } from '../utils/logger.js';

/**
 * Teste específico para diagnosticar problemas do módulo bootstrap
 */
async function debugBootstrap() {
  const logger = BlockchainLogger.getInstance();
  logger.blockchainInfo('🔧 === DIAGNÓSTICO DO MÓDULO BOOTSTRAP ===');

  let bootstrapNode: LibP2PNetwork | null = null;
  let peerNode: LibP2PNetwork | null = null;

  try {
    // 1. Criar nó bootstrap
    logger.blockchainInfo('📡 Criando nó bootstrap...');
    const bootstrapConfig: LibP2PConfig = {
      port: 5001,
      isBootstrap: true,
      enableMDNS: false,
      maxConnections: 100,
      minConnections: 0
    };

    bootstrapNode = new LibP2PNetwork(bootstrapConfig);
    await bootstrapNode.start();

    const bootstrapId = bootstrapNode.getNodeId();
    const bootstrapAddrs = bootstrapNode.getMultiaddrs();
    
    logger.blockchainInfo('📡 Bootstrap criado:', {
      id: bootstrapId.substring(0, 16) + '...',
      addresses: bootstrapAddrs.map(ma => ma.toString())
    });

    // Aguardar bootstrap estar completamente pronto
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Criar peer com bootstrap configurado
    logger.blockchainInfo('🔗 Criando peer com bootstrap...');
    
    const bootstrapTcpAddr = bootstrapAddrs.find(ma => ma.toString().includes('/tcp/') && !ma.toString().includes('/ws'));
    const bootstrapMultiaddr = bootstrapTcpAddr?.toString();
    
    if (!bootstrapMultiaddr) {
      throw new Error('Não foi possível encontrar endereço TCP do bootstrap');
    }
    
    logger.blockchainInfo('🎯 Usando bootstrap address:', bootstrapMultiaddr);

    const peerConfig: LibP2PConfig = {
      port: 5002,
      isBootstrap: false,
      bootstrapPeers: [bootstrapMultiaddr],
      enableMDNS: false,
      maxConnections: 50,
      minConnections: 1
    };

    peerNode = new LibP2PNetwork(peerConfig);
    
    // Configurar listeners detalhados
    setupDetailedListeners(peerNode, logger, 'PEER');
    setupDetailedListeners(bootstrapNode, logger, 'BOOTSTRAP');

    await peerNode.start();

    const peerId = peerNode.getNodeId();
    const peerAddrs = peerNode.getMultiaddrs();
    
    logger.blockchainInfo('🔗 Peer criado:', {
      id: peerId.substring(0, 16) + '...',
      addresses: peerAddrs.map(ma => ma.toString())
    });

    // 3. Aguardar descoberta e conexão automática
    logger.blockchainInfo('⏳ Aguardando descoberta automática via bootstrap...');
    
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const bootstrapConnections = bootstrapNode.getConnections();
      const peerConnections = peerNode.getConnections();
      
      logger.blockchainInfo(`⏰ ${i + 1}s - Conexões Bootstrap: ${bootstrapConnections.length}, Peer: ${peerConnections.length}`);

      if (bootstrapConnections.length > 0 || peerConnections.length > 0) {
        logger.blockchainInfo('🎉 CONEXÃO AUTOMÁTICA ESTABELECIDA!');
        break;
      }

      // A cada 10 segundos, mostrar status detalhado
      if ((i + 1) % 10 === 0) {
        await showDetailedStatus(bootstrapNode, peerNode, logger);
      }
    }

    // 4. Teste de conexão manual como fallback
    const finalBootstrapConnections = bootstrapNode.getConnections();
    const finalPeerConnections = peerNode.getConnections();

    if (finalBootstrapConnections.length === 0 && finalPeerConnections.length === 0) {
      logger.blockchainWarn('❌ BOOTSTRAP NÃO FUNCIONOU - Tentando conexão manual...');
      
      try {
        await peerNode.connectToPeer(bootstrapMultiaddr);
        
        const afterManualBootstrap = bootstrapNode.getConnections();
        const afterManualPeer = peerNode.getConnections();
        
        if (afterManualBootstrap.length > 0 || afterManualPeer.length > 0) {
          logger.blockchainInfo('✅ CONEXÃO MANUAL FUNCIONOU!');
          logger.blockchainError('🔴 CONCLUSÃO: Bootstrap automático FALHOU, mas conexão manual FUNCIONA');
        } else {
          logger.blockchainError('❌ Nem bootstrap nem conexão manual funcionaram!');
        }
      } catch (error) {
        logger.blockchainError('❌ Erro na conexão manual:', error);
      }
    } else {
      logger.blockchainInfo('🎉 SUCESSO: Bootstrap funcionou automaticamente!');
    }

  } catch (error) {
    logger.blockchainError('❌ Erro no diagnóstico do bootstrap:', error);
  } finally {
    logger.blockchainInfo('🛑 Parando nós...');
    
    if (peerNode) {
      await peerNode.stop();
    }
    
    if (bootstrapNode) {
      await bootstrapNode.stop();
    }
    
    logger.blockchainInfo('🏁 Diagnóstico do bootstrap finalizado');
  }
}

/**
 * Configura listeners detalhados para monitorar eventos
 */
function setupDetailedListeners(node: LibP2PNetwork, logger: any, prefix: string) {
  node.on('peer:discovery', (event) => {
    logger.blockchainInfo(`🔍 [${prefix}] DESCOBERTA:`, {
      peer: event.peerId?.substring(0, 16) + '...',
      addrs: event.multiaddrs?.length || 0
    });
  });

  node.on('peer:connect', (event) => {
    logger.blockchainInfo(`🤝 [${prefix}] CONECTADO:`, {
      peer: event.peerId?.substring(0, 16) + '...'
    });
  });

  node.on('peer:disconnect', (event) => {
    logger.blockchainInfo(`🔌 [${prefix}] DESCONECTADO:`, {
      peer: event.peerId?.substring(0, 16) + '...'
    });
  });
}

/**
 * Mostra status detalhado dos nós
 */
async function showDetailedStatus(bootstrapNode: LibP2PNetwork, peerNode: LibP2PNetwork, logger: any) {
  logger.blockchainInfo('📊 STATUS DETALHADO:');
  
  const bootstrapStats = bootstrapNode.getNetworkStats();
  const peerStats = peerNode.getNetworkStats();
  
  logger.blockchainInfo('  Bootstrap:', {
    connections: bootstrapStats.connectedPeers,
    nodeId: bootstrapStats.nodeId.substring(0, 16) + '...',
    listening: bootstrapStats.connected
  });
  
  logger.blockchainInfo('  Peer:', {
    connections: peerStats.connectedPeers,
    nodeId: peerStats.nodeId.substring(0, 16) + '...',
    listening: peerStats.connected
  });
}

// Executar diagnóstico
debugBootstrap().catch(console.error);

export { debugBootstrap };
