// Tipos base do SDK
export interface VaultZeroConfig {
  /** URL base da API VaultZero (opcional, usa padrão se não fornecido) */
  apiBaseUrl?: string
  /** URL de callback após autenticação bem-sucedida */
  callbackUrl: string
  /** URL de redirecionamento após login (opcional) */
  redirectUrl?: string
  /** Tempo de expiração do QR Code em segundos (padrão: 300) */
  qrCodeExpiration?: number
  /** Modo de desenvolvimento (ativa logs extras) */
  debug?: boolean
}

export interface RequestedField {
  /** Nome do campo */
  name: string
  /** Se o campo é obrigatório */
  required?: boolean
  /** Descrição do campo (aparece no app) */
  description?: string
  /** Tipo de entrada (para UI hints) */
  inputType?: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'multiline'
  /** Opções para campos do tipo select */
  options?: string[]
  /** Placeholder para o campo */
  placeholder?: string
}

export interface LoginSession {
  /** ID único da sessão */
  sessionId: string
  /** Dados do QR Code em formato JSON */
  qrCodeData: string
  /** Data de expiração da sessão */
  expiresAt: Date
  /** Se a sessão está ativa */
  isActive: boolean
  /** URL do QR Code como data URL */
  qrCodeUrl?: string
}

export interface AuthenticatedUser {
  /** ID único do usuário */
  userId: string
  /** Dados do usuário - campos livres */
  [key: string]: any
}

export interface LoginState {
  /** Status atual do login */
  status: 'idle' | 'waiting' | 'scanning' | 'authenticating' | 'success' | 'error' | 'expired'
  /** Sessão de login atual */
  session?: LoginSession
  /** Dados do usuário autenticado */
  user?: AuthenticatedUser
  /** Mensagem de erro (se houver) */
  error?: string
  /** Tempo restante em segundos */
  timeLeft?: number
}

export interface QRCodeOptions {
  /** Largura do QR Code (padrão: 300) */
  width?: number
  /** Margem do QR Code (padrão: 2) */
  margin?: number
  /** Cores do QR Code */
  color?: {
    dark?: string
    light?: string
  }
}

export interface LoginRequest {
  /** Campos a serem solicitados do usuário */
  requestedFields?: RequestedField[]
  /** Configurações do QR Code */
  qrCodeOptions?: QRCodeOptions
  /** Dados extras a serem incluídos na requisição */
  metadata?: Record<string, any>
}

export interface CallbackData {
  /** ID da sessão */
  sessionId: string
  /** Dados do usuário - campos livres definidos pela empresa */
  userData: Record<string, any>
  /** Assinatura criptográfica (opcional) */
  signature?: string
  /** Timestamp do callback */
  timestamp: number
}

export interface ValidationError {
  /** Nome do campo com erro */
  field: string
  /** Código do erro */
  code: string
  /** Mensagem de erro legível */
  message: string
  /** Valor que causou o erro */
  value?: any
}

export interface ValidationResponse {
  /** Se a validação passou */
  success: boolean
  /** Lista de erros encontrados */
  errors: ValidationError[]
  /** Se permite nova tentativa */
  allowRetry: boolean
  /** Campos que foram aceitos (em caso de erro parcial) */
  acceptedFields?: string[]
}

export interface SDKError {
  code: string
  message: string
  details?: any
}

// Eventos do SDK
export type VaultZeroEventType = 
  | 'session_created'
  | 'qr_generated'
  | 'scan_detected'
  | 'authentication_start'
  | 'authentication_success'
  | 'authentication_error'
  | 'session_expired'
  | 'access_revoked'
  | 'connection_error'

export interface VaultZeroEvent {
  type: VaultZeroEventType
  data?: any
  timestamp: number
}

export type VaultZeroEventListener = (event: VaultZeroEvent) => void
