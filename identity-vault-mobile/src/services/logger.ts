/**
 * Serviço de Logging para Debug
 * Salva logs detalhados em arquivo para investigação de erros
 */

import * as FileSystem from 'expo-file-system';

export class Logger {
  private static readonly LOG_DIR = FileSystem.documentDirectory + 'logs/';
  private static readonly LOG_FILE = Logger.LOG_DIR + 'identity-debug.log';
  
  static async initialize() {
    try {
      // Criar diretório de logs se não existir
      const dirInfo = await FileSystem.getInfoAsync(Logger.LOG_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(Logger.LOG_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao inicializar logger:', error);
    }
  }
  
  static async log(level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN', message: string, data?: any) {
    try {
      await Logger.initialize();
      
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level,
        message,
        data: data ? JSON.stringify(data, null, 2) : undefined
      };
      
      const logLine = `[${timestamp}] ${level}: ${message}${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}\n\n`;
      
      // Escrever no arquivo de log
      await FileSystem.writeAsStringAsync(Logger.LOG_FILE, logLine, {
        encoding: FileSystem.EncodingType.UTF8,
        append: true
      });
      
      // Também imprimir no console para debug imediato
      console.log(`[${level}] ${message}`, data || '');
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }
  }
  
  static async error(message: string, error?: any) {
    await Logger.log('ERROR', message, {
      error: error?.message || error,
      stack: error?.stack
    });
  }
  
  static async info(message: string, data?: any) {
    await Logger.log('INFO', message, data);
  }
  
  static async debug(message: string, data?: any) {
    await Logger.log('DEBUG', message, data);
  }
  
  static async warn(message: string, data?: any) {
    await Logger.log('WARN', message, data);
  }
  
  // Ler logs do arquivo
  static async readLogs(): Promise<string> {
    try {
      const fileExists = await FileSystem.getInfoAsync(Logger.LOG_FILE);
      if (!fileExists.exists) {
        return 'Nenhum log encontrado';
      }
      
      return await FileSystem.readAsStringAsync(Logger.LOG_FILE);
    } catch (error) {
      return `Erro ao ler logs: ${error}`;
    }
  }
  
  // Limpar logs
  static async clearLogs(): Promise<void> {
    try {
      const fileExists = await FileSystem.getInfoAsync(Logger.LOG_FILE);
      if (fileExists.exists) {
        await FileSystem.deleteAsync(Logger.LOG_FILE);
      }
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
    }
  }
  
  // Obter caminho do arquivo de log (para debug)
  static getLogPath(): string {
    return Logger.LOG_FILE;
  }
}
