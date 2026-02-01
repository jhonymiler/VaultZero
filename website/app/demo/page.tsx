'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { CheckCircle, ArrowLeft, Clock, Shield, Smartphone, Users, Lock, Zap, Eye, EyeOff, Fingerprint, Loader2, RotateCw } from 'lucide-react'
import Link from 'next/link'
import { Navigation } from '../../components/Navigation'

export default function DemoPage() {
  const [currentDemo, setCurrentDemo] = useState<'traditional' | 'vaultzero'>('vaultzero')
  const [traditionalTime, setTraditionalTime] = useState(0)
  const [vaultZeroTime, setVaultZeroTime] = useState(0)
  const [isTraditionalRunning, setIsTraditionalRunning] = useState(false)
  const [isVaultZeroRunning, setIsVaultZeroRunning] = useState(false)
  const [traditionalStep, setTraditionalStep] = useState(0)
  const [vaultZeroStep, setVaultZeroStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [qrScanned, setQrScanned] = useState(false)
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const qrCodeRef = useRef<HTMLDivElement>(null)

  // Cronômetro para login tradicional
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTraditionalRunning) {
      interval = setInterval(() => {
        setTraditionalTime(prev => prev + 10)
      }, 10)
    }
    return () => clearInterval(interval)
  }, [isTraditionalRunning])

  // Cronômetro para VaultZero
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isVaultZeroRunning) {
      interval = setInterval(() => {
        setVaultZeroTime(prev => prev + 10)
      }, 10)
    }
    return () => clearInterval(interval)
  }, [isVaultZeroRunning])

  const startTraditionalLogin = () => {
    setTraditionalTime(0)
    setTraditionalStep(0)
    setIsTraditionalRunning(true)
    setUserName('')
    setPassword('')
    
    setTimeout(() => setTraditionalStep(1), 500) // Email input step
    setTimeout(() => {
      setTraditionalStep(2) // Password input step
      if (passwordInputRef.current) {
        passwordInputRef.current.focus()
      }
    }, 8000)
    setTimeout(() => setTraditionalStep(3), 16000) // Verificando
    setTimeout(() => {
      setTraditionalStep(4) // Sucesso
      setIsTraditionalRunning(false)
    }, 20000)
  }

  const startVaultZeroLogin = () => {
    setVaultZeroTime(0)
    setVaultZeroStep(0)
    setQrScanned(false)
    setIsVaultZeroRunning(true)
    
    setTimeout(() => setVaultZeroStep(1), 500) // QR Code aparece
    setTimeout(() => {
      setQrScanned(true)
      setVaultZeroStep(2)
    }, 1500) // Scanner
    setTimeout(() => {
      setVaultZeroStep(3) // Biometria
    }, 2000)
    setTimeout(() => {
      setVaultZeroStep(4) // Sucesso
      setIsVaultZeroRunning(false)
    }, 2500)
  }

  const resetDemo = () => {
    setTraditionalTime(0)
    setVaultZeroTime(0)
    setIsTraditionalRunning(false)
    setIsVaultZeroRunning(false)
    setTraditionalStep(0)
    setVaultZeroStep(0)
    setQrScanned(false)
    setUserName('')
    setPassword('')
  }

  // Iniciar ambas as demos simultaneamente
  const startBothDemos = () => {
    resetDemo()
    startTraditionalLogin()
    startVaultZeroLogin()
  }

  const formatTime = (time: number) => {
    return (time / 1000).toFixed(2)
  }

  const formatTimeDiff = () => {
    const vaultTime = vaultZeroTime / 1000
    const tradTime = traditionalTime / 1000
    const diff = tradTime - vaultTime
    const times = Math.round(tradTime / vaultTime)
    return { diff: diff.toFixed(2), times }
  }

  // QR Code animation
  useEffect(() => {
    if (vaultZeroStep === 1 && qrCodeRef.current) {
      const element = qrCodeRef.current
      element.classList.add('pulse-animation')
      return () => {
        element.classList.remove('pulse-animation')
      }
    }
  }, [vaultZeroStep])

  return (
    <div className="min-h-screen gradient-bg pt-24 pb-20">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Voltar */}
        <div className="mb-8">
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </div>

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Demonstração <span className="gradient-text">Interativa</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Compare o processo de login tradicional com senhas versus o sistema VaultZero sem senhas.
          </p>
        </motion.div>

        {/* Botão para iniciar ambas as demonstrações */}
        <div className="mb-12 text-center flex flex-col items-center">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={startBothDemos}
            className="btn-primary py-3 px-8 text-lg"
            disabled={isTraditionalRunning || isVaultZeroRunning}
          >
            <Zap className="w-5 h-5 mr-2" />
            Iniciar Comparação em Tempo Real
          </motion.button>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Compare ambos os métodos de login simultaneamente
          </p>
        </div>

        {/* Resultado da Comparação */}
        {traditionalStep === 4 && vaultZeroStep === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 mb-16 text-center"
          >
            <h2 className="text-3xl font-bold mb-6">Resultado da Comparação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Login Tradicional</h3>
                <p className="text-3xl text-red-500 font-bold">{formatTime(traditionalTime)}s</p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Diferença</h3>
                <p className="text-3xl text-purple-500 font-bold">
                  {formatTimeDiff().times}x mais rápido
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Economia de {formatTimeDiff().diff}s
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">VaultZero</h3>
                <p className="text-3xl text-green-500 font-bold">{formatTime(vaultZeroTime)}s</p>
              </div>
            </div>
            <button
              onClick={resetDemo}
              className="btn-secondary"
            >
              <RotateCw className="w-5 h-5" />
              Reiniciar Demonstração
            </button>
          </motion.div>
        )}

        {/* Seletores de Demo */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-12">
          <button
            onClick={() => {
              setCurrentDemo('traditional')
              !isTraditionalRunning && !isVaultZeroRunning && startTraditionalLogin()
            }}
            className={`flex-1 glass-card p-6 transition-all ${currentDemo === 'traditional' ? 'border-4 border-blue-500 dark:border-blue-600' : ''}`}
          >
            <h3 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Login Tradicional</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              O sistema de autenticação com senhas que todo mundo conhece: digitar email, lembrar senha, esperar...
            </p>
            <div className="flex items-center gap-2">
              <Clock className="text-blue-500" />
              <span className="text-lg text-gray-700 dark:text-gray-300">~30 segundos</span>
            </div>
          </button>

          <button
            onClick={() => {
              setCurrentDemo('vaultzero')
              !isTraditionalRunning && !isVaultZeroRunning && startVaultZeroLogin()
            }}
            className={`flex-1 glass-card p-6 transition-all ${currentDemo === 'vaultzero' ? 'border-4 border-purple-500 dark:border-purple-600' : ''}`}
          >
            <h3 className="text-2xl font-bold mb-4 text-purple-600 dark:text-purple-400">Login VaultZero</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Autenticação moderna com blockchain P2P: escanear QR code, confirmar biometria, pronto!
            </p>
            <div className="flex items-center gap-2">
              <Zap className="text-purple-500" />
              <span className="text-lg text-gray-700 dark:text-gray-300">~2 segundos</span>
            </div>
          </button>
        </div>

        {/* Demos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
          {/* Demo de Login Tradicional */}
          <div className={`glass-card p-8 ${currentDemo === 'traditional' ? 'ring-4 ring-blue-500/30' : ''}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Login Tradicional</h3>
              <div className="text-lg font-bold">
                {isTraditionalRunning || traditionalStep > 0 ? formatTime(traditionalTime) + 's' : '0.00s'}
              </div>
            </div>

            <div className="h-[400px] flex flex-col items-center justify-center relative">
              
              {traditionalStep === 0 && (
                <button
                  onClick={startTraditionalLogin}
                  className="btn-primary"
                  disabled={isTraditionalRunning || isVaultZeroRunning}
                >
                  Iniciar Login Tradicional
                </button>
              )}

              {/* Email Step */}
              <AnimatePresence>
                {traditionalStep === 1 && (
                  <motion.div 
                    className="w-full max-w-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h4 className="text-xl font-semibold mb-6 text-center">Entre com seu email</h4>
                    <div className="mb-6">
                      <input 
                        type="email"
                        className="w-full p-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                        placeholder="seu.email@exemplo.com"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <p className="text-gray-500 text-sm italic text-center">Auto-preenchendo em alguns segundos...</p>
                    <div className="typing-animation mt-4"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password Step */}
              <AnimatePresence>
                {traditionalStep === 2 && (
                  <motion.div 
                    className="w-full max-w-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <h4 className="text-xl font-semibold mb-6 text-center">Digite sua senha</h4>
                    <div className="mb-6 relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full p-4 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                        placeholder="******"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        ref={passwordInputRef}
                      />
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm italic text-center">
                      {password === '' ? 'Tentando lembrar a senha...' : 'Digitando senha...'}
                    </p>
                    <div className="typing-animation mt-4"></div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Verificando Step */}
              <AnimatePresence>
                {traditionalStep === 3 && (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
                    <h4 className="text-xl font-semibold">Verificando credenciais...</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Autenticando com o servidor...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sucesso Step */}
              <AnimatePresence>
                {traditionalStep === 4 && (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h4 className="text-2xl font-semibold text-green-600 mb-2">Login bem-sucedido!</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você levou <strong>{formatTime(traditionalTime)} segundos</strong> para entrar.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

          {/* Demo de Login VaultZero */}
          <div className={`glass-card p-8 ${currentDemo === 'vaultzero' ? 'ring-4 ring-purple-500/30' : ''}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">Login VaultZero</h3>
              <div className="text-lg font-bold">
                {isVaultZeroRunning || vaultZeroStep > 0 ? formatTime(vaultZeroTime) + 's' : '0.00s'}
              </div>
            </div>

            <div className="h-[400px] flex flex-col items-center justify-center relative">
              
              {vaultZeroStep === 0 && (
                <button
                  onClick={startVaultZeroLogin}
                  className="btn-primary"
                  disabled={isTraditionalRunning || isVaultZeroRunning}
                >
                  Iniciar Login VaultZero
                </button>
              )}

              {/* QR Code Step */}
              <AnimatePresence>
                {vaultZeroStep === 1 && (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="mb-6" ref={qrCodeRef}>
                      <QRCodeSVG
                        value="vaultzero://auth?session=demo&challenge=123456789&timestamp=1623499861"
                        size={200}
                        bgColor={"#ffffff"}
                        fgColor={"#000000"}
                        level={"L"}
                        includeMargin={false}
                        className="mx-auto rounded-lg"
                      />
                    </div>
                    <h4 className="text-xl font-semibold">Escaneie o QR Code</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Use o app VaultZero para escanear
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scanning Step */}
              <AnimatePresence>
                {vaultZeroStep === 2 && (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="relative w-40 h-40 mx-auto mb-6">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping"></div>
                      <div className="absolute inset-3 bg-purple-500/30 rounded-full"></div>
                      <Smartphone className="w-20 h-20 text-purple-600 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h4 className="text-xl font-semibold">QR Code escaneado</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Confirmando identidade...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Biometria Step */}
              <AnimatePresence>
                {vaultZeroStep === 3 && (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, scale: [0.8, 1.1, 1] }}
                    transition={{ scale: { duration: 0.4 } }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="relative w-32 h-32 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <Fingerprint className="w-24 h-24 text-green-600 pulse-animation" />
                    </div>
                    <h4 className="text-xl font-semibold">Biometria confirmada</h4>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Autenticando...
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sucesso Step */}
              <AnimatePresence>
                {vaultZeroStep === 4 && (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h4 className="text-2xl font-semibold text-green-600 mb-2">Login bem-sucedido!</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Você levou apenas <strong>{formatTime(vaultZeroTime)} segundos</strong> para entrar.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* Explicação técnica */}
        <div className="glass-card p-8 mb-16">
          <h2 className="text-3xl font-bold mb-8">Como o VaultZero funciona?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="text-blue-500" />
                Tecnologia Blockchain P2P
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                O VaultZero usa uma rede blockchain descentralizada para autenticação.
                Cada usuário tem um <strong>endereço único</strong> derivado de um
                par de chaves criptográficas. Sem servidores centrais significa 
                <strong> zero riscos de vazamentos</strong> de credenciais.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Fingerprint className="text-purple-500" />
                Biometria Local e Segura
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Sua biometria <strong>nunca sai do seu dispositivo</strong>. 
                O reconhecimento facial/digital é feito localmente através 
                de Secure Enclave/TEE, garantindo que seus dados biométricos 
                permaneçam privados e seguros.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="text-green-500" />
                Self-Sovereign Identity
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                SSI significa que <strong>você controla totalmente</strong> sua identidade 
                digital. Compartilhe apenas os dados que deseja, com quem deseja, quando 
                deseja. Sem intermediários ou autoridades centrais controlando seus dados.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Users className="text-yellow-500" />
                Multi-Dispositivo
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Adicione facilmente novos dispositivos usando QR Code + código de 6 dígitos, 
                ou recupere sua identidade em qualquer lugar usando suas 12 palavras secretas 
                (padrão BIP39).
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para experimentar?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/login" className="btn-primary">
              <Shield className="w-5 h-5" />
              Criar Identidade Grátis
            </Link>
            <Link href="/" className="btn-secondary">
              Saiba Mais
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
