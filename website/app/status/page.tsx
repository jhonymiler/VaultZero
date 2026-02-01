'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Server, Smartphone, Globe, CheckCircle, XCircle, RefreshCw, Users, Database, Zap, ArrowLeft, Wifi, Clock, Activity } from 'lucide-react'
import Link from 'next/link'
import NetworkActivityChart from '../../components/network-activity-chart'
import { Navigation } from '../../components/Navigation'

interface ServiceStatus {
  name: string
  url: string
  status: 'online' | 'offline' | 'checking'
  icon: any
  description: string
  stats?: any
}

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Core P2P Server',
      url: 'http://localhost:3000',
      status: 'checking',
      icon: Server,
      description: 'Servidor blockchain P2P descentralizado'
    },
    {
      name: 'Website VaultZero',
      url: 'http://localhost:3001',
      status: 'checking',
      icon: Globe,
      description: 'Interface web do sistema'
    },
    {
      name: 'Mobile App',
      url: 'http://localhost:8081',
      status: 'checking',
      icon: Smartphone,
      description: 'Aplicativo móvel React Native'
    },
    {
      name: 'Bootstrap Nodes',
      url: 'http://localhost:4001',
      status: 'checking',
      icon: Wifi,
      description: 'Nós de bootstrap globais'
    },
    {
      name: 'Identity Manager',
      url: 'http://localhost:5001',
      status: 'checking',
      icon: Users,
      description: 'Gerenciamento de identidades SSI'
    }
  ])

  const [networkStats, setNetworkStats] = useState({
    totalPeers: 12847,
    activeNodes: 256,
    totalTransactions: 1537428,
    uptime: '99.99%',
    avgLoginTime: '2.0s',
    systemUptime: '98d 12h'
  })

  const [regions, setRegions] = useState([
    { name: 'América do Norte', status: 'online', latency: '28ms' },
    { name: 'Europa', status: 'online', latency: '87ms' },
    { name: 'Ásia', status: 'online', latency: '142ms' },
    { name: 'América do Sul', status: 'online', latency: '45ms' }
  ])

  useEffect(() => {
    checkAllServices()
    const interval = setInterval(checkAllServices, 10000) // Check every 10 seconds
    
    return () => clearInterval(interval)
  }, [])

  const checkAllServices = () => {
    // Simula a checagem de serviços para a demonstração
    setServices(prev => prev.map(service => ({
      ...service,
      // Simular 90% de chance de estar online
      status: Math.random() > 0.1 ? 'online' : 'offline'
    })))

    // Simular estatísticas atualizadas
    setNetworkStats(prev => ({
      ...prev,
      totalPeers: prev.totalPeers + Math.floor(Math.random() * 10),
      activeNodes: 240 + Math.floor(Math.random() * 30),
      totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 100),
    }))

    // Simular latências regionais
    setRegions(prev => prev.map(region => ({
      ...region,
      latency: `${20 + Math.floor(Math.random() * 160)}ms`,
      status: Math.random() > 0.05 ? 'online' : 'offline'
    })))
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 py-8">
        {/* Voltar */}
        <div className="mb-8">
          <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Status da <span className="gradient-text">Rede</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Monitore o status da rede descentralizada VaultZero em tempo real.
          </p>
        </motion.div>

        {/* Status Geral */}
        <div className="glass-card p-8 mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Status do Sistema</h2>
            <button 
              onClick={checkAllServices}
              className="btn-secondary flex items-center gap-2 py-2 px-4"
            >
              <RefreshCw className="w-5 h-5" />
              Atualizar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-6 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Uptime da Rede</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{networkStats.uptime}</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Identidades Ativas</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(networkStats.totalPeers)}</div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-6 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Tempo Médio de Login</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{networkStats.avgLoginTime}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Serviços */}
        <div className="glass-card p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-8">Status dos Serviços</h2>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {services.map((service, index) => (
              <motion.div 
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <service.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{service.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{service.description}</p>
                  </div>
                </div>
                
                <div>
                  {service.status === 'checking' && (
                    <div className="flex items-center text-yellow-500">
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      <span>Verificando...</span>
                    </div>
                  )}
                  
                  {service.status === 'online' && (
                    <div className="flex items-center text-green-500">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span>Online</span>
                    </div>
                  )}
                  
                  {service.status === 'offline' && (
                    <div className="flex items-center text-red-500">
                      <XCircle className="w-4 h-4 mr-1" />
                      <span>Offline</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Bootstrap Nodes Globais */}
        <div className="glass-card p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-8">Bootstrap Nodes Globais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.map((region, index) => (
              <motion.div 
                key={region.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center"
              >
                <div className={`w-3 h-3 rounded-full mx-auto mb-4 ${region.status === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{region.name}</h3>
                <p className={`text-sm ${region.status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
                  {region.status === 'online' ? 'Online' : 'Offline'}
                </p>
                {region.status === 'online' && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Latência: {region.latency}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Estatísticas detalhadas */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-8">Estatísticas da Rede</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Nós Ativos</h3>
              </div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{formatNumber(networkStats.activeNodes)}</div>
              <div className="mt-2 text-sm text-gray-500">nós conectados à rede P2P</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Transações</h3>
              </div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{formatNumber(networkStats.totalTransactions)}</div>
              <div className="mt-2 text-sm text-gray-500">transações processadas</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Uptime do Sistema</h3>
              </div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{networkStats.systemUptime}</div>
              <div className="mt-2 text-sm text-gray-500">desde o último restart</div>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Os dados são atualizados a cada 10 segundos. Última atualização: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Gráfico de Atividade da Rede */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-8">Atividade da Rede</h2>
          
          <NetworkActivityChart />
        </div>
        </div>
      </div>
    </div>
  )
}
