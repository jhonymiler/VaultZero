import { useState, useEffect, useCallback } from 'react'
import { VaultZeroSDK } from './VaultZeroSDK'
import {
  VaultZeroConfig,
  LoginSession,
  LoginState,
  LoginRequest,
  AuthenticatedUser,
  VaultZeroEvent
} from './types'

export interface UseVaultZeroLoginResult {
  /** Estado atual do login */
  loginState: LoginState
  /** Sessão atual (se existir) */
  session: LoginSession | undefined
  /** URL do QR Code para exibição */
  qrCodeUrl: string | undefined
  /** Tempo restante em segundos */
  timeLeft: number
  /** Inicia uma nova sessão de login */
  startLogin: (request?: LoginRequest) => Promise<void>
  /** Cancela a sessão atual */
  cancelLogin: () => void
  /** Recarrega a sessão (gera novo QR Code) */
  refreshSession: () => Promise<void>
  /** Se há erro */
  error: string | undefined
  /** Se está carregando */
  loading: boolean
}

export function useVaultZeroLogin(config: VaultZeroConfig): UseVaultZeroLoginResult {
  const [sdk] = useState(() => new VaultZeroSDK(config))
  const [loginState, setLoginState] = useState<LoginState>({ status: 'idle' })
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(false)

  // Listener para eventos do SDK
  useEffect(() => {
    const handleEvent = (event: VaultZeroEvent) => {
      switch (event.type) {
        case 'session_created':
          setLoginState(prev => ({
            ...prev,
            status: 'waiting',
            session: event.data.session
          }))
          break

        case 'qr_generated':
          setLoginState(prev => ({
            ...prev,
            session: prev.session ? {
              ...prev.session,
              qrCodeUrl: event.data.qrCodeUrl
            } : undefined
          }))
          break

        case 'scan_detected':
          setLoginState(prev => ({
            ...prev,
            status: 'scanning'
          }))
          break

        case 'authentication_start':
          setLoginState(prev => ({
            ...prev,
            status: 'authenticating'
          }))
          break

        case 'authentication_success':
          setLoginState(prev => ({
            ...prev,
            status: 'success',
            user: event.data.userData
          }))
          break

        case 'authentication_error':
          setLoginState(prev => ({
            ...prev,
            status: 'error',
            error: event.data.message || 'Authentication failed'
          }))
          break

        case 'session_expired':
          setLoginState(prev => ({
            ...prev,
            status: 'expired',
            error: 'Session expired'
          }))
          break
      }
    }

    // Registrar listeners para todos os eventos
    const eventTypes: Array<keyof typeof handleEvent> = [
      'session_created',
      'qr_generated', 
      'scan_detected',
      'authentication_start',
      'authentication_success',
      'authentication_error',
      'session_expired'
    ]

    eventTypes.forEach(eventType => {
      sdk.on(eventType as any, handleEvent)
    })

    return () => {
      eventTypes.forEach(eventType => {
        sdk.off(eventType as any, handleEvent)
      })
    }
  }, [sdk])

  // Timer para atualizar tempo restante
  useEffect(() => {
    if (loginState.status === 'waiting' && loginState.session) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((loginState.session!.expiresAt.getTime() - Date.now()) / 1000))
        setTimeLeft(remaining)
        
        if (remaining === 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [loginState.status, loginState.session])

  const startLogin = useCallback(async (request?: LoginRequest) => {
    try {
      setLoading(true)
      setLoginState({ status: 'idle', error: undefined })
      
      const session = await sdk.createLoginSession(request)
      
      // O estado será atualizado pelos event listeners
    } catch (error) {
      setLoginState({
        status: 'error',
        error: error instanceof Error ? error.message : 'Failed to start login'
      })
    } finally {
      setLoading(false)
    }
  }, [sdk])

  const cancelLogin = useCallback(() => {
    sdk.cancelSession()
    setLoginState({ status: 'idle' })
    setTimeLeft(0)
  }, [sdk])

  const refreshSession = useCallback(async () => {
    if (loginState.session) {
      // Preservar a configuração da sessão anterior
      const lastRequest = {
        requestedFields: [], // TODO: extrair da sessão anterior
        metadata: {}
      }
      await startLogin(lastRequest)
    }
  }, [loginState.session, startLogin])

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      sdk.dispose()
    }
  }, [sdk])

  return {
    loginState,
    session: loginState.session,
    qrCodeUrl: loginState.session?.qrCodeUrl,
    timeLeft,
    startLogin,
    cancelLogin,
    refreshSession,
    error: loginState.error,
    loading
  }
}
