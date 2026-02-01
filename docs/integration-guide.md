# 🔧 VaultZero - Guia de Integração para Desenvolvedores

## 🚀 **Início Rápido**

### **1. Instalação do SDK**
```bash
npm install @identity-vault/sdk
```

### **2. Configuração Básica**
```typescript
import { VaultZero } from '@identity-vault/sdk';

const VaultZero = new VaultZero({
  appId: 'seu-app-id',
  environment: 'production', // ou 'development'
  bootstrapNodes: [
    'https://bootstrap1.VaultZero.com',
    'https://bootstrap2.VaultZero.com'
  ]
});
```

### **3. Implementação de Login**
```typescript
// Seu botão de login
<button onClick={handleVaultZeroLogin}>
  Login com VaultZero
</button>

// Handler do login
const handleVaultZeroLogin = async () => {
  try {
    const qrCode = await VaultZero.requestAuth({
      scope: ['name', 'email'], // dados que você precisa
      purpose: 'Login no MeuApp'
    });
    
    // Mostra QR Code para o usuário
    showQRCode(qrCode);
    
    // Aguarda autenticação
    const user = await VaultZero.waitForAuth();
    
    // Usuário autenticado!
    console.log('Usuário logado:', user);
    
  } catch (error) {
    console.error('Erro no login:', error);
  }
};
```

## 🎯 **Casos de Uso Completos**

### **🛒 E-commerce - Checkout Rápido**
```typescript
// Página de checkout
const handleQuickCheckout = async () => {
  const authResult = await VaultZero.requestAuth({
    scope: ['name', 'email', 'address', 'payment'],
    purpose: 'Finalizar compra - R$ 129,90'
  });
  
  if (authResult.success) {
    // Preenche automaticamente dados do usuário
    fillCheckoutForm(authResult.userData);
    
    // Processa pagamento com dados verificados
    processPayment(authResult.userData.payment);
  }
};
```

### **🏢 Sistema Empresarial - SSO**
```typescript
// Login empresarial
const handleCorporateLogin = async () => {
  const authResult = await VaultZero.requestAuth({
    scope: ['employee_id', 'department', 'clearance_level'],
    purpose: 'Acesso ao sistema corporativo',
    verificationLevel: 'high' // Requer biometria obrigatória
  });
  
  if (authResult.success) {
    // Configura sessão com permissões específicas
    setupCorporateSession(authResult.userData);
  }
};
```

### **🏦 Fintech - Assinatura Digital**
```typescript
// Assinatura de contrato
const handleDocumentSigning = async (documentHash: string) => {
  const signature = await VaultZero.signDocument({
    documentHash,
    signerInfo: ['name', 'cpf', 'timestamp'],
    purpose: 'Assinatura de contrato de investimento'
  });
  
  // Signature contém prova criptográfica válida
  submitSignedDocument(signature);
};
```

## 🔐 **Configurações de Segurança**

### **Níveis de Verificação**
```typescript
interface AuthConfig {
  verificationLevel: 'low' | 'medium' | 'high' | 'critical';
  // low: apenas QR Code
  // medium: QR + confirmação no app
  // high: QR + biometria obrigatória
  // critical: QR + biometria + PIN adicional
}
```

### **Controle de Escopo de Dados**
```typescript
const scopeOptions = {
  // Dados básicos
  basic: ['name', 'email'],
  
  // Perfil completo
  profile: ['name', 'email', 'phone', 'photo'],
  
  // Dados de entrega
  shipping: ['name', 'address', 'phone'],
  
  // Dados corporativos
  corporate: ['employee_id', 'department', 'manager'],
  
  // Dados financeiros (requer verificação alta)
  financial: ['bank_account', 'income', 'credit_score']
};
```

## 🎨 **Customização da Interface**

### **Botão de Login Personalizado**
```typescript
const CustomLoginButton = () => {
  const [qrCode, setQrCode] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <div className="identity-vault-login">
      {!qrCode ? (
        <button 
          onClick={startAuth}
          className="btn-identity-vault"
          disabled={isLoading}
        >
          {isLoading ? 'Gerando QR...' : 'Login Rápido com VaultZero'}
        </button>
      ) : (
        <div className="qr-display">
          <QRCode value={qrCode} />
          <p>Escaneie com seu app VaultZero</p>
          <button onClick={cancelAuth}>Cancelar</button>
        </div>
      )}
    </div>
  );
};
```

