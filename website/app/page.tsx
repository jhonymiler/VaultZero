'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Users, Zap, Lock, Globe, Smartphone, QrCode, Key, Eye, Check, CheckCircle, Computer } from 'lucide-react';
import { Navigation } from '../components/Navigation';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="gradient-bg">
      {/* Navegação */}
      <Navigation />
      
      {/* Conteúdo Principal */}
      <main className="pt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Hero Principal */}
          <div className="text-center mb-20">
            <div className="glass-card max-w-7xl mx-auto p-12 animate-scale-in">
              <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight animate-fade-in delay-100">
                <span className="gradient-text">VaultZero</span>
                <br />
                <span className="text-gray-800 dark:text-gray-200">Login sem Senhas</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 mb-12 leading-relaxed max-w-4xl mx-auto animate-fade-in delay-200">
                Sistema revolucionário baseado em <strong className="text-blue-600 dark:text-blue-400">blockchain P2P</strong> que 
                elimina senhas para sempre. <strong className="text-purple-600 dark:text-purple-400">Biometria local</strong>, 
                <strong className="text-green-600 dark:text-green-400"> Self-Sovereign Identity</strong> e 
                <strong className="text-red-600 dark:text-red-400"> controle total</strong> da sua identidade digital.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16 animate-fade-in delay-300">
                <Link href="/demo" className="btn-primary">
                  <QrCode className="w-5 h-5" />
                  Testar Demo
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="btn-secondary">
                  <Shield className="w-5 h-5" />
                  Criar Identidade
                </Link>
              </div>

              {/* Stats em tempo real */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in delay-400">
                <div className="text-center">
                  <div className="stat-number">12,847+</div>
                  <div className="text-gray-600 dark:text-gray-400 font-semibold">Identidades Ativas</div>
                </div>
                <div className="text-center">
                  <div className="stat-number">99.99%</div>
                  <div className="text-gray-600 dark:text-gray-400 font-semibold">Uptime P2P</div>
                </div>
                <div className="text-center">
                  <div className="stat-number">2.0s</div>
                  <div className="text-gray-600 dark:text-gray-400 font-semibold">Login Médio</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparativo de Experiência */}
          <section className="mb-20">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                <span className="gradient-text">15x mais rápido</span> que senhas
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Compare o login tradicional (30 segundos) com VaultZero (2 segundos)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-card p-8 animate-fade-in delay-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Login com Senha</h3>
                  <div className="text-red-500 font-bold">30s</div>
                </div>
                <ol className="space-y-4 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-500 w-8 h-8 rounded-full flex items-center justify-center">1</div>
                    <span>Digitar email (8s)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-500 w-8 h-8 rounded-full flex items-center justify-center">2</div>
                    <span>Tentar lembrar senha (10s)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-500 w-8 h-8 rounded-full flex items-center justify-center">3</div>
                    <span>Digitar senha (8s)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-500 w-8 h-8 rounded-full flex items-center justify-center">4</div>
                    <span>Esperar processamento (4s)</span>
                  </li>
                </ol>
              </div>

              <div className="glass-card p-8 animate-fade-in delay-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Login VaultZero</h3>
                  <div className="text-green-500 font-bold">2s</div>
                </div>
                <ol className="space-y-4 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-500 w-8 h-8 rounded-full flex items-center justify-center">1</div>
                    <span>Escanear QR Code (1s)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-500 w-8 h-8 rounded-full flex items-center justify-center">2</div>
                    <span>Confirmar biometria (1s)</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-500 w-8 h-8 rounded-full flex items-center justify-center">3</div>
                    <span>Pronto! Você está dentro!</span>
                  </li>
                </ol>
              </div>
            </div>
          </section>

          {/* Como Funciona */}
          <section className="mb-20">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Como <span className="gradient-text">Funciona</span>?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Três passos simples para nunca mais precisar de senhas
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="feature-card text-center animate-fade-in delay-100">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-float">
                  <Key className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">1. Gere sua Identidade</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Baixe o app, configure biometria e receba 12 palavras de recuperação. 
                  Sua identidade blockchain única é criada localmente.
                </p>
              </div>

              <div className="feature-card text-center animate-fade-in delay-200">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center animate-float delay-100">
                  <QrCode className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">2. Escaneie QR Code</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Sites mostram QR Code do VaultZero. Aponte a câmera do app 
                  e confirme com sua biometria local.
                </p>
              </div>

              <div className="feature-card text-center animate-fade-in delay-300">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center animate-float delay-200">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">3. Login Instantâneo</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Pronto! Você está logado em segundos. Sem senhas, sem dados 
                  pessoais expostos, sem riscos de vazamento.
                </p>
              </div>
            </div>

            <div className="text-center">
              <Link href="/demo" className="btn-secondary">
                <QrCode className="w-5 h-5" />
                Ver Demonstração Completa
              </Link>
            </div>
          </section>

          {/* Tecnologia */}
          <section className="mb-20">
            <div className="glass-card p-12 text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Tecnologia de <span className="gradient-text">Vanguarda</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
                Nossa solução combina blockchain P2P, biometria avançada e Self-Sovereign Identity 
                para criar a experiência de autenticação mais segura e conveniente do mundo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="feature-card">
                <div className="mb-6">
                  <Lock className="w-12 h-12 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Blockchain P2P</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Rede descentralizada sem pontos únicos de falha. Seus dados ficam apenas com você, 
                  usando consensus PBFT e armazenamento LevelDB/IndexedDB.
                </p>
              </div>

              <div className="feature-card">
                <div className="mb-6">
                  <Eye className="w-12 h-12 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Biometria Local</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Reconhecimento facial/digital que nunca sai do seu dispositivo usando Secure Enclave/TEE.
                  Zero template biométrico em servidores.
                </p>
              </div>

              <div className="feature-card">
                <div className="mb-6">
                  <Shield className="w-12 h-12 text-green-500 dark:text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Self-Sovereign Identity</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Você controla 100% da sua identidade digital. Sem intermediários ou autoridades centrais.
                  Dados compartilhados seletivamente sob seu controle.
                </p>
              </div>

              <div className="feature-card">
                <div className="mb-6">
                  <Zap className="w-12 h-12 text-yellow-500 dark:text-yellow-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Zero-Knowledge Proofs</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Prove sua identidade sem revelar informações pessoais usando criptografia Ed25519, AES-256-GCM
                  e hash SHA-256, protegendo sua privacidade.
                </p>
              </div>

              <div className="feature-card">
                <div className="mb-6">
                  <Users className="w-12 h-12 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Multi-Dispositivo</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Sincronize identidade entre dispositivos usando QR Code + código de 6 dígitos ou recuperação 
                  via 12 palavras padrão BIP39.
                </p>
              </div>

              <div className="feature-card">
                <div className="mb-6">
                  <Globe className="w-12 h-12 text-teal-500 dark:text-teal-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Recuperação Segura</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  12 palavras BIP39 padrão garantem que você nunca perderá acesso, mesmo se trocar de dispositivo
                  ou perder seu celular.
                </p>
              </div>
            </div>
          </section>

          {/* Para quem é */}
          <section className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Para <span className="gradient-text">Quem</span> é?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Usuários */}
              <div className="glass-card p-8">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
                  <Users className="text-blue-500" />
                  Usuários
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400">Pessoas <strong>cansadas de senhas</strong> que esquecem frequentemente</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400">Preocupados com <strong>privacidade</strong> de dados pessoais</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400"><strong>Usuários móveis</strong> que precisam de autenticação rápida</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400"><strong>Profissionais</strong> que fazem login em múltiplos serviços</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400">Usuários <strong>crypto/Web3</strong> familiarizados com wallets</span>
                  </li>
                </ul>
              </div>
              
              {/* Empresas */}
              <div className="glass-card p-8">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-3">
                  <Computer className="text-purple-500" />
                  Empresas
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400"><strong>Redução de custos</strong> em infraestrutura de autenticação</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400"><strong>Segurança melhorada</strong> sem senhas para serem vazadas</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400"><strong>Experiência superior</strong> com login em segundos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400"><strong>Compliance</strong> automática com LGPD/GDPR</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-600 dark:text-gray-400"><strong>Web3 Ready</strong> para o futuro da internet</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>


          {/* CTA Final */}
          <section className="text-center">
            <div className="glass-card p-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                Pronto para o <span className="gradient-text">Futuro</span>?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
                Junte-se à revolução da autenticação descentralizada. Crie sua identidade blockchain 
                agora e experimente a liberdade de nunca mais precisar de senhas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/demo" className="btn-primary">
                  <QrCode className="w-5 h-5" />
                  Testar Demonstração
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/login" className="btn-secondary">
                  <Shield className="w-5 h-5" />
                  Criar Identidade Grátis
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-card mt-20 p-12 mx-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">VaultZero</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Sistema revolucionário de autenticação sem senhas baseado em blockchain P2P.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Produtos</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">App Mobile</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Extensão de Browser</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">App Desktop</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">SDK para Desenvolvedores</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Recursos</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Documentação</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">API</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Status da Rede</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Segurança</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Empresa</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Sobre</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Blog</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Carreiras</Link></li>
                <li><Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">Contato</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              © 2025 VaultZero. Código aberto. Identidade sua.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-500 hover:text-blue-600">Termos</Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600">Privacidade</Link>
              <Link href="#" className="text-gray-500 hover:text-blue-600">GitHub</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}