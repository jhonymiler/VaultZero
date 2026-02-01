import { LibP2PNetwork } from '../network/libp2p.js';
import { BlockchainLogger } from '../utils/logger.js';

const logger = BlockchainLogger.getInstance();

async function testLibP2PInit() {
  logger.blockchainInfo('🧪 Testando inicialização do LibP2P...');
  
  try {
    const node = new LibP2PNetwork({
      port: 3010, // Usar porta diferente
      isBootstrap: true,
      enableMDNS: false // Desabilitar MDNS por enquanto
    });
    
    logger.blockchainInfo('🚀 Criando nó LibP2P...');
    await node.start();
    
    logger.blockchainInfo('✅ Nó criado com sucesso!');
    logger.blockchainInfo('Node ID:', node.getNodeId());
    logger.blockchainInfo('Multiaddrs:', node.getMultiaddrs());
    
    const stats = node.getNetworkStats();
    logger.blockchainInfo('📊 Estatísticas:', stats);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await node.stop();
    logger.blockchainInfo('🛑 Teste concluído');
    
  } catch (error) {
    logger.blockchainError('❌ Erro no teste:', error);
    console.error('ERRO COMPLETO:', error);
    throw error;
  }
}

testLibP2PInit().catch(error => {
  logger.blockchainError('TESTE FALHOU:', error);
  console.error('TESTE FALHOU COMPLETO:', error);
  process.exit(1);
});
