# VaultZero SDK

Official SDK for integrating VaultZero authentication system in web applications.

## 🚀 Installation

```bash
npm install @vaultzero/login-sdk
# or
yarn add @vaultzero/login-sdk
```

## 📖 Basic Usage

### 1. Initial Setup

```typescript
import { VaultZeroSDK } from '@vaultzero/login-sdk'

const sdk = new VaultZeroSDK({
  callbackUrl: 'https://mysite.com/api/auth/callback',
  redirectUrl: '/dashboard', // optional
  qrCodeExpiration: 300, // 5 minutes (optional)
  debug: false // optional
})
```

### 2. Criando uma Sessão de Login

```typescript
// Sessão básica
const session = await sdk.createLoginSession()

// Sessão com campos personalizados
const session = await sdk.createLoginSession({
  requestedFields: [
    { name: 'name', required: true },
    { name: 'email', required: true },
    { name: 'cpf', required: false },
    { name: 'phone', required: false }
  ],
  qrCodeOptions: {
    width: 400,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  },
  metadata: {
    loginReason: 'Acesso ao painel administrativo',
    requesterApp: 'MyApp v1.0'
  }
})

console.log('QR Code URL:', session.qrCodeUrl)
console.log('Session ID:', session.sessionId)
```

### 3. Escutando Eventos

```typescript
// Eventos disponíveis
sdk.on('session_created', (event) => {
  console.log('Sessão criada:', event.data.session)
})

sdk.on('qr_generated', (event) => {
  const qrCodeUrl = event.data.qrCodeUrl
  // Exibir QR Code na tela
  document.getElementById('qr-code').src = qrCodeUrl
})

sdk.on('scan_detected', () => {
  console.log('QR Code foi escaneado!')
})

sdk.on('authentication_success', (event) => {
  const userData = event.data.userData
  console.log('Login realizado:', userData)
  // Redirecionar ou atualizar UI
})

sdk.on('authentication_error', (event) => {
  console.error('Erro na autenticação:', event.data)
})

sdk.on('session_expired', () => {
  console.log('Sessão expirou')
  // Gerar nova sessão ou voltar ao estado inicial
})
```

## ⚛️ Uso com React

### Hook useVaultZeroLogin

```typescript
import { useVaultZeroLogin } from '@vaultzero/login-sdk'

function LoginComponent() {
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
    callbackUrl: '/api/auth/callback',
    redirectUrl: '/dashboard'
  })

  const handleStartLogin = () => {
    startLogin({
      requestedFields: [
        { name: 'name', required: true },
        { name: 'email', required: true },
        { name: 'cpf', required: false }
      ]
    })
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (error) {
    return <div>Erro: {error}</div>
  }

  switch (loginState.status) {
    case 'idle':
      return (
        <button onClick={handleStartLogin}>
          Iniciar Login com VaultZero
        </button>
      )

    case 'waiting':
      return (
        <div>
          <img src={qrCodeUrl} alt="QR Code de Login" />
          <p>Escaneie o QR Code com o app VaultZero</p>
          <p>Tempo restante: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
          <button onClick={refreshSession}>Gerar Novo QR Code</button>
          <button onClick={cancelLogin}>Cancelar</button>
        </div>
      )

    case 'scanning':
      return <div>QR Code escaneado! Aguardando confirmação...</div>

    case 'authenticating':
      return <div>Autenticando...</div>

    case 'success':
      return <div>Login realizado com sucesso! Redirecionando...</div>

    case 'expired':
      return (
        <div>
          <p>Sessão expirada</p>
          <button onClick={handleStartLogin}>Tentar Novamente</button>
        </div>
      )

    default:
      return null
  }
}
```

## 🛠️ API de Callback

### Implementação do Endpoint

Você precisa criar um endpoint para receber os callbacks de autenticação:

```typescript
// Next.js API Route (app/api/auth/callback/route.ts)
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userData, signature } = await request.json()

    // Validar sessão
    if (!sessionId || !userData) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 })
    }

    // Verificar assinatura (recomendado)
    if (signature) {
      // Implementar verificação de assinatura criptográfica
      const isValid = await verifySignature(userData, signature)
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Criar sessão do usuário
    const userSession = {
      userId: userData.id,
      name: userData.name,
      email: userData.email,
      cpf: userData.cpf,
      authenticatedAt: new Date().toISOString(),
      sessionId
    }

    // Salvar sessão (cookie, JWT, banco de dados, etc.)
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful'
    })

    response.cookies.set('auth-session', JSON.stringify(userSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 horas
    })

    return response

  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.json({ success: false, error: 'Authentication failed' }, { status: 500 })
  }
}
```

## 🎨 Componente de Login Completo

