import { NextRequest, NextResponse } from 'next/server'
import { notifyLoginSuccess, notifyValidationError, saveSessionUserMapping } from '../events/route'

// Simulação de validação da empresa (agnóstica)
function validateUserData(userData: any): { 
  success: boolean, 
  errors?: Array<{ field: string, code: string, message: string }> 
} {
  const errors: Array<{ field: string, code: string, message: string }> = []

  // Definir campos obrigatórios (em produção, isso viria da configuração da empresa)
  const requiredFields = ['name', 'email', 'cpf', 'address']; // phone é opcional
  
  // Verificar campos obrigatórios
  requiredFields.forEach(field => {
    if (!userData[field] || userData[field].trim() === '') {
      errors.push({
        field,
        code: 'REQUIRED_FIELD',
        message: `Campo '${field}' é obrigatório.`
      })
    }
  });

  // Se há campos obrigatórios faltando, retornar erro
  if (errors.length > 0) {
    return {
      success: false,
      errors
    }
  }

  // Simulações de validação específicas da empresa
  // Em produção, cada empresa teria suas próprias regras

  // Simular erro aleatório para demonstrar fluxo de feedback (só se não há campos faltando)
  if (Math.random() < 0.1) { // 10% de chance de erro
    if (userData.cpf && Math.random() < 0.5) {
      errors.push({
        field: 'cpf',
        code: 'INVALID_FORMAT',
        message: 'CPF inválido. Verifique os dígitos.'
      })
    }
    
    if (userData.email && Math.random() < 0.5) {
      errors.push({
        field: 'email',
        code: 'DOMAIN_BLOCKED',
        message: 'Domínio de email não aceito por nossa empresa.'
      })
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userData, signature, timestamp } = body

    console.log('Auth callback received:', { 
      sessionId, 
      userData: !!userData, 
      signature: !!signature,
      timestamp,
      userDataFields: userData ? Object.keys(userData) : []
    })

    // Validação básica
    if (!sessionId || !userData || !signature || !timestamp) {
      return NextResponse.json(
        { success: false, message: 'Dados de autenticação incompletos' },
        { status: 400 }
      )
    }

    // Verificar se não é muito antigo (5 minutos)
    const requestTime = new Date(timestamp).getTime()
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutos

    if (now - requestTime > maxAge) {
      return NextResponse.json(
        { success: false, message: 'Solicitação expirada' },
        { status: 401 }
      )
    }

    // TODO: Verificar assinatura criptográfica (em produção)
    // const isValidSignature = await verifySignature(userData, signature, userPublicKey)
    // if (!isValidSignature) {
    //   return NextResponse.json(
    //     { success: false, message: 'Assinatura inválida' },
    //     { status: 401 }
    //   )
    // }

    // Validar dados específicos da empresa
    const validation = validateUserData(userData)
    
    if (!validation.success && validation.errors) {
      // Notificar o frontend sobre erros de validação via SSE
      notifyValidationError(sessionId, validation.errors)
      
      return NextResponse.json({
        success: false,
        message: 'Dados inválidos. Corrija e tente novamente.',
        errors: validation.errors,
        requiresCorrection: true
      }, { status: 422 })
    }

    // Autenticação bem-sucedida
    console.log('Login successful for user:', userData.name || userData.userId)

    // Salvar mapeamento sessionId -> userId para revogação precisa
    if (userData.userId) {
      saveSessionUserMapping(sessionId, userData.userId)
    }

    // Em produção, você criaria um JWT ou sessão aqui
    const authToken = `token_${sessionId}_${Date.now()}`
    
    // Notificar o frontend sobre o sucesso via SSE
    notifyLoginSuccess(sessionId, userData, authToken)
    
    return NextResponse.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      userData: userData,
      sessionId: sessionId,
      authToken: authToken,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    })

  } catch (error) {
    console.error('Erro no callback de autenticação:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint para callback de autenticação VaultZero' },
    { status: 200 }
  )
}
