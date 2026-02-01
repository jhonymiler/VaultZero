# 🔧 VaultZero - Guia de Setup

## Requisitos

| Software | Versão Mínima |
|----------|---------------|
| Node.js | 20.x |
| npm | 10.x |
| Git | 2.x |
| React Native CLI | 0.73+ |
| Expo CLI | 50+ |

---

## Clone do Repositório

```bash
git clone https://github.com/seu-usuario/IdentityVault.git
cd IdentityVault
```

---

## 1. Core Backend

### Instalação

```bash
cd core
npm install
```

### Configuração

Crie `.env` na raiz do `core/`:

```env
# Porta HTTP do servidor
HTTP_PORT=3000

# Porta P2P (WebSocket)
P2P_PORT=8087

# Modo bootstrap (primeiro nó da rede)
BOOTSTRAP_MODE=true

# Peers de bootstrap (separados por vírgula)
BOOTSTRAP_PEERS=

# Nível de log
LOG_LEVEL=info
```

### Executar

```bash
# Modo normal
npm start

# Modo bootstrap (primeiro nó)
npm run start:bootstrap

# Modo peer (conecta a outro nó)
npm run start:peer -- --connect=127.0.0.1:8087
```

### Verificar

```bash
# Status da rede
curl http://localhost:3000/api/network/status

# Deve retornar:
{
  "connected": true,
  "nodeId": "12D3KooW...",
  "connectedPeers": 0
}
```

---

## 2. Mobile App

### Instalação

```bash
cd identity-vault-mobile
npm install
```

### Configuração

Crie/edite `.env`:

```env
# URL do Core (para testes locais)
CORE_API_URL=http://192.168.1.100:3000

# Modo de desenvolvimento
DEV_MODE=true
```

> ⚠️ Use o IP local da sua máquina, não `localhost`

### Executar

```bash
# Iniciar Expo
npx expo start

# Opções:
# - Press 'a' para Android
# - Press 'i' para iOS
# - Press 'w' para Web
```

### Build para Dispositivo

```bash
# Android
npx expo run:android

# iOS (requer macOS + Xcode)
npx expo run:ios
```

---

## 3. SDK

### Instalação (para uso em projetos)

```bash
npm install @vaultzero/sdk
```

### Build do SDK

```bash
cd sdk
npm install
npm run build
```

### Uso Básico

```typescript
import { VaultZeroSDK } from '@vaultzero/sdk'

const sdk = new VaultZeroSDK({
  apiUrl: 'http://localhost:3000',
  siteUrl: 'http://localhost:3001'
})

// Criar sessão de login
const session = await sdk.createLoginSession()
console.log('QR Code:', session.qrCodeDataURL)

// Escutar eventos
sdk.on('auth_success', (user) => {
  console.log('Logado:', user)
})
```

---

## 4. Website Demo

### Instalação

```bash
cd website
npm install
```

### Configuração

Crie/edite `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

### Executar

```bash
npm run dev
# Acesse http://localhost:3001
```

---

## 5. Testes

### Core Tests

```bash
cd core
npm test

# Teste P2P específico
npm run test:p2p
```

### E2E Tests

```bash
cd tests
npm install
npx playwright test
```

### Relatório de Testes

```bash
npx playwright show-report
```

---

## Troubleshooting

### Erro: "Port 3000 already in use"

```bash
# Encontrar processo
lsof -i :3000

# Matar processo
kill -9 <PID>
```

### Erro: "Cannot connect to peer"

1. Verifique se o Bootstrap node está rodando
2. Verifique firewall/antivírus
3. Use IP local, não `localhost`

### Erro: "Expo cannot connect"

```bash
# Limpar cache do Expo
npx expo start -c

# Verificar se está na mesma rede WiFi
```

### Erro: "libp2p connection failed"

```bash
# Verificar portas
netstat -tulpn | grep 8087

# Liberar porta no firewall
sudo ufw allow 8087
```

---

## Estrutura de Desenvolvimento

```
# Terminal 1: Core
cd core && npm start

# Terminal 2: Mobile
cd identity-vault-mobile && npx expo start

# Terminal 3: Website
cd website && npm run dev
```

---

## Variáveis de Ambiente Completas

### Core `.env`

```env
HTTP_PORT=3000
P2P_PORT=8087
BOOTSTRAP_MODE=true
BOOTSTRAP_PEERS=
LOG_LEVEL=info
DHT_REPLICATION=3
CONSENSUS_THRESHOLD=0.67
```

### Mobile `.env`

```env
CORE_API_URL=http://192.168.1.100:3000
DEV_MODE=true
BIOMETRIC_ENABLED=true
```

### Website `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_SESSION_TIMEOUT=300000
```

---

## Scripts Úteis

```bash
# Iniciar tudo de uma vez (Linux/Mac)
./setup.sh

# Verificar status de todos os serviços
curl http://localhost:3000/api/network/status && \
curl http://localhost:3001/api/health
```
