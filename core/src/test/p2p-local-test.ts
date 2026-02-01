import { LibP2PNetwork, LibP2PConfig } from '../network/libp2p.js';
import { BlockchainLogger } from '../utils/logger.js';
import { Identity } from '../types/index.js';

export class LocalP2PTestNetwork {
  private nodes: Map<string, LibP2PNetwork> = new Map();
  private logger = BlockchainLogger.getInstance();

  /**
   * Cria uma rede P2P local para testes
   */
  async createLocalNetwork(nodeCount: number = 5): Promise<void> {
    this.logger.blockchainInfo(`🚀 Criando rede P2P local com ${nodeCount} nós...`);

    // 1. Criar nó bootstrap
    const bootstrapPort = 3001;
    const bootstrapConfig: LibP2PConfig = {
      port: bootstrapPort,
      isBootstrap: true,
      enableMDNS: false, // Desabilitar em testes locais
      maxConnections: 100,
      minConnections: 0
    };

    const bootstrapNode = new LibP2PNetwork(bootstrapConfig);
    await bootstrapNode.start();
    this.nodes.set('bootstrap', bootstrapNode);

    // Aguardar bootstrap estar pronto
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Usar endereço TCP do bootstrap (não WebSocket)
    const bootstrapMultiaddrs = bootstrapNode.getMultiaddrs();
    const bootstrapTcpAddr = bootstrapMultiaddrs.find(ma => ma.toString().includes('/tcp/') && !ma.toString().includes('/ws'));
    const bootstrapMultiaddr = bootstrapTcpAddr?.toString() || `/ip4/127.0.0.1/tcp/${bootstrapPort}/p2p/${bootstrapNode.getNodeId()}`;
    this.logger.blockchainInfo(`📡 Bootstrap node criado: ${bootstrapMultiaddr}`);

    // 2. Criar nós peers
    for (let i = 1; i < nodeCount; i++) {
      const port = bootstrapPort + i;
      const peerConfig: LibP2PConfig = {
        port,
        isBootstrap: false,
        bootstrapPeers: [bootstrapMultiaddr],
        enableMDNS: false,
        maxConnections: 50,
        minConnections: 2
      };

      const peer = new LibP2PNetwork(peerConfig);
      await peer.start();
      this.nodes.set(`peer-${i}`, peer);

      // Aguardar conexão estabilizar
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.logger.blockchainInfo(`🔗 Peer ${i} criado na porta ${port}`);
    }

    // 3. Aguardar formação da rede
    await this.waitForNetworkFormation();
    this.logger.blockchainInfo(`🌐 Rede P2P local formada com ${nodeCount} nós!`);
  }

  /**
   * Testa comunicação P2P real entre nós
   */
  async testP2PCommunication(): Promise<void> {
    this.logger.blockchainInfo('🧪 Iniciando testes de comunicação P2P...');

    const nodes = Array.from(this.nodes.values());
    
    if (nodes.length < 2) {
      throw new Error('Precisa de pelo menos 2 nós para testar comunicação');
    }

    // 1. Teste DHT Storage/Retrieval
    await this.testDHTOperations(nodes);

    // 2. Teste Identity Management
    await this.testIdentityManagement(nodes);

    // 3. Teste Network Stats
    await this.testNetworkStats(nodes);

    this.logger.blockchainInfo('✅ Testes de comunicação P2P concluídos!');
  }

