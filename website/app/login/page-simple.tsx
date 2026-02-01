'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Smartphone, 
  Clock, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Scan
} from 'lucide-react'
import { VaultZeroSDK, LoginSession, AuthenticatedUser, ValidationError } from '../../../sdk/src'
import { Navigation } from '../../components/Navigation'

interface LoginState {
  status: 'idle' | 'waiting' | 'scanning' | 'authenticating' | 'success' | 'error' | 'validation_error'
  session?: LoginSession
  user?: AuthenticatedUser
  error?: string
  validationErrors?: ValidationError[]
  timeLeft?: number
}

// Configuração da empresa (exemplo: e-commerce brasileiro)
const COMPANY_CONFIG = {
  name: 'VaultZero Demo Store',
  description: 'Loja virtual de demonstração',
  logo: '🛒',
  requestedFields: [
    { name: 'name', required: true, description: 'Nome completo', placeholder: 'Digite seu nome completo' },
    { name: 'email', required: true, description: 'Email para contato', placeholder: 'seu@email.com' },
    { name: 'cpf', required: true, description: 'CPF para nota fiscal', placeholder: '000.000.000-00' },
    { name: 'phone', required: false, description: 'Telefone (opcional)', placeholder: '(11) 99999-9999' },
    { name: 'address', required: true, description: 'Endereço de entrega', placeholder: 'Rua, número, cidade' }
  ]
}

