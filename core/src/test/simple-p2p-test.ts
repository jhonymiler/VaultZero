import { LibP2PNetwork, LibP2PConfig } from '../network/libp2p.js';
import { BlockchainLogger } from '../utils/logger.js';

async function testSimpleP2PConnection() {
  try {
    console.log('🧪 === TESTE SIMPLES DE CONEXÃO P2P ===');
    
    // 1. Criar e iniciar bootstrap node
    const bootstrapConfig: LibP2PConfig = {
      port: 9001,
      isBootstrap: true,
      bootstrapPeers: [],
      enableMDNS: false,
      maxConnections: 100,
      minConnections: 1
    };
    
    const bootstrap = new LibP2PNetwork(bootstrapConfig);
    await bootstrap.start();
    
    console.log('✅ Bootstrap node iniciado na porta 9001');
    console.log(`🆔 Bootstrap ID: ${bootstrap.getNodeId()}`);
    console.log(`📡 Listen addresses: ${bootstrap.getMultiaddrs()}`);
    
    // 2. Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Criar peer que se conecta ao bootstrap
    const bootstrapMultiaddr = `/ip4/127.0.0.1/tcp/9001/p2p/${bootstrap.getNodeId()}`;
    console.log(`📡 Bootstrap multiaddr: ${bootstrapMultiaddr}`);
    
    const peerConfig: LibP2PConfig = {
      port: 9002,
      isBootstrap: false,
      bootstrapPeers: [bootstrapMultiaddr],
      enableMDNS: false,
      maxConnections: 100,
      minConnections: 1
    };
    
    const peer = new LibP2PNetwork(peerConfig);
    
    // Adicionar event listeners para debug
    peer.on('peer:connected', (data) => {
      console.log(`🤝 Peer conectado: ${data.peerId}`);
    });
    
    peer.on('peer:disconnected', (data) => {
      console.log(`💔 Peer desconectado: ${data.peerId}`);
    });
    
    await peer.start();
    
    console.log('✅ Peer iniciado na porta 9002');
    console.log(`🆔 Peer ID: ${peer.getNodeId()}`);
    console.log(`📡 Listen addresses: ${peer.getMultiaddrs()}`);
    
    // 4. Tentar conectar manualmente
    console.log('🔗 Tentando conectar manualmente ao bootstrap...');
    try {
      const success = await peer.connectToPeer(bootstrapMultiaddr);
      if (success) {
        console.log('✅ Conexão manual bem-sucedida!');
      } else {
        console.log('❌ Falha na conexão manual');
      }
    } catch (error) {
      console.error('❌ Erro na conexão manual:', error);
    }
    
    // 5. Aguardar conexão
    console.log('⏳ Aguardando conexão...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Verificar status da conexão
    const bootstrapStats = bootstrap.getNetworkStats();
    const peerStats = peer.getNetworkStats();
    
    console.log('📊 Bootstrap Stats:', {
      connected: bootstrapStats.connected,
      connectedPeers: bootstrapStats.connectedPeers,
      connections: bootstrapStats.connections
    });
    
    console.log('📊 Peer Stats:', {
      connected: peerStats.connected,
      connectedPeers: peerStats.connectedPeers,
      connections: peerStats.connections
    });
    
    // 7. Testar comunicação via pubsub
    console.log('📡 Testando comunicação via pubsub...');
    
    // Subscrever ao tópico no bootstrap
    bootstrap.on('message', (message) => {
      console.log('📨 Bootstrap recebeu mensagem:', message);
    });
    
    // Enviar mensagem do peer para o bootstrap
    const testMessage = {
      type: 'test-message',
      data: { text: 'Hello from peer!' },
      sender: peer.getNodeId(),
      timestamp: Date.now()
    };
    
    const published = await peer.publishToTopic('vault-zero-test', testMessage);
    console.log(`📤 Mensagem publicada: ${published}`);
    
    // Aguardar propagação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 8. Cleanup
    console.log('🧹 Limpando...');
    await peer.stop();
    await bootstrap.stop();
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    process.exit(1);
  }
}

// Executar o teste
testSimpleP2PConnection().catch(console.error);
