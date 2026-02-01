'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Shield, 
  Clock, 
  LogOut, 
  Settings,
  Eye,
  EyeOff,
  Globe,
  Smartphone,
  Key,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Lock,
  Trash2
} from 'lucide-react'
import { Navigation } from '../../components/Navigation'
import { VaultZeroSDK } from '../../../sdk/src'

interface UserData {
  id: string
  name: string
  email: string
  cpf?: string
  phone?: string
  address?: string
  loginTime: string
  sessionExpiresAt: string
}

interface SessionData {
  sessionId: string
  timestamp: number
  expiresAt: number
}

interface ActiveSession {
  id: string
  siteUrl: string
  loginTime: string
  lastActivity: string
  status: 'active' | 'expired'
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [session, setSession] = useState<SessionData | null>(null)
  const [showSensitiveData, setShowSensitiveData] = useState(false)
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Carregar dados do usuário do localStorage (persistente)
    const userData = localStorage.getItem('vaultzero_user')
    const sessionData = localStorage.getItem('vaultzero_session')

    console.log('🔍 Dashboard useEffect - userData raw:', userData)
    console.log('🔍 Dashboard useEffect - sessionData raw:', sessionData)
    console.log('🔍 Dashboard useEffect - userData exists:', userData ? 'Sim' : 'Não')
    console.log('🔍 Dashboard useEffect - sessionData exists:', sessionData ? 'Sim' : 'Não')

    if (userData && sessionData) {
      const userObj = JSON.parse(userData)
      const sessionObj = JSON.parse(sessionData)
      
      console.log('🔍 Dashboard useEffect - userObj:', userObj)
      console.log('🔍 Dashboard useEffect - sessionObj:', sessionObj)
      
      // Fallback: se não vier loginTime, usar timestamp da sessão
      if (!userObj.loginTime) {
        userObj.loginTime = sessionObj?.timestamp ? new Date(sessionObj.timestamp).toISOString() : new Date().toISOString()
      }
      setUser(userObj)
      setSession(sessionObj)
      
      // Simular sessões ativas
      setActiveSessions([
        {
          id: 'sess_1',
          siteUrl: 'vaultzero-demo.com',
          loginTime: userObj.loginTime,
          lastActivity: new Date().toISOString(),
          status: 'active'
        }
      ])
    } else {
      console.log('❌ Dashboard - Dados não encontrados, redirecionando para login')
      // Redirecionar para login se não houver dados
      window.location.href = '/login'
      return
    }

