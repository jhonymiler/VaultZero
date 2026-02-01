import QRCodeLib from 'qrcode'
import {
  VaultZeroConfig,
  LoginSession,
  LoginState,
  RequestedField,
  QRCodeOptions,
  LoginRequest,
  AuthenticatedUser,
  VaultZeroEvent,
  VaultZeroEventListener,
  VaultZeroEventType,
  SDKError,
  ValidationResponse,
  CallbackData
} from './types'
import {
  QRCodeUtils,
  CryptoUtils,
  StorageUtils,
  TimeUtils,
  DataUtils,
  MockSaaSService,
  VAULT_ZERO_CONSTANTS
} from './utils'

export class VaultZeroSDK {
  private config: Required<VaultZeroConfig>
  private eventListeners: Map<VaultZeroEventType, VaultZeroEventListener[]> = new Map()
  private currentSession?: LoginSession
  private sessionTimer?: any // Compatível com navegador e Node.js
  private eventSource?: EventSource // Para SSE

  constructor(config: VaultZeroConfig) {
    this.config = {
      apiBaseUrl: VAULT_ZERO_CONSTANTS.DEFAULT_API_BASE,
      qrCodeExpiration: VAULT_ZERO_CONSTANTS.DEFAULT_QR_EXPIRATION,
      debug: false,
      redirectUrl: '/dashboard',
      ...config
    }

    if (this.config.debug) {
      console.log('[VaultZero SDK] Initialized with config:', this.config)
    }

    // Salvar configuração no storage para persistência
    StorageUtils.setItem('vaultzero_config', {
      apiBaseUrl: this.config.apiBaseUrl,
      qrCodeExpiration: this.config.qrCodeExpiration
    })
  }

