import { BlockchainIdentity, Device, AuthenticationSession } from '../types';
import { CryptoService } from './crypto';
import { BiometricService } from './biometric';
import { P2PService } from './p2p';
import { Logger } from './logger';

export class IdentityService {
  private static instance: IdentityService;
  private currentIdentity: BlockchainIdentity | null = null;
  private p2pService: P2PService;

  constructor() {
    this.p2pService = P2PService.getInstance();
  }

  // Singleton pattern
  static getInstance(): IdentityService {
    if (!IdentityService.instance) {
      IdentityService.instance = new IdentityService();
    }
    return IdentityService.instance;
  }

  // Inicializar serviço
  async initialize(): Promise<void> {
    console.log('🚀 IdentityService.initialize: Inicializando serviços...');
    await this.p2pService.initialize();
    console.log('🚀 IdentityService.initialize: P2P inicializado, carregando identidade...');
    this.currentIdentity = await CryptoService.loadIdentity();
    console.log('🚀 IdentityService.initialize: Identidade carregada:', this.currentIdentity ? 'Existe' : 'Null');
    if (this.currentIdentity) {
      console.log('🚀 IdentityService.initialize: Permissões na identidade:', Object.keys(this.currentIdentity.permissions || {}));
    }
  }

  // Criar nova identidade
  async createIdentity(name: string, deviceName: string): Promise<BlockchainIdentity> {
    await Logger.info('IdentityService.createIdentity: Iniciando criação de identidade', { 
      name, 
      deviceName 
    });
    
    try {
      await Logger.debug('IdentityService.createIdentity: Gerando mnemônico de recuperação');
      // Gerar mnemônico de recuperação primeiro
      const mnemonic = await CryptoService.generateMnemonic();
      await Logger.info('IdentityService.createIdentity: Mnemônico gerado com sucesso');
      
      await Logger.debug('IdentityService.createIdentity: Gerando chaves criptográficas a partir do mnemônico');
      // Gerar chaves criptográficas a partir do mnemônico
      const { address, publicKey, privateKey } = await CryptoService.generateKeyPairFromMnemonic(mnemonic);
      await Logger.info('IdentityService.createIdentity: Chaves criptográficas geradas', {
        addressPrefix: address.substring(0, 10) + '...',
        publicKeyPrefix: publicKey.substring(0, 10) + '...'
      });
      
      await Logger.debug('IdentityService.createIdentity: Gerando ID do dispositivo atual');
      // Gerar ID do dispositivo atual
      const deviceId = await CryptoService.generateDeviceId();
      await Logger.info('IdentityService.createIdentity: ID do dispositivo gerado', {
        deviceIdPrefix: deviceId.substring(0, 10) + '...'
      });
      
      await Logger.debug('IdentityService.createIdentity: Criando objeto de identidade');
      // Criar identidade
      const identity: BlockchainIdentity = {
        address,
        mnemonic,
        derivationPath: "m/44'/60'/0'/0/0",
        publicKey,
        privateKey,
        devices: {
          [deviceId]: {
            name: name || 'Dispositivo Móvel',
            addedAt: new Date(),
            lastSync: new Date(),
            publicKey
          }
        },
        profile: {
          name
        },
        permissions: {}
      };
      await Logger.info('IdentityService.createIdentity: Objeto de identidade criado com sucesso');

      await Logger.debug('IdentityService.createIdentity: Salvando identidade no armazenamento seguro');
      // Salvar identidade
      await CryptoService.saveIdentity(identity);
      await Logger.info('IdentityService.createIdentity: Identidade salva no armazenamento seguro');
      
      this.currentIdentity = identity;
      await Logger.debug('IdentityService.createIdentity: Identidade definida como atual');

      await Logger.debug('IdentityService.createIdentity: Registrando biometria');
      // Registrar biometria
      await BiometricService.registerBiometricTemplate(deviceId);
      await Logger.info('IdentityService.createIdentity: Biometria registrada com sucesso');

      await Logger.debug('IdentityService.createIdentity: Sincronizando com rede P2P');
      // Sincronizar com rede P2P
      await this.p2pService.syncIdentity(identity);
      await Logger.info('IdentityService.createIdentity: Sincronização P2P concluída');

      await Logger.info('IdentityService.createIdentity: ✅ IDENTIDADE CRIADA COM SUCESSO', {
        address: identity.address,
        deviceCount: Object.keys(identity.devices).length
      });

      return identity;
    } catch (error) {
      await Logger.error('IdentityService.createIdentity: ❌ ERRO ao criar identidade', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name,
        deviceName
      });
      console.error('Error creating identity 2:', error);
      throw new Error('Falha ao criar identidade');
    }
  }

  // Restaurar identidade usando mnemônico
  async restoreIdentity(mnemonic: string, name: string, deviceName: string): Promise<BlockchainIdentity> {
    try {
      // Validar mnemônico usando método profissional
      if (!CryptoService.validateMnemonic(mnemonic)) {
        throw new Error('Mnemônico inválido');
      }

      // Derivar chaves a partir do mnemônico usando método profissional
      const { address, publicKey, privateKey } = await CryptoService.generateKeyPairFromMnemonic(mnemonic);
      const deviceId = await CryptoService.generateDeviceId();

      // Criar identidade restaurada
      const identity: BlockchainIdentity = {
        address,
        mnemonic,
        derivationPath: "m/44'/60'/0'/0/0",
        publicKey,
        privateKey,
        devices: {
          [deviceId]: {
            name: deviceName,
            addedAt: new Date(),
            lastSync: new Date(),
            publicKey
          }
        },
        profile: {
          name: name
        },
        permissions: {}
      };

      // Salvar identidade
      await CryptoService.saveIdentity(identity);
      this.currentIdentity = identity;

      // Registrar biometria no novo dispositivo
      await BiometricService.registerBiometricTemplate(deviceId);

      // Sincronizar com rede P2P
      await this.p2pService.syncIdentity(identity);

      return identity;
    } catch (error) {
      console.error('Error restoring identity:', error);
      throw new Error('Falha ao restaurar identidade');
    }
  }

  // Adicionar novo dispositivo via QR Code
  async addDeviceViaQR(qrData: any, deviceName: string): Promise<void> {
    if (!this.currentIdentity) {
      throw new Error('Nenhuma identidade ativa');
    }

    try {
      const deviceId = await CryptoService.generateDeviceId();
      
      // Usar a chave pública da identidade atual para novos dispositivos
      const { publicKey } = await CryptoService.generateKeyPairFromMnemonic(
        this.currentIdentity.mnemonic || ''
      );

      // Adicionar dispositivo à identidade
      this.currentIdentity.devices[deviceId] = {
        name: deviceName,
        addedAt: new Date(),
        lastSync: new Date(),
        publicKey
      };

      // Salvar identidade atualizada
      await CryptoService.saveIdentity(this.currentIdentity);

      // Sincronizar com rede P2P
      await this.p2pService.syncIdentity(this.currentIdentity);
    } catch (error) {
      console.error('Error adding device via QR:', error);
      throw new Error('Falha ao adicionar dispositivo');
    }
  }

  // Autenticar com biometria
  async authenticateWithBiometric(): Promise<boolean> {
    await Logger.info('IdentityService.authenticateWithBiometric: Iniciando autenticação biométrica');
    
    if (!this.currentIdentity) {
      await Logger.error('IdentityService.authenticateWithBiometric: ❌ Nenhuma identidade ativa');
      return false;
    }

    try {
      await Logger.debug('IdentityService.authenticateWithBiometric: Verificando disponibilidade de biometria');
      const isAvailable = await BiometricService.isBiometricAvailable();
      if (!isAvailable) {
        await Logger.error('IdentityService.authenticateWithBiometric: ❌ Biometria não disponível no dispositivo');
        return false;
      }

      const deviceId = Object.keys(this.currentIdentity.devices)[0]; // Primeiro dispositivo
      await Logger.debug('IdentityService.authenticateWithBiometric: Verificando template para dispositivo', {
        deviceIdPrefix: deviceId.substring(0, 10) + '...'
      });
      
      const hasTemplate = await BiometricService.hasTemplateForDevice(deviceId);
      
      if (!hasTemplate) {
        await Logger.warn('IdentityService.authenticateWithBiometric: Template não encontrado, registrando novo');
        // Registrar biometria se não existir
        const template = await BiometricService.registerBiometricTemplate(deviceId);
        if (!template) {
          await Logger.error('IdentityService.authenticateWithBiometric: ❌ Falha ao registrar template biométrico');
          return false;
        }
      }

      await Logger.debug('IdentityService.authenticateWithBiometric: Solicitando autenticação biométrica');
      const result = await BiometricService.authenticate('Confirme sua identidade');
      
      if (result) {
        await Logger.info('IdentityService.authenticateWithBiometric: ✅ Autenticação biométrica bem-sucedida');
      } else {
        await Logger.warn('IdentityService.authenticateWithBiometric: ⚠️ Autenticação biométrica falhou ou cancelada');
      }
      
      return result;
    } catch (error) {
      await Logger.error('IdentityService.authenticateWithBiometric: ❌ ERRO durante autenticação biométrica', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      console.error('Error authenticating with biometric:', error);
      return false;
    }
  }

  // Processar sessão de autenticação de website
  async processAuthenticationSession(sessionData: AuthenticationSession): Promise<boolean> {
    if (!this.currentIdentity) {
      return false;
    }

    try {
      // Autenticar com biometria
      const isAuthenticated = await this.authenticateWithBiometric();
      if (!isAuthenticated) {
        return false;
      }

      // Assinar challenge
      const signature = await CryptoService.signData(
        sessionData.challenge,
        this.currentIdentity.privateKey || ''
      );

      // Aqui seria feita a comunicação com o site/servidor
      console.log('Authentication successful for:', sessionData.siteUrl);
      console.log('Signature:', signature);

      return true;
    } catch (error) {
      console.error('Error processing authentication session:', error);
      return false;
    }
  }

  // Obter identidade atual
  getCurrentIdentity(): BlockchainIdentity | null {
    return this.currentIdentity;
  }

  // Verificar se existe identidade
  hasIdentity(): boolean {
    return this.currentIdentity !== null;
  }

  // Obter dispositivos
  getDevices(): Device[] {
    if (!this.currentIdentity) return [];

    return Object.entries(this.currentIdentity.devices).map(([id, device]) => ({
      id,
      name: device.name,
      type: 'mobile', // Por padrão mobile no app
      addedAt: device.addedAt,
      lastSync: device.lastSync,
      publicKey: device.publicKey,
      isCurrentDevice: true // Primeiro dispositivo é atual
    }));
  }

  // Atualizar perfil
  async updateProfile(profileData: Partial<BlockchainIdentity['profile']>): Promise<void> {
    if (!this.currentIdentity) {
      throw new Error('Nenhuma identidade ativa');
    }

    this.currentIdentity.profile = {
      ...this.currentIdentity.profile,
      ...profileData
    };

    await CryptoService.saveIdentity(this.currentIdentity);
    await this.p2pService.syncIdentity(this.currentIdentity);
  }

  // Limpar identidade (logout/reset)
  async clearIdentity(): Promise<void> {
    await CryptoService.clearIdentity();
    await BiometricService.clearBiometricTemplates();
    this.currentIdentity = null;
  }

  // Obter mnemônico (para backup)
  getMnemonic(): string | null {
    return this.currentIdentity?.mnemonic || null;
  }

  // Autorizar website com campos selecionados
  async authorizeWebsite(
    siteUrl: string, 
    requestId: string, 
    challenge: string, 
    selectedFields: string[], 
    userData: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    await Logger.info('IdentityService.authorizeWebsite: Iniciando autorização de website', {
      siteUrl,
      requestId,
      selectedFields
    });

    if (!this.currentIdentity) {
      await Logger.error('IdentityService.authorizeWebsite: ❌ Nenhuma identidade ativa');
      return { success: false, error: 'Nenhuma identidade ativa' };
    }

    try {
      await Logger.debug('IdentityService.authorizeWebsite: Preparando dados de autorização');
      
      // Preparar dados para envio
      const sharedData: Record<string, any> = {};
      selectedFields.forEach(field => {
        if (userData[field] !== undefined) {
          sharedData[field] = userData[field];
        }
      });

      await Logger.info('IdentityService.authorizeWebsite: Dados preparados para envio', {
        selectedFields,
        userData,
        sharedData
      });

      await Logger.debug('IdentityService.authorizeWebsite: Assinando challenge');
      
      // Assinar challenge
      const signature = await CryptoService.signData(challenge, this.currentIdentity.privateKey || '');
      
      const authResponse = {
        sessionId: requestId,  // Mudança de requestId para sessionId
        userData: sharedData,
        signature,
        timestamp: Date.now()
      };

      await Logger.debug('IdentityService.authorizeWebsite: Enviando resposta de autorização para o website');

      // Enviar resposta para o website
      const callbackUrl = `${siteUrl}/api/auth/callback`;
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authResponse)
      });

      if (!response.ok) {
        const errorText = await response.text();
        await Logger.error('IdentityService.authorizeWebsite: ❌ Resposta de erro do website', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        return { success: false, error: `Erro do servidor: ${response.status}` };
      }

      await Logger.debug('IdentityService.authorizeWebsite: Salvando permissão concedida');

      // Salvar permissão concedida
      if (!this.currentIdentity.permissions) {
        this.currentIdentity.permissions = {};
      }

      const newPermission = {
        grantedAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        allowedFields: selectedFields,
        autoLogin: false,
        siteMetadata: {
          siteName: siteUrl
        }
      };

      this.currentIdentity.permissions[siteUrl] = newPermission;
      console.log('💾 Salvando nova permissão:', { siteUrl, newPermission });
      console.log('💾 Total de permissões após adição:', Object.keys(this.currentIdentity.permissions).length);

      await CryptoService.saveIdentity(this.currentIdentity);
      await this.p2pService.syncIdentity(this.currentIdentity);
      
      // Recarregar identidade para garantir que as permissões estejam atualizadas
      await this.reloadIdentity();

      await Logger.info('IdentityService.authorizeWebsite: ✅ Autorização de website concluída com sucesso');

      return { success: true };
    } catch (error) {
      await Logger.error('IdentityService.authorizeWebsite: ❌ ERRO durante autorização de website', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        siteUrl,
        requestId
      });
      console.error('Error authorizing website:', error);
      return { success: false, error: 'Falha na comunicação com o website' };
    }
  }

  // Obter endereço blockchain
  getAddress(): string | null {
    return this.currentIdentity?.address || null;
  }

  // Obter status de sincronização P2P
  getSyncStatus() {
    return this.p2pService.getSyncStatus();
  }

  // Obter permissões do usuário
  getPermissions() {
    console.log('📋 IdentityService.getPermissions: Buscando permissões...');
    
    if (!this.currentIdentity) {
      console.log('❌ IdentityService.getPermissions: Identidade não carregada');
      return [];
    }
    
    const permissions = this.currentIdentity.permissions || {};
    console.log('📋 IdentityService.getPermissions: Permissões brutas:', permissions);
    
    const formattedPermissions = Object.entries(permissions).map(([siteUrl, permission]) => ({
      siteUrl,
      ...permission,
      fields: permission.allowedFields || permission.fields || []
    }));
    
    console.log('📋 IdentityService.getPermissions: Permissões formatadas:', formattedPermissions);
    return formattedPermissions;
  }

  // Recarregar identidade do armazenamento
  async reloadIdentity(): Promise<void> {
    console.log('🔄 IdentityService.reloadIdentity: Recarregando identidade do armazenamento...');
    this.currentIdentity = await CryptoService.loadIdentity();
    console.log('🔄 IdentityService.reloadIdentity: Identidade recarregada:', this.currentIdentity ? 'Existe' : 'Null');
    if (this.currentIdentity) {
      console.log('🔄 IdentityService.reloadIdentity: Permissões na identidade recarregada:', Object.keys(this.currentIdentity.permissions || {}));
    }
  }

  // Remover dispositivo
  async removeDevice(deviceId: string): Promise<boolean> {
    try {
      if (!this.currentIdentity) return false;
      
      if (this.currentIdentity.devices[deviceId]) {
        delete this.currentIdentity.devices[deviceId];
        await CryptoService.saveIdentity(this.currentIdentity);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao remover dispositivo:', error);
      return false;
    }
  }

  // Revogar permissão
  async revokePermission(siteUrl: string): Promise<boolean> {
    await Logger.info('IdentityService.revokePermission: Iniciando revogação de permissão', { siteUrl });
    
    try {
      if (!this.currentIdentity) {
        await Logger.error('IdentityService.revokePermission: ❌ Nenhuma identidade ativa');
        return false;
      }
      
      await Logger.debug('IdentityService.revokePermission: Verificando se permissão existe');
      if (this.currentIdentity.permissions[siteUrl]) {
        await Logger.debug('IdentityService.revokePermission: Removendo permissão do armazenamento local');
        delete this.currentIdentity.permissions[siteUrl];
        
        await Logger.debug('IdentityService.revokePermission: Salvando identidade atualizada');
        await CryptoService.saveIdentity(this.currentIdentity);
        
        await Logger.debug('IdentityService.revokePermission: Notificando backend sobre revogação');
        // Notificar o backend sobre a revogação
        await this.notifyRevocation(siteUrl);
        
        await Logger.info('IdentityService.revokePermission: ✅ Permissão revogada com sucesso');
        return true;
      }
      
      await Logger.warn('IdentityService.revokePermission: ⚠️ Permissão não encontrada para este site');
      return false;
    } catch (error) {
      await Logger.error('IdentityService.revokePermission: ❌ ERRO ao revogar permissão', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        siteUrl
      });
      console.error('Erro ao revogar permissão:', error);
      return false;
    }
  }

  // Notificar backend sobre revogação de acesso
  private async notifyRevocation(siteUrl: string): Promise<void> {
    try {
      if (!this.currentIdentity) return;

      const dataToSign = JSON.stringify({
        action: 'revoke_access',
        userId: this.currentIdentity.address,
        siteUrl: siteUrl,
        timestamp: Date.now()
      });

      const signature = this.currentIdentity.privateKey 
        ? await CryptoService.signData(dataToSign, this.currentIdentity.privateKey)
        : 'mock_signature';

      const revocationData = {
        userId: this.currentIdentity.address,
        siteUrl: siteUrl,
        signature: signature,
        timestamp: Date.now()
      };

      console.log('🚫 Enviando notificação de revogação para:', siteUrl);

      // Extrair URL base do siteUrl para enviar a notificação
      const url = new URL(siteUrl);
      const revokeEndpoint = `${url.protocol}//${url.host}/api/auth/revoke`;

      const response = await fetch(revokeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(revocationData)
      });

      if (response.ok) {
        console.log('✅ Revogação notificada com sucesso');
      } else {
        console.warn('⚠️ Falha ao notificar revogação:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao notificar revogação:', error);
    }
  }

  // Obter dados do usuário para um campo específico (com mapeamento inteligente)
  getUserFieldValue(fieldName: string): string | null {
    if (!this.currentIdentity?.profile) return null;
    
    // Mapeamento de campos comuns para diferentes formatos
    const fieldMappings: Record<string, string[]> = {
      'name': ['name', 'fullName', 'nome', 'nomeCompleto', 'displayName'],
      'email': ['email', 'emailAddress', 'mail', 'e-mail'],
      'phone': ['phone', 'phoneNumber', 'telefone', 'celular', 'mobile'],
      'cpf': ['cpf', 'ssn', 'taxId', 'documentNumber', 'documento'],
      'address': ['address', 'endereco', 'fullAddress', 'enderecoCompleto'],
      'birthDate': ['birthDate', 'dateOfBirth', 'dataNascimento', 'birthday'],
      'gender': ['gender', 'sexo', 'genero'],
      'occupation': ['occupation', 'profissao', 'job', 'trabalho']
    };

    // Buscar diretamente primeiro
    if (this.currentIdentity.profile[fieldName]) {
      return this.currentIdentity.profile[fieldName] || null;
    }

    // Buscar por mapeamentos
    for (const [standardField, variants] of Object.entries(fieldMappings)) {
      if (variants.includes(fieldName.toLowerCase())) {
        for (const variant of variants) {
          if (this.currentIdentity.profile[variant]) {
            return this.currentIdentity.profile[variant] || null;
          }
        }
      }
    }

    return null;
  }

  // Verificar se um campo existe no perfil
  hasField(fieldName: string): boolean {
    return this.getUserFieldValue(fieldName) !== null;
  }

  // Atualizar campo específico dinamicamente
  async updateField(fieldName: string, value: string): Promise<void> {
    if (!this.currentIdentity) {
      throw new Error('Nenhuma identidade ativa');
    }

    this.currentIdentity.profile = {
      ...this.currentIdentity.profile,
      [fieldName]: value
    };

    await CryptoService.saveIdentity(this.currentIdentity);
    await this.p2pService.syncIdentity(this.currentIdentity);
  }

  // Obter lista de sites logados sem duplicatas
  getLoggedSites(): Array<{
    siteUrl: string;
    grantedAt: string;
    lastUsed: string;
    fields: string[];
    siteName?: string;
    isActive?: boolean;
  }> {
    if (!this.currentIdentity) {
      return [];
    }

    const loggedSites = Object.entries(this.currentIdentity.permissions).map(([siteUrl, permission]) => ({
      siteUrl,
      grantedAt: permission.grantedAt,
      lastUsed: permission.lastUsed || permission.grantedAt,
      fields: permission.allowedFields || permission.fields || [],
      siteName: permission.siteMetadata?.siteName,
      isActive: true
    }));

    // Remover duplicatas baseado na URL do site
    const uniqueSites = loggedSites.reduce((acc, current) => {
      const existing = acc.find(site => site.siteUrl === current.siteUrl);
      if (!existing) {
        acc.push(current);
      } else {
        // Manter o registro com a data mais recente
        if (new Date(current.lastUsed) > new Date(existing.lastUsed)) {
          const index = acc.indexOf(existing);
          acc[index] = current;
        }
      }
      return acc;
    }, [] as typeof loggedSites);

    // Ordenar por último uso (mais recente primeiro)
    return uniqueSites.sort((a, b) => 
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    );
  }

  // Assinar dados (simplificado para demonstração)
  private async signData(data: any): Promise<string> {
    if (!this.currentIdentity?.privateKey) {
      throw new Error('Chave privada não disponível');
    }

    // Em produção, use uma biblioteca de criptografia adequada
    const dataString = JSON.stringify(data);
    const signature = await CryptoService.sign(dataString, this.currentIdentity.privateKey);
    return signature;
  }
}