  /**
   * Testa operações DHT
   */
  private async testDHTOperations(nodes: LibP2PNetwork[]): Promise<void> {
    this.logger.blockchainInfo('📊 Testando operações DHT...');

    try {
      // Criar identidade de teste
      const testIdentity: Identity = {
        id: 'test-identity-' + Date.now(),
        publicKey: 'mock-public-key-' + Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        signature: 'mock-signature',
        metadata: {
          deviceInfo: 'test-device',
          location: 'local-test'
        }
      };

      // Armazenar no primeiro nó
      const stored = await nodes[0].storeIdentity(testIdentity);
      if (stored) {
        this.logger.blockchainInfo(`✅ Identidade armazenada via nó 1: ${testIdentity.id}`);
      } else {
        this.logger.blockchainError('❌ Falha ao armazenar identidade');
        return;
      }

      // Aguardar propagação
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Tentar recuperar do segundo nó
      const retrieved = await nodes[1].getIdentity(testIdentity.id);
      if (retrieved) {
        this.logger.blockchainInfo(`✅ Identidade recuperada via nó 2: ${retrieved.id}`);
        this.logger.blockchainDebug('Dados recuperados:', retrieved);
      } else {
        this.logger.blockchainWarn('⚠️ Identidade não encontrada no nó 2 (pode ser normal em rede pequena)');
      }

    } catch (error) {
      this.logger.blockchainError('❌ Erro no teste DHT:', error);
    }
  }

  /**
   * Testa gerenciamento de identidades
   */
  private async testIdentityManagement(nodes: LibP2PNetwork[]): Promise<void> {
    this.logger.blockchainInfo('🔐 Testando gerenciamento de identidades...');

    try {
      // Criar múltiplas identidades
      const identities: Identity[] = [];
      
      for (let i = 0; i < 3; i++) {
        const identity: Identity = {
          id: `identity-${i}-${Date.now()}`,
          publicKey: `public-key-${i}-${Math.random().toString(36).substring(7)}`,
          timestamp: Date.now() + i,
          signature: `signature-${i}`,
          metadata: {
            deviceInfo: `device-${i}`,
            location: 'test-environment'
          }
        };

        identities.push(identity);
        
        // Armazenar em nós diferentes
        const nodeIndex = i % nodes.length;
        await nodes[nodeIndex].storeIdentity(identity);
        
        this.logger.blockchainDebug(`🔐 Identidade ${i} armazenada no nó ${nodeIndex}`);
      }

      // Aguardar sincronização
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Tentar recuperar todas as identidades de nós diferentes
      for (let i = 0; i < identities.length; i++) {
        const searchNodeIndex = (i + 1) % nodes.length; // Nó diferente do que armazenou
        const found = await nodes[searchNodeIndex].getIdentity(identities[i].id);
        
        if (found) {
          this.logger.blockchainInfo(`✅ Identidade ${i} encontrada no nó ${searchNodeIndex}`);
        } else {
          this.logger.blockchainWarn(`⚠️ Identidade ${i} não encontrada no nó ${searchNodeIndex}`);
        }
      }

    } catch (error) {
      this.logger.blockchainError('❌ Erro no teste de identidades:', error);
    }
  }

  /**
   * Testa estatísticas da rede
   */
  private async testNetworkStats(nodes: LibP2PNetwork[]): Promise<void> {
    this.logger.blockchainInfo('📈 Testando estatísticas da rede...');

    for (const [nodeId, node] of this.nodes.entries()) {
      const stats = node.getNetworkStats();
      this.logger.blockchainInfo(`📊 Estatísticas do ${nodeId}:`, {
        connected: stats.connected,
        connections: stats.connections,
        peers: stats.peers,
        identitiesStored: stats.identitiesStored,
        nodeId: stats.nodeId?.substring(0, 16) + '...'
      });
    }
  }

