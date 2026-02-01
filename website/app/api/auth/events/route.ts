import { NextRequest, NextResponse } from 'next/server'

// Store global para manter as conexões SSE ativas por sessão
// Em desenvolvimento, usar globalThis para evitar problemas de HMR
const getSSEStore = () => {
  if (typeof globalThis === 'undefined') {
    throw new Error('globalThis not available')
  }
  
  // @ts-ignore
  if (!globalThis.__sseConnections) {
    // @ts-ignore
    globalThis.__sseConnections = new Map<string, (data: any) => void>()
    console.log('🆕 Store SSE criado no globalThis')
  }
  
  // @ts-ignore
  return globalThis.__sseConnections as Map<string, (data: any) => void>
}

const sseConnections = getSSEStore()

// Store para mapear sessionId -> userId para revogação mais precisa
const getSessionUserStore = () => {
  if (typeof globalThis === 'undefined') {
    throw new Error('globalThis not available')
  }
  
  // @ts-ignore
  if (!globalThis.__sessionUserMapping) {
    // @ts-ignore
    globalThis.__sessionUserMapping = new Map<string, string>()
    console.log('🆕 Store de mapeamento sessionId->userId criado')
  }
  
  // @ts-ignore
  return globalThis.__sessionUserMapping as Map<string, string>
}

const sessionUserMapping = getSessionUserStore()

// Função para salvar o mapeamento sessionId -> userId
export function saveSessionUserMapping(sessionId: string, userId: string) {
  sessionUserMapping.set(sessionId, userId)
  console.log(`💾 Mapeamento salvo: sessionId ${sessionId} -> userId ${userId}`)
}

// Função para notificar o frontend sobre o sucesso do login
export function notifyLoginSuccess(sessionId: string, userData: any, authToken: string) {
  console.log(`🚀 Tentando notificar sucesso via SSE para sessão: ${sessionId}`)
  console.log(`📊 Total de conexões SSE: ${sseConnections.size}`)
  console.log(`🔍 Conexões disponíveis:`, Array.from(sseConnections.keys()))
  console.log(`🔍 Verificando se sessionId existe no Map: ${sseConnections.has(sessionId)}`)
  
  const notify = sseConnections.get(sessionId)
  console.log(`🔍 Função notify obtida: ${typeof notify}`)
  
  if (notify) {
    console.log(`✅ Conexão SSE encontrada, enviando notificação para: ${sessionId}`)
    try {
      notify({
        type: 'authentication_success',
        data: {
          userData,
          sessionId,
          authToken,
          timestamp: Date.now()
        }
      })
      console.log(`📤 Notificação enviada com sucesso para: ${sessionId}`)
    } catch (error) {
      console.error(`❌ Erro ao enviar notificação:`, error)
    }
    // Remover a conexão após notificar
    sseConnections.delete(sessionId)
    console.log(`🧹 Conexão SSE removida para sessão: ${sessionId}`)
  } else {
    console.log(`❌ Nenhuma conexão SSE ativa encontrada para sessão: ${sessionId}`)
    console.log(`📋 Conexões SSE ativas: ${Array.from(sseConnections.keys()).join(', ')}`)
  }
}

// Função para notificar sobre erros de validação
export function notifyValidationError(sessionId: string, errors: any[]) {
  console.log(`⚠️ Tentando notificar erro de validação via SSE para sessão: ${sessionId}`)
  const notify = sseConnections.get(sessionId)
  if (notify) {
    console.log(`✅ Conexão SSE encontrada, enviando erro para: ${sessionId}`)
    notify({
      type: 'validation_error',
      data: {
        errors,
        sessionId,
        timestamp: Date.now()
      }
    })
  } else {
    console.log(`❌ Nenhuma conexão SSE ativa encontrada para erro em sessão: ${sessionId}`)
  }
}

// Função para notificar sobre revogação de acesso
export function notifyRevocation(userId: string, siteUrl: string) {
  console.log(`🚫 Tentando notificar revogação via SSE para usuário: ${userId}, site: ${siteUrl}`)
  console.log(`📊 Total de conexões SSE ativas: ${sseConnections.size}`)
  
  let notifiedSessions = 0
  
  // Primeiro, tentar encontrar sessões específicas do usuário
  const userSessions: string[] = []
  sessionUserMapping.forEach((mappedUserId, sessionId) => {
    if (mappedUserId === userId) {
      userSessions.push(sessionId)
    }
  })
  
  if (userSessions.length > 0) {
    console.log(`🎯 Encontradas ${userSessions.length} sessões para o usuário ${userId}`)
    userSessions.forEach(sessionId => {
      const notify = sseConnections.get(sessionId)
      if (notify) {
        try {
          console.log(`🔔 Enviando notificação de revogação para sessão específica: ${sessionId}`)
          notify({
            type: 'access_revoked',
            data: {
              userId,
              siteUrl,
              revokedAt: Date.now(),
              message: 'Seu acesso foi revogado pelo dispositivo móvel'
            }
          })
          notifiedSessions++
        } catch (error) {
          console.error(`❌ Erro ao notificar revogação para sessão ${sessionId}:`, error)
        }
      }
    })
  } else {
    // Fallback: notificar todas as sessões ativas (comportamento anterior)
    console.log(`⚠️ Nenhuma sessão específica encontrada para ${userId}, notificando todas as sessões ativas`)
    sseConnections.forEach((notify, sessionId) => {
      try {
        console.log(`🔔 Enviando notificação de revogação para sessão: ${sessionId}`)
        notify({
          type: 'access_revoked',
          data: {
            userId,
            siteUrl,
            revokedAt: Date.now(),
            message: 'Seu acesso foi revogado pelo dispositivo móvel'
          }
        })
        notifiedSessions++
      } catch (error) {
        console.error(`❌ Erro ao notificar revogação para sessão ${sessionId}:`, error)
      }
    })
  }
  
  console.log(`📤 Revogação notificada para ${notifiedSessions} sessões ativas`)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  console.log('🔗 SSE connection established for session:', sessionId)

  // Configurar SSE
  const responseStream = new TransformStream()
  const writer = responseStream.writable.getWriter()
  const encoder = new TextEncoder()

  // Função para enviar eventos SSE
  const sendEvent = (data: any) => {
    const eventData = `data: ${JSON.stringify(data)}\n\n`
    writer.write(encoder.encode(eventData))
  }

  // Registrar a conexão
  sseConnections.set(sessionId, sendEvent)
  console.log(`📝 Conexão SSE registrada para sessão: ${sessionId}`)
  console.log(`📊 Total de conexões SSE ativas: ${sseConnections.size}`)

  // Enviar evento inicial de conexão
  sendEvent({
    type: 'connection_established',
    data: { sessionId, timestamp: Date.now() }
  })

  // Configurar limpeza quando a conexão for fechada
  request.signal.addEventListener('abort', () => {
    console.log('🔌 SSE connection closed for session:', sessionId)
    sseConnections.delete(sessionId)
    sessionUserMapping.delete(sessionId)
    writer.close()
  })

  // Auto-limpeza após 5 minutos (timeout do QR Code)
  setTimeout(() => {
    if (sseConnections.has(sessionId)) {
      sendEvent({
        type: 'session_expired',
        data: { sessionId, timestamp: Date.now() }
      })
      sseConnections.delete(sessionId)
      sessionUserMapping.delete(sessionId)
      writer.close()
    }
  }, 5 * 60 * 1000) // 5 minutos

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}
