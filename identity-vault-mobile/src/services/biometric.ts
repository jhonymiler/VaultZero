import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BiometricTemplate } from '../types';
import { CryptoService } from './crypto';
import { Logger } from './logger';

export class BiometricService {
  private static readonly BIOMETRIC_KEY = 'biometric_templates';

  // Verificar se biometria está disponível
  static async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  // Obter tipos de biometria disponíveis
  static async getSupportedBiometricTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  // Autenticar com biometria
  static async authenticate(reason: string = 'Confirme sua identidade'): Promise<boolean> {
    await Logger.info('BiometricService.authenticate: Iniciando autenticação biométrica', { reason });
    
    try {
      await Logger.debug('BiometricService.authenticate: Verificando disponibilidade de hardware biométrico');
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        await Logger.error('BiometricService.authenticate: ❌ Hardware biométrico não disponível');
        return false;
      }

      await Logger.debug('BiometricService.authenticate: Verificando se biometria está cadastrada');
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        await Logger.error('BiometricService.authenticate: ❌ Biometria não cadastrada no dispositivo');
        return false;
      }

      await Logger.debug('BiometricService.authenticate: Obtendo tipos de autenticação suportados');
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      await Logger.debug('BiometricService.authenticate: Tipos suportados', { supportedTypes });

      await Logger.debug('BiometricService.authenticate: Solicitando autenticação ao usuário');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar código de acesso',
        disableDeviceFallback: false,
      });

      await Logger.info('BiometricService.authenticate: Resultado da autenticação', {
        success: result.success
      });

      if (result.success) {
        await Logger.info('BiometricService.authenticate: ✅ Autenticação biométrica bem-sucedida');
      } else {
        await Logger.warn('BiometricService.authenticate: ⚠️ Autenticação biométrica falhou');
      }

      return result.success;
    } catch (error) {
      await Logger.error('BiometricService.authenticate: ❌ ERRO durante autenticação biométrica', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        reason
      });
      console.error('Biometric authentication error:', error);
      return false;
    }
  }

  // Registrar template biométrico (simulado)
  static async registerBiometricTemplate(deviceId: string): Promise<BiometricTemplate | null> {
    await Logger.info('BiometricService.registerBiometricTemplate: Iniciando registro de template biométrico', { 
      deviceId: deviceId.substring(0, 10) + '...' 
    });
    
    try {
      await Logger.debug('BiometricService.registerBiometricTemplate: Verificando se biometria está disponível');
      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        await Logger.warn('BiometricService.registerBiometricTemplate: Biometria não disponível no dispositivo');
        return null;
      }

      await Logger.debug('BiometricService.registerBiometricTemplate: Solicitando autenticação biométrica');
      const isAuthenticated = await this.authenticate('Registre sua biometria para autenticação');
      
      if (!isAuthenticated) {
        await Logger.warn('BiometricService.registerBiometricTemplate: Autenticação biométrica falhou ou cancelada');
        return null;
      }
      await Logger.info('BiometricService.registerBiometricTemplate: Autenticação biométrica bem-sucedida');

      await Logger.debug('BiometricService.registerBiometricTemplate: Obtendo tipos de biometria suportados');
      const supportedTypes = await this.getSupportedBiometricTypes();
      const biometricType = supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) 
        ? 'face' 
        : 'fingerprint';
      await Logger.info('BiometricService.registerBiometricTemplate: Tipo de biometria detectado', { biometricType });

      await Logger.debug('BiometricService.registerBiometricTemplate: Gerando template simulado');
      // Gerar template simulado
      const templateData = `biometric_${deviceId}_${Date.now()}_${biometricType}`;
      const encryptedTemplate = await CryptoService.encryptData(templateData, deviceId);

      const template: BiometricTemplate = {
        id: `template_${Date.now()}`,
        template: encryptedTemplate,
        type: biometricType,
        deviceId,
        createdAt: new Date()
      };
      await Logger.info('BiometricService.registerBiometricTemplate: Template biométrico criado', { 
        templateId: template.id,
        type: template.type 
      });

      await Logger.debug('BiometricService.registerBiometricTemplate: Salvando template');
      // Salvar template
      await this.saveBiometricTemplate(template);
      await Logger.info('BiometricService.registerBiometricTemplate: ✅ Template biométrico registrado com sucesso');

      return template;
    } catch (error) {
      await Logger.error('BiometricService.registerBiometricTemplate: ❌ ERRO ao registrar template biométrico', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        deviceId: deviceId.substring(0, 10) + '...'
      });
      console.error('Error registering biometric template:', error);
      return null;
    }
  }

  // Salvar template biométrico
  private static async saveBiometricTemplate(template: BiometricTemplate): Promise<void> {
    try {
      const existingTemplates = await this.loadBiometricTemplates();
      const updatedTemplates = [...existingTemplates, template];
      
      await SecureStore.setItemAsync(
        this.BIOMETRIC_KEY, 
        JSON.stringify(updatedTemplates)
      );
    } catch (error) {
      console.error('Error saving biometric template:', error);
    }
  }

  // Carregar templates biométricos
  static async loadBiometricTemplates(): Promise<BiometricTemplate[]> {
    try {
      const templatesData = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
      if (!templatesData) return [];
      
      return JSON.parse(templatesData) as BiometricTemplate[];
    } catch (error) {
      console.error('Error loading biometric templates:', error);
      return [];
    }
  }

  // Verificar se existe template para o dispositivo
  static async hasTemplateForDevice(deviceId: string): Promise<boolean> {
    const templates = await this.loadBiometricTemplates();
    return templates.some(template => template.deviceId === deviceId);
  }

  // Remover templates biométricos
  static async clearBiometricTemplates(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
    } catch (error) {
      console.error('Error clearing biometric templates:', error);
    }
  }

  // Autenticar usando template específico
  static async authenticateWithTemplate(templateId: string): Promise<boolean> {
    try {
      const templates = await this.loadBiometricTemplates();
      const template = templates.find(t => t.id === templateId);
      
      if (!template) {
        return false;
      }

      const isAuthenticated = await this.authenticate(
        `Autentique com ${template.type === 'face' ? 'reconhecimento facial' : 'impressão digital'}`
      );

      return isAuthenticated;
    } catch (error) {
      console.error('Error authenticating with template:', error);
      return false;
    }
  }

  // Verificar status da segurança do dispositivo
  static async getSecurityLevel(): Promise<LocalAuthentication.SecurityLevel> {
    return await LocalAuthentication.getEnrolledLevelAsync();
  }
}
