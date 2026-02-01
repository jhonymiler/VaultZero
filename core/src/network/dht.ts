import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { DHT } from '../types';

interface DHTEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  replicas: string[]; // IDs dos nós que possuem réplicas
}

interface DHTNode {
  id: string;
  address: string;
  port: number;
  distance: number;
  lastSeen: number;
}

export class DistributedHashTable extends EventEmitter implements DHT {
  private storage: Map<string, DHTEntry> = new Map();
  private nodes: Map<string, DHTNode> = new Map();
  private nodeId: string;
  private buckets: Map<number, DHTNode[]> = new Map();
  private readonly BUCKET_SIZE = 20;
  private readonly REPLICA_COUNT = 3;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 horas

  constructor(nodeId: string) {
    super();
    this.nodeId = nodeId;
    this.initializeBuckets();
    this.startMaintenanceTasks();
  }

  /**
   * Inicializa os buckets da DHT
   */
  private initializeBuckets(): void {
    for (let i = 0; i < 160; i++) { // 160 bits para SHA-1
      this.buckets.set(i, []);
    }
  }

  /**
   * Calcula a distância XOR entre dois IDs
   */
  private calculateDistance(id1: string, id2: string): number {
    const hash1 = createHash('sha1').update(id1).digest();
    const hash2 = createHash('sha1').update(id2).digest();
    
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      const xor = hash1[i] ^ hash2[i];
      if (xor !== 0) {
        // Encontra o bit mais significativo
        for (let bit = 7; bit >= 0; bit--) {
          if ((xor >> bit) & 1) {
            return distance + (7 - bit);
          }
        }
      }
      distance += 8;
    }
    return distance;
  }

  /**
   * Determina o bucket apropriado para um nó
   */
  private getBucketIndex(nodeId: string): number {
    return this.calculateDistance(this.nodeId, nodeId);
  }

  /**
   * Adiciona um nó à DHT
   */
  addNode(node: Omit<DHTNode, 'distance'>): void {
    const distance = this.calculateDistance(this.nodeId, node.id);
    const dhtNode: DHTNode = { ...node, distance };
    
    const bucketIndex = this.getBucketIndex(node.id);
    const bucket = this.buckets.get(bucketIndex)!;
    
    // Verifica se o nó já existe no bucket
    const existingIndex = bucket.findIndex(n => n.id === node.id);
    
    if (existingIndex >= 0) {
      // Atualiza nó existente
      bucket[existingIndex] = dhtNode;
    } else {
      // Adiciona novo nó
      if (bucket.length < this.BUCKET_SIZE) {
        bucket.push(dhtNode);
      } else {
        // Bucket cheio - remove o nó mais antigo
        const oldestIndex = bucket.findIndex(n => 
          Math.min(...bucket.map(node => node.lastSeen)) === n.lastSeen
        );
        bucket[oldestIndex] = dhtNode;
      }
    }
    
    this.nodes.set(node.id, dhtNode);
    console.log(`Nó adicionado à DHT: ${node.id} (bucket ${bucketIndex})`);
  }

  /**
   * Remove um nó da DHT
   */
  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      const bucketIndex = this.getBucketIndex(nodeId);
      const bucket = this.buckets.get(bucketIndex)!;
      
      const index = bucket.findIndex(n => n.id === nodeId);
      if (index >= 0) {
        bucket.splice(index, 1);
      }
      
      this.nodes.delete(nodeId);
      console.log(`Nó removido da DHT: ${nodeId}`);
    }
  }

  /**
   * Encontra os K nós mais próximos de uma chave
   */
  findClosestNodes(key: string, k: number = this.BUCKET_SIZE): DHTNode[] {
    const allNodes = Array.from(this.nodes.values());
    
    // Ordena por distância à chave
    allNodes.sort((a, b) => {
      const distA = this.calculateDistance(key, a.id);
      const distB = this.calculateDistance(key, b.id);
      return distA - distB;
    });
    
    return allNodes.slice(0, k);
  }

  /**
   * Armazena um valor na DHT
   */
  async store(key: string, value: any, ttl?: number): Promise<void> {
    const actualTtl = ttl || this.DEFAULT_TTL;
    const timestamp = Date.now();
    
    // Encontra os nós responsáveis por esta chave
    const responsibleNodes = this.findClosestNodes(key, this.REPLICA_COUNT);
    
    const entry: DHTEntry = {
      key,
      value,
      timestamp,
      ttl: actualTtl,
      replicas: responsibleNodes.map(n => n.id)
    };
    
    // Armazena localmente se este nó for responsável
    const isResponsible = responsibleNodes.some(n => n.id === this.nodeId);
    if (isResponsible || responsibleNodes.length === 0) {
      this.storage.set(key, entry);
      console.log(`Valor armazenado localmente: ${key}`);
    }
    
    // Replica para outros nós responsáveis
    for (const node of responsibleNodes) {
      if (node.id !== this.nodeId) {
        this.sendStoreRequest(node, key, value, actualTtl);
      }
    }
    
    this.emit('stored', { key, value, replicas: entry.replicas });
  }

  /**
   * Recupera um valor da DHT
   */
  async get(key: string): Promise<any> {
    // Primeiro verifica o armazenamento local
    const localEntry = this.storage.get(key);
    if (localEntry && !this.isExpired(localEntry)) {
      console.log(`Valor encontrado localmente: ${key}`);
      return localEntry.value;
    }
    
    // Se não encontrou localmente, consulta os nós responsáveis
    const responsibleNodes = this.findClosestNodes(key, this.REPLICA_COUNT);
    
    for (const node of responsibleNodes) {
      if (node.id !== this.nodeId) {
        try {
          const value = await this.sendGetRequest(node, key);
          if (value !== null) {
            // Cache o valor localmente
            await this.store(key, value);
            return value;
          }
        } catch (error) {
          console.error(`Erro ao consultar nó ${node.id}:`, error);
        }
      }
    }
    
    console.log(`Valor não encontrado: ${key}`);
    return null;
  }

  /**
   * Busca valores por padrão
   */
  async find(pattern: string): Promise<any[]> {
    const results: any[] = [];
    const regex = new RegExp(pattern);
    
    // Busca local
    for (const [key, entry] of this.storage.entries()) {
      if (regex.test(key) && !this.isExpired(entry)) {
        results.push({
          key,
          value: entry.value,
          timestamp: entry.timestamp
        });
      }
    }
    
    // Busca remota em todos os nós conhecidos
    const searchPromises = Array.from(this.nodes.values()).map(async (node) => {
      if (node.id !== this.nodeId) {
        try {
          const nodeResults = await this.sendFindRequest(node, pattern);
          return nodeResults || [];
        } catch (error) {
          console.error(`Erro ao buscar no nó ${node.id}:`, error);
          return [];
        }
      }
      return [];
    });
    
    const remoteResults = await Promise.all(searchPromises);
    
    // Combina resultados locais e remotos
    for (const nodeResults of remoteResults) {
      results.push(...nodeResults);
    }
    
    // Remove duplicatas baseado na chave
    const uniqueResults = results.filter((result, index, array) => 
      array.findIndex(r => r.key === result.key) === index
    );
    
    console.log(`Busca por '${pattern}' retornou ${uniqueResults.length} resultados`);
    return uniqueResults;
  }

  /**
   * Verifica se uma entrada expirou
   */
  private isExpired(entry: DHTEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  /**
   * Envia solicitação de armazenamento para um nó
   */
  private async sendStoreRequest(node: DHTNode, key: string, value: any, ttl: number): Promise<void> {
    // Implementação de rede seria aqui
    // Por agora, apenas simula o envio
    console.log(`Enviando store request para ${node.id}: ${key}`);
    
    // Em uma implementação real, enviaria via WebSocket ou HTTP
    this.emit('store_request_sent', { node: node.id, key, value });
  }

  /**
   * Envia solicitação de recuperação para um nó
   */
  private async sendGetRequest(node: DHTNode, key: string): Promise<any> {
    // Implementação de rede seria aqui
    // Por agora, retorna null para simular "não encontrado"
    console.log(`Enviando get request para ${node.id}: ${key}`);
    
    this.emit('get_request_sent', { node: node.id, key });
    return null; // Simulação
  }

  /**
   * Envia solicitação de busca para um nó
   */
  private async sendFindRequest(node: DHTNode, pattern: string): Promise<any[]> {
    // Implementação de rede seria aqui
    console.log(`Enviando find request para ${node.id}: ${pattern}`);
    
    this.emit('find_request_sent', { node: node.id, pattern });
    return []; // Simulação
  }

  /**
   * Inicia tarefas de manutenção da DHT
   */
  private startMaintenanceTasks(): void {
    // Limpeza de entradas expiradas a cada 10 minutos
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 10 * 60 * 1000);
    
    // Verificação de nós inativos a cada 5 minutos
    setInterval(() => {
      this.checkInactiveNodes();
    }, 5 * 60 * 1000);
    
    // Redistribuição de dados a cada 30 minutos
    setInterval(() => {
      this.redistributeData();
    }, 30 * 60 * 1000);
  }

  /**
   * Remove entradas expiradas do armazenamento
   */
  private cleanupExpiredEntries(): void {
    let removedCount = 0;
    
    for (const [key, entry] of this.storage.entries()) {
      if (this.isExpired(entry)) {
        this.storage.delete(key);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removidas ${removedCount} entradas expiradas da DHT`);
    }
  }

  /**
   * Verifica e remove nós inativos
   */
  private checkInactiveNodes(): void {
    const now = Date.now();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutos
    let removedCount = 0;
    
    for (const [nodeId, node] of this.nodes.entries()) {
      if (now - node.lastSeen > inactiveThreshold) {
        this.removeNode(nodeId);
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`Removidos ${removedCount} nós inativos da DHT`);
    }
  }

  /**
   * Redistribui dados para os nós corretos
   */
  private async redistributeData(): Promise<void> {
    console.log('Iniciando redistribuição de dados...');
    
    for (const [key, entry] of this.storage.entries()) {
      const currentResponsible = this.findClosestNodes(key, this.REPLICA_COUNT);
      const shouldStore = currentResponsible.some(n => n.id === this.nodeId);
      
      if (!shouldStore) {
        // Este nó não deveria armazenar esta chave
        this.storage.delete(key);
        console.log(`Removida chave não responsável: ${key}`);
      } else {
        // Verifica se as réplicas estão corretas
        const newReplicas = currentResponsible.map(n => n.id);
        if (JSON.stringify(entry.replicas.sort()) !== JSON.stringify(newReplicas.sort())) {
          // Atualiza réplicas
          entry.replicas = newReplicas;
          
          // Re-replica para novos nós responsáveis
          for (const node of currentResponsible) {
            if (node.id !== this.nodeId) {
              this.sendStoreRequest(node, key, entry.value, entry.ttl);
            }
          }
        }
      }
    }
  }

  /**
   * Retorna estatísticas da DHT
   */
  getStats() {
    const bucketStats = Array.from(this.buckets.entries()).map(([index, nodes]) => ({
      bucket: index,
      nodeCount: nodes.length
    })).filter(b => b.nodeCount > 0);

    return {
      nodeId: this.nodeId,
      totalNodes: this.nodes.size,
      totalEntries: this.storage.size,
      activeBuckets: bucketStats.length,
      bucketDistribution: bucketStats,
      replicationFactor: this.REPLICA_COUNT,
      bucketSize: this.BUCKET_SIZE
    };
  }

  /**
   * Retorna lista de nós conhecidos
   */
  getKnownNodes(): DHTNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Retorna entradas armazenadas localmente
   */
  getLocalEntries(): Array<{ key: string, value: any, timestamp: number, ttl: number }> {
    return Array.from(this.storage.entries()).map(([key, entry]) => ({
      key,
      value: entry.value,
      timestamp: entry.timestamp,
      ttl: entry.ttl
    }));
  }
}