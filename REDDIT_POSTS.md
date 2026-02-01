# 🚀 VaultZero - Reddit Promotion Guide

This document contains the best Reddit communities to post about VaultZero and ready-to-use posts for each type of community.

---

## 📋 Best Reddit Communities to Post

### **Tier 1 - Highest Priority (Most Relevant)**

| Subreddit | Members | Best For | Rules to Check |
|-----------|---------|----------|----------------|
| **r/opensource** | 30K+ | Open source project showcase | Read posting guidelines |
| **r/reactnative** | 100K+ | React Native community | Tag as [Showcase] |
| **r/typescript** | 200K+ | TypeScript projects | Technical content welcome |
| **r/node** | 150K+ | Node.js backend projects | Show code examples |
| **r/CryptoTechnology** | 1.3M | Blockchain tech discussions | Focus on tech, not price |
| **r/programming** | 5.5M | General programming | High-quality content only |

### **Tier 2 - Good Reach**

| Subreddit | Members | Best For |
|-----------|---------|----------|
| **r/coolgithubprojects** | 200K+ | GitHub project showcase |
| **r/sideproject** | 200K+ | Side projects and MVPs |
| **r/webdev** | 1.5M | Web development |
| **r/javascript** | 2.5M | JavaScript community |
| **r/selfhosted** | 500K+ | Self-hosted solutions |
| **r/crypto** | 5.9M | Cryptocurrency (careful with rules) |

### **Tier 3 - Niche Communities**

| Subreddit | Members | Best For |
|-----------|---------|----------|
| **r/blockchain** | 200K+ | Blockchain discussions |
| **r/decentralization** | 50K+ | Decentralization tech |
| **r/privacy** | 2M | Privacy-focused tech |
| **r/security** | 500K+ | Security projects |
| **r/Entrepreneur** | 1M | Startup/business angle |
| **r/startups** | 1.5M | Tech startups |

---

## 📝 Post Templates

### **Template 1: For r/opensource, r/coolgithubprojects, r/sideproject**

```markdown
# VaultZero - Passwordless Authentication with P2P Blockchain & Self-Sovereign Identity

Hey everyone! I've been working on an open-source passwordless authentication system and just released the initial MVP. Would love to get feedback from the community!

## What is VaultZero?

VaultZero is a decentralized authentication system that eliminates passwords entirely using:
- **P2P Blockchain** (libp2p) - No central servers
- **Self-Sovereign Identity (SSI)** - Users control their own data
- **Biometric Authentication** - Face ID, Touch ID, Fingerprint
- **QR Code Login** - Scan to authenticate on any device

## The Problem

- 81% of data breaches are caused by weak/stolen passwords
- Average person has 100+ passwords to remember
- Centralized auth = single point of failure
- Users don't own their identity data

## The Solution

VaultZero uses a P2P blockchain network where:
1. Your identity lives on YOUR device (mobile app)
2. No passwords, no servers, no central database
3. Authenticate with biometrics + QR codes
4. Works offline, syncs when online

## Tech Stack

- **Core Backend**: Node.js + TypeScript + libp2p
- **Mobile App**: React Native + Expo (iOS/Android)
- **Website**: Next.js 14 + Tailwind CSS
- **SDK**: Easy integration for developers
- **Crypto**: Ed25519, AES-256-GCM, BIP39

## Architecture

- P2P network with Kademlia DHT
- GossipSub for message propagation
- Proof of Authority consensus
- Hardware-backed key storage
- Zero-knowledge proofs

## Components

✅ **Core (100%)**: P2P backend fully functional
🔄 **Mobile (70%)**: iOS/Android app in progress
🔄 **Website (50%)**: Demo and dashboard
✅ **SDK (100%)**: Integration library ready

## Repository

GitHub: https://github.com/jhonymiler/VaultZero

```bash
git clone https://github.com/jhonymiler/VaultZero.git
cd VaultZero
./setup.sh
```

## Looking For

- **Contributors**: Especially React Native, libp2p, or crypto experts
- **Feedback**: Architecture, security, UX improvements
- **Testers**: Help test on different devices/platforms
- **Ideas**: Features, use cases, integrations

## Why I Built This

After working with traditional auth systems for years, I got frustrated with:
- Password complexity requirements
- 2FA fatigue
- Centralized data breaches
- Users forgetting passwords constantly

I wanted to create something that's both more secure AND easier to use.

## Current Status

MVP is functional! You can:
- Create decentralized identity
- Authenticate with biometrics
- Login via QR code scanning
- Integrate into your apps with SDK

## Roadmap

- [ ] Complete mobile app features
- [ ] Add Web3 integration
- [ ] Multi-device sync improvements
- [ ] Plugin ecosystem
- [ ] Enterprise features

## License

MIT - Free and open source forever

---

**Star the repo if you find this interesting! ⭐**

Would love to hear your thoughts, criticisms, and ideas!
```