    setIsLoading(false)
  }, [])

  // Inicializar SSE para escutar revogações - executar imediatamente após carregar dados
  useEffect(() => {
    console.log('🔗 SSE useEffect executado - user:', user ? 'Existe' : 'Null')
    console.log('🔗 SSE useEffect executado - session:', session ? 'Existe' : 'Null')
    console.log('🔗 SSE useEffect executado - sessionId:', session?.sessionId || 'Undefined')
    
    if (!user || !session?.sessionId) {
      console.log('❌ Não foi possível conectar SSE - dados faltando')
      return
    }

    console.log('🔗 Inicializando conexão SSE para sessão:', session.sessionId)

    // Aguardar um pouco para garantir que o navegador está pronto
    const timeoutId = setTimeout(() => {
      // Conectar ao SSE usando o sessionId da sessão atual
      const sseUrl = `${window.location.origin}/api/auth/events?sessionId=${session.sessionId}`
      console.log('🔗 Conectando ao SSE:', sseUrl)
      
      const eventSource = new EventSource(sseUrl)
      
      eventSource.onopen = () => {
        console.log('✅ Conexão SSE estabelecida para revogações')
      }
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 Evento SSE recebido no dashboard:', data)
          
          if (data.type === 'access_revoked') {
            console.log('🚫 Acesso revogado detectado no dashboard:', data.data)
            // Limpar dados e redirecionar
            localStorage.removeItem('vaultzero_user')
            localStorage.removeItem('vaultzero_session')
            window.location.href = '/login?revoked=true'
          }
        } catch (error) {
          console.error('❌ Erro ao processar evento SSE:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('❌ Erro na conexão SSE:', error)
        console.log('❌ SSE readyState:', eventSource.readyState)
      }
      
      // Limpar timeout e eventSource quando o componente for desmontado
      return () => {
        console.log('🔌 Fechando conexão SSE para sessão:', session.sessionId)
        clearTimeout(timeoutId)
        eventSource.close()
      }
    }, 1000) // Aguardar 1 segundo

    return () => {
      clearTimeout(timeoutId)
    }
  }, [user, session])

  const handleLogout = () => {
    localStorage.removeItem('vaultzero_user')
    localStorage.removeItem('vaultzero_session')
    window.location.href = '/'
  }

  const handleRevokeSession = (sessionId: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const maskData = (data: string, show: boolean): string => {
    if (show) return data
    if (data.includes('@')) {
      const [name, domain] = data.split('@')
      return `${name.substring(0, 2)}***@${domain}`
    }
    return `${data.substring(0, 3)}***${data.substring(data.length - 3)}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  if (!user) {
    return null // Será redirecionado para login
  }

  return (
    <div className="min-h-screen mt-20 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 z-10 relative">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Bem-vindo, {user.name}
              </h1>
              <p className="text-blue-200">
                Sua identidade está segura e sob seu controle
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600/80 hover:bg-red-600 px-4 py-2 rounded-lg text-white transition-colors w-fit self-end md:self-auto"
              style={{ zIndex: 20 }}
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Perfil do Usuário */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <User size={20} />
                  Dados Compartilhados
                </h2>
                <button
                  onClick={() => setShowSensitiveData(!showSensitiveData)}
                  className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors"
                >
                  {showSensitiveData ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showSensitiveData ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-blue-200 text-sm">Nome Completo</label>
                    <p className="text-white font-medium">{user.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-blue-200 text-sm">Email</label>
                    <p className="text-white font-medium">
                      {maskData(user.email, showSensitiveData)}
                    </p>
                  </div>

                  {user.cpf && (
                    <div>
                      <label className="text-blue-200 text-sm">CPF</label>
                      <p className="text-white font-medium">
                        {maskData(user.cpf, showSensitiveData)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {user.phone && (
                    <div>
                      <label className="text-blue-200 text-sm">Telefone</label>
                      <p className="text-white font-medium">
                        {maskData(user.phone, showSensitiveData)}
                      </p>
                    </div>
                  )}

                  {user.address && (
                    <div>
                      <label className="text-blue-200 text-sm">Endereço</label>
                      <p className="text-white font-medium">
                        {showSensitiveData ? user.address : user.address.substring(0, 20) + '...'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-blue-200 text-sm">Último Login</label>
                    <p className="text-white font-medium">
                      {formatDate(user.loginTime)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-300">
                  <CheckCircle size={16} />
                  <span className="text-sm font-medium">
                    Todos os dados foram compartilhados com seu consentimento
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Estatísticas */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Status da Sessão */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield size={18} />
                  Status da Sessão
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Status</span>
                    <span className="flex items-center gap-1 text-green-300 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      Ativa
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Expira em</span>
                    <span className="text-white text-sm">23h 45m</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Dispositivo</span>
                    <span className="flex items-center gap-1 text-white text-sm">
                      <Smartphone size={12} />
                      Mobile
                    </span>
                  </div>
                </div>
              </div>

              {/* Privacidade */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock size={18} />
                  Privacidade
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Dados criptografados</span>
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Armazenamento local</span>
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Compartilhamento zero</span>
                    <CheckCircle size={16} className="text-green-400" />
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={18} />
                  Estatísticas
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Sites autorizados</span>
                    <span className="text-white font-medium">1</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Logins hoje</span>
                    <span className="text-white font-medium">1</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-blue-200 text-sm">Tempo ativo</span>
                    <span className="text-white font-medium">15min</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sessões Ativas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Globe size={20} />
              Sites Conectados
            </h2>

            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Globe size={20} className="text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{session.siteUrl}</h3>
                      <p className="text-blue-200 text-sm">
                        Login: {formatDate(session.loginTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300 text-sm">Ativo</span>
                    </div>
                    
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Revogar acesso"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-blue-300 mt-0.5" />
                <div className="text-blue-200 text-sm">
                  <p className="font-medium mb-1">Direito ao Esquecimento Ativo</p>
                  <p>
                    Seus dados serão automaticamente removidos deste site em 24 horas. 
                    Você pode revogar o acesso a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
