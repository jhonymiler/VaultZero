// Exemplo de uso do SDK VaultZero em uma aplicação Next.js

import React from 'react'
import { useVaultZeroLogin, TimeUtils } from '@vaultzero/login-sdk'

export default function LoginPage() {
  const {
    loginState,
    qrCodeUrl,
    timeLeft,
    startLogin,
    cancelLogin,
    refreshSession,
    loading,
    error
  } = useVaultZeroLogin({
    callbackUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback`,
    redirectUrl: '/dashboard',
    debug: process.env.NODE_ENV === 'development'
  })

  const handleStartLogin = () => {
    startLogin({
      requestedFields: [
        { name: 'name', required: true, description: 'Nome completo' },
        { name: 'email', required: true, description: 'E-mail principal' },
        { name: 'cpf', required: false, description: 'CPF (opcional)' },
        { name: 'phone', required: false, description: 'Telefone (opcional)' }
      ],
      metadata: {
        loginReason: 'Acesso ao painel do usuário',
        appVersion: '1.0.0'
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">🔐</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Login VaultZero
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Autenticação segura sem senhas
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Estado inicial */}
          {loginState.status === 'idle' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Use o app VaultZero para fazer login de forma segura
                </p>
                <button
                  onClick={handleStartLogin}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Gerando QR Code...
                    </>
                  ) : (
                    'Entrar com VaultZero'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Aguardando scan */}
          {loginState.status === 'waiting' && qrCodeUrl && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Escaneie o QR Code
                </h3>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code de Login" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Abra o app VaultZero e escaneie o código acima
                </p>
                <div className="mt-2 text-lg font-mono text-blue-600">
                  {TimeUtils.formatTimeRemaining(timeLeft)}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={refreshSession}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  🔄 Novo QR Code
                </button>
                <button
                  onClick={cancelLogin}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  ❌ Cancelar
                </button>
              </div>
            </div>
          )}

          {/* QR Code escaneado */}
          {loginState.status === 'scanning' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full">
                <svg className="animate-spin h-8 w-8 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                QR Code Escaneado!
              </h3>
              <p className="text-sm text-gray-600">
                Aguardando confirmação no app...
              </p>
            </div>
          )}

          {/* Autenticando */}
          {loginState.status === 'authenticating' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <svg className="animate-pulse h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM2 8a8 8 0 1016 0A8 8 0 002 8z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Autenticando...
              </h3>
              <p className="text-sm text-gray-600">
                Confirme a autenticação no seu dispositivo
              </p>
            </div>
          )}

          {/* Sucesso */}
          {loginState.status === 'success' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <svg className="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Login Realizado!
              </h3>
              <p className="text-sm text-gray-600">
                Redirecionando para o painel...
              </p>
              {loginState.user && (
                <div className="text-sm text-gray-500">
                  Bem-vindo, {loginState.user.name}!
                </div>
              )}
            </div>
          )}

          {/* Erro ou expirado */}
          {(loginState.status === 'error' || loginState.status === 'expired') && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {loginState.status === 'expired' ? 'Sessão Expirada' : 'Erro no Login'}
              </h3>
              <p className="text-sm text-gray-600">
                {error || 'Algo deu errado. Tente novamente.'}
              </p>
              <button
                onClick={handleStartLogin}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
