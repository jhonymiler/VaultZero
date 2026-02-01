import { Alert } from 'react-native';
import { Device, SecurityEvent } from '../types';

/**
 * Serviço de Notificações Locais para Sistema de Segurança
 * 
 * Responsável por:
 * - Configurar permissões de notificação
 * - Enviar alertas sobre novos dispositivos
 * - Notificar sobre eventos de segurança
 * - Gerenciar quarentena e aprovações
 * 
 * NOTA: Versão simplificada usando Alert para compatibilidade
 */

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Inicializa o serviço de notificações
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.isInitialized = true;
      console.log('📱 NotificationService inicializado (modo simplificado)');
    } catch (error) {
      console.error('❌ Erro ao inicializar NotificationService:', error);
      throw error;
    }
  }

  /**
   * Verifica o status das permissões
   */
  async getPermissionStatus(): Promise<string> {
    return 'granted'; // Simulado para Alert
  }

  /**
   * Notifica sobre novo dispositivo detectado
   */
  async notifyNewDevice(device: Device): Promise<void> {
    try {
      await this.initialize();

      Alert.alert(
        '🔒 VaultZero - Novo Dispositivo Detectado',
        `Um novo dispositivo tentou acessar sua identidade: ${device.name || 'Dispositivo Desconhecido'}`,
        [{ text: 'OK', style: 'default' }]
      );

      console.log('📱 Notificação de novo dispositivo enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de novo dispositivo:', error);
    }
  }

  /**
   * Notifica sobre dispositivo aprovado
   */
  async notifyDeviceApproved(device: Device): Promise<void> {
    try {
      await this.initialize();

      Alert.alert(
        '✅ VaultZero - Dispositivo Aprovado',
        `O dispositivo "${device.name}" foi aprovado e já pode acessar sua identidade.`,
        [{ text: 'OK', style: 'default' }]
      );

      console.log('📱 Notificação de dispositivo aprovado enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de aprovação:', error);
    }
  }

  /**
   * Notifica sobre evento de segurança
   */
  async notifySecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await this.initialize();

      let title = '🛡️ VaultZero - Evento de Segurança';
      let body = 'Um evento de segurança foi registrado.';

      switch (event.type) {
        case 'recovery_attempted':
          title = '🔄 Tentativa de Recuperação';
          body = 'Alguém tentou recuperar sua identidade usando as palavras-chave.';
          break;
        case 'suspicious_activity':
          title = '⚠️ Atividade Suspeita';
          body = 'Atividade suspeita detectada em sua conta.';
          break;
        case 'device_added':
          title = '📱 Novo Dispositivo';
          body = 'Um novo dispositivo foi adicionado à sua conta.';
          break;
      }

      Alert.alert(title, body, [{ text: 'OK', style: 'default' }]);

      console.log(`📱 Notificação de evento de segurança enviada: ${event.type}`);
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de evento:', error);
    }
  }

  /**
   * Notifica sobre dispositivo em quarentena
   */
  async notifyQuarantineExpired(device: Device): Promise<void> {
    try {
      await this.initialize();

      const title = '⏰ Quarentena Finalizada';
      const message = `O dispositivo "${device.name}" saiu da quarentena automaticamente após 24h.`;

      Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);

      console.log('📱 Notificação de quarentena expirada enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de quarentena:', error);
    }
  }

  /**
   * Envia uma notificação de teste
   */
  async sendTestNotification(): Promise<void> {
    try {
      await this.initialize();

      Alert.alert(
        '🧪 VaultZero - Teste de Notificação',
        'Esta é uma notificação de teste para verificar se o sistema está funcionando.',
        [{ text: 'OK', style: 'default' }]
      );

      console.log('📱 Notificação de teste enviada');
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de teste:', error);
    }
  }

  /**
   * Limpa todas as notificações
   */
  async clearAllNotifications(): Promise<void> {
    try {
      console.log('🧹 Simulando limpeza de notificações');
      Alert.alert(
        '🧹 Notificações Limpas',
        'Todas as notificações foram removidas.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
    }
  }
}

export default NotificationService;