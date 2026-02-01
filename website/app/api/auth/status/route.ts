import { NextRequest, NextResponse } from 'next/server'

// Armazenamento temporário em memória para o status das sessões
// Em produção, isso seria um Redis ou banco de dados
const sessionStatus = new Map<string, {
  status: 'waiting' | 'success' | 'error' | 'expired'
  userData?: any
  error?: string
  timestamp: number
}>()

// Limpar sessões antigas a cada 10 minutos
setInterval(() => {
  const now = Date.now()
  const maxAge = 10 * 60 * 1000 // 10 minutos
  
  for (const [sessionId, data] of sessionStatus.entries()) {
    if (now - data.timestamp > maxAge) {
      sessionStatus.delete(sessionId)
    }
  }
}, 10 * 60 * 1000)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'Session ID is required' },
        { status: 400 }
      )
    }

    const status = sessionStatus.get(sessionId) || { 
      status: 'waiting' as const, 
      timestamp: Date.now() 
    }

    return NextResponse.json({
      success: true,
      status: status.status,
      userData: status.userData,
      error: status.error,
      timestamp: status.timestamp
    })

  } catch (error) {
    console.error('Erro ao verificar status:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status, userData, error } = body

    if (!sessionId || !status) {
      return NextResponse.json(
        { success: false, message: 'Session ID and status are required' },
        { status: 400 }
      )
    }

    sessionStatus.set(sessionId, {
      status,
      userData,
      error,
      timestamp: Date.now()
    })

    console.log(`Session ${sessionId} status updated to: ${status}`)

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    })

  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
