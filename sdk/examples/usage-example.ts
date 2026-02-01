/**
 * Exemplo de uso do VaultZero SDK
 * SDK completamente agnóstico - pode trabalhar com qualquer tipo de campo
 */

import { VaultZeroSDK } from '../src'

// ========== EXEMPLO 1: E-commerce Global (aceita qualquer campo) ==========

const ecommerceSDK = new VaultZeroSDK({
  callbackUrl: 'https://mystore.example.com/auth/callback',
  redirectUrl: '/dashboard',
  debug: true
})

// Empresa pode solicitar QUALQUER campo - SDK não valida
async function loginEcommerce() {
  try {
    const session = await ecommerceSDK.createLoginSession({
      requestedFields: [
        { name: 'name', required: true, description: 'Nome completo' },
        { name: 'email', required: true, description: 'Email para contato' },
        { name: 'phone', required: false, description: 'Telefone (opcional)' },
        { name: 'address', required: true, description: 'Endereço de entrega' }
      ],
      metadata: {
        companyName: 'Global Store',
        purpose: 'checkout'
      }
    })

    console.log('QR Code gerado:', session.qrCodeUrl)
    console.log('Session ID:', session.sessionId)

    // Simular callback do app mobile com dados do usuário
    const callbackData = {
      sessionId: session.sessionId,
      userData: {
        name: 'João Silva Santos',
        email: 'joao@email.com',
        phone: '(11) 99999-8888',
        address: 'Rua das Flores, 123 - São Paulo, SP'
      },
      timestamp: Date.now()
    }

    const validationResult = await ecommerceSDK.handleAuthenticationCallback(callbackData)
    
    if (validationResult.success) {
      console.log('Login aprovado!')
    } else {
      console.log('Errors:', validationResult.errors)
      console.log('Pode tentar novamente:', validationResult.allowRetry)
    }

  } catch (error) {
    console.error('Erro no login:', error)
  }
}

// ========== EXEMPLO 2: Banco Brasileiro ==========

const bancoSDK = new VaultZeroSDK({
  callbackUrl: 'https://banco.example.com.br/auth/callback',
  redirectUrl: '/conta'
})

async function loginBanco() {
  const session = await bancoSDK.createLoginSession({
    requestedFields: [
      { name: 'name', required: true, description: 'Nome completo conforme RG' },
      { name: 'email', required: true, description: 'Email principal' },
      { name: 'cpf', required: true, description: 'CPF para abertura da conta' },
      { name: 'phone', required: true, description: 'Telefone para segurança' },
      { name: 'address', required: true, description: 'Endereço residencial' }
    ],
    metadata: {
      companyName: 'Banco Digital Brasil',
      purpose: 'account_opening'
    }
  })

  console.log('QR para banco:', session.qrCodeData)
}

// ========== EXEMPLO 3: Empresa Americana ==========

const usCompanySDK = new VaultZeroSDK({
  callbackUrl: 'https://techco.example.com/auth/callback'
})

async function loginUSCompany() {
  const session = await usCompanySDK.createLoginSession({
    requestedFields: [
      { name: 'name', required: true, description: 'Full legal name' },
      { name: 'email', required: true, description: 'Primary email address' },
      { name: 'ssn', required: true, description: 'Social Security Number' },
      { name: 'phone', required: true, description: 'US phone number' },
      { name: 'zipCode', required: true, description: 'ZIP code' },
      { name: 'dateOfBirth', required: false, description: 'Date of birth (optional)' }
    ],
    metadata: {
      companyName: 'US Tech Company',
      country: 'US'
    }
  })

  // Simular dados americanos
  const callbackData = {
    sessionId: session.sessionId,
    userData: {
      name: 'John Smith',
      email: 'john.smith@email.com',
      ssn: '123-45-6789',
      phone: '+1 (555) 123-4567',
      zipCode: '10001',
      dateOfBirth: '1985-03-15'
    },
    timestamp: Date.now()
  }

  const result = await usCompanySDK.handleAuthenticationCallback(callbackData)
  console.log('US login result:', result)
}

// ========== EXEMPLO 4: Empresa Francesa ==========

const frenchCompanySDK = new VaultZeroSDK({
  callbackUrl: 'https://startup.example.eu/auth/callback'
})

async function loginFrenchCompany() {
  const session = await frenchCompanySDK.createLoginSession({
    requestedFields: [
      { name: 'name', required: true, description: 'Nom complet' },
      { name: 'email', required: true, description: 'Adresse email' },
      { name: 'nir', required: false, description: 'Numéro de sécurité sociale (optionnel)' },
      { name: 'phone', required: true, description: 'Numéro de téléphone' },
      { name: 'nationality', required: true, description: 'Nationalité' }
    ],
    metadata: {
      companyName: 'Startup Européenne',
      country: 'FR',
      language: 'fr'
    }
  })

  console.log('QR pour entreprise française:', session.qrCodeData)
}

// ========== USANDO DADOS MOCKADOS ==========

function useMockData() {
  // SDK fornece perfis mockados para testes
  const mockProfiles = ecommerceSDK.getMockUserProfiles()
  console.log('Perfis mockados disponíveis:', mockProfiles)

  // SDK fornece exemplos de empresas
  const mockCompanies = ecommerceSDK.getMockCompanyRequests()
  console.log('Empresas exemplo:', mockCompanies)

  // Usar um perfil aleatório para teste
  const randomUser = mockProfiles[Math.floor(Math.random() * mockProfiles.length)]
  console.log('Usuário aleatório para teste:', randomUser)
}

// ========== GERENCIAMENTO DE SESSÃO ==========

function sessionManagement() {
  // Restaurar sessão se existir
  const restoredSession = ecommerceSDK.restoreSession()
  if (restoredSession) {
    console.log('Sessão restaurada:', restoredSession)
  }

  // Debug info
  const debugInfo = ecommerceSDK.getDebugInfo()
  console.log('Debug SDK:', debugInfo)

  // Cancelar sessão
  ecommerceSDK.cancelSession()

  // Limpar todos os dados
  ecommerceSDK.dispose()
}

// ========== LISTENERS DE EVENTOS ==========

function setupEventListeners() {
  ecommerceSDK.on('session_created', (event) => {
    console.log('Sessão criada:', event.data)
  })

  ecommerceSDK.on('qr_generated', (event) => {
    console.log('QR Code gerado:', event.data)
  })

  ecommerceSDK.on('authentication_success', (event) => {
    console.log('Login bem-sucedido:', event.data)
  })

  ecommerceSDK.on('authentication_error', (event) => {
    console.log('Erro de autenticação:', event.data)
  })

  ecommerceSDK.on('session_expired', (event) => {
    console.log('Sessão expirada:', event.data)
  })
}

// ========== EXECUTAR EXEMPLOS ==========

async function runExamples() {
  setupEventListeners()
  
  console.log('\n=== EXEMPLO E-COMMERCE ===')
  await loginEcommerce()
  
  console.log('\n=== EXEMPLO BANCO BRASILEIRO ===')
  await loginBanco()
  
  console.log('\n=== EXEMPLO EMPRESA AMERICANA ===')
  await loginUSCompany()
  
  console.log('\n=== EXEMPLO EMPRESA FRANCESA ===')
  await loginFrenchCompany()
  
  console.log('\n=== DADOS MOCKADOS ===')
  useMockData()
  
  console.log('\n=== GERENCIAMENTO DE SESSÃO ===')
  sessionManagement()
}

// runExamples()

export {
  loginEcommerce,
  loginBanco,
  loginUSCompany,
  loginFrenchCompany,
  useMockData,
  sessionManagement,
  setupEventListeners,
  runExamples
}
