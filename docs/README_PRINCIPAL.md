# 🔐 VaultZero - Sistema de Autenticação Descentralizado

![Status](https://img.shields.io/badge/Status-MVP%20Funcional-green)
![Core](https://img.shields.io/badge/Core-Funcional-brightgreen)
![Mobile](https://img.shields.io/badge/Mobile-70%25-yellow)
![SDK](https://img.shields.io/badge/SDK-Funcional-brightgreen)

> **Autenticação sem senhas baseada em blockchain P2P com Self-Sovereign Identity (SSI)**

---

## 🚀 O que é VaultZero?

VaultZero é um sistema revolucionário que elimina senhas através de:

- **🔑 Login por QR Code + Biometria** - 2 segundos para autenticar
- **📱 Identidade no seu dispositivo** - Seus dados, seu controle
- **🌐 Rede P2P descentralizada** - Sem servidores centrais para hackear
- **💳 Carteira digital integrada** - Login + pagamentos em um app
- **💰 Wallet crypto nativa** - Endereço Ethereum compatível

---

## 📚 Documentação

| Documento | Descrição |
|-----------|-----------|
| [📐 Arquitetura](./ARCHITECTURE.md) | Diagramas e design técnico |
| [🗺️ Roadmap](./ROADMAP.md) | Sprints e milestones |
| [📊 Análise de Código](./CODE_ANALYSIS.md) | Métricas e padrões |
| [📖 API Reference](./API_REFERENCE.md) | Endpoints e métodos |
| [🔧 Setup Guide](./SETUP_GUIDE.md) | Instalação e desenvolvimento |
| [🎨 UX Spec](./UX_SPEC.md) | Jornada do usuário |
| [⚙️ Technical Spec](./TECHNICAL_SPEC.md) | Especificações técnicas |

---

## 🏗️ Estrutura do Projeto

```
IdentityVault/
├── core/                 # Backend P2P (✅ Funcional)
│   └── src/
│       ├── network/      # libp2p, DHT, Gossip
│       ├── blockchain/   # Consensus, Identity
│       └── auth/         # WebAuthn, Biometric
├── identity-vault-mobile/# App React Native (🔄 70%)
│   └── src/
│       ├── services/     # P2P, Identity, Crypto
│       └── screens/      # UI components
├── sdk/                  # SDK Integração (✅ Funcional)
│   └── src/
│       └── VaultZeroSDK.ts
├── website/              # Demo Next.js (🔄 50%)
│   └── app/
│       ├── demo/
│       └── api/
└── docs/                 # Documentação
```

---

## 🚀 Quick Start

### Requisitos
- Node.js 20+
- npm ou yarn
- React Native CLI (para mobile)

### 1. Core (Backend P2P)
```bash
cd core
npm install
npm start
# Servidor rodando em http://localhost:3000
```

### 2. Mobile (React Native)
```bash
cd identity-vault-mobile
npm install
npx expo start
```

### 3. Website (Demo)
```bash
cd website
npm install
npm run dev
# Demo em http://localhost:3001
```

---

## 🔑 Tecnologias

| Componente | Stack |
|------------|-------|
| **Core** | Node.js, TypeScript, libp2p, Express |
| **Mobile** | React Native, Expo, TypeScript |
| **SDK** | TypeScript, SSE, QR Code |
| **Website** | Next.js 14, Tailwind CSS |
| **Crypto** | BIP39, Ed25519, AES-256-GCM |
| **Auth** | WebAuthn, Passkeys, Biometric |

---

## 📈 Status Atual

| Módulo | Progresso | Features |
|--------|-----------|----------|
| **Core P2P** | ✅ 100% | libp2p, DHT, Gossip, Consensus |
| **Auth Backend** | ✅ 100% | WebAuthn, Biometric, Passkeys |
| **Mobile Services** | ✅ 90% | Identity, P2P, Crypto |
| **Mobile UI** | 🔄 60% | Telas básicas funcionando |
| **SDK** | ✅ 100% | Sessions, QR, SSE |
| **Website** | 🔄 50% | Landing, Demo basic |

---

## 🤝 Contribuindo

1. Fork do repositório
2. Clone localmente
3. Instale dependências: `npm install`
4. Crie sua branch: `git checkout -b feature/nome`
5. Teste: `npm test`
6. Commit: `git commit -m 'feat: descrição'`
7. Push: `git push origin feature/nome`
8. Abra um Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](../LICENSE) para detalhes.

---

**VaultZero** - Autenticação do futuro, disponível hoje. 🚀
