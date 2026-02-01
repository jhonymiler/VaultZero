# 📖 VaultZero - API Reference

## Core REST API

Base URL: `http://localhost:3000/api`

---

## Autenticação

### POST `/auth/register/biometric`

Registra nova identidade com biometria.

**Request:**
```json
{
  "userId": "user123",
  "biometricData": "base64_encoded_template",
  "biometricType": "fingerprint" | "face" | "voice" | "iris"
}
```

**Response:**
```json
{
  "success": true,
  "identity": {
    "address": "0x742d35Cc...",
    "publicKey": "...",
    "createdAt": "2025-01-11T10:00:00Z"
  }
}
```

---

### POST `/auth/register/passkey`

Inicia registro de passkey (WebAuthn).

**Request:**
```json
{
  "userId": "user123",
  "userName": "joao@email.com",
  "userDisplayName": "João Silva"
}
```

**Response:**
```json
{
  "options": {
    "challenge": "...",
    "rp": { "name": "VaultZero", "id": "vaultzero.io" },
    "user": { "id": "...", "name": "...", "displayName": "..." },
    "pubKeyCredParams": [...]
  }
}
```

---

### POST `/auth/register/passkey/complete`

Completa registro de passkey.

**Request:**
```json
{
  "userId": "user123",
  "response": {
    "id": "credential_id",
    "rawId": "...",
    "response": { "clientDataJSON": "...", "attestationObject": "..." }
  }
}
```

---

### POST `/auth/authenticate/passkey`

Inicia autenticação com passkey.

**Request:**
```json
{
  "userId": "user123"
}
```

**Response:**
```json
{
  "options": {
    "challenge": "...",
    "allowCredentials": [...],
    "timeout": 60000
  }
}
```

---

## Rede P2P

### GET `/network/status`

Retorna status da rede P2P.

**Response:**
```json
{
  "connected": true,
  "nodeId": "12D3KooW...",
  "port": 8087,
  "connectedPeers": 3,
  "dhtPeers": 5,
  "gossipPeers": 3
}
```

---

### POST `/network/connect`

Conecta a um peer específico.

**Request:**
```json
{
  "address": "192.168.1.100",
  "port": 8087
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conectado ao peer"
}
```

---

### GET `/network/peers`

Lista todos os peers conhecidos.

**Response:**
```json
{
  "networkPeers": [...],
  "dhtPeers": [...],
  "gossipPeers": [...]
}
```

---

## Blockchain

### GET `/blockchain/status`

Retorna status da blockchain local.

**Response:**
```json
{
  "identitiesCount": 150,
  "lastBlockHash": "...",
  "consensusState": "idle",
  "pendingProposals": 0
}
```

---

### POST `/blockchain/identity`

Cria nova identidade na blockchain.

**Request:**
```json
{
  "publicKey": "...",
  "metadata": { "name": "João" }
}
```

---

## SDK Methods

### VaultZeroSDK

```typescript
import { VaultZeroSDK } from '@vaultzero/sdk'

const sdk = new VaultZeroSDK({
  apiUrl: 'https://api.vaultzero.io',
  siteUrl: 'https://meusite.com',
  sessionTimeout: 300000  // 5 minutos
})
```

---

### `createLoginSession(request?)`

Cria nova sessão de login.

```typescript
const session = await sdk.createLoginSession({
  requestedFields: ['name', 'email', 'age'],
  customMessage: 'Login para MeuSite'
})

// Retorna:
{
  sessionId: 'sess_abc123',
  qrCodeDataURL: 'data:image/png;base64,...',
  expiresAt: Date,
  state: 'pending'
}
```

---

### `on(eventType, listener)`

Adiciona listener para eventos.

```typescript
sdk.on('auth_success', (user) => {
  console.log('Usuário:', user.name)
})

sdk.on('session_expired', () => {
  console.log('Sessão expirou')
})

sdk.on('auth_error', (error) => {
  console.error('Erro:', error.message)
})
```

**Eventos disponíveis:**
- `auth_success` - Autenticação bem-sucedida
- `auth_error` - Erro na autenticação
- `session_expired` - Sessão expirou
- `session_cancelled` - Usuário cancelou
- `access_revoked` - Acesso revogado

---

### `cancelSession()`

Cancela sessão atual.

```typescript
sdk.cancelSession()
```

---

### `getCurrentSession()`

Retorna sessão atual.

```typescript
const session = sdk.getCurrentSession()
if (session) {
  console.log('Session ID:', session.sessionId)
}
```

---

### `hasActiveSession()`

Verifica se há sessão ativa.

```typescript
if (sdk.hasActiveSession()) {
  // Usuário está autenticado
}
```

---

### `dispose()`

Limpa todos os recursos.

```typescript
sdk.dispose()
```

---

## P2P Protocol Messages

### Identity Messages

```typescript
interface IdentityCreateMessage {
  type: 'IDENTITY_CREATE'
  data: {
    address: string
    publicKey: string
    timestamp: number
  }
  sender: string
  signature: string
}

interface IdentityUpdateMessage {
  type: 'IDENTITY_UPDATE'
  data: {
    address: string
    fields: Record<string, any>
  }
  sender: string
  signature: string
}
```

---

### Auth Messages

```typescript
interface AuthRequestMessage {
  type: 'AUTH_REQUEST'
  data: {
    sessionId: string
    siteUrl: string
    challenge: string
    requestedFields: string[]
  }
  sender: string
  timestamp: number
}

interface AuthResponseMessage {
  type: 'AUTH_RESPONSE'
  data: {
    sessionId: string
    approved: boolean
    userData: Record<string, any>
    signature: string
  }
  sender: string
  timestamp: number
}
```

---

## SSE Events

Endpoint: `GET /api/sse/session/:sessionId`

### Event Types

```typescript
// Autenticação bem-sucedida
event: auth_success
data: {
  "sessionId": "sess_abc123",
  "user": {
    "name": "João Silva",
    "email": "joao@email.com"
  },
  "signature": "..."
}

// Erro de validação
event: validation_error
data: {
  "error": "Invalid signature",
  "code": "INVALID_SIGNATURE"
}

// Sessão expirada
event: session_expired
data: {
  "sessionId": "sess_abc123",
  "expiredAt": "2025-01-11T10:05:00Z"
}

// Acesso revogado
event: access_revoked
data: {
  "sessionId": "sess_abc123",
  "revokedBy": "user",
  "revokedAt": "2025-01-11T10:10:00Z"
}
```

---

## Error Codes

| Code | Descrição |
|------|-----------|
| `INVALID_SESSION` | Sessão inválida ou expirada |
| `INVALID_SIGNATURE` | Assinatura criptográfica inválida |
| `USER_CANCELLED` | Usuário cancelou a operação |
| `BIOMETRIC_FAILED` | Falha na verificação biométrica |
| `PEER_UNREACHABLE` | Peer P2P não alcançável |
| `CONSENSUS_FAILED` | Falha no consenso |
| `DHT_ERROR` | Erro no DHT |