---

### **Template 2: For r/reactnative, r/typescript, r/node**

```markdown
# [Showcase] Built a Passwordless Auth System with React Native + libp2p

Just finished the MVP of a decentralized authentication system and wanted to share with the community!

## Stack

**Frontend:**
- React Native + Expo
- TypeScript
- Expo Router for navigation
- Expo LocalAuth for biometrics
- Secure storage with hardware backing

**Backend:**
- Node.js + TypeScript
- libp2p for P2P networking
- LevelDB for local storage
- WebSocket + REST API

**Crypto:**
- Ed25519 signatures
- AES-256-GCM encryption
- BIP39 mnemonic phrases

## What It Does

Passwordless authentication using:
- Mobile app scans QR code
- Biometric verification (Face ID/Touch ID)
- P2P blockchain validates identity
- No central servers needed

## Interesting Technical Challenges

1. **P2P on Mobile**: Getting libp2p to work reliably on mobile networks with NAT traversal
2. **Offline-First**: Making authentication work without internet, sync when available
3. **Security**: Hardware-backed key storage, secure enclave integration
4. **Cross-Platform**: Making biometrics work consistently on iOS/Android

## Architecture Highlights

```
User Device (Mobile)          Website
     |                           |
     | Scan QR Code              | Generate QR
     |                           |
     | Biometric Auth            | Wait for response
     |                           |
     +-------- P2P Network ------+
              |
         Blockchain
         Validation
```

## Code Quality

- Full TypeScript
- ESLint + Prettier
- Unit tests with Jest
- E2E tests with Playwright
- CI/CD with GitHub Actions

## Open Source

GitHub: https://github.com/jhonymiler/VaultZero

- MIT License
- Accepting contributions
- Issues and PRs welcome

## Looking For

- Code review feedback
- Security audit volunteers
- React Native performance optimization tips
- Contributors interested in P2P/blockchain tech

## Quick Start

```bash
git clone https://github.com/jhonymiler/VaultZero.git
cd VaultZero/identity-vault-mobile
npm install
npx expo start
```

---

Happy to answer any technical questions! 🚀
```

---

### **Template 3: For r/CryptoTechnology, r/blockchain, r/decentralization**

```markdown
# Built a Self-Sovereign Identity System Using P2P Blockchain

## TL;DR

Open-source passwordless authentication using libp2p + blockchain where users truly own their identity data. No central servers, no passwords, full privacy.

## The Concept

Traditional authentication has fundamental problems:
- Centralized identity providers (Google, Facebook, Auth0)
- Single points of failure
- Users don't own their data
- Passwords are inherently insecure

**Self-Sovereign Identity (SSI)** solves this by giving users complete control over their identity.

## Technical Architecture

### Blockchain Layer
- **Consensus**: Proof of Authority (PoA)
- **Storage**: Distributed ledger with LevelDB
- **Network**: libp2p with Kademlia DHT
- **Propagation**: GossipSub protocol
- **Block time**: ~10 seconds

### Identity Format
```
DID: did:p2p:{hash}

