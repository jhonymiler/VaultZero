import { Identity, LocalLedger } from '../types';
import { DecentralizedIdentity } from './identity';
import { Level } from 'level';

export class LocalLedgerManager {
  private ledger: LocalLedger;
  private db: Level<string, string>;
  private readonly DB_PATH = './data/local-ledger';

  constructor() {
    this.ledger = {
      identities: new Map(),
      lastSync: 0,
      version: 1
    };
    this.db = new Level(this.DB_PATH, { valueEncoding: 'json' });
    this.loadFromDisk();
  }

  /**
   * Carrega o ledger do disco
   */
  private async loadFromDisk(): Promise<void> {
    try {
      const ledgerData = await this.db.get('ledger');
      if (ledgerData) {
        const parsed = JSON.parse(ledgerData);
        this.ledger.lastSync = parsed.lastSync;
        this.ledger.version = parsed.version;
        
        // Reconstrói o Map de identidades
        if (parsed.identities) {
          Object.entries(parsed.identities).forEach(([key, value]) => {
            this.ledger.identities.set(key, value as Identity);
          });
        }
      }
    } catch (error) {
      console.log('Criando novo ledger local...');
    }
  }

  /**
   * Salva o ledger no disco
   */
  private async saveToDisk(): Promise<void> {
    try {
      const dataToSave = {
        identities: Object.fromEntries(this.ledger.identities),
        lastSync: this.ledger.lastSync,
        version: this.ledger.version
      };
      await this.db.put('ledger', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao salvar ledger:', error);
    }
  }

  /**
   * Adiciona uma nova identidade ao ledger
   */
  async addIdentity(identity: Identity): Promise<boolean> {
    try {
      // Verifica se a identidade é válida
      if (!DecentralizedIdentity.verifyIdentity(identity)) {
        console.error('Identidade inválida - falha na verificação');
        return false;
      }

      // Verifica se já existe
      if (this.ledger.identities.has(identity.id)) {
        const existing = this.ledger.identities.get(identity.id)!;
        if (identity.timestamp <= existing.timestamp) {
          console.log('Identidade já existe com timestamp mais recente');
          return false;
        }
      }

      // Adiciona ao ledger
      this.ledger.identities.set(identity.id, identity);
      this.ledger.version++;
      
      await this.saveToDisk();
      console.log(`Identidade adicionada: ${identity.id}`);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar identidade:', error);
      return false;
    }
  }

  /**
   * Remove uma identidade do ledger
   */
  async removeIdentity(identityId: string): Promise<boolean> {
    try {
      if (this.ledger.identities.has(identityId)) {
        this.ledger.identities.delete(identityId);
        this.ledger.version++;
        await this.saveToDisk();
        console.log(`Identidade removida: ${identityId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao remover identidade:', error);
      return false;
    }
  }

  /**
   * Busca uma identidade específica
   */
  getIdentity(identityId: string): Identity | undefined {
    return this.ledger.identities.get(identityId);
  }

  /**
   * Retorna todas as identidades
   */
  getAllIdentities(): Identity[] {
    return Array.from(this.ledger.identities.values());
  }

  /**
   * Busca identidades por critério
   */
  searchIdentities(criteria: Partial<Identity>): Identity[] {
    const results: Identity[] = [];
    
    for (const identity of this.ledger.identities.values()) {
      let matches = true;
      
      for (const [key, value] of Object.entries(criteria)) {
        if (identity[key as keyof Identity] !== value) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        results.push(identity);
      }
    }
    
    return results;
  }

  /**
   * Merge com identidades de outros nós
   */
  async mergeIdentities(externalIdentities: Identity[]): Promise<number> {
    let merged = 0;
    
    for (const identity of externalIdentities) {
      if (await this.addIdentity(identity)) {
        merged++;
      }
    }
    
    if (merged > 0) {
      this.ledger.lastSync = Date.now();
      await this.saveToDisk();
    }
    
    return merged;
  }

  /**
   * Retorna estatísticas do ledger
   */
  getStats() {
    return {
      totalIdentities: this.ledger.identities.size,
      version: this.ledger.version,
      lastSync: new Date(this.ledger.lastSync).toISOString(),
      oldestIdentity: this.getOldestIdentity(),
      newestIdentity: this.getNewestIdentity()
    };
  }

  private getOldestIdentity(): Identity | null {
    let oldest: Identity | null = null;
    
    for (const identity of this.ledger.identities.values()) {
      if (!oldest || identity.timestamp < oldest.timestamp) {
        oldest = identity;
      }
    }
    
    return oldest;
  }

  private getNewestIdentity(): Identity | null {
    let newest: Identity | null = null;
    
    for (const identity of this.ledger.identities.values()) {
      if (!newest || identity.timestamp > newest.timestamp) {
        newest = identity;
      }
    }
    
    return newest;
  }

  /**
   * Limpa identidades antigas (mais de 30 dias)
   */
  async cleanupOldIdentities(): Promise<number> {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let removed = 0;
    
    for (const [id, identity] of this.ledger.identities.entries()) {
      if (identity.timestamp < thirtyDaysAgo) {
        this.ledger.identities.delete(id);
        removed++;
      }
    }
    
    if (removed > 0) {
      this.ledger.version++;
      await this.saveToDisk();
    }
    
    return removed;
  }

  /**
   * Exporta o ledger para backup
   */
  exportLedger(): string {
    return JSON.stringify({
      identities: Object.fromEntries(this.ledger.identities),
      lastSync: this.ledger.lastSync,
      version: this.ledger.version,
      exportTimestamp: Date.now()
    }, null, 2);
  }

  /**
   * Importa ledger de backup
   */
  async importLedger(ledgerData: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(ledgerData);
      
      if (parsed.identities) {
        // Verifica cada identidade antes de importar
        const validIdentities: Identity[] = [];
        
        for (const identity of Object.values(parsed.identities)) {
          if (DecentralizedIdentity.verifyIdentity(identity as Identity)) {
            validIdentities.push(identity as Identity);
          }
        }
        
        await this.mergeIdentities(validIdentities);
        console.log(`Importadas ${validIdentities.length} identidades válidas`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao importar ledger:', error);
      return false;
    }
  }
}