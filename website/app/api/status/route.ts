import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock data representing the system status
    const statusData = {
      timestamp: new Date().toISOString(),
      system: 'VaultZero',
      version: '1.0.0',
      status: 'operational',
      uptime: '99.9%',
      services: {
        core: {
          status: 'online',
          url: 'http://localhost:3000',
          version: '1.0.0',
          lastCheck: new Date().toISOString()
        },
        website: {
          status: 'online',
          url: 'http://localhost:3001',
          version: '1.0.0',
          lastCheck: new Date().toISOString()
        },
        mobile: {
          status: 'online',
          url: 'http://localhost:8081',
          version: '1.0.0',
          lastCheck: new Date().toISOString()
        }
      },
      network: {
        peers: 8,
        activeNodes: 3,
        totalTransactions: 1247,
        blockHeight: 156,
        networkHealth: 'excellent'
      },
      security: {
        encryptionStatus: 'active',
        quantumResistant: true,
        zeroKnowledgeProofs: true,
        biometricAuth: true
      },
      performance: {
        avgResponseTime: '125ms',
        throughput: '1200 tx/s',
        memoryUsage: '45%',
        cpuUsage: '23%'
      }
    }

    return NextResponse.json(statusData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('Error in status API:', error)
    
    return NextResponse.json({
      error: 'Failed to get system status',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