Identity Document:
{
  "id": "did:p2p:abc123...",
  "publicKey": "Ed25519 key",
  "authentication": ["biometric", "passkey"],
  "created": "2026-02-01T00:00:00Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "signature": "..."
  }
}
```

### Cryptography
- **Signing**: Ed25519 (fast, quantum-resistant ready)
- **Encryption**: AES-256-GCM
- **Key Derivation**: PBKDF2 from BIP39 mnemonic
- **Recovery**: 12/24 word seed phrases

### P2P Network
- **Peer Discovery**: mDNS + DHT
- **NAT Traversal**: STUN/TURN + hole punching
- **Transport**: TCP, WebSocket, WebRTC
- **Max Peers**: 50 (configurable)
- **Message Size**: 1MB max

## How Authentication Works

1. **Identity Creation**
   ```
   User → Generate Seed Phrase (BIP39)
        → Derive Ed25519 Keys
        → Create DID
        → Broadcast to Network
        → Stored in Distributed Ledger
   ```

2. **Authentication Flow**
   ```
   Website → Generate Challenge (QR Code)
   User → Scan QR with Mobile App
        → Biometric Verification
        → Sign Challenge with Private Key
        → Broadcast Proof to P2P Network
   Website → Verify Signature via Blockchain
          → Grant Access
   ```

3. **Decentralization**
   - No central authority
   - Byzantine Fault Tolerant (67% threshold)
   - Works offline (local-first)
   - Syncs when online

## Security Features

- Hardware-backed key storage (Secure Enclave/TEE)
- Biometric authentication required for signing
- Zero-knowledge proofs for privacy
- No password storage anywhere
- End-to-end encrypted communication
- Immutable identity records

## Advantages Over Traditional Auth

| Feature | Traditional | VaultZero |
|---------|-------------|-----------|
| Password | Yes | No |
| Central Server | Required | None |
| Single Point of Failure | Yes | No |
| Data Ownership | Provider | User |
| Offline | No | Yes |
| Privacy | Limited | Full |
| Recovery | Email/SMS | Seed Phrase |

## Performance Metrics

- Authentication: < 2 seconds
- Peer discovery: < 5 seconds
- Block creation: ~10 seconds
- Tx throughput: ~100 tx/s
- Network overhead: Minimal (P2P)

## Current Implementation

**Status:** MVP Functional

- ✅ P2P blockchain core
- ✅ DID creation/management
- ✅ Ed25519 crypto
- ✅ Biometric auth
- 🔄 Multi-device sync (70%)
- 🔄 Zero-knowledge proofs (planned)
- 🔄 IPFS integration (planned)

## Open Source

GitHub: https://github.com/jhonymiler/VaultZero
License: MIT

**Tech Stack:**
- Node.js + TypeScript (backend)
- libp2p (P2P networking)
- React Native (mobile)
- Next.js (web)

## Discussion Points

1. **Consensus Algorithm**: PoA works for MVP, but considering BFT or PoS for production
2. **Scalability**: Current DHT can handle ~10K peers, need sharding for more
3. **Privacy**: Exploring ZK-SNARKs for identity verification without revealing data
4. **Interoperability**: Working on W3C DID compliance

## Looking For

- Security researchers for audits
- Blockchain experts for consensus optimization
- Cryptographers for ZK implementation
- Contributors interested in SSI/DID

---

**Thoughts on the architecture? Suggestions for improvements?**

This is a complex problem space and I'd love to hear from the community!
```

---

### **Template 4: For r/privacy, r/security**

