// SDK completamente agnóstico - sem validações específicas

// Interface genérica para dados de usuário
export interface UserData {
  [key: string]: any // Aceita qualquer campo
}

// Interface para dados mockados do SaaS
export interface MockUserProfile {
  id: string
  displayName: string
  data: UserData
  lastUsed: Date
}

// Mock service para simular dados do SaaS - completamente agnóstico
export class MockSaaSService {
  /**
   * Simula diferentes perfis de usuários para testes
   * O sistema agora é agnóstico - pode ter dados de qualquer país/formato
   */
  static getMockUserProfiles(): MockUserProfile[] {
    return [
      {
        id: 'user_001',
        displayName: 'João Silva Santos',
        data: {
          name: 'João Silva Santos',
          email: 'joao.silva@email.com',
          cpf: '123.456.789-01',
          phone: '(11) 99999-8888',
          address: 'Rua das Flores, 123 - São Paulo, SP'
        },
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 dia atrás
      },
      {
        id: 'user_002',
        displayName: 'Maria Oliveira Costa',
        data: {
          name: 'Maria Oliveira Costa',
          email: 'maria.oliveira@email.com',
          cpf: '987.654.321-02',
          phone: '(21) 98888-7777',
          address: 'Av. Copacabana, 456 - Rio de Janeiro, RJ',
          birthDate: '1990-05-15'
        },
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 horas atrás
      },
      {
        id: 'user_003',
        displayName: 'John Smith',
        data: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          ssn: '123-45-6789',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, New York, NY 10001',
          zipCode: '10001'
        },
        lastUsed: new Date(Date.now() - 1000 * 60 * 30) // 30 minutos atrás
      },
      {
        id: 'user_004',
        displayName: 'Pierre Dubois',
        data: {
          name: 'Pierre Dubois',
          email: 'pierre.dubois@email.fr',
          nir: '1 90 05 75 116 001 23', // Número de segurança social francês
          phone: '+33 1 42 86 83 26',
          address: '123 Rue de la Paix, 75001 Paris',
          nationality: 'French'
        },
        lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 6) // 6 horas atrás
      }
    ]
  }

  /**
   * Retorna um perfil aleatório para testes
   */
  static getRandomMockUser(): MockUserProfile {
    const profiles = this.getMockUserProfiles()
    return profiles[Math.floor(Math.random() * profiles.length)]
  }

  /**
   * Simula resposta de validação de uma empresa
   * A empresa pode retornar qualquer tipo de erro para qualquer campo
   */
  static simulateCompanyValidation(userData: UserData): {
    success: boolean
    errors?: Array<{
      field: string
      message: string
      code?: string
    }>
    message: string
  } {
    const scenario = Math.random()
    
    if (scenario < 0.7) {
      // 70% - sucesso
      return {
        success: true,
        message: 'Login aprovado! Redirecionando...'
      }
    } else if (scenario < 0.9) {
      // 20% - erro simples
      const fields = Object.keys(userData)
      const randomField = fields[Math.floor(Math.random() * fields.length)]
      
      return {
        success: false,
        errors: [
          {
            field: randomField,
            message: `${randomField} precisa ser verificado`,
            code: 'VERIFICATION_REQUIRED'
          }
        ],
        message: 'Alguns dados precisam ser corrigidos'
      }
    } else {
      // 10% - múltiplos erros
      return {
        success: false,
        errors: [
          {
            field: 'email',
            message: 'Email em formato não aceito por nossa empresa',
            code: 'INVALID_FORMAT'
          },
          {
            field: 'phone',
            message: 'Telefone é obrigatório para esta operação',
            code: 'REQUIRED'
          }
        ],
        message: 'Múltiplos campos precisam ser corrigidos'
      }
    }
  }

  /**
   * Simula empresas que solicitam dados - exemplo de diferentes tipos de requisições
   */
  static getMockCompanyRequests() {
    return [
      {
        companyName: 'E-commerce Global',
        logo: '🛒',
        description: 'Loja online internacional',
        websiteUrl: 'https://shop.example.com',
        requestedFields: [
          { name: 'name', displayName: 'Nome Completo', required: true, helpText: 'Nome para entrega' },
          { name: 'email', displayName: 'Email', required: true, helpText: 'Email para comunicação' },
          { name: 'phone', displayName: 'Telefone', required: false, helpText: 'Contato opcional' },
          { name: 'address', displayName: 'Endereço', required: true, helpText: 'Endereço de entrega' }
        ]
      },
      {
        companyName: 'Banco Digital Brasil',
        logo: '🏦',
        description: 'Conta digital sem taxas',
        websiteUrl: 'https://banco.example.com.br',
        requestedFields: [
          { name: 'name', displayName: 'Nome Completo', required: true, helpText: 'Nome conforme RG' },
          { name: 'email', displayName: 'Email', required: true, helpText: 'Email principal' },
          { name: 'cpf', displayName: 'CPF', required: true, helpText: 'CPF para abertura da conta' },
          { name: 'phone', displayName: 'Telefone', required: true, helpText: 'Para segurança' },
          { name: 'address', displayName: 'Endereço', required: true, helpText: 'Endereço residencial' }
        ]
      },
      {
        companyName: 'US Tech Company',
        logo: '�🇸',
        description: 'American technology services',
        websiteUrl: 'https://techco.example.com',
        requestedFields: [
          { name: 'name', displayName: 'Full Name', required: true, helpText: 'Legal name' },
          { name: 'email', displayName: 'Email Address', required: true, helpText: 'Primary email' },
          { name: 'ssn', displayName: 'Social Security Number', required: true, helpText: 'For verification' },
          { name: 'phone', displayName: 'Phone Number', required: true, helpText: 'US phone number' },
          { name: 'zipCode', displayName: 'ZIP Code', required: true, helpText: 'Your ZIP code' }
        ]
      },
      {
        companyName: 'Startup Europea',
        logo: '🇪🇺',
        description: 'Service européen innovant',
        websiteUrl: 'https://startup.example.eu',
        requestedFields: [
          { name: 'name', displayName: 'Nom Complet', required: true, helpText: 'Nom légal' },
          { name: 'email', displayName: 'Adresse Email', required: true, helpText: 'Email principal' },
          { name: 'nir', displayName: 'Numéro de Sécurité Sociale', required: false, helpText: 'NIR français (optionnel)' },
          { name: 'phone', displayName: 'Téléphone', required: true, helpText: 'Numéro européen' },
          { name: 'nationality', displayName: 'Nationalité', required: true, helpText: 'Pays de nationalité' }
        ]
      }
    ]
  }
}

