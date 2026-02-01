# 🔐 VaultZero - Decentralized Authentication System

> **Passwordless authentication based on P2P blockchain with Self-Sovereign Identity (SSI)**

![Status](https://img.shields.io/badge/Status-MVP%20Functional-green)
![Core](https://img.shields.io/badge/Core-100%25-brightgreen)
![Mobile](https://img.shields.io/badge/Mobile-70%25-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 Main README](docs/README_PRINCIPAL.md) | Complete overview |
| [📐 Architecture](docs/ARCHITECTURE.md) | Diagrams and technical design |
| [🗺️ Roadmap](docs/ROADMAP.md) | Sprints and milestones |
| [📊 Code Analysis](docs/CODE_ANALYSIS.md) | Metrics and patterns |
| [📖 API Reference](docs/API_REFERENCE.md) | Endpoints and methods |
| [🔧 Setup Guide](docs/SETUP_GUIDE.md) | Installation and development |
| [❓ FAQ](docs/FAQ.md) | Frequently asked questions |
| [⚙️ Technical Spec](docs/TECHNICAL_SPEC.md) | Technical specifications |
| [🎨 UX Spec](docs/UX_SPEC.md) | User journey |

---

## 📁 Project Structure

```
VaultZero/
├── core/                    # P2P Backend (✅ Functional)
├── identity-vault-mobile/   # React Native App (🔄 70%)
├── sdk/                     # Integration SDK (✅ Functional)
├── website/                 # Next.js Demo (🔄 50%)
├── tests/                   # Automated tests
└── docs/                    # Centralized documentation
    ├── README_PRINCIPAL.md
    ├── ARCHITECTURE.md
    ├── ROADMAP.md
    ├── CODE_ANALYSIS.md
    ├── API_REFERENCE.md
    ├── SETUP_GUIDE.md
    ├── FAQ.md
    └── assets/
```

---

## 🚀 Quick Start

```bash
# 1. Core Backend
cd core && npm install && npm start

# 2. Mobile App
cd identity-vault-mobile && npm install && npx expo start

# 3. Website Demo
cd website && npm install && npm run dev
```

**Full guide**: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

---

## 🔑 Technologies

| Component | Stack |
|-----------|-------|
| **Core** | Node.js, TypeScript, libp2p |
| **Mobile** | React Native, Expo |
| **SDK** | TypeScript, SSE, QR Code |
| **Website** | Next.js 14, Tailwind CSS |
| **Crypto** | BIP39, Ed25519, AES-256-GCM |

---

## 🎯 Key Features

- 🔒 **Zero passwords** - Biometrics + QR Code
- 📱 **Your data, your control** - Full SSI
- 🌐 **Decentralized** - No central servers
- ⚡ **2-second login** - Superior UX
- 💳 **Integrated wallet** - Payments + crypto

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Clone: `git clone https://github.com/your-username/IdentityVault.git`
3. Install: `npm install`
4. Develop your feature
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**VaultZero** - The future of authentication, available today. 🚀