```typescript
import React from 'react'
import { useVaultZeroLogin, TimeUtils } from '@vaultzero/login-sdk'

interface VaultZeroLoginProps {
  onSuccess?: (userData: any) => void
  onError?: (error: string) => void
  requestedFields?: Array<{
    name: string
    required?: boolean
    description?: string
  }>
}

export function VaultZeroLogin({ 
  onSuccess, 
  onError, 
  requestedFields = [
    { name: 'name', required: true },
    { name: 'email', required: true }
  ]
}: VaultZeroLoginProps) {
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
    callbackUrl: `${window.location.origin}/api/auth/callback`,
    redirectUrl: '/dashboard'
  })

  React.useEffect(() => {
    if (loginState.status === 'success' && loginState.user) {
      onSuccess?.(loginState.user)
    }
  }, [loginState.status, loginState.user, onSuccess])

  React.useEffect(() => {
    if (error) {
      onError?.(error)
    }
  }, [error, onError])

  const handleStartLogin = () => {
    startLogin({ requestedFields })
  }

  return (
    <div className="vaultzero-login">
      {loginState.status === 'idle' && (
        <div className="login-start">
          <h2>Login com VaultZero</h2>
          <p>Autenticação segura sem senhas</p>
          <button 
            onClick={handleStartLogin}
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Carregando...' : 'Entrar com VaultZero'}
          </button>
        </div>
      )}

      {loginState.status === 'waiting' && qrCodeUrl && (
        <div className="qr-code-display">
          <h3>Escaneie o QR Code</h3>
          <div className="qr-container">
            <img src={qrCodeUrl} alt="QR Code de Login" />
          </div>
          <p>Abra o app VaultZero e escaneie o código</p>
          <div className="timer">
            Expira em: {TimeUtils.formatTimeRemaining(timeLeft)}
          </div>
          <div className="actions">
            <button onClick={refreshSession}>🔄 Novo QR Code</button>
            <button onClick={cancelLogin}>❌ Cancelar</button>
          </div>
        </div>
      )}

      {loginState.status === 'scanning' && (
        <div className="scanning-state">
          <div className="spinner">🔄</div>
          <h3>QR Code Escaneado!</h3>
          <p>Aguardando confirmação no app...</p>
        </div>
      )}

      {loginState.status === 'authenticating' && (
        <div className="authenticating-state">
          <div className="spinner">⏳</div>
          <h3>Autenticando...</h3>
          <p>Confirme no seu dispositivo</p>
        </div>
      )}

      {loginState.status === 'success' && (
        <div className="success-state">
          <div className="success-icon">✅</div>
          <h3>Login Realizado!</h3>
          <p>Redirecionando...</p>
        </div>
      )}

      {(loginState.status === 'error' || loginState.status === 'expired') && (
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>{loginState.status === 'expired' ? 'Sessão Expirada' : 'Erro no Login'}</h3>
          <p>{error || 'Tente novamente'}</p>
          <button onClick={handleStartLogin}>
            🔄 Tentar Novamente
          </button>
        </div>
      )}
    </div>
  )
}
```

## 🔧 Utilitários

### Validação de Dados

```typescript
import { VaultZeroValidator } from '@vaultzero/login-sdk'

// Validar CPF
const isValidCPF = VaultZeroValidator.validateCPF('123.456.789-01')

// Validar email
const isValidEmail = VaultZeroValidator.validateEmail('user@example.com')

// Formatar CPF
const formattedCPF = VaultZeroValidator.formatCPF('12345678901')
// Resultado: '123.456.789-01'
```

### Manipulação de QR Code

```typescript
import { QRCodeUtils } from '@vaultzero/login-sdk'

// Verificar se QR Code é válido
const isValid = QRCodeUtils.isValidVaultZeroQR(qrCodeData)

// Extrair dados do QR Code
const qrData = QRCodeUtils.parseVaultZeroQR(qrCodeString)
```

## 📱 Integração com App Mobile

O app VaultZero deve ser capaz de interpretar QR Codes no seguinte formato:

```json
{
  "sessionId": "session_1640995200000_abc123",
  "action": "login",
  "timestamp": 1640995200000,
  "expiresAt": "2021-12-31T23:59:59.000Z",
  "callbackUrl": "https://meusite.com/api/auth/callback",
  "requestedFields": [
    { "name": "name", "required": true },
    { "name": "email", "required": true },
    { "name": "cpf", "required": false }
  ],
  "metadata": {
    "loginReason": "Acesso ao sistema",
    "requesterApp": "MyApp v1.0"
  }
}
```

Após a autenticação, o app deve fazer um POST para o `callbackUrl` com:

```json
{
  "sessionId": "session_1640995200000_abc123",
  "userData": {
    "id": "user_123",
    "name": "João Silva",
    "email": "joao@example.com",
    "cpf": "123.456.789-01"
  },
  "signature": "crypto_signature_here",
  "timestamp": 1640995260000
}
```

## ⚠️ Segurança

1. **HTTPS**: Sempre use HTTPS em produção
2. **Validação**: Valide todas as entradas no backend
3. **Assinaturas**: Implemente verificação de assinaturas criptográficas
4. **Expiração**: Respeite os tempos de expiração
5. **Rate Limiting**: Implemente rate limiting nos endpoints

## 🎯 Typescript

O SDK é totalmente tipado em TypeScript. Todos os tipos estão disponíveis:

```typescript
import type { 
  VaultZeroConfig,
  LoginSession,
  LoginState,
  AuthenticatedUser,
  RequestedField
} from '@vaultzero/login-sdk'
```

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.