// Utilitários para QR Code - genéricos
export class QRCodeUtils {
  /**
   * Gera um ID único para sessão
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Verifica se um QR Code está no formato VaultZero
   */
  static isValidVaultZeroQR(qrData: string): boolean {
    try {
      const data = JSON.parse(qrData)
      return !!(
        data.sessionId &&
        data.action &&
        data.timestamp &&
        data.callbackUrl
      )
    } catch {
      return false
    }
  }

  /**
   * Extrai dados de um QR Code VaultZero
   */
  static parseVaultZeroQR(qrData: string) {
    try {
      const data = JSON.parse(qrData)
      if (!this.isValidVaultZeroQR(qrData)) {
        throw new Error('Invalid VaultZero QR Code format')
      }
      return data
    } catch (error) {
      throw new Error('Failed to parse QR Code: ' + (error as Error).message)
    }
  }

  /**
   * Cria payload do QR Code VaultZero - formato mínimo e otimizado
   */
  static createVaultZeroQR(params: {
    sessionId: string
    action: string
    callbackUrl: string
    requestedFields: Array<{ name: string; displayName?: string; required?: boolean; helpText?: string }>
    companyName: string
    expiresAt?: Date
  }): string {
    // Formato super simplificado - apenas o essencial para o QR Code ser leve e rápido
    const payload = {
      type: 'auth',
      data: {
        siteUrl: new URL(params.callbackUrl).origin, // Apenas o domínio, não a URL completa
        requestId: params.sessionId,
        challenge: params.sessionId.substring(0, 16), // Challenge menor
        requestedFields: params.requestedFields.map(f => f.name) // Apenas os nomes dos campos
        // Removemos companyName, expiresAt e outros metadados do QR
        // Estes serão enviados via API após o login bem-sucedido
      }
    }
    
    return JSON.stringify(payload)
  }
}

// Utilitários de criptografia (placeholder para implementação futura)
export class CryptoUtils {
  /**
   * Gera um hash SHA-256 (placeholder)
   */
  static async generateHash(data: string): Promise<string> {
    // Em uma implementação real, usaria crypto.subtle ou similar
    return btoa(data)
  }