export default function LoginPage() {
  const [loginState, setLoginState] = useState<LoginState>({ status: 'idle' })
  const [sdk, setSDK] = useState<VaultZeroSDK | null>(null)
  const [showDemo, setShowDemo] = useState(false)

  // Inicializar SDK
  useEffect(() => {
    const vaultSDK = new VaultZeroSDK({
      callbackUrl: `${window.location.origin}/api/auth/callback`,
      redirectUrl: '/dashboard',
      qrCodeExpiration: 300, // 5 minutos
      debug: true
    })

    // Configurar listeners do SDK
    vaultSDK.on('session_created', (event) => {
      console.log('✅ Sessão criada:', event.data)
      setLoginState(prev => ({
        ...prev,
        status: 'waiting',
        session: event.data.session
      }))
    })

    vaultSDK.on('qr_generated', (event) => {
      console.log('📱 QR Code gerado:', event.data)
    })

    vaultSDK.on('authentication_success', (event) => {
      console.log('🎉 Login bem-sucedido:', event.data)
      setLoginState({
        status: 'success',
        user: event.data.userData
      })
      
      // SDK gerencia tudo, apenas salvamos para o dashboard
      sessionStorage.setItem('vaultzero_user', JSON.stringify(event.data.userData))
      sessionStorage.setItem('vaultzero_session', JSON.stringify({
        sessionId: event.data.sessionId,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      }))
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    })

    vaultSDK.on('authentication_error', (event) => {
      console.log('❌ Erro de autenticação:', event.data)
      if (event.data.errors) {
        setLoginState({
          status: 'validation_error',
          validationErrors: event.data.errors
        })
      } else {
        setLoginState({
          status: 'error',
          error: event.data.message || 'Erro na autenticação'
        })
      }
    })

    vaultSDK.on('session_expired', (event) => {
      console.log('⏰ Sessão expirada:', event.data)
      setLoginState({
        status: 'error',
        error: 'Sessão expirada. Clique para gerar um novo código.'
      })
    })

    setSDK(vaultSDK)

    return () => {
      vaultSDK.dispose()
    }
  }, [])

  // Criar sessão de login usando o SDK
  const createLoginSession = useCallback(async () => {
    if (!sdk) return

    try {
      setLoginState({ status: 'idle' })
      
      // O SDK faz todo o trabalho pesado
      const session = await sdk.createLoginSession({
        requestedFields: COMPANY_CONFIG.requestedFields,
        metadata: {
          companyName: COMPANY_CONFIG.name,
          companyDescription: COMPANY_CONFIG.description,
          companyLogo: COMPANY_CONFIG.logo
        }
      })

      // O SDK já emitiu o evento, apenas aguardamos
      console.log('🔄 Sessão criada pelo SDK:', session.sessionId)

    } catch (error) {
      console.error('💥 Erro ao criar sessão:', error)
      setLoginState({
        status: 'error',
        error: 'Erro ao gerar código QR'
      })
    }
  }, [sdk])

  // Iniciar processo quando SDK estiver pronto
  useEffect(() => {
    if (sdk) {
      createLoginSession()
    }
  }, [sdk, createLoginSession])

  // Função para simular login (para demonstração sem app mobile)
  const simulateLogin = async () => {
    if (!loginState.session || !sdk) return

    setLoginState(prev => ({ ...prev, status: 'scanning' }))
    
    setTimeout(() => {
      setLoginState(prev => ({ ...prev, status: 'authenticating' }))
    }, 1500)

    setTimeout(() => {
      // Simular dados do usuário que o app mobile enviaria
      const mockUser = {
        userId: 'demo_user_123',
        name: 'João Silva Demo',
        email: 'joao.demo@email.com',
        cpf: '123.456.789-00',
        phone: '(11) 99999-9999',
        address: 'Rua Demo, 123 - São Paulo, SP',
        blockchainAddress: '0x742d35Cc6634C0532925a3b8D4C2Faa4E28F90b6'
      }

      // Simular callback do app mobile
      sdk.handleAuthenticationCallback({
        sessionId: loginState.session!.sessionId,
        userData: mockUser,
        signature: 'mock_signature_' + Date.now(),
        timestamp: Date.now()
      }).then(() => {
        console.log('🎭 Simulação de login concluída')
      }).catch(error => {
        console.error('Erro na simulação:', error)
      })
    }, 3000)
  }

  // Formatação do tempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation />
      
      <div className="flex items-center justify-center min-h-screen pt-16">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Lado esquerdo - Informações */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">
                    {COMPANY_CONFIG.logo} {COMPANY_CONFIG.name}
                  </h1>
                  <p className="text-xl text-gray-300 mb-8">
                    {COMPANY_CONFIG.description}
                  </p>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-white mb-4">
                    Dados necessários para sua conta:
                  </h2>
                  
                  <div className="space-y-3">
                    {COMPANY_CONFIG.requestedFields.map((field, index) => (
                      <motion.div
                        key={field.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm"
                      >
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {field.description}
                            {field.required && <span className="text-red-400 ml-1">*</span>}
                          </p>
                          <p className="text-gray-400 text-sm">{field.placeholder}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-600/20 border border-blue-400/30 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-6 w-6 text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="text-blue-300 font-semibold mb-2">100% Seguro e Privado</h3>
                      <p className="text-blue-200 text-sm">
                        Seus dados são criptografados e você mantém total controle sobre eles.
                        Nenhuma senha é necessária - apenas sua biometria.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Lado direito - QR Code */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                
                {/* Status do Login */}
                {loginState.status === 'idle' && (
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white">Preparando código QR...</p>
                  </div>
                )}

                {loginState.status === 'waiting' && loginState.session && (
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Escaneie o QR Code
                      </h3>
                      <p className="text-gray-300 mb-6">
                        Use o app VaultZero no seu celular
                      </p>
                    </div>

                    {/* QR Code gerado pelo SDK */}
                    {loginState.session.qrCodeUrl && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white p-6 rounded-2xl inline-block"
                      >
                        <img 
                          src={loginState.session.qrCodeUrl} 
                          alt="QR Code para Login"
                          className="w-48 h-48"
                        />
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2 text-gray-300">
                        <Clock className="h-5 w-5" />
                        <span>Expira em 5 minutos</span>
                      </div>

                      <button
                        onClick={createLoginSession}
                        className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors mx-auto"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Gerar novo código</span>
                      </button>

                      {/* Botão de demonstração */}
                      <div className="pt-4 border-t border-gray-600">
                        <button
                          onClick={() => setShowDemo(!showDemo)}
                          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                        >
                          🎬 Modo demonstração
                        </button>
                        
                        {showDemo && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3"
                          >
                            <button
                              onClick={simulateLogin}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                            >
                              🎭 Simular Login
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {loginState.status === 'scanning' && (
                  <div className="text-center space-y-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Scan className="h-12 w-12 text-blue-400 mx-auto" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">QR Code Escaneado!</h3>
                    <p className="text-gray-300">Aguardando confirmação no app...</p>
                  </div>
                )}

                {loginState.status === 'authenticating' && (
                  <div className="text-center space-y-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Shield className="h-12 w-12 text-purple-400 mx-auto" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">Autenticando...</h3>
                    <p className="text-gray-300">Verificando sua identidade</p>
                  </div>
                )}

                {loginState.status === 'success' && (
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 10 }}
                    >
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">Login Realizado!</h3>
                    <p className="text-gray-300">Redirecionando para o dashboard...</p>
                    {loginState.user && (
                      <p className="text-purple-300">Bem-vindo, {loginState.user.name}!</p>
                    )}
                  </div>
                )}

                {loginState.status === 'error' && (
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
                    <h3 className="text-xl font-bold text-white">Erro</h3>
                    <p className="text-red-300">{loginState.error}</p>
                    <button
                      onClick={createLoginSession}
                      className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg transition-colors"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                )}

                {loginState.status === 'validation_error' && loginState.validationErrors && (
                  <div className="text-center space-y-4">
                    <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto" />
                    <h3 className="text-xl font-bold text-white">Dados Inválidos</h3>
                    <div className="text-left space-y-2">
                      {loginState.validationErrors.map((error, index) => (
                        <div key={index} className="bg-red-600/20 border border-red-400/30 rounded-lg p-3">
                          <p className="text-red-300 font-medium">{error.field}</p>
                          <p className="text-red-200 text-sm">{error.message}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-yellow-300 text-sm">
                      Corrija os dados no app e tente novamente
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