```markdown
# Eliminating Passwords: A Privacy-First Authentication System

## The Password Problem

81% of data breaches involve stolen or weak passwords. Yet we continue to use them because there hasn't been a better alternative that's both secure AND private.

## What I Built

VaultZero - An open-source authentication system where:
- **No passwords** - Ever
- **No central database** - Your data stays on YOUR device
- **No tracking** - Zero telemetry, zero surveillance
- **Full privacy** - You control your identity

## Privacy Features

### 1. Self-Sovereign Identity
- Your identity lives on your device
- No company owns your data
- No central registry
- You can delete it anytime

### 2. Zero Data Collection
- No analytics
- No telemetry
- No phone home
- No user tracking
- Open source - verify yourself

### 3. Decentralized Architecture
- P2P blockchain network
- No central servers to hack
- No single point of failure
- No company can be subpoenaed for your data

### 4. End-to-End Encryption
- All communication encrypted
- Private keys never leave your device
- Hardware-backed key storage
- AES-256-GCM + Ed25519

### 5. Minimal Data Exposure
- Only share what's needed
- Selective disclosure
- Zero-knowledge proofs (planned)
- No metadata leakage

## How It Works (Privacy Perspective)

**Traditional Auth:**
```
You → Password → Company Server → Store Password Hash
                                 → Store Login Logs
                                 → Track Your Activity
                                 → Sell Your Data (maybe)
```

**VaultZero:**
```
You → Biometric (local only) → Sign Challenge → P2P Network
                                               → Verify
                                               → Done

No storage, no logs, no tracking
```

## Security Without Surveillance

- **Biometric data** never leaves your device
- **Private keys** stored in secure enclave
- **No login history** collected
- **No IP logging** in the protocol
- **No session tracking** possible

## GDPR Compliance by Design

- ✅ Data minimization
- ✅ Right to erasure
- ✅ Data portability
- ✅ Privacy by design
- ✅ No consent needed (no data collected)

## Threat Model

**What VaultZero Protects Against:**
- Password breaches ✅
- Phishing attacks ✅
- Credential stuffing ✅
- Database leaks ✅
- Man-in-the-middle ✅
- Server compromise ✅
- Surveillance ✅

**What It Doesn't:**
- Physical device theft (use device PIN/biometric)
- Malware on your device
- Lost seed phrase (same as crypto wallets)

## Open Source = Verifiable Privacy

GitHub: https://github.com/jhonymiler/VaultZero

- Full source code available
- Security audits welcome
- No hidden telemetry
- Build it yourself
- Self-host everything

## Comparison

| Feature | VaultZero | Auth0 | Okta | Google |
|---------|-----------|-------|------|--------|
| No passwords | ✅ | ❌ | ❌ | ❌ |
| No central DB | ✅ | ❌ | ❌ | ❌ |
| No tracking | ✅ | ❌ | ❌ | ❌ |
| User owns data | ✅ | ❌ | ❌ | ❌ |
| Open source | ✅ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ | ❌ | ❌ | ❌ |

## For the Privacy-Conscious

- No email required
- No phone number required
- No personal info stored
- No cookies
- No fingerprinting
- No analytics

## Current Status

MVP is functional and available for testing.

**Looking for:**
- Privacy advocates to review
- Security researchers to audit
- Feedback on threat model
- Contributors who care about privacy

---

**Finally, authentication that respects your privacy.**

MIT License - Free forever
```

---

### **Template 5: For r/programming (General Audience)**

```markdown
# I built a passwordless authentication system to solve the "100 passwords problem"

## Background

Like most developers, I was tired of:
- Remembering dozens of passwords
- Dealing with "password must be 12 characters, include emojis, and your grandmother's maiden name"
- Getting locked out after fat-fingering my password 3 times
- Password reset emails that take 10 minutes to arrive

So I built an alternative.

## The Idea

What if authentication worked like this:
1. You open a website
2. Scan a QR code with your phone
3. Use Face ID/Touch ID
4. Logged in

No passwords. Ever.

## How It Works

**Architecture:**
```
┌─────────────┐          ┌──────────────┐
│   Website   │          │  Mobile App  │
└──────┬──────┘          └──────┬───────┘
       │                        │
       │ Generate QR Code       │
       │───────────────────────>│
       │                        │
       │                   Scan QR Code
       │                        │
       │                   Biometric Auth
       │                        │
       │                   Sign Challenge
       │                        │
       │<───────────────────────│
       │                        │
   Verify Signature
       │
   Grant Access