  /**
   * Adiciona um listener para eventos do SDK
   */
  on(eventType: VaultZeroEventType, listener: VaultZeroEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  /**
   * Remove um listener de eventos
   */
  off(eventType: VaultZeroEventType, listener: VaultZeroEventListener): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Emite um evento para todos os listeners
   */
  private emit(eventType: VaultZeroEventType, data?: any): void {
    const event: VaultZeroEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    }

    if (this.config.debug) {
      console.log('[VaultZero SDK] Event:', event)
    }

    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('[VaultZero SDK] Error in event listener:', error)
        }
      })
    }
  }

  /**
   * Inicia uma nova sessão de login
   */
  async createLoginSession(request?: LoginRequest): Promise<LoginSession> {
    try {
      const sessionId = QRCodeUtils.generateSessionId()
      const expiresAt = new Date(Date.now() + this.config.qrCodeExpiration * 1000)

      // Campos padrão apenas se não foram especificados
      const defaultFields: RequestedField[] = [
        { name: 'name', required: true, description: 'Nome completo' },
        { name: 'email', required: true, description: 'Email para contato' }
      ]

      const requestedFields = request?.requestedFields || defaultFields

      // Usar o utilitário para criar payload do QR Code
      const qrPayload = QRCodeUtils.createVaultZeroQR({
        sessionId,
        action: VAULT_ZERO_CONSTANTS.ACTIONS.LOGIN,
        callbackUrl: this.config.callbackUrl,
        requestedFields: requestedFields.map(field => ({
          name: field.name,
          displayName: field.description,
          required: field.required,
          helpText: field.placeholder
        })),
        companyName: request?.metadata?.companyName || 'VaultZero App',
        expiresAt
      })

      if (this.config.debug) {
        console.log('[VaultZero SDK] QR Code payload gerado:', JSON.parse(qrPayload))
        console.log('[VaultZero SDK] SessionId gerado:', sessionId)
      }

      // Gerar QR Code com configurações otimizadas para menos pontos
      const qrCodeOptions = {
        width: 300,
        margin: 1, // Margem menor
        scale: 8, // Pontos maiores
        errorCorrectionLevel: 'L' as const, // Menor correção de erro = menos dados
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        },
        ...request?.qrCodeOptions
      }

      const qrCodeUrl = await QRCodeLib.toDataURL(qrPayload, qrCodeOptions)

      const session: LoginSession = {
        sessionId,
        qrCodeData: qrPayload,
        expiresAt,
        isActive: true,
        qrCodeUrl
      }

      this.currentSession = session
      this.startSessionTimer()
      
      // Iniciar conexão SSE para notificações instantâneas
      this.startSSEConnection(sessionId)

      // Salvar sessão no storage
      StorageUtils.setItem('vaultzero_current_session', {
        sessionId,
        expiresAt: expiresAt.toISOString(),
        isActive: true
      })

      this.emit('session_created', { session })
      this.emit('qr_generated', { qrCodeUrl, sessionData: JSON.parse(qrPayload) })

      return session

    } catch (error) {
      const sdkError: SDKError = {
        code: VAULT_ZERO_CONSTANTS.ERROR_CODES.SESSION_EXPIRED,
        message: 'Failed to create login session',
        details: error
      }
      this.emit('authentication_error', sdkError)
      throw sdkError
    }
  }

  /**
   * Inicia o timer de expiração da sessão
   */
  private startSessionTimer(): void {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
    }

    this.sessionTimer = setTimeout(() => {
      if (this.currentSession) {
        this.currentSession.isActive = false
        this.emit('session_expired', { sessionId: this.currentSession.sessionId })
      }
    }, this.config.qrCodeExpiration * 1000)
  }

  /**
   * Inicia a conexão SSE para notificações instantâneas
   */
  private startSSEConnection(sessionId: string): void {
    // Só funciona no browser
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      if (this.config.debug) {
        console.log('[VaultZero SDK] SSE não disponível neste ambiente')
      }
      return
    }

    // Fechar conexão anterior se existir
    if (this.eventSource) {
      this.eventSource.close()
    }

    const sseUrl = `${this.config.apiBaseUrl}/api/auth/events?sessionId=${sessionId}`
    
    if (this.config.debug) {
      console.log('[VaultZero SDK] Conectando SSE para sessionId:', sessionId)
      console.log('[VaultZero SDK] URL SSE:', sseUrl)
    }

    this.eventSource = new EventSource(sseUrl)

    this.eventSource.onopen = () => {
      if (this.config.debug) {
        console.log('[VaultZero SDK] Conexão SSE estabelecida')
      }
    }

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (this.config.debug) {
          console.log('[VaultZero SDK] Evento SSE recebido:', data)
        }

        switch (data.type) {
          case 'authentication_success':
            this.handleSSEAuthSuccess(data.data)
            break
          case 'validation_error':
            this.handleSSEValidationError(data.data)
            break
          case 'access_revoked':
            this.handleSSEAccessRevoked(data.data)
            break
          case 'session_expired':
            this.handleSSESessionExpired(data.data)
            break
          case 'connection_established':
            if (this.config.debug) {
              console.log('[VaultZero SDK] Conexão SSE confirmada para sessão:', data.data.sessionId)
            }
            break
        }
      } catch (error) {
        console.error('[VaultZero SDK] Erro ao processar evento SSE:', error)
      }
    }

    this.eventSource.onerror = (error) => {
      console.error('[VaultZero SDK] Erro na conexão SSE:', error)
      
      // Tentar reconectar após 2 segundos se a sessão ainda estiver ativa
      if (this.currentSession?.isActive) {
        setTimeout(() => {
          if (this.currentSession?.isActive) {
            this.startSSEConnection(sessionId)
          }
        }, 2000)
      }
    }
  }

  /**
   * Manipula o sucesso de autenticação via SSE
   */
  private handleSSEAuthSuccess(data: any): void {
    // Capturar sessionId antes de limpar a sessão
    const sessionId = this.currentSession?.sessionId
    
    if (this.currentSession) {
      this.currentSession.isActive = false
    }

    // Limpar timers e conexão SSE
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
    }
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }

    // Limpar dados de sessão do storage
    StorageUtils.removeItem('vaultzero_current_session')

    this.emit('authentication_success', { 
      userData: data.userData, 
      sessionId: sessionId 
    })

    // Redirecionar se configurado
    if (this.config.redirectUrl && typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = this.config.redirectUrl!
      }, 1000)
    }
  }

  /**
   * Manipula erros de validação via SSE
   */
  private handleSSEValidationError(data: any): void {
    this.emit('authentication_error', {
      code: VAULT_ZERO_CONSTANTS.ERROR_CODES.VALIDATION_ERROR,
      message: 'Dados inválidos. Corrija e tente novamente.',
      errors: data.errors
    })
  }

  /**
   * Manipula expiração de sessão via SSE
   */
  private handleSSESessionExpired(data: any): void {
    if (this.currentSession) {
      this.currentSession.isActive = false
    }
    
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }

    this.emit('session_expired', { sessionId: data.sessionId })
  }

  /**
   * Manipula revogação de acesso via SSE
   */
  private handleSSEAccessRevoked(data: any): void {
    if (this.config.debug) {
      console.log('[VaultZero SDK] Acesso revogado via SSE:', data)
    }

    // Marcar sessão como inativa
    if (this.currentSession) {
      this.currentSession.isActive = false
    }

    // Fechar conexão SSE
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }

    // Limpar dados de sessão do storage
    StorageUtils.removeItem('vaultzero_current_session')
    StorageUtils.removeItem('vaultzero_user')

    // Emitir evento de revogação
    this.emit('access_revoked', { 
      userId: data.userId,
      siteUrl: data.siteUrl,
      message: data.message,
      revokedAt: data.revokedAt
    })

    // Redirecionar para página de login após 2 segundos
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/login?revoked=true'
      }, 2000)
    }
  }

  /**
   * Verifica o status da autenticação
   */
  async checkAuthenticationStatus(sessionId: string): Promise<LoginState> {
    try {
      if (!this.currentSession || this.currentSession.sessionId !== sessionId) {
        return {
          status: 'error',
          error: 'Session not found'
        }
      }

      if (!this.currentSession.isActive || TimeUtils.isExpired(this.currentSession.expiresAt)) {
        return {
          status: 'expired'
        }
      }

      const timeLeft = TimeUtils.secondsUntil(this.currentSession.expiresAt)

      return {
        status: 'waiting',
        session: this.currentSession,
        timeLeft
      }

    } catch (error) {
      return {
        status: 'error',
        error: 'Failed to check authentication status'
      }
    }
  }

  /**
   * Processa um callback de autenticação
   */
  async handleAuthenticationCallback(callbackData: CallbackData): Promise<ValidationResponse> {
    try {
      if (!this.currentSession || this.currentSession.sessionId !== callbackData.sessionId) {
        throw new Error('Invalid session ID')
      }

      if (!this.currentSession.isActive || TimeUtils.isExpired(this.currentSession.expiresAt)) {
        throw new Error('Session expired')
      }

      // Simular validação da empresa usando utilitários mockados
      const validationResult = MockSaaSService.simulateCompanyValidation(callbackData.userData)

      if (validationResult.success) {
        // Marcar sessão como inativa em caso de sucesso
        this.currentSession.isActive = false

        // Limpar timers
        if (this.sessionTimer) {
          clearTimeout(this.sessionTimer)
        }
        // Capturar sessionId antes de limpar
        const sessionId = this.currentSession?.sessionId
        
        // Fechar conexão SSE
        if (this.eventSource) {
          this.eventSource.close()
          this.eventSource = undefined
        }

        // Limpar dados de sessão do storage
        StorageUtils.removeItem('vaultzero_current_session')

        this.emit('authentication_success', { 
          userData: callbackData.userData,
          sessionId: sessionId 
        })

        // Redirecionar se configurado
        if (this.config.redirectUrl && typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = this.config.redirectUrl!
          }, 1000)
        }

        return {
          success: true,
          errors: [],
          allowRetry: false
        }
      } else {
        // Em caso de erro de validação, manter sessão ativa para correção
        this.emit('authentication_error', {
          code: VAULT_ZERO_CONSTANTS.ERROR_CODES.VALIDATION_ERROR,
          message: validationResult.message,
          errors: validationResult.errors
        })

        return {
          success: false,
          errors: (validationResult.errors || []).map(error => ({
            field: error.field,
            code: error.code || 'VALIDATION_ERROR',
            message: error.message,
            value: undefined
          })),
          allowRetry: true
        }
      }

    } catch (error) {
      const sdkError: SDKError = {
        code: VAULT_ZERO_CONSTANTS.ERROR_CODES.AUTHENTICATION_FAILED,
        message: 'Failed to process authentication callback',
        details: error
      }
      this.emit('authentication_error', sdkError)
      
      return {
        success: false,
        errors: [{
          field: 'general',
          code: 'CALLBACK_ERROR',
          message: 'Erro interno do sistema'
        }],
        allowRetry: false
      }
    }
  }

  /**
   * Simula dados de usuário para testes
   */
  getMockUserProfiles() {
    return MockSaaSService.getMockUserProfiles()
  }

  /**
   * Simula empresas que fazem requisições
   */
  getMockCompanyRequests() {
    return MockSaaSService.getMockCompanyRequests()
  }

  /**
   * Recupera sessão do storage se existir
   */
  restoreSession(): LoginSession | null {
    const storedSession = StorageUtils.getItem('vaultzero_current_session')
    if (storedSession && !TimeUtils.isExpired(new Date(storedSession.expiresAt))) {
      // Recriar sessão básica (sem QR Code)
      const session: LoginSession = {
        sessionId: storedSession.sessionId,
        qrCodeData: '',
        expiresAt: new Date(storedSession.expiresAt),
        isActive: storedSession.isActive
      }
      this.currentSession = session
      return session
    }
    return null
  }

  /**
   * Cancela a sessão atual
   */
  cancelSession(): void {
    if (this.currentSession) {
      this.currentSession.isActive = false
    }

    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
    }

    // Fechar conexão SSE
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }

    // Limpar dados do storage
    StorageUtils.removeItem('vaultzero_current_session')

    this.currentSession = undefined
    this.emit('session_expired', { reason: 'cancelled' })
  }

  /**
   * Obtém a sessão atual
   */
  getCurrentSession(): LoginSession | undefined {
    return this.currentSession
  }

  /**
   * Verifica se há uma sessão ativa
   */
  hasActiveSession(): boolean {
    return !!(this.currentSession && this.currentSession.isActive)
  }

  /**
   * Limpa todos os recursos e dados
   */
  dispose(): void {
    this.cancelSession()
    this.eventListeners.clear()
    StorageUtils.clearVaultZeroData()
    
    // Fechar conexão SSE
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = undefined
    }
    
    if (this.config.debug) {
      console.log('[VaultZero SDK] Recursos limpos')
    }
  }

  /**
   * Obtém informações de debug do SDK
   */
  getDebugInfo(): {
    currentSession?: LoginSession
    config: VaultZeroConfig
    hasActiveSession: boolean
    timeLeft?: string
    storageData: any
  } {
    const debugInfo = {
      currentSession: this.currentSession,
      config: this.config,
      hasActiveSession: this.hasActiveSession(),
      timeLeft: this.currentSession ? TimeUtils.formatTimeRemaining(
        TimeUtils.secondsUntil(this.currentSession.expiresAt)
      ) : undefined,
      storageData: {
        config: StorageUtils.getItem('vaultzero_config'),
        session: StorageUtils.getItem('vaultzero_current_session')
      }
    }

    if (this.config.debug) {
      console.log('[VaultZero SDK] Debug Info:', debugInfo)
    }

    return debugInfo
  }
}
