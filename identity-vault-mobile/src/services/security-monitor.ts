/**
 * Security Monitor Service
 * Monitora atividades de segurança, detecta novos dispositivos e gerencia quarentena
 */

import { Device, SecurityEvent } from '../types';
import { Logger } from './logger';
import { P2PService } from './p2p';
import { DeviceFingerprintService } from './device-fingerprint';
import { NotificationService } from './notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class SecurityMonitorService {
  private static instance: SecurityMonitorService;
  private securityEvents: SecurityEvent[] = [];
  private quarantinePeriod = 24 * 60 * 60 * 1000; // 24 horas
  private readonly EVENTS_STORAGE_KEY = 'security_events';

  static getInstance(): SecurityMonitorService {
    if (!SecurityMonitorService.instance) {
      SecurityMonitorService.instance = new SecurityMonitorService();
    }
    return SecurityMonitorService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadStoredEvents();
    await Logger.info('SecurityMonitorService: Serviço inicializado');
  }

  /**
   * Detecta se este é um novo dispositivo tentando recuperar identidade
   */
  async detectNewDeviceRecovery(recoveryAttempt: {
    mnemonicHash: string;
    identityAddress: string;
  }): Promise<{
    isNewDevice: boolean;
    shouldQuarantine: boolean;
    existingDevices: Device[];
  }> {
    try {
      const deviceFingerprint = await DeviceFingerprintService.generateDeviceFingerprint();
      const p2pService = P2PService.getInstance();
      
      // Buscar dispositivos existentes na DHT
      const existingDevicesKey = `identity-devices:${recoveryAttempt.identityAddress}`;
      const existingDevicesData = await p2pService.dhtGet(existingDevicesKey);
      
      const existingDevices: Device[] = existingDevicesData?.devices || [];
      
      // Verificar se este dispositivo já existe
      const isNewDevice = !existingDevices.some(device => device.id === deviceFingerprint);
      
      // Determinar se deve entrar em quarentena
      const shouldQuarantine = isNewDevice && existingDevices.length > 0;
      
      await Logger.info('SecurityMonitorService: Detecção de novo dispositivo', {
        isNewDevice,
        shouldQuarantine,
        existingDevicesCount: existingDevices.length,
        deviceFingerprint
      });

      return {
        isNewDevice,
        shouldQuarantine,
        existingDevices
      };
    } catch (error) {
      await Logger.error('SecurityMonitorService: Erro na detecção de novo dispositivo', error);
      return {
        isNewDevice: true,
        shouldQuarantine: true,
        existingDevices: []
      };
    }
  }

  /**
   * Registra um novo dispositivo no sistema
   */
  async registerNewDevice(identityAddress: string, approve: boolean = false): Promise<Device> {
    const deviceFingerprint = await DeviceFingerprintService.generateDeviceFingerprint();
    const deviceInfo = await DeviceFingerprintService.getDeviceInfo();
    
    const newDevice: Device = {
      id: deviceFingerprint,
      name: deviceInfo.deviceName || 'Dispositivo Desconhecido',
      type: 'mobile',
      os: deviceInfo.osName,
      addedAt: new Date(),
      lastSync: new Date(),
      publicKey: '', // TODO: Implementar geração de chave pública
      trustLevel: approve ? 'verified' : 'quarantine',
      quarantineUntil: approve ? undefined : new Date(Date.now() + this.quarantinePeriod)
    };

    // Enviar notificação sobre novo dispositivo
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.notifyNewDevice(newDevice);
      
      // Se dispositivo está em quarentena, agendar lembrete
      if (newDevice.trustLevel === 'quarantine') {
        // Criar evento de segurança para quarentena
        await notificationService.notifySecurityEvent({
          id: `quarantine-${newDevice.id}`,
          type: 'device_added',
          deviceId: newDevice.id,
          timestamp: new Date(),
          details: { identityAddress: identityAddress, isQuarantine: true },
          resolved: false
        });
      }
    } catch (error) {
      await Logger.warn('Erro ao enviar notificação de novo dispositivo:', error);
    }

    // Log do evento
    await this.logSecurityEvent({
      type: 'device_added',
      deviceId: newDevice.id,
      details: { 
        identityAddress,
        trustLevel: newDevice.trustLevel,
        deviceInfo 
      }
    });

    // Salvar na DHT
    await this.saveDeviceToIdentity(identityAddress, newDevice);

    return newDevice;
  }

  /**
   * Aprova um dispositivo em quarentena
   */
  async approveDevice(identityAddress: string, deviceId: string, approverDeviceId: string): Promise<void> {
    try {
      const p2pService = P2PService.getInstance();
      const devicesKey = `identity-devices:${identityAddress}`;
      const existingData = await p2pService.dhtGet(devicesKey);
      
      if (existingData && existingData.devices) {
        const devices: Device[] = existingData.devices;
        const deviceIndex = devices.findIndex(d => d.id === deviceId);
        
        if (deviceIndex !== -1) {
          devices[deviceIndex].trustLevel = 'verified';
          devices[deviceIndex].quarantineUntil = undefined;
          devices[deviceIndex].approvedBy = approverDeviceId;
          
          await p2pService.dhtPut(devicesKey, { devices });
          
          // Notificar aprovação
          try {
            const notificationService = NotificationService.getInstance();
            await notificationService.notifyDeviceApproved(devices[deviceIndex]);
          } catch (error) {
            await Logger.warn('Erro ao enviar notificação de aprovação:', error);
          }

          await this.logSecurityEvent({
            type: 'device_approved',
            deviceId,
            details: { 
              identityAddress,
              approverDeviceId 
            }
          });

          await Logger.info('SecurityMonitorService: Dispositivo aprovado', { deviceId, approverDeviceId });
        }
      }
    } catch (error) {
      await Logger.error('SecurityMonitorService: Erro ao aprovar dispositivo', error);
      throw error;
    }
  }

  /**
   * Verifica se um dispositivo está em quarentena
   */
  isDeviceInQuarantine(device: Device): boolean {
    if (device.trustLevel !== 'quarantine') return false;
    if (!device.quarantineUntil) return false;
    
    return new Date() < device.quarantineUntil;
  }

  /**
   * Obtém dispositivos em quarentena para uma identidade
   */
  async getQuarantinedDevices(identityAddress: string): Promise<Device[]> {
    try {
      const p2pService = P2PService.getInstance();
      const devicesKey = `identity-devices:${identityAddress}`;
      const existingData = await p2pService.dhtGet(devicesKey);
      
      if (!existingData || !existingData.devices) return [];
      
      return existingData.devices.filter((device: Device) => this.isDeviceInQuarantine(device));
    } catch (error) {
      await Logger.error('SecurityMonitorService: Erro ao obter dispositivos em quarentena', error);
      return [];
    }
  }

  /**
   * Simula a recuperação de identidade em novo dispositivo (para testes)
   */
  async simulateNewDeviceRecovery(identityAddress: string): Promise<{
    simulatedDeviceId: string;
    securityResult: {
      isNewDevice: boolean;
      shouldQuarantine: boolean;
      existingDevices: Device[];
    };
  }> {
    // Simular novo dispositivo
    const originalFingerprint = await DeviceFingerprintService.generateDeviceFingerprint();
    const simulatedDeviceId = await DeviceFingerprintService.simulateNewDevice();
    
    // Detectar como novo dispositivo
    const securityResult = await this.detectNewDeviceRecovery({
      mnemonicHash: 'test-hash',
      identityAddress
    });
    
    await Logger.info('SecurityMonitorService: Simulação de novo dispositivo', {
      originalFingerprint,
      simulatedDeviceId,
      securityResult
    });

    return {
      simulatedDeviceId,
      securityResult
    };
  }

  /**
   * Notifica dispositivos existentes sobre eventos de segurança
   */
  private async notifyExistingDevices(devices: Device[], notification: any): Promise<void> {
    // Implementação de notificação P2P entre dispositivos
    try {
      const p2pService = P2PService.getInstance();
      
      for (const device of devices) {
        if (device.trustLevel === 'verified') {
          const notificationKey = `device-notification:${device.id}:${Date.now()}`;
          await p2pService.dhtPut(notificationKey, notification);
        }
      }
    } catch (error) {
      await Logger.warn('SecurityMonitorService: Erro ao notificar dispositivos', error);
    }
  }

  /**
   * Salva dispositivo na identidade na DHT
   */
  private async saveDeviceToIdentity(identityAddress: string, device: Device): Promise<void> {
    try {
      const p2pService = P2PService.getInstance();
      const devicesKey = `identity-devices:${identityAddress}`;
      const existingData = await p2pService.dhtGet(devicesKey);
      
      const devices = existingData?.devices || [];
      devices.push(device);
      
      await p2pService.dhtPut(devicesKey, { devices });
      await Logger.info('SecurityMonitorService: Dispositivo salvo na DHT', { deviceId: device.id });
    } catch (error) {
      await Logger.error('SecurityMonitorService: Erro ao salvar dispositivo na DHT', error);
    }
  }

  /**
   * Registra evento de segurança
   */
  private async logSecurityEvent(eventData: {
    type: SecurityEvent['type'];
    deviceId: string;
    details: any;
  }): Promise<void> {
    const securityEvent: SecurityEvent = {
      id: `${eventData.type}-${eventData.deviceId}-${Date.now()}`,
      type: eventData.type,
      deviceId: eventData.deviceId,
      timestamp: new Date(),
      details: eventData.details,
      resolved: false
    };

    this.securityEvents.unshift(securityEvent);
    
    // Manter apenas os últimos 100 eventos
    if (this.securityEvents.length > 100) {
      this.securityEvents = this.securityEvents.slice(0, 100);
    }
    
    await this.saveEventsToStorage();
    
    // Notificar sobre evento crítico
    if (eventData.type === 'suspicious_activity') {
      try {
        const notificationService = NotificationService.getInstance();
        await notificationService.notifySecurityEvent(securityEvent);
      } catch (error) {
        await Logger.warn('Erro ao enviar notificação de evento de segurança:', error);
      }
    }

    await Logger.info('SecurityMonitorService: Evento de segurança registrado', securityEvent);
  }

  /**
   * Obtém eventos de segurança recentes
   */
  getRecentSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents].slice(0, 20);
  }

  /**
   * Carrega eventos armazenados
   */
  private async loadStoredEvents(): Promise<void> {
    try {
      const storedEvents = await AsyncStorage.getItem(this.EVENTS_STORAGE_KEY);
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        this.securityEvents = events.map((event: any) => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
      }
    } catch (error) {
      await Logger.warn('SecurityMonitorService: Erro ao carregar eventos armazenados', error);
    }
  }

  /**
   * Salva eventos no armazenamento
   */
  private async saveEventsToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.EVENTS_STORAGE_KEY, JSON.stringify(this.securityEvents));
    } catch (error) {
      await Logger.warn('SecurityMonitorService: Erro ao salvar eventos', error);
    }
  }

  /**
   * Limpa todos os eventos de segurança
   */
  async clearEvents(): Promise<void> {
    this.securityEvents = [];
    await AsyncStorage.removeItem(this.EVENTS_STORAGE_KEY);
    await Logger.info('SecurityMonitorService: Eventos de segurança limpos');
  }
}

export default SecurityMonitorService;
