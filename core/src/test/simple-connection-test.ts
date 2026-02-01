import { LibP2PNetwork } from '../network/libp2p.js';
import { BlockchainLogger } from '../utils/logger.js';

const logger = BlockchainLogger.getInstance();

async function testPeerConnection() {
  logger.blockchainInfo('🧪 === TESTE DE CONEXÃO ENTRE 2 PEERS ===');
  
  let bootstrap: LibP2PNetwork | null = null;
  let peer: LibP2PNetwork | null = null;
  
  try {
    // 1. Criar bootstrap
    logger.blockchainInfo('🚀 Criando nó bootstrap...');
    bootstrap = new LibP2PNetwork({
      port: 5001, // Usar porta diferente
      isBootstrap: true,
      enableMDNS: true // Habilitar MDNS para descoberta local
    });
    
    await bootstrap.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const bootstrapAddr = `/ip4/127.0.0.1/tcp/5001/p2p/${bootstrap.getNodeId()}`; // TCP direto
    logger.blockchainInfo(`📡 Bootstrap criado: ${bootstrapAddr}`);
    logger.blockchainInfo(`📊 Bootstrap multiaddrs: ${bootstrap.getMultiaddrs().join(', ')}`);
    
    // 2. Criar peer
    logger.blockchainInfo('🔗 Criando peer...');
    peer = new LibP2PNetwork({
      port: 5002, // Usar porta diferente
      isBootstrap: false,
      bootstrapPeers: [bootstrapAddr],
      enableMDNS: true // Habilitar MDNS também no peer
    });
    
    // Escutar eventos de descoberta e conexão
    peer.on('peer:discovery', (data) => {
      logger.blockchainInfo(`🔍 PEER: Peer descoberto: ${data.peerId.substring(0, 16)}...`);
    });
    
    peer.on('peer:connect', (data) => {
      logger.blockchainInfo(`🤝 PEER: Conectado a: ${data.peerId.substring(0, 16)}...`);
    });
    
    bootstrap.on('peer:discovery', (data) => {
      logger.blockchainInfo(`🔍 BOOTSTRAP: Peer descoberto: ${data.peerId.substring(0, 16)}...`);
    });
    
    bootstrap.on('peer:connect', (data) => {
      logger.blockchainInfo(`🤝 BOOTSTRAP: Conectado a: ${data.peerId.substring(0, 16)}...`);
    });
    
    await peer.start();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logger.blockchainInfo(`🔗 Peer criado na porta 5002`);
    logger.blockchainInfo(`📊 Peer multiaddrs: ${peer.getMultiaddrs().join(', ')}`);
    
    // 3. Aguardar descoberta automática
    logger.blockchainInfo('⏳ Aguardando descoberta automática (10s)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // 4. Verificar conexões
    const bootstrapStats = bootstrap.getNetworkStats();
    const peerStats = peer.getNetworkStats();
    
    logger.blockchainInfo('📊 === ESTATÍSTICAS DE CONEXÃO ===');
    logger.blockchainInfo(`Bootstrap - Conexões: ${bootstrapStats.connectedPeers}, Peers conhecidos: ${bootstrapStats.knownNodes}`);
    logger.blockchainInfo(`Peer - Conexões: ${peerStats.connectedPeers}, Peers conhecidos: ${peerStats.knownNodes}`);
    
    if (bootstrapStats.connectedPeers === 0 && peerStats.connectedPeers === 0) {
      logger.blockchainWarn('⚠️ Descoberta automática falhou, tentando conexão manual...');
      
      // 5. Tentar conexão manual
      const success = await peer.connectToPeer(bootstrapAddr);
      if (success) {
        logger.blockchainInfo('✅ Conexão manual bem-sucedida!');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalBootstrapStats = bootstrap.getNetworkStats();
        const finalPeerStats = peer.getNetworkStats();
        
        logger.blockchainInfo('📊 === ESTATÍSTICAS FINAIS ===');
        logger.blockchainInfo(`Bootstrap - Conexões: ${finalBootstrapStats.connectedPeers}`);
        logger.blockchainInfo(`Peer - Conexões: ${finalPeerStats.connectedPeers}`);
      } else {
        logger.blockchainError('❌ Conexão manual também falhou');
      }
    } else {
      logger.blockchainInfo('✅ Conexão automática bem-sucedida!');
    }
    
  } catch (error) {
    logger.blockchainError('❌ Erro no teste:', error);
    console.error('ERRO COMPLETO:', error);
  } finally {
    // Cleanup
    if (peer) {
      await peer.stop();
      logger.blockchainInfo('🛑 Peer parado');
    }
    if (bootstrap) {
      await bootstrap.stop();
      logger.blockchainInfo('🛑 Bootstrap parado');
    }
  }
}

testPeerConnection().catch(error => {
  logger.blockchainError('TESTE FALHOU:', error);
  console.error('TESTE FALHOU COMPLETO:', error);
  process.exit(1);
});