  /**
   * Verifica uma assinatura (placeholder)
   */
  static async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    // Implementação real de verificação de assinatura
    console.log('Verifying signature:', { data, signature, publicKey })
    return true // Placeholder
  }

  /**
   * Gera um token JWT simples (placeholder)
   */
  static generateJWT(payload: any, secret: string): string {
    // Em uma implementação real, usaria uma biblioteca JWT
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payloadStr = btoa(JSON.stringify(payload))
    const signature = btoa(`${header}.${payloadStr}.${secret}`)
    return `${header}.${payloadStr}.${signature}`
  }

  /**
   * Gera ID único
   */
  static generateUniqueId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
  }
}

// Utilitários de storage
export class StorageUtils {
  /**
   * Salva dados no localStorage (se disponível)
   */
  static setItem(key: string, value: any): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
    }
  }

  /**
   * Recupera dados do localStorage
   */
  static getItem<T = any>(key: string): T | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.warn('Failed to read from localStorage:', error)
        return null
      }
    }
    return null
  }

  /**
   * Remove item do localStorage
   */
  static removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(key)
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error)
      }
    }
  }

  /**
   * Limpa todos os dados VaultZero do localStorage
   */
  static clearVaultZeroData(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('vaultzero_')) {
          this.removeItem(key)
        }
      })
    }
  }
}

// Utilitários de tempo
export class TimeUtils {
  /**
   * Formata tempo restante em formato MM:SS
   */
  static formatTimeRemaining(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * Verifica se uma data está expirada
   */
  static isExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate
  }

  /**
   * Calcula segundos até uma data
   */
  static secondsUntil(targetDate: Date): number {
    return Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000))
  }

  /**
   * Formata data para exibição
   */
  static formatDate(date: Date): string {
    return date.toLocaleDateString()
  }

  /**
   * Formata data e hora para exibição
   */
  static formatDateTime(date: Date): string {
    return date.toLocaleString()
  }
}

// Utilitários de dados genéricos
export class DataUtils {
  /**
   * Mascara dados sensíveis para exibição
   */
  static maskSensitiveData(value: string, visibleChars: number = 4): string {
    if (!value || value.length <= visibleChars) return value
    const visible = value.slice(-visibleChars)
    const masked = '*'.repeat(Math.max(0, value.length - visibleChars))
    return masked + visible
  }

  /**
   * Capitaliza primeira letra de cada palavra
   */
  static capitalizeWords(text: string): string {
    return text.replace(/\b\w+/g, word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
  }

  /**
   * Trunca texto com reticências
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
  }

  /**
   * Remove acentos de uma string
   */
  static removeAccents(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  /**
   * Verifica se um campo está vazio
   */
  static isEmpty(value: any): boolean {
    return value === null || value === undefined || 
           (typeof value === 'string' && value.trim() === '') ||
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0)
  }

  /**
   * Sanitiza entrada de usuário removendo caracteres potencialmente perigosos
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>]/g, '')
      .trim()
  }
}

// Constantes genéricas do VaultZero
export const VAULT_ZERO_CONSTANTS = {
  // Tempos padrão
  DEFAULT_QR_EXPIRATION: 300, // 5 minutos
  DEFAULT_SESSION_DURATION: 24 * 60 * 60, // 24 horas
  MAX_QR_EXPIRATION: 30 * 60, // 30 minutos máximo
  
  // URLs
  DEFAULT_API_BASE: 'https://api.vaultzero.com',
  
  // Códigos de erro genéricos
  ERROR_CODES: {
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    INVALID_QR: 'INVALID_QR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    USER_CANCELLED: 'USER_CANCELLED',
    COMPANY_REJECTED: 'COMPANY_REJECTED'
  },

  // Ações disponíveis
  ACTIONS: {
    LOGIN: 'login',
    REGISTER: 'register',
    VERIFY: 'verify',
    UPDATE_PROFILE: 'update_profile'
  },

  // Configurações de UI
  UI: {
    MAX_FIELD_DISPLAY_NAME_LENGTH: 50,
    MAX_HELP_TEXT_LENGTH: 200,
    DEFAULT_AVATAR_SIZE: 40
  }
} as const
