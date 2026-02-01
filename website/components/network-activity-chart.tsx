'use client'

import React, { useEffect, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'

// Registrar componentes do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface NetworkActivityChartProps {
  darkMode?: boolean
}

const NetworkActivityChart: React.FC<NetworkActivityChartProps> = ({ darkMode = false }) => {
  const [chartData, setChartData] = useState({
    labels: Array(24).fill('').map((_, i) => `${i}h`),
    datasets: [
      {
        label: 'Logins',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Transações',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  })

  useEffect(() => {
    // Gera dados iniciais realistas para o gráfico
    generateChartData()

    // Atualiza o gráfico periodicamente
    const interval = setInterval(() => {
      generateChartData(true)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const generateChartData = (update = false) => {
    // Determina o horário atual para realismo
    const now = new Date()
    const currentHour = now.getHours()
    
    // Gera dados baseados em padrões realistas de uso
    const loginData = Array(24).fill(0).map((_, hour) => {
      // Tráfego mais alto durante o horário comercial (8h-18h)
      let baseTraffic = hour >= 8 && hour <= 18 ? 80 + Math.random() * 60 : 15 + Math.random() * 30
      
      // Picos matinais e entardecer
      if (hour === 9 || hour === 10 || hour === 14 || hour === 15) {
        baseTraffic *= 1.4
      }
      
      // Tráfego muito baixo durante a madrugada
      if (hour >= 0 && hour <= 5) {
        baseTraffic *= 0.2
      }
      
      return Math.floor(baseTraffic)
    })
    
    // Transações são ~2.5x os logins
    const transactionData = loginData.map(val => Math.floor(val * 2.5 + Math.random() * 15))
    
    if (update) {
      // Se for uma atualização, apenas modifica levemente os dados existentes para
      // criar um efeito de movimento no gráfico
      setChartData(prev => {
        const newLoginData = [...prev.datasets[0].data]
        const newTransactionData = [...prev.datasets[1].data]
        
        // Pequena variação aleatória nos dados atuais para simular atividade em tempo real
        newLoginData[currentHour] = Math.max(1, newLoginData[currentHour] + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5))
        newTransactionData[currentHour] = Math.max(1, newTransactionData[currentHour] + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 8))
        
        return {
          ...prev,
          datasets: [
            {
              ...prev.datasets[0],
              data: newLoginData
            },
            {
              ...prev.datasets[1],
              data: newTransactionData
            }
          ]
        }
      })
    } else {
      // Atualização inicial com dados completos
      setChartData({
        labels: Array(24).fill('').map((_, i) => `${i}h`),
        datasets: [
          {
            label: 'Logins',
            data: loginData,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Transações',
            data: transactionData,
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            fill: true,
            tension: 0.4,
          }
        ]
      })
    }
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#e2e8f0' : '#475569',
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
        },
        ticks: {
          color: darkMode ? '#94a3b8' : '#475569',
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
        },
        ticks: {
          color: darkMode ? '#94a3b8' : '#475569',
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  }

  return (
    <div className="w-full h-full p-2">
      <Line data={chartData} options={options} />
    </div>
  )
}

export default NetworkActivityChart
