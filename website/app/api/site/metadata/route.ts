import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const domain = url.searchParams.get('domain')
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      )
    }

    // Metadados do site que serão enviados APÓS o login
    // Isso mantém o QR Code leve e transmite dados detalhados só quando necessário
    const siteMetadata = {
      name: 'VaultZero Demo Store',
      description: 'Loja virtual de demonstração do VaultZero',
      logo: '🛒',
      logoUrl: `${url.origin}/logo.png`,
      primaryColor: '#3b82f6',
      website: url.origin,
      privacy: {
        dataRetention: '24 horas',
        dataSharing: 'Não compartilhamos dados com terceiros',
        rightToForget: 'Dados são apagados automaticamente após logout'
      },
      features: [
        'Login sem senha',
        'Dados criptografados',
        'Controle total da privacidade',
        'Sem armazenamento permanente'
      ],
      supportContact: 'suporte@vaultzero.com',
      lastUpdated: new Date().toISOString()
    }

    // Em produção, você buscaria esses dados do banco baseado no domínio
    return NextResponse.json({
      success: true,
      metadata: siteMetadata
    })

  } catch (error) {
    console.error('Error fetching site metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userAddress } = body

    if (!sessionId || !userAddress) {
      return NextResponse.json(
        { error: 'SessionId and userAddress are required' },
        { status: 400 }
      )
    }

    // Aqui o site pode enviar dados específicos para o usuário que acabou de fazer login
    // Por exemplo: produtos recomendados, ofertas personalizadas, etc.
    const userSpecificData = {
      sessionId,
      userAddress,
      recommendations: [
        'Smartphone Samsung Galaxy',
        'Notebook Dell Inspiron',
        'Fone de Ouvido Bluetooth'
      ],
      notifications: [
        {
          type: 'welcome',
          message: 'Bem-vindo ao VaultZero Demo Store!',
          action: 'Explore nossos produtos'
        }
      ],
      loginTime: new Date().toISOString(),
      sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    return NextResponse.json({
      success: true,
      data: userSpecificData
    })

  } catch (error) {
    console.error('Error processing user data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
