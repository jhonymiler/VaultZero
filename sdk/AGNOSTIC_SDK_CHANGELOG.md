# VaultZero SDK - Versão Agnóstica Global

## ✅ Alterações Implementadas

### 1. **SDK Completamente Agnóstico**
- **Removidas todas as validações específicas** (CPF, telefone brasileiro, etc.)
- **Campos livres**: Sistema aceita qualquer tipo de campo solicitado por empresas
- **Suporte internacional**: Pode trabalhar com SSN (EUA), NIR (França), CPF (Brasil), etc.
- **Sem imposições**: SDK não força estruturas específicas de dados

### 2. **Novos Utilitários Genéricos**

#### **QRCodeUtils**
```typescript
// Geração de IDs únicos
QRCodeUtils.generateSessionId()

// Criação de payload VaultZero
QRCodeUtils.createVaultZeroQR({
  sessionId: 'session_123',
  action: 'login',
  callbackUrl: 'https://site.com/callback',
  requestedFields: [
    { name: 'email', displayName: 'Email', required: true },
    { name: 'customField', displayName: 'Qualquer Campo', required: false }
  ],
  companyName: 'Qualquer Empresa'
})

// Validação e parsing de QR Codes
QRCodeUtils.isValidVaultZeroQR(qrData)
QRCodeUtils.parseVaultZeroQR(qrData)
```

#### **MockSaaSService**
```typescript
// Perfis internacionais para teste
MockSaaSService.getMockUserProfiles()
// Retorna usuários do Brasil, EUA, França, etc.

// Simulação de validação de empresas
MockSaaSService.simulateCompanyValidation(userData)
// Simula respostas de erro/sucesso aleatórias

// Exemplos de empresas globais
MockSaaSService.getMockCompanyRequests()
// E-commerce, bancos, startups de diferentes países
```

#### **DataUtils**
```typescript
// Utilitários genéricos para qualquer tipo de dado
DataUtils.maskSensitiveData('123456789', 4) // '*****6789'
DataUtils.capitalizeWords('john smith') // 'John Smith'
DataUtils.truncate('texto muito longo...', 10) // 'texto m...'
DataUtils.removeAccents('São Paulo') // 'Sao Paulo'
DataUtils.isEmpty(value) // verificação universal
DataUtils.sanitizeInput(userInput) // sanitização básica
```

#### **TimeUtils, StorageUtils, CryptoUtils**
- Utilitários genéricos para tempo, armazenamento e criptografia
- Compatíveis com qualquer ambiente (browser/Node.js)

### 3. **Tipos Atualizados**

#### **RequestedField - Agnóstico**
```typescript
interface RequestedField {
  name: string // QUALQUER nome de campo
  required?: boolean
  description?: string // Para UI do app mobile
  inputType?: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'multiline'
  options?: string[] // Para campos select
  placeholder?: string
}
```

#### **AuthenticatedUser - Campos Livres**
```typescript
interface AuthenticatedUser {
  userId: string
  [key: string]: any // QUALQUER campo que a empresa solicitar
}
```

#### **ValidationResponse - Feedback Detalhado**
```typescript
interface ValidationResponse {
  success: boolean
  errors: ValidationError[]
  allowRetry: boolean // Permite nova tentativa sem novo QR
  acceptedFields?: string[] // Campos que passaram na validação
}
```

### 4. **Fluxo de Feedback/Correção**

```typescript
// 1. Empresa solicita campos
const session = await sdk.createLoginSession({
  requestedFields: [
    { name: 'cpf', required: true, description: 'CPF brasileiro' },
    { name: 'ssn', required: false, description: 'Social Security (se tiver)' },
    { name: 'email', required: true, description: 'Email principal' }
  ]
})

// 2. App mobile envia dados
const callbackData = {
  sessionId: session.sessionId,
  userData: {
    cpf: '123.456.789-01',
    email: 'usuario@email.com'
    // ssn não enviado (opcional)
  },
  timestamp: Date.now()
}

// 3. SDK processa e retorna feedback
const result = await sdk.handleAuthenticationCallback(callbackData)

if (!result.success) {
  // Empresa pode retornar erros específicos
  console.log('Erros:', result.errors)
  // [{ field: 'cpf', code: 'INVALID_FORMAT', message: 'CPF inválido' }]
  
  // App mobile pode corrigir e reenviar SEM novo QR Code
  if (result.allowRetry) {
    // Novo envio com dados corrigidos...
  }
}
```

### 5. **Exemplos de Uso Global**

#### **E-commerce Internacional**
```typescript
const session = await sdk.createLoginSession({
  requestedFields: [
    { name: 'name', required: true },
    { name: 'email', required: true },
    { name: 'phone', required: false },
    { name: 'address', required: true }
  ]
})
```

#### **Banco Brasileiro**
```typescript
const session = await sdk.createLoginSession({
  requestedFields: [
    { name: 'name', required: true, description: 'Nome conforme RG' },
    { name: 'cpf', required: true, description: 'CPF para conta' },
    { name: 'phone', required: true, description: 'Telefone celular' }
  ]
})
```

#### **Empresa Americana**
```typescript
const session = await sdk.createLoginSession({
  requestedFields: [
    { name: 'name', required: true, description: 'Full legal name' },
    { name: 'ssn', required: true, description: 'Social Security Number' },
    { name: 'zipCode', required: true, description: 'ZIP code' }
  ]
})
```

#### **Startup Francesa**
```typescript
const session = await sdk.createLoginSession({
  requestedFields: [
    { name: 'name', required: true, description: 'Nom complet' },
    { name: 'nir', required: false, description: 'NIR (optionnel)' },
    { name: 'nationality', required: true, description: 'Nationalité' }
  ]
})
```

### 6. **Recursos Adicionais**

#### **Gestão de Sessão Avançada**
```typescript
// Restaurar sessão se existir
const restored = sdk.restoreSession()

// Debug completo
const debug = sdk.getDebugInfo()

// Limpeza completa
sdk.dispose()
```

#### **Dados Mockados para Testes**
```typescript
// Perfis de diferentes países
const profiles = sdk.getMockUserProfiles()

// Empresas exemplo
const companies = sdk.getMockCompanyRequests()
```

#### **Eventos Detalhados**
```typescript
sdk.on('authentication_error', (event) => {
  // Detalhes do erro para debugging
  console.log('Erro:', event.data)
})

sdk.on('authentication_success', (event) => {
  // Sucesso com dados do usuário
  console.log('Dados:', event.data.userData)
})
```

## ✅ Benefícios da Nova Versão

1. **🌍 Compatibilidade Global**: Funciona com qualquer país/formato de dados
2. **🔧 Flexibilidade Total**: Empresas definem seus próprios campos
3. **📱 UX Melhorada**: Feedback de erro permite correção inline
4. **🧪 Fácil Teste**: Dados mockados inclusos
5. **🔒 Privacidade**: SDK não armazena nem valida dados sensíveis
6. **⚡ Performance**: Menos código, foco em utilitários genéricos

## ✅ Próximos Passos

1. **Website**: Implementar fluxo de login com campos dinâmicos
2. **App Mobile**: Coletar campos dinâmicos e exibir feedback de erro
3. **Integração**: Testar fluxo completo de feedback/correção
4. **Documentação**: Guias de uso para diferentes países/casos

O SDK agora está **100% agnóstico** e pronto para uso global! 🚀
