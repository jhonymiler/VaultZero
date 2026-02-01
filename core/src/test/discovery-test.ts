import { LibP2PNetwork, LibP2PConfig } from '../network/libp2p.js';
import { BlockchainLogger } from '../utils/logger.js';

/**
 * Teste focado na descoberta automática de peers
 */
async function testPeerDiscovery() {
  const logger = BlockchainLogger.getInstance();
  logger.blockchainInfo('🔍 === TESTE DE DESCOBERTA AUTOMÁTICA DE PEERS ===');

  let bootstrapNode: LibP2PNetwork | null = null;
  let peerNode: LibP2PNetwork | null = null;

  try {
    // 1. Criar nó bootstrap
    logger.blockchainInfo('📡 Criando nó bootstrap...');
    const bootstrapConfig: LibP2PConfig = {
      port: 4001,
      isBootstrap: true,
      enableMDNS: false, // Desabilitar MDNS para focar apenas no bootstrap
      maxConnections: 100,
      minConnections: 0
    };

    bootstrapNode = new LibP2PNetwork(bootstrapConfig);
    await bootstrapNode.start();

    const bootstrapId = bootstrapNode.getNodeId();
    const bootstrapAddrs = bootstrapNode.getMultiaddrs();
    
    logger.blockchainInfo('📡 Bootstrap iniciado:', {
      id: bootstrapId.substring(0, 16) + '...',
      addresses: bootstrapAddrs.map(ma => ma.toString())
    });

    // Aguardar bootstrap estar pronto
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Criar peer que vai descobrir o bootstrap
    logger.blockchainInfo('🔗 Criando peer...');
    
    // Usar APENAS endereço TCP do bootstrap para conexão direta
    const bootstrapTcpAddr = bootstrapAddrs.find(ma => ma.toString().includes('/tcp/') && !ma.toString().includes('/ws'));
    const bootstrapMultiaddr = bootstrapTcpAddr?.toString();
    
    logger.blockchainInfo('🎯 Bootstrap address para conexão:', bootstrapMultiaddr);

    const peerConfig: LibP2PConfig = {
      port: 4002,
      isBootstrap: false,
      bootstrapPeers: bootstrapMultiaddr ? [bootstrapMultiaddr] : [], // Apenas TCP
      enableMDNS: false, // Desabilitar MDNS para focar apenas no bootstrap
      maxConnections: 50,
      minConnections: 1
    };

    peerNode = new LibP2PNetwork(peerConfig);
    
    // Configurar listeners de eventos para monitorar descoberta
    setupDiscoveryListeners(peerNode, logger);
    setupDiscoveryListeners(bootstrapNode, logger);

    await peerNode.start();

    const peerId = peerNode.getNodeId();
    const peerAddrs = peerNode.getMultiaddrs();
    
    logger.blockchainInfo('🔗 Peer iniciado:', {
      id: peerId.substring(0, 16) + '...',
      addresses: peerAddrs.map(ma => ma.toString()),
      bootstrap: bootstrapMultiaddr
    });

    // 3. Aguardar descoberta automática
    logger.blockchainInfo('⏳ Aguardando descoberta automática...');
    
    // Aguardar 20 segundos para descoberta
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const bootstrapConnections = bootstrapNode.getConnections();
      const peerConnections = peerNode.getConnections();
      
      logger.blockchainInfo(`⏰ ${i + 1}s - Conexões:`, {
        bootstrap: bootstrapConnections.length,
        peer: peerConnections.length
      });

      // Se houve conexão, mostrar detalhes
      if (bootstrapConnections.length > 0 || peerConnections.length > 0) {
        logger.blockchainInfo('✅ DESCOBERTA AUTOMÁTICA FUNCIONOU!');
        
        logger.blockchainInfo('📊 Detalhes das conexões:');
        bootstrapConnections.forEach((connectedPeerId, i) => {
          logger.blockchainInfo(`  Bootstrap -> Peer ${i + 1}:`, {
            remotePeer: connectedPeerId.substring(0, 16) + '...'
          });
        });

        peerConnections.forEach((connectedPeerId, i) => {
          logger.blockchainInfo(`  Peer -> Bootstrap ${i + 1}:`, {
            remotePeer: connectedPeerId.substring(0, 16) + '...'
          });
        });

        break;
      }

      // A cada 6 segundos, tentar forçar descoberta
      if (i === 5 || i === 11 || i === 17) {
        logger.blockchainInfo('🔍 Tentando descoberta manual...');
        try {
          if (bootstrapMultiaddr) {
            // Extrair peerId do endereço multiaddr
            const bootstrapMultiaddrs = bootstrapNode.getMultiaddrs().map(ma => ma.toString());
            for (const addr of bootstrapMultiaddrs) {
              try {
                await peerNode.connectToPeer(addr);
              } catch (err) {
                logger.blockchainWarn('⚠️ Erro ao conectar manualmente ao endereço:', { addr, err });
              }
            }
          }
        } catch (error) {
          logger.blockchainWarn('⚠️ Erro na descoberta manual:', error);
        }
      }
    }

    // 4. Verificar resultado final
    const finalBootstrapConnections = bootstrapNode.getConnections();
    const finalPeerConnections = peerNode.getConnections();

    if (finalBootstrapConnections.length > 0 || finalPeerConnections.length > 0) {
      logger.blockchainInfo('🎉 SUCESSO: Peers se descobriram e conectaram!');
    } else {
      logger.blockchainError('❌ FALHA: Peers não se conectaram automaticamente');
      
      // Debug adicional
      logger.blockchainInfo('🔍 Debug final:');
      logger.blockchainInfo('Bootstrap connections:', peerNode.getConnections());
      logger.blockchainInfo('Peer connections:', bootstrapNode.getConnections());
    }

  } catch (error) {
    logger.blockchainError('❌ Erro no teste de descoberta:', error);
  } finally {
    // Limpar recursos
    logger.blockchainInfo('🛑 Parando nós...');
    
    if (peerNode) {
      await peerNode.stop();
    }
    
    if (bootstrapNode) {
      await bootstrapNode.stop();
    }
    
    logger.blockchainInfo('🏁 Teste de descoberta finalizado');
  }
}

/**
 * Configura listeners de eventos para monitorar descoberta
 */
function setupDiscoveryListeners(node: LibP2PNetwork, logger: any) {
  const nodeId = node.getNodeId().substring(0, 8);
  
  node.on('peer:discovery', (peerId) => {
    logger.blockchainInfo(`🔍 [${nodeId}] Peer descoberto:`, peerId.toString().substring(0, 16) + '...');
  });

  node.on('peer:connect', (peerId) => {
    logger.blockchainInfo(`🔗 [${nodeId}] Peer conectado:`, peerId.toString().substring(0, 16) + '...');
  });

  node.on('peer:disconnect', (peerId) => {
    logger.blockchainInfo(`🔌 [${nodeId}] Peer desconectado:`, peerId.toString().substring(0, 16) + '...');
  });
}

// Executar teste
testPeerDiscovery().catch(console.error);

export { testPeerDiscovery };
