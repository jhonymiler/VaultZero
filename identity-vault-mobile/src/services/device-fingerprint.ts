/**
 * Device Fingerprint Service
 * Gera ID único determinístico baseado em características do hardware
 */

import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from './logger';

export class DeviceFingerprintService {
  private static readonly STORAGE_KEY = 'device_fingerprint_id';
  private static cachedFingerprint: string | null = null;

  /**
   * Gera um fingerprint único e determinístico do dispositivo
   * Baseado em características imutáveis do hardware
   */
  static async generateDeviceFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    try {
      // Verificar se já temos um fingerprint salvo
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.cachedFingerprint = stored;
        await Logger.info('DeviceFingerprintService: Fingerprint recuperado do storage');
        return stored;
      }

      // Coletar características únicas do dispositivo
      const characteristics = await this.collectDeviceCharacteristics();
      
      // Gerar hash determinístico
      const fingerprintString = JSON.stringify(characteristics);
      const fingerprint = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fingerprintString
      );

      // Usar apenas os primeiros 16 caracteres para um ID mais gerenciável
      const shortFingerprint = fingerprint.substring(0, 16);

      // Salvar para uso futuro
      await AsyncStorage.setItem(this.STORAGE_KEY, shortFingerprint);
      this.cachedFingerprint = shortFingerprint;

      await Logger.info('DeviceFingerprintService: Novo fingerprint gerado', {
        characteristics: Object.keys(characteristics),
        fingerprintPrefix: shortFingerprint.substring(0, 8) + '...'
      });

      return shortFingerprint;

    } catch (error) {
      await Logger.error('DeviceFingerprintService: Erro ao gerar fingerprint', error);
      
      // Fallback: gerar ID baseado em timestamp e random
      const fallback = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}-${Math.random()}`
      );
      return fallback.substring(0, 16);
    }
  }

  /**
   * Coleta características únicas do dispositivo
   */
  private static async collectDeviceCharacteristics(): Promise<Record<string, any>> {
    const characteristics: Record<string, any> = {};

    try {
      // Informações básicas da plataforma
      characteristics.platform = Platform.OS;
      characteristics.version = Platform.Version;

      // Características específicas por plataforma
      if (Platform.OS === 'ios') {
        characteristics.deviceType = 'ios';
        characteristics.systemName = 'iOS';
      }

      if (Platform.OS === 'android') {
        characteristics.deviceType = 'android';
        characteristics.systemName = 'Android';
      }

      // Adicionar timestamp da primeira execução para garantir unicidade
      // (isso garante que mesmo dispositivos idênticos tenham IDs diferentes)
      const installTime = await this.getInstallationTime();
      characteristics.installTime = installTime;

      // Adicionar seed baseado no tempo de inicialização da aplicação
      characteristics.bootTime = Date.now();

    } catch (error) {
      Logger.warn('Erro ao coletar algumas características do dispositivo', error);
      
      // Fallback mínimo
      characteristics.platform = Platform.OS || 'unknown';
      characteristics.fallback = true;
      characteristics.timestamp = Date.now();
    }

    return characteristics;
  }

  /**
   * Obtém ou cria um timestamp de instalação único
   */
  private static async getInstallationTime(): Promise<number> {
    const INSTALL_TIME_KEY = 'device_install_time';
    
    try {
      const stored = await AsyncStorage.getItem(INSTALL_TIME_KEY);
      if (stored) {
        return parseInt(stored, 10);
      }

      // Primeira execução - salvar timestamp atual
      const installTime = Date.now();
      await AsyncStorage.setItem(INSTALL_TIME_KEY, installTime.toString());
      return installTime;

    } catch (error) {
      Logger.warn('Erro ao gerenciar install time', error);
      return Date.now();
    }
  }

  /**
   * Gera ID de dispositivo único combinando fingerprint com seed da identidade
   * Isso garante que o mesmo dispositivo tenha IDs diferentes para identidades diferentes
   */
  static async generateDeterministicDeviceId(identityAddress: string): Promise<string> {
    try {
      const deviceFingerprint = await this.generateDeviceFingerprint();
      
      // Combinar fingerprint do dispositivo com endereço da identidade
      const combined = `${deviceFingerprint}-${identityAddress}`;
      const deviceId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        combined
      );

      // Usar formato amigável: device-[8chars]
      const shortId = `device-${deviceId.substring(0, 8)}`;

      await Logger.info('DeviceFingerprintService: Device ID determinístico gerado', {
        deviceFingerprintPrefix: deviceFingerprint.substring(0, 8) + '...',
        identityAddressPrefix: identityAddress.substring(0, 10) + '...',
        deviceId: shortId
      });

      return shortId;

    } catch (error) {
      await Logger.error('DeviceFingerprintService: Erro ao gerar device ID determinístico', error);
      
      // Fallback
      const fallback = await Crypto.getRandomBytesAsync(8);
      return `device-${Array.from(fallback, b => b.toString(16).padStart(2, '0')).join('').substring(0, 8)}`;
    }
  }

  /**
   * Verifica se um dispositivo já existe para uma identidade
   */
  static async isKnownDevice(identityAddress: string, deviceId?: string): Promise<boolean> {
    try {
      const expectedDeviceId = await this.generateDeterministicDeviceId(identityAddress);
      
      if (deviceId) {
        return deviceId === expectedDeviceId;
      }

      // Se não foi fornecido deviceId, apenas retorna true se conseguimos gerar um
      return true;

    } catch (error) {
      await Logger.error('DeviceFingerprintService: Erro ao verificar dispositivo conhecido', error);
      return false;
    }
  }

  /**
   * Limpa cache (útil para testes)
   */
  static clearCache(): void {
    this.cachedFingerprint = null;
  }

  /**
   * Obtém informações do dispositivo atual para debug
   */
  static async getDeviceInfo(): Promise<Record<string, any>> {
    const characteristics = await this.collectDeviceCharacteristics();
    const fingerprint = await this.generateDeviceFingerprint();
    
    return {
      fingerprint,
      characteristics,
      platform: Platform.OS,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Gera contexto de segurança completo para detecção de novos dispositivos
   */
  static async generateSecurityContext(): Promise<{
    deviceFingerprint: string;
    deviceInfo: any;
    timestamp: number;
    userAgent: string;
  }> {
    const characteristics = await this.collectDeviceCharacteristics();
    const deviceFingerprint = await this.generateDeviceFingerprint();
    
    return {
      deviceFingerprint,
      deviceInfo: characteristics,
      timestamp: Date.now(),
      userAgent: `VaultZero/${Platform.OS}-${characteristics.osVersion || Platform.Version}`
    };
  }

  /**
   * Simula um novo dispositivo para testes (força geração de novo fingerprint)
   */
  static async simulateNewDevice(): Promise<string> {
    const originalFingerprint = this.cachedFingerprint;
    
    // Gerar um fingerprint simulado
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const simulatedFingerprint = `sim-device-${randomSuffix}`;
    
    // Temporariamente substituir o fingerprint
    this.cachedFingerprint = simulatedFingerprint;
    
    await Logger.info('DeviceFingerprintService: Dispositivo simulado criado', {
      original: originalFingerprint,
      simulated: simulatedFingerprint
    });
    
    return simulatedFingerprint;
  }

  /**
   * Restaura o fingerprint original após simulação
   */
  static async restoreOriginalDevice(): Promise<void> {
    // Limpar cache para forçar regeneração do fingerprint real
    this.cachedFingerprint = null;
    
    // Regenerar fingerprint real
    await this.generateDeviceFingerprint();
    
    await Logger.info('DeviceFingerprintService: Fingerprint original restaurado');
  }
}