```

**Under the Hood:**
- P2P blockchain for verification
- Ed25519 cryptography
- Hardware-backed key storage
- No central servers

## Tech Stack

**Backend:**
- Node.js + TypeScript
- libp2p for P2P networking
- Custom blockchain implementation
- Express for REST API

**Mobile:**
- React Native + Expo
- Biometric authentication
- QR code scanner
- Secure storage

**Web:**
- Next.js 14
- Server-side rendering
- Real-time updates
- SDK for easy integration

## Why It's Better Than Passwords

1. **Security**: Can't phish what doesn't exist
2. **UX**: Faster than typing a password
3. **Privacy**: No central database to breach
4. **Portable**: Your identity goes with you
5. **Recovery**: Seed phrase backup (like crypto wallets)

## Challenges I Faced

1. **P2P on Mobile**: NAT traversal is hard
2. **Offline Support**: Making it work without internet
3. **Key Management**: Secure but accessible
4. **UX**: Making crypto invisible to users
5. **Cross-platform**: iOS, Android, Web all behaving differently

## Current Status

MVP is working! You can:
- Create an identity
- Authenticate with biometrics
- Login via QR codes
- Integrate into apps

**What's Left:**
- Polish the mobile UI
- Add more auth methods
- Enterprise features
- Plugin ecosystem

## Open Source

GitHub: https://github.com/jhonymiler/VaultZero
License: MIT

Built with:
- TypeScript (full stack)
- 300+ commits
- GitHub Actions CI/CD
- Comprehensive docs

## Try It

```bash
git clone https://github.com/jhonymiler/VaultZero.git
cd VaultZero
./setup.sh
```

## Feedback Welcome

This is an early MVP and I'd love:
- Code reviews
- Security feedback
- UX suggestions
- Contributors

---

**No more passwords. Just scan and go.**

⭐ Star if you're interested!
```

---

## 🎯 Posting Strategy

### **Do's:**
1. ✅ Read each subreddit's rules before posting
2. ✅ Use appropriate flair/tags
3. ✅ Respond to all comments within 24 hours
4. ✅ Be humble and open to criticism
5. ✅ Focus on the problem you're solving
6. ✅ Include technical details for dev communities
7. ✅ Be honest about MVP status

### **Don'ts:**
1. ❌ Don't spam multiple subreddits at once (space out over days)
2. ❌ Don't use the same exact post everywhere
3. ❌ Don't ask for upvotes
4. ❌ Don't be defensive about criticism
5. ❌ Don't promote without providing value
6. ❌ Don't post in cryptocurrency subreddits about price/tokens
7. ❌ Don't crosspost excessively

### **Timing:**
- **Best days**: Tuesday, Wednesday, Thursday
- **Best times** (EST): 8-10 AM, 2-4 PM, 7-9 PM
- **Avoid**: Friday evening, weekends (lower engagement)

### **Posting Schedule:**
- **Week 1**: r/opensource, r/reactnative, r/typescript
- **Week 2**: r/programming, r/coolgithubprojects, r/sideproject
- **Week 3**: r/CryptoTechnology, r/privacy, r/security
- **Week 4**: r/webdev, r/javascript, r/blockchain

---

## 📊 Success Metrics

Track these for each post:
- Upvotes
- Comments
- GitHub stars gained
- Issues/PRs created
- Contributors joining

---

## 🔗 Sources

- [Best subreddits for sharing projects](https://tereza-tizkova.medium.com/best-subreddits-for-sharing-your-project-517c433442f9)
- [Top 30 Subreddits for Web Developers](https://whatpixel.com/top-subreddits-for-development/)
- [Top Crypto Subreddits 2026](https://coingape.com/crypto-subreddits-to-follow/)
- [Blockchain & Open Source Communities](https://opensource.com/article/19/2/blockchain-open-source-communities)

---

**Good luck! 🚀**
