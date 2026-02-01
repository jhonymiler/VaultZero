'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { 
  Shield, 
  Smartphone, 
  Clock, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { VaultZeroSDK } from '../../../sdk/src'
import { Navigation } from '../../components/Navigation'

// Tipos do SDK
interface LoginSession {
  sessionId: string
  qrCodeData: string
  expiresAt: Date
  isActive: boolean
  qrCodeUrl?: string
}

interface AuthenticatedUser {
  userId: string
  [key: string]: any
}

interface ValidationError {
  field: string
  code: string
  message: string
  value?: any
}

interface LoginState {
  status: 'idle' | 'waiting' | 'scanning' | 'authenticating' | 'success' | 'error' | 'validation_error'
  session?: LoginSession
  user?: AuthenticatedUser
  error?: string
  validationErrors?: ValidationError[]
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
  const [timeLeft, setTimeLeft] = useState(300)
  const [sdk, setSDK] = useState<VaultZeroSDK | null>(null)
  const [showCreateIdentity, setShowCreateIdentity] = useState(false)
  const [step, setStep] = useState(1)
  const [animateQR, setAnimateQR] = useState(false)
  const [seedWords] = useState([
    'apple', 'orange', 'banana', 'grape', 'lemon', 'kiwi',
    'melon', 'cherry', 'mango', 'peach', 'plum', 'coconut'
  ])
  const [recoveryWords, setRecoveryWords] = useState(Array(12).fill(''))
  
  const intervalRef = useRef<any>(null)
  const pollIntervalRef = useRef<any>(null)

