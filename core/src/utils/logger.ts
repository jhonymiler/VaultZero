import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  blockHeight?: number;
  peerId?: string;
  transactionId?: string;
}

export class BlockchainLogger {
  private static instance: BlockchainLogger;
  private logFile: string;
  private logLevel: LogLevel;
  private debugEnabled: boolean;

  constructor() {
    this.logFile = process.env.LOG_FILE || './logs/blockchain.log';
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    this.debugEnabled = process.env.BLOCKCHAIN_DEBUG === 'true';
    
    // Criar diretório de logs se não existir
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  static getInstance(): BlockchainLogger {
    if (!BlockchainLogger.instance) {
      BlockchainLogger.instance = new BlockchainLogger();
    }
    return BlockchainLogger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level];
    let logLine = `[${entry.timestamp}] [${levelStr}] [${entry.category}] ${entry.message}`;
    
    if (entry.blockHeight !== undefined) {
      logLine += ` | Block: ${entry.blockHeight}`;
    }
    
    if (entry.peerId) {
      logLine += ` | Peer: ${entry.peerId.substring(0, 8)}...`;
    }
    
    if (entry.transactionId) {
      logLine += ` | Tx: ${entry.transactionId.substring(0, 8)}...`;
    }
    
    if (entry.data && this.debugEnabled) {
      logLine += ` | Data: ${JSON.stringify(entry.data)}`;
    }
    
    return logLine;
  }

  private writeLog(entry: LogEntry): void {
    if (entry.level < this.logLevel) return;

    const logLine = this.formatLogEntry(entry) + '\n';
    
    // Log no console
    const color = this.getConsoleColor(entry.level);
    console.log(color + logLine.trim() + '\x1b[0m');
    
    // Log no arquivo
    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }
  }

  private getConsoleColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      default: return '\x1b[0m';              // Reset
    }
  }

  // Métodos de logging para blockchain
  blockchainInfo(message: string, data?: any, blockHeight?: number): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      category: 'BLOCKCHAIN',
      message,
      data,
      blockHeight
    });
  }

  blockchainDebug(message: string, data?: any, blockHeight?: number): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.DEBUG,
      category: 'BLOCKCHAIN',
      message,
      data,
      blockHeight
    });
  }

  blockchainWarn(message: string, data?: any, blockHeight?: number): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.WARN,
      category: 'BLOCKCHAIN',
      message,
      data,
      blockHeight
    });
  }

  blockchainError(message: string, error?: any, blockHeight?: number): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.ERROR,
      category: 'BLOCKCHAIN',
      message,
      data: error?.message || error,
      blockHeight
    });
  }

  // Métodos de logging para P2P
  p2pInfo(message: string, peerId?: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      category: 'P2P',
      message,
      data,
      peerId
    });
  }

  p2pDebug(message: string, peerId?: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.DEBUG,
      category: 'P2P',
      message,
      data,
      peerId
    });
  }

  p2pWarn(message: string, peerId?: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.WARN,
      category: 'P2P',
      message,
      data,
      peerId
    });
  }

  p2pError(message: string, peerId?: string, error?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.ERROR,
      category: 'P2P',
      message,
      data: error?.message || error,
      peerId
    });
  }

  // Métodos de logging para consenso
  consensusInfo(message: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      category: 'CONSENSUS',
      message,
      data
    });
  }

  consensusDebug(message: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.DEBUG,
      category: 'CONSENSUS',
      message,
      data
    });
  }

  consensusWarn(message: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.WARN,
      category: 'CONSENSUS',
      message,
      data
    });
  }

  consensusError(message: string, error?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.ERROR,
      category: 'CONSENSUS',
      message,
      data: error?.message || error
    });
  }

  // Métodos de logging para autenticação
  authInfo(message: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      category: 'AUTH',
      message,
      data
    });
  }

  authDebug(message: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.DEBUG,
      category: 'AUTH',
      message,
      data
    });
  }

  authWarn(message: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.WARN,
      category: 'AUTH',
      message,
      data
    });
  }

  authError(message: string, error?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.ERROR,
      category: 'AUTH',
      message,
      data: error?.message || error
    });
  }

  // Método para transações
  transactionLog(message: string, transactionId: string, data?: any): void {
    this.writeLog({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      category: 'TRANSACTION',
      message,
      data,
      transactionId
    });
  }

  // Método para limpar logs antigos
  clearOldLogs(daysToKeep: number = 7): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        const daysDiff = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > daysToKeep) {
          fs.unlinkSync(this.logFile);
          this.blockchainInfo('Log antigo removido');
        }
      }
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  }

  // Método para rotação de logs
  rotateLogs(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB > 10) { // Rotacionar se > 10MB
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = this.logFile.replace('.log', `-${timestamp}.log`);
          fs.renameSync(this.logFile, rotatedFile);
          this.blockchainInfo('Log rotacionado', { newFile: rotatedFile });
        }
      }
    } catch (error) {
      console.error('Erro ao rotacionar logs:', error);
    }
  }
}
