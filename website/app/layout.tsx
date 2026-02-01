import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '../components/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VaultZero - A Revolução da Autenticação sem Senhas',
  description: 'Plataforma revolucionária de autenticação biométrica descentralizada. Zero senhas, máxima segurança. Blockchain P2P, Self-Sovereign Identity e criptografia quântica.',
  keywords: [
    'vaultzero', 'autenticação sem senha', 'biometria', 'blockchain', 'p2p', 
    'descentralizado', 'zero-knowledge', 'quantum-resistant', 'identity', 
    'self-sovereign', 'passwordless', 'authentication', 'security', 'crypto'
  ],
  authors: [{ name: 'VaultZero Team', url: 'https://vaultzero.dev' }],
  creator: 'VaultZero',
  publisher: 'VaultZero',
  robots: 'index, follow',
  openGraph: {
    title: 'VaultZero - A Revolução da Autenticação sem Senhas',
    description: 'Plataforma revolucionária de autenticação biométrica descentralizada. Zero senhas, máxima segurança.',
    type: 'website',
    url: 'https://vaultzero.dev',
    siteName: 'VaultZero',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'VaultZero - Autenticação sem Senhas',
      },
    ],
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VaultZero - A Revolução da Autenticação sem Senhas',
    description: 'Plataforma revolucionária de autenticação biométrica descentralizada.',
    images: ['/og-image.png'],
    creator: '@vaultzero',
  },
  metadataBase: new URL('https://vaultzero.dev'),
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/pt-br',
      'en-US': '/en',
    },
  },
  verification: {
    google: 'google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#667eea" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