  // Inicializar SDK
  useEffect(() => {
    const vaultSDK = new VaultZeroSDK({
      callbackUrl: `${window.location.origin}/api/auth/callback`,
      redirectUrl: '/dashboard',
      qrCodeExpiration: 300, // 5 minutos
      debug: true
    })

    // Configurar listeners
    vaultSDK.on('session_created', (event) => {
      console.log('Sessão criada:', event.data)
    })

    vaultSDK.on('qr_generated', (event) => {
      console.log('QR Code gerado:', event.data)
    })

    vaultSDK.on('authentication_success', (event) => {
      console.log('Login bem-sucedido:', event.data)
      setLoginState({
        status: 'success',
        user: event.data.userData
      })
      
      // Salvar dados do usuário no sessionStorage para o dashboard
      sessionStorage.setItem('vaultzero_user', JSON.stringify(event.data.userData))
      
      // Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    })

    vaultSDK.on('authentication_error', (event) => {
      console.log('Erro de autenticação:', event.data)
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
      console.log('Sessão expirada:', event.data)
      setLoginState({
        status: 'error',
        error: 'Sessão expirada. Gerando novo código...'
      })
      // Gerar nova sessão automaticamente
      setTimeout(() => createLoginSession(), 2000)
    })

    setSDK(vaultSDK)

    return () => {
      vaultSDK.dispose()
    }
  }, [])

  // Criar sessão de login
  const createLoginSession = useCallback(async () => {
    if (!sdk) return

    try {
      setLoginState({ status: 'idle' })
      
      const session = await sdk.createLoginSession({
        requestedFields: COMPANY_CONFIG.requestedFields,
        metadata: {
          companyName: COMPANY_CONFIG.name,
          companyDescription: COMPANY_CONFIG.description,
          companyLogo: COMPANY_CONFIG.logo
        }
      })

      setLoginState({
        status: 'waiting',
        session
      })
      setTimeLeft(300)

      // Timer para countdown
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Simular polling para verificar status (em produção, seria via websocket ou webhook)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = setInterval(async () => {
        const status = await sdk.checkAuthenticationStatus(session.sessionId)
        
        if (status.status === 'expired') {
          clearInterval(pollIntervalRef.current)
          setLoginState({
            status: 'error',
            error: 'Sessão expirada'
          })
        }
      }, 5000)

    } catch (error) {
      console.error('Erro ao criar sessão:', error)
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

  // Limpar intervalos
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  // Simular login para demonstração
  const simulateLogin = async () => {
    if (!sdk || !loginState.session) return

    setLoginState(prev => ({ ...prev, status: 'scanning' }))

    setTimeout(() => {
      setLoginState(prev => ({ ...prev, status: 'authenticating' }))
    }, 2000)

    // Simular dados do usuário após 3 segundos
    setTimeout(async () => {
      const mockUserData = {
        userId: 'demo_user_123',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
        cpf: '123.456.789-01',
        phone: '(11) 99999-8888',
        address: 'Rua das Flores, 123 - São Paulo, SP'
      }

      const callbackData = {
        sessionId: loginState.session!.sessionId,
        userData: mockUserData,
        timestamp: Date.now()
      }

      try {
        const result = await sdk.handleAuthenticationCallback(callbackData)
        
        if (result.success) {
          setLoginState({
            status: 'success',
            user: mockUserData
          })
          
          // Salvar dados no sessionStorage
          sessionStorage.setItem('vaultzero_user', JSON.stringify(mockUserData))
          
          // Redirecionar
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000)
        } else {
          setLoginState({
            status: 'validation_error',
            validationErrors: result.errors
          })
        }
      } catch (error) {
        setLoginState({
          status: 'error',
          error: 'Erro no processamento do login'
        })
      }
    }, 4000)
  }

  // Criar nova identidade
  const startCreatingIdentity = () => {
    setShowCreateIdentity(true)
    setStep(1)

    // Simular passos de criação
    setTimeout(() => setStep(2), 2000)
    setTimeout(() => setStep(3), 4000)
    setTimeout(() => setStep(4), 6000)
  }

  // Recuperação por palavras
  const handleRecoveryWordChange = (index: number, value: string) => {
    const newWords = [...recoveryWords]
    newWords[index] = value.toLowerCase().trim()
    setRecoveryWords(newWords)
  }

  const restoreFromWords = () => {
    setLoginState({ status: 'authenticating' })

    setTimeout(() => {
      const mockUserData = {
        userId: 'recovered_user_456',
        name: 'Identidade Recuperada',
        email: 'usuario@email.com'
      }
      
      setLoginState({
        status: 'success',
        user: mockUserData
      })
      
      sessionStorage.setItem('vaultzero_user', JSON.stringify(mockUserData))
      
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    }, 3000)
  }

  // Efeito de pulsar para o QR code
  useEffect(() => {
    if (loginState.status === 'waiting' && !showCreateIdentity) {
      const pulseInterval = setInterval(() => {
        setAnimateQR(true)
        setTimeout(() => setAnimateQR(false), 1000)
      }, 3000)
      return () => clearInterval(pulseInterval)
    }
  }, [loginState.status, showCreateIdentity])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getFieldIcon = (fieldName: string) => {
    switch (fieldName) {
      case 'name': return <User className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'address': return <MapPin className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Entre com VaultZero
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Login seguro sem senhas usando sua identidade digital
            </p>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* QR Code Section */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {COMPANY_CONFIG.logo} {COMPANY_CONFIG.name}
                </h2>
                
                <p className="text-slate-300 mb-6">
                  {COMPANY_CONFIG.description}
                </p>

                {/* Campos solicitados */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Dados necessários:
                  </h3>
                  <div className="space-y-2">
                    {COMPANY_CONFIG.requestedFields.map((field, index) => (
                      <div key={index} className="flex items-center justify-between text-sm text-slate-300 bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          {getFieldIcon(field.name)}
                          <span>{field.description}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          field.required 
                            ? 'bg-red-500/20 text-red-300' 
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {field.required ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* QR Code Display */}
                {loginState.status === 'waiting' && loginState.session?.qrCodeUrl && (
                  <div className="space-y-4">
                    <motion.div 
                      className={`bg-white p-4 rounded-lg inline-block ${animateQR ? 'ring-4 ring-blue-400' : ''}`}
                      animate={{ scale: animateQR ? 1.05 : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={loginState.session.qrCodeUrl}
                        alt="QR Code para login"
                        width={300}
                        height={300}
                        className="rounded"
                      />
                    </motion.div>

                    <div className="flex items-center justify-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4" />
                      <span>Expira em: {formatTime(timeLeft)}</span>
                    </div>

                    <button
                      onClick={simulateLogin}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      🧪 Simular Login (Demo)
                    </button>

                    <button
                      onClick={createLoginSession}
                      className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4 inline mr-2" />
                      Gerar Novo Código
                    </button>
                  </div>
                )}

                {/* Status States */}
                {loginState.status === 'idle' && (
                  <div className="text-slate-300">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    Gerando código QR...
                  </div>
                )}

                {loginState.status === 'scanning' && (
                  <motion.div 
                    className="text-center space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                      <Smartphone className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div className="text-blue-300">
                      <p className="font-semibold">Código escaneado!</p>
                      <p className="text-sm">Aguardando confirmação no app...</p>
                    </div>
                  </motion.div>
                )}

                {loginState.status === 'authenticating' && (
                  <motion.div 
                    className="text-center space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-yellow-500 rounded-full flex items-center justify-center">
                      <Shield className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div className="text-yellow-300">
                      <p className="font-semibold">Autenticando...</p>
                      <p className="text-sm">Processando dados biométricos...</p>
                    </div>
                  </motion.div>
                )}

                {loginState.status === 'success' && (
                  <motion.div 
                    className="text-center space-y-4"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-green-300">
                      <p className="font-semibold">Login bem-sucedido!</p>
                      <p className="text-sm">Redirecionando para o dashboard...</p>
                      {loginState.user && (
                        <p className="text-sm mt-2">Bem-vindo, {loginState.user.name}!</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {loginState.status === 'validation_error' && (
                  <motion.div 
                    className="text-center space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-red-300">
                      <p className="font-semibold">Erro de validação</p>
                      <p className="text-sm">Alguns dados precisam ser corrigidos no app:</p>
                      {loginState.validationErrors && (
                        <div className="mt-2 space-y-1">
                          {loginState.validationErrors.map((error, index) => (
                            <div key={index} className="text-xs bg-red-500/20 rounded p-2">
                              <strong>{error.field}</strong>: {error.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {loginState.status === 'error' && (
                  <motion.div 
                    className="text-center space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="w-16 h-16 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-red-300">
                      <p className="font-semibold">Erro</p>
                      <p className="text-sm">{loginState.error}</p>
                    </div>
                    <button
                      onClick={createLoginSession}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Tentar Novamente
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Instructions Section */}
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Como Funciona */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Como funciona?
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="text-white font-semibold">Escaneie o QR Code</p>
                      <p className="text-slate-300 text-sm">Use seu app VaultZero para escanear o código</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="text-white font-semibold">Confirme com biometria</p>
                      <p className="text-slate-300 text-sm">Use impressão digital ou reconhecimento facial</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="text-white font-semibold">Autorize os dados</p>
                      <p className="text-slate-300 text-sm">Escolha quais informações compartilhar</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      ✓
                    </div>
                    <div>
                      <p className="text-white font-semibold">Acesso liberado!</p>
                      <p className="text-slate-300 text-sm">Entre sem senhas, de forma segura</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Não tem o app? */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Não tem o app?
                </h3>
                
                <div className="space-y-4">
                  <button
                    onClick={startCreatingIdentity}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg transition-all duration-300 font-semibold"
                  >
                    🆕 Criar Nova Identidade
                  </button>
                  
                  <div className="text-center">
                    <p className="text-slate-300 text-sm mb-4">
                      Ou restaure uma identidade existente:
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <input
                          key={index}
                          type="text"
                          placeholder={`${index + 1}`}
                          value={recoveryWords[index]}
                          onChange={(e) => handleRecoveryWordChange(index, e.target.value)}
                          className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm text-center placeholder-slate-400"
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={restoreFromWords}
                      disabled={recoveryWords.some(word => !word.trim())}
                      className="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      🔄 Restaurar Identidade
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Modal de Criação de Identidade */}
        {showCreateIdentity && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="bg-white rounded-2xl p-8 max-w-md w-full"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-center">
                {step === 1 && (
                  <div>
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Gerando Identidade</h3>
                    <p className="text-gray-600 mb-4">Criando suas chaves criptográficas...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-1/4 transition-all duration-500"></div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Smartphone className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Configurando Biometria</h3>
                    <p className="text-gray-600 mb-4">Registrando sua impressão digital...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-2/4 transition-all duration-500"></div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Registrando na Blockchain</h3>
                    <p className="text-gray-600 mb-4">Sincronizando com a rede P2P...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full w-3/4 transition-all duration-500"></div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Identidade Criada!</h3>
                    <p className="text-gray-600 mb-4">Guarde suas palavras de recuperação:</p>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                      {seedWords.map((word, index) => (
                        <div key={index} className="bg-gray-100 p-2 rounded text-center">
                          <span className="text-gray-500">{index + 1}.</span> {word}
                        </div>
                      ))}
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                      <div className="bg-green-500 h-2 rounded-full w-full transition-all duration-500"></div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowCreateIdentity(false)
                        setStep(1)
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Finalizar
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
