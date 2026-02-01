# ❓ VaultZero - FAQ (Perguntas Frequentes)

## Índice

1. [Múltiplas Identidades](#1-múltiplas-identidades)
2. [Consenso e Armazenamento](#2-consenso-e-armazenamento)
3. [VaultZero vs Google Login](#3-vaultzero-vs-google-login)
4. [Direito ao Esquecimento](#4-direito-ao-esquecimento)
5. [Modelo de Negócio](#5-modelo-de-negócio)
6. [Armazenamento de Dados](#6-armazenamento-de-dados)
7. [Viabilidade](#7-viabilidade)

---

## 1. Múltiplas Identidades

### "O que me impede de criar duas identidades?"

**Resposta**: Nada impede - e é **proposital**.

O sistema foi projetado para permitir múltiplas identidades. É como ter várias carteiras crypto.

### Casos de Uso

| Identidade | Dados | Uso |
|------------|-------|-----|
| **Profissional** | Nome, cargo, LinkedIn | Trabalho |
| **Compras** | Nome, endereço | E-commerce |
| **Crypto** | Apenas nickname | DeFi, NFTs |
| **Gaming** | Nickname, avatar | Jogos online |

---

## 2. Consenso e Armazenamento

### "Como funciona a rede P2P?"

**Duas camadas**:

| Tipo | Quantidade | Função |
|------|------------|--------|
| **Bootstrap Nodes** | 7-15 | Consenso crítico, estabilidade |
| **User Nodes** | Ilimitado | DHT distribuída, cache local |

### DHT (Distributed Hash Table)

- Cada nó armazena apenas sua faixa de hashes (~1-50MB)
- Replicação em 3-5 nós vizinhos
- Auto-organização quando nós entram/saem

### Quando Offline

1. Identidades na sua faixa ficam com nós vizinhos
2. Quando volta, re-sincroniza automaticamente
3. É como BitTorrent - outros seeders continuam

---

## 3. VaultZero vs Google Login

### Comparação Direta

| Aspecto | Google Login | VaultZero |
|---------|--------------|-----------|
| Cadastro | Precisa criar conta | Zero cadastro |
| Senha | Precisa lembrar | Não existe |
| Privacidade | Google rastreia | Zero tracking |
| Vendor lock-in | Forte | Nenhum |
| Offline | Não funciona | Funciona |
| Dados | Google controla | Você controla |

### Fluxo de Login

**Google (7 passos, ~2-3 min)**:
1. Clica "Login with Google"
2. Redireciona para Google
3. Digite email
4. Digite senha
5. Confirma 2FA
6. Autoriza permissões
7. Volta pro site

**VaultZero (3 passos, ~15 seg)**:
1. Escaneia QR Code
2. Confirma biometria
3. Logado!

---

## 4. Direito ao Esquecimento

### É possível garantir que sites apaguem meus dados?

**Resposta honesta**: Não 100%.

Uma vez que dados sensíveis saem do VaultZero, depende do site.

### O que VaultZero melhora

| Cenário | Sem VaultZero | Com VaultZero |
|---------|---------------|---------------|
| CPF vazado | 5 empresas têm | 1 tem (certificador) |
| Dados compartilhados | Tudo ou nada | Granular por campo |
| Controle | Zero | Total sobre quando/quem |

### Proteção Máxima (sem dados reais)

- ✅ Login em fóruns (só username)
- ✅ Streaming (só confirmação +18)
- ✅ SaaS tools (email temporário)

### Proteção Limitada (dados reais necessários)

- ⚠️ Fintechs (CPF para compliance)
- ⚠️ E-commerce (endereço de entrega)
- ⚠️ Governo (exigência legal)

---

## 5. Modelo de Negócio

### Quanto custa usar?

| Tier | Preço | Inclui |
|------|-------|--------|
| **Grátis** | $0 | Login + carteira digital |
| **Premium** | $5/mês | Múltiplas identidades |
| **Certificações** | $5-15 | Skills verificadas |

### Para Empresas

| Serviço | Preço |
|---------|-------|
| Login básico | $0.05/login (após 1K grátis) |
| Verificar certificados | $0.50/verificação |
| Assinar dados | $2-5/assinatura |

---

## 6. Armazenamento de Dados

### Onde ficam meus dados?

| Local | O que armazena | Tamanho |
|-------|----------------|---------|
| **Seu celular** | Identidade + chaves | ~50MB |
| **Rede DHT** | Apenas chave pública | ~500 bytes |
| **Sites** | Só o que você autoriza | Varia |

### Exemplo de Autorização

1. E-commerce pede: nome, email, +18
2. Você autoriza: nome=✅, email=❌, +18=✅
3. Site recebe: `{ nome: "João", ageOver18: true }`
4. Email não vazou!

---

## 7. Viabilidade

### É viável tecnicamente?

| Critério | Nota | Justificativa |
|----------|------|---------------|
| Técnica | 8/10 | Stack maduro, core funcional |
| Mercado | 6/10 | Nicho lucrativo mas chicken-egg |
| Execução | 5/10 | Escopo ambicioso |

### Riscos

1. Apple/Google bloquearem (baixo)
2. Regulação anti-crypto (médio)
3. BigTech lançar concorrente (alto)
4. UX ruim (altíssimo)

### Comparação

É tipo **Brave Browser vs Chrome** - não vai dominar o mundo, mas pode ser negócio sustentável de dezenas de milhões de ARR.

---

## Funcionalidades Nativas Gratuitas

| Feature | Descrição |
|---------|-----------|
| 🔐 Login sem senha | QR Code + biometria |
| 💳 Carteira digital | Cartões NFC + pagamentos |
| 💰 Carteira crypto | Endereço Ethereum nativo |
| 📝 Certificados | Claims verificáveis P2P |
| 🔄 Sincronização | Entre seus dispositivos |

---

## Contato

- 📚 [Documentação](./README_PRINCIPAL.md)
- 🏗️ [Arquitetura](./ARCHITECTURE.md)
- 🗺️ [Roadmap](./ROADMAP.md)
