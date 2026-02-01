import { NextRequest, NextResponse } from 'next/server'
import { notifyRevocation } from '../events/route'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, siteUrl, signature, timestamp } = body

    console.log('Revocation request received:', { 
      userId, 
      siteUrl, 
      signature: !!signature,
      timestamp
    })

    // Validação básica
    if (!userId || !siteUrl || !signature || !timestamp) {
      return NextResponse.json(
        { success: false, message: 'Dados de revogação incompletos' },
        { status: 400 }
      )
    }

    // Verificar se não é muito antigo (5 minutos)
    const requestTime = new Date(timestamp).getTime()
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutos

    if (now - requestTime > maxAge) {
      return NextResponse.json(
        { success: false, message: 'Solicitação de revogação expirada' },
        { status: 401 }
      )
    }

    // TODO: Verificar assinatura criptográfica (em produção)
    // const isValidSignature = await verifyRevocationSignature(userId, siteUrl, signature, userPublicKey)
    // if (!isValidSignature) {
    //   return NextResponse.json(
    //     { success: false, message: 'Assinatura de revogação inválida' },
    //     { status: 401 }
    //   )
    // }

    console.log('Access revoked for user:', userId, 'from site:', siteUrl)

    // Notificar todas as sessões ativas deste usuário sobre a revogação
    notifyRevocation(userId, siteUrl)
    
    return NextResponse.json({
      success: true,
      message: 'Acesso revogado com sucesso',
      userId: userId,
      siteUrl: siteUrl,
      revokedAt: Date.now()
    })

  } catch (error) {
    console.error('Erro no endpoint de revogação:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint para revogação de acesso VaultZero' },
    { status: 200 }
  )
}