  /**
   * Simula dispositivos móveis conectando à rede
   */
  async simulateMobileDevices(): Promise<void> {
    this.logger.blockchainInfo('📱 Simulando dispositivos móveis...');

    const bootstrapNode = this.nodes.get('bootstrap');
    if (!bootstrapNode) {
      throw new Error('Bootstrap node não encontrado');
    }

    // Usar endereço TCP do bootstrap
    const bootstrapMultiaddrs = bootstrapNode.getMultiaddrs();
    const bootstrapTcpAddr = bootstrapMultiaddrs.find(ma => ma.toString().includes('/tcp/') && !ma.toString().includes('/ws'));
    const bootstrapMultiaddr = bootstrapTcpAddr?.toString() || `/ip4/127.0.0.1/tcp/3001/p2p/${bootstrapNode.getNodeId()}`;

    // Simular 3 dispositivos móveis
    for (let i = 1; i <= 3; i++) {
      const mobilePort = 4000 + i;
      const mobileConfig: LibP2PConfig = {
        port: mobilePort,
        isBootstrap: false,
        bootstrapPeers: [bootstrapMultiaddr],
        enableMDNS: false,
        maxConnections: 20,
        minConnections: 1
      };

      const mobileNode = new LibP2PNetwork(mobileConfig);
      await mobileNode.start();
      this.nodes.set(`mobile-${i}`, mobileNode);

      // Simular sincronização de identidade móvel
      await this.simulateIdentitySync(mobileNode, `mobile-device-${i}`);

      this.logger.blockchainInfo(`📱 Dispositivo móvel ${i} conectado na porta ${mobilePort}`);
      
      // Aguardar estabilização
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  /**
   * Simula sincronização de identidade de um dispositivo
   */
  private async simulateIdentitySync(node: LibP2PNetwork, deviceId: string): Promise<void> {
    const mobileIdentity: Identity = {
      id: `mobile-identity-${deviceId}-${Date.now()}`,
      publicKey: `mobile-public-key-${deviceId}`,
      timestamp: Date.now(),
      signature: `mobile-signature-${deviceId}`,
      metadata: {
        deviceInfo: deviceId,
        location: 'mobile-simulation',
        userAgent: 'VaultZero-Mobile/1.0.0'
      }
    };

    const stored = await node.storeIdentity(mobileIdentity);
    if (stored) {
      this.logger.blockchainInfo(`🔐 Identidade móvel sincronizada: ${deviceId}`);
    } else {
      this.logger.blockchainError(`❌ Falha ao sincronizar identidade móvel: ${deviceId}`);
    }
  }

  /**
   * Monitora o estado da rede continuamente
   */
  async monitorNetwork(): Promise<void> {
    this.logger.blockchainInfo('👁️ Iniciando monitoramento da rede...');

    const monitorInterval = setInterval(() => {
      this.logger.blockchainInfo('\n📊 === ESTADO DA REDE P2P ===');
      
      let totalConnections = 0;
      let totalPeers = 0;
      let totalIdentities = 0;

      for (const [nodeId, node] of this.nodes.entries()) {
        const stats = node.getNetworkStats();
        
        totalConnections += (stats.connections?.length || 0);
        totalPeers += stats.peers || 0;
        totalIdentities += stats.identitiesStored || 0;

        this.logger.blockchainInfo(`  ${nodeId}:`);
        this.logger.blockchainInfo(`    🔗 Conexões: ${stats.connections}`);
        this.logger.blockchainInfo(`    👥 Peers: ${stats.peers}`);
        this.logger.blockchainInfo(`    🔐 Identidades: ${stats.identitiesStored}`);
        this.logger.blockchainInfo(`    🆔 Node ID: ${stats.nodeId?.substring(0, 16)}...`);
      }

      this.logger.blockchainInfo(`\n📈 TOTAIS DA REDE:`);
      this.logger.blockchainInfo(`  🌐 Nós ativos: ${this.nodes.size}`);
      this.logger.blockchainInfo(`  🔗 Total conexões: ${totalConnections}`);
      this.logger.blockchainInfo(`  👥 Total peers únicos: ${totalPeers}`);
      this.logger.blockchainInfo(`  🔐 Total identidades: ${totalIdentities}`);
      this.logger.blockchainInfo('================================\n');

    }, 15000); // A cada 15 segundos

    // Cleanup handler
    process.on('SIGINT', () => {
      clearInterval(monitorInterval);
      this.shutdown();
    });
  }

  /**
   * Aguarda a formação da rede
   */
  private async waitForNetworkFormation(): Promise<void> {
    this.logger.blockchainInfo('⏳ Aguardando formação da rede...');
    
    // Aguardar 15 segundos para descoberta automática através do bootstrap
    const maxWaitTime = 15;
    let totalConnections = 0;
    
    for (let i = 0; i < maxWaitTime; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      totalConnections = 0;
      for (const [nodeId, node] of this.nodes.entries()) {
        const connections = node.getConnections();
        totalConnections += connections.length;
      }

      this.logger.blockchainInfo(`⏰ ${i + 1}s - Total de conexões na rede: ${totalConnections}`);
      
      // Se tivermos pelo menos algumas conexões, considerar a rede formada
      if (totalConnections >= 2) {
        this.logger.blockchainInfo(`🎉 Rede formada rapidamente com ${totalConnections} conexões!`);
        break;
      }
    }

    // Log final detalhado
    for (const [nodeId, node] of this.nodes.entries()) {
      const connections = node.getConnections();
      this.logger.blockchainInfo(`📈 ${nodeId}: ${connections.length} conexões`);
      if (connections.length > 0) {
        this.logger.blockchainDebug(`  - Conectado a: ${connections.map(c => c.substring(0, 8)).join(', ')}`);
      }
    }

    this.logger.blockchainInfo(`✅ Rede formada com ${totalConnections} conexões totais`);
  }

  /**
   * Testa resistência da rede
   */
  async testNetworkResilience(): Promise<void> {
    this.logger.blockchainInfo('🛡️ Testando resistência da rede...');

    const nodes = Array.from(this.nodes.entries());
    if (nodes.length < 4) {
      this.logger.blockchainWarn('Precisa de pelo menos 4 nós para teste de resistência');
      return;
    }

    // 1. Desconectar aleatoriamente 2 nós
    const nodesToDisconnect = nodes.slice(1, 3); // Não desconectar bootstrap
    
    for (const [nodeId, node] of nodesToDisconnect) {
      this.logger.blockchainInfo(`🔌 Desconectando nó: ${nodeId}`);
      await node.stop();
      this.nodes.delete(nodeId);
    }

    // 2. Aguardar e verificar se rede continua funcionando
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const remainingNodes = Array.from(this.nodes.values());
    await this.testDHTOperations(remainingNodes);

    // 3. Reconectar nós
    this.logger.blockchainInfo('🔄 Reconectando nós...');
    // Note: Em um teste real, reconectaríamos os nós aqui
    
    this.logger.blockchainInfo('✅ Teste de resistência concluído');
  }

  /**
   * Para todos os nós da rede
   */
  async shutdown(): Promise<void> {
    this.logger.blockchainInfo('🛑 Parando rede P2P local...');

    for (const [nodeId, node] of this.nodes.entries()) {
      try {
        await node.stop();
        this.logger.blockchainDebug(`✅ Nó ${nodeId} parado`);
      } catch (error) {
        this.logger.blockchainError(`❌ Erro ao parar nó ${nodeId}:`, error);
      }
    }

    this.nodes.clear();
    this.logger.blockchainInfo('🏁 Rede P2P local finalizada');
  }
}

/**
 * Script principal para executar teste da rede P2P local
 */
export async function runLocalP2PTest(): Promise<void> {
  const logger = BlockchainLogger.getInstance();
  
  logger.blockchainInfo('🚀 === INICIANDO TESTE DE REDE P2P LOCAL ===\n');
  
  const testNetwork = new LocalP2PTestNetwork();
  
  try {
    // 1. Criar rede base
    await testNetwork.createLocalNetwork(5);
    
    // 2. Testar comunicação P2P
    await testNetwork.testP2PCommunication();
    
    // 3. Simular dispositivos móveis
    await testNetwork.simulateMobileDevices();
    
    // 4. Testar resistência (opcional)
    // await testNetwork.testNetworkResilience();
    
    // 5. Iniciar monitoramento contínuo
    await testNetwork.monitorNetwork();
    
  } catch (error) {
    logger.blockchainError('❌ ERRO NO TESTE P2P:', error);
    await testNetwork.shutdown();
    process.exit(1);
  }
}

// Executar se chamado diretamente (ESM compatível)
if (import.meta.url === `file://${process.argv[1]}`) {
  runLocalP2PTest().catch(console.error);
}