### **CSS Customizável**
```css
.identity-vault-login {
  /* Seus estilos personalizados */
}

.btn-identity-vault {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-identity-vault:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}
```

## 📊 **Analytics e Monitoramento**

### **Eventos de Tracking**
```typescript
// Configurar analytics
VaultZero.analytics.configure({
  trackUserJourney: true,
  trackPerformance: true,
  anonymizeData: true // LGPD compliance
});

// Eventos automaticamente rastreados:
// - auth_requested
// - qr_generated  
// - qr_scanned
// - auth_completed
// - auth_failed
// - user_preferences_updated
```

### **Métricas Customizadas**
```typescript
// Seus próprios eventos
VaultZero.analytics.track('checkout_started', {
  value: 129.90,
  currency: 'BRL',
  category: 'electronics'
});
```

## 🧪 **Ambiente de Testes**

### **Modo Desenvolvimento**
```typescript
const VaultZero = new VaultZero({
  environment: 'development',
  mockMode: true, // Simula autenticação sem QR real
  debugLevel: 'verbose'
});

// Em modo mock, sempre retorna usuário de teste
const testUser = await VaultZero.requestAuth({
  scope: ['name', 'email']
});
// Retorna: { name: 'João Teste', email: 'joao@teste.com' }
```

### **Testes Automatizados**
```typescript
// Jest + Testing Library
import { render, fireEvent, waitFor } from '@testing-library/react';
import { VaultZero } from '@identity-vault/sdk';

// Mock do SDK para testes
jest.mock('@identity-vault/sdk');

test('login com VaultZero', async () => {
  const mockAuth = jest.fn().mockResolvedValue({
    success: true,
    userData: { name: 'João', email: 'joao@email.com' }
  });
  
  VaultZero.mockImplementation(() => ({
    requestAuth: mockAuth
  }));
  
  const { getByText } = render(<LoginPage />);
  
  fireEvent.click(getByText('Login com VaultZero'));
  
  await waitFor(() => {
    expect(mockAuth).toHaveBeenCalledWith({
      scope: ['name', 'email'],
      purpose: 'Login no site'
    });
  });
});
```

## 🚀 **Deploy em Produção**

### **Configuração Produção**
```typescript
const VaultZero = new VaultZero({
  appId: process.env.IDENTITY_VAULT_APP_ID,
  environment: 'production',
  apiKey: process.env.IDENTITY_VAULT_API_KEY,
  bootstrapNodes: [
    'https://bootstrap-us-east.VaultZero.com',
    'https://bootstrap-eu-west.VaultZero.com',
    'https://bootstrap-asia-southeast.VaultZero.com'
  ],
  retryConfig: {
    maxRetries: 3,
    backoffMultiplier: 2
  },
  security: {
    validateOrigin: true,
    requireHTTPS: true,
    sessionTimeout: 3600000 // 1 hora
  }
});
```

### **Variáveis de Ambiente**
```bash
# .env.production
IDENTITY_VAULT_APP_ID=your-app-id-here
IDENTITY_VAULT_API_KEY=your-api-key-here
IDENTITY_VAULT_ENVIRONMENT=production
IDENTITY_VAULT_DEBUG=false
```

## 📞 **Suporte e Documentação**

### **Links Úteis**
- 📖 **Documentação Completa**: https://docs.VaultZero.com
- 🎮 **Playground Interativo**: https://playground.VaultZero.com
- 🤝 **Comunidade Discord**: https://discord.gg/VaultZero
- 🐛 **Report de Bugs**: https://github.com/VaultZero/sdk/issues
- 💬 **Suporte**: support@VaultZero.com

### **Exemplos Prontos**
- **React**: https://github.com/VaultZero/examples/react
- **Vue.js**: https://github.com/VaultZero/examples/vue
- **Angular**: https://github.com/VaultZero/examples/angular
- **Next.js**: https://github.com/VaultZero/examples/nextjs
- **WordPress**: https://github.com/VaultZero/examples/wordpress

### **Migration Guides**
- 🔄 **De Auth0**: https://docs.VaultZero.com/migrate/auth0
- 🔄 **De Firebase Auth**: https://docs.VaultZero.com/migrate/firebase
- 🔄 **De OAuth tradicional**: https://docs.VaultZero.com/migrate/oauth

---

**Integração completa em menos de 30 minutos** ⚡  
**Suporte 24/7 em português** 🇧🇷
