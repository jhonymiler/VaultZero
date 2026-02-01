# 🔐 VaultZero Core - P2P Backend

The core backend of VaultZero is a decentralized authentication system built on P2P blockchain technology.

## 🎯 Overview

VaultZero Core provides a passwordless authentication infrastructure using:
- **P2P Network**: libp2p for peer discovery and communication
- **Blockchain**: Custom blockchain for identity verification
- **Self-Sovereign Identity (SSI)**: Users control their own identity data
- **WebAuthn/FIDO2**: Hardware-backed authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
cd core
npm install
```

### Running

```bash
# Start as bootstrap node
npm run start:bootstrap

# Start as peer node (in another terminal)
npm run start:peer

# Run P2P tests
npm run test:p2p

# Build
npm run build
```

## 📁 Project Structure

```
core/
├── src/
│   ├── app.ts              # Main application entry
│   ├── blockchain/         # Blockchain implementation
│   ├── p2p/               # P2P network layer
│   ├── auth/              # Authentication logic
│   ├── crypto/            # Cryptographic utilities
│   └── test/              # Test files
├── data/                  # Blockchain data storage
└── logs/                  # Application logs
```

## 🔑 Key Features

### P2P Network
- Peer discovery using mDNS and DHT
- GossipSub for message propagation
- WebRTC support for browser peers
- NAT traversal

### Blockchain
- Proof of Authority (PoA) consensus
- Identity transaction validation
- Distributed ledger storage
- Block synchronization

### Authentication
- QR Code-based challenge/response
- Biometric verification support
- Session management
- Multi-device support

### Security
- Ed25519 signatures
- AES-256-GCM encryption
- BIP39 mnemonic phrases
- Secure key derivation (PBKDF2)

## ⚙️ Configuration

Create a `.env` file in the core directory (see `.env.example` in project root):

```env
# Server
CORE_PORT=3000
CORE_HOST=localhost

# P2P Network
P2P_PORT=8163
P2P_WEBSOCKET_PORT=8087
MAX_PEERS=50

# Blockchain
CONSENSUS_THRESHOLD=0.67
BLOCK_TIME=10000

# Logging
LOG_LEVEL=info
BLOCKCHAIN_DEBUG=true
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Test P2P network
npm run test:p2p
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/challenge` - Generate authentication challenge
- `POST /api/auth/verify` - Verify authentication response
- `GET /api/auth/status` - Check authentication status

### Identity
- `POST /api/identity/create` - Create new identity
- `GET /api/identity/:id` - Get identity information
- `PUT /api/identity/:id` - Update identity

### Blockchain
- `GET /api/blockchain/info` - Get blockchain information
- `GET /api/blockchain/block/:hash` - Get block by hash
- `GET /api/blockchain/peers` - List connected peers

## 🔧 Development

### Adding a New Feature

1. Create feature branch
2. Implement in appropriate module
3. Add tests
4. Update documentation
5. Submit pull request

### Code Style

- Use TypeScript
- Follow ESLint configuration
- Document public APIs
- Write unit tests

## 🛠️ Technologies

| Technology | Purpose |
|------------|---------|
| **libp2p** | P2P networking |
| **TypeScript** | Type-safe development |
| **Express** | REST API |
| **LevelDB** | Blockchain storage |
| **WebSocket** | Real-time communication |
| **@simplewebauthn** | FIDO2/WebAuthn |

## 📊 Performance

- **Authentication**: < 2 seconds
- **Block creation**: ~10 seconds
- **Peer discovery**: < 5 seconds
- **Transaction throughput**: ~100 tx/s

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Peer Connection Issues
- Check firewall settings
- Verify bootstrap node is running
- Review P2P_PORT configuration

### Database Corruption
```bash
# Clear blockchain data (WARNING: destroys local data)
rm -rf data/local-ledger
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines

---

**Part of [VaultZero](../README.md)** - The future of authentication 🚀
