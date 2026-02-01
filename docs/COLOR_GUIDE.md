# Guia de Cores - VaultZero Identity App

## Visão Geral

Este guia documenta o sistema de cores centralizado do VaultZero Identity App. Todas as cores são definidas no arquivo `constants/Colors.ts` para garantir consistência visual e facilitar manutenção, baseado na identidade visual com fundo azul-escuro (#1a2332).

## Como Usar

### Importação

```typescript
import { Colors } from '../constants/Colors';
```

## Estrutura da Paleta

### Cores Principais
- `Colors.primary.main` - Azul principal (#0066cc)
- `Colors.primary.dark` - Azul escuro (#004499) 
- `Colors.primary.light` - Azul claro (#3399ff)
- `Colors.primary.contrast` - Branco para contraste (#ffffff)

### Backgrounds
- `Colors.background.primary` - Fundo principal escuro (#1a2332)
- `Colors.background.secondary` - Fundo secundário (#2a2a2a)
- `Colors.background.card` - Fundo de cards (#121212)
- `Colors.background.overlay` - Overlay transparente
- `Colors.background.glass` - Efeito vidro

### Status e Estados
- `Colors.status.success` - Verde para sucesso (#4CAF50)
- `Colors.status.successLight` - Verde claro (#00ff88)
- `Colors.status.warning` - Laranja para avisos (#ff9500)
- `Colors.status.error` - Vermelho para erros (#ff3b30)
- `Colors.status.info` - Azul para informações (#0066cc)
- `Colors.status.connected` - Estado conectado (#00ff88)
- `Colors.status.disconnected` - Estado desconectado (#ff4444)

### Textos
- `Colors.text.primary` - Texto principal branco (#ffffff)
- `Colors.text.secondary` - Texto secundário (#cccccc)
- `Colors.text.muted` - Texto esmaecido (#666666)
- `Colors.text.disabled` - Texto desabilitado (#999999)
- `Colors.text.link` - Texto de link (#0066cc)

### Botões
- `Colors.button.primary` - Botão principal (#0066cc)
- `Colors.button.primaryHover` - Hover do botão principal (#004499)
- `Colors.button.secondary` - Botão secundário (#2a2a2a)
- `Colors.button.danger` - Botão de perigo (#ff3b30)
- `Colors.button.success` - Botão de sucesso (#4CAF50)

### Bordas
- `Colors.border.primary` - Borda principal (#333333)
- `Colors.border.secondary` - Borda secundária (#444444)
- `Colors.border.accent` - Borda de destaque (#0066cc)

### Componentes Específicos
- `Colors.component.tabActive` - Tab ativa (#0066cc)
- `Colors.component.tabInactive` - Tab inativa (#666666)
- `Colors.component.inputBackground` - Fundo de input (#2a2a2a)
- `Colors.component.loadingSpinner` - Spinner de carregamento (#0066cc)
- `Colors.component.placeholder` - Placeholder de texto (#666666)

### Cores de Destaque (Accent)
- `Colors.accent.biometric` - Biometria (#00aa44)
- `Colors.accent.security` - Segurança (#9333ea)
- `Colors.accent.network` - Rede (#0d9488)
- `Colors.accent.device` - Dispositivo (#0066cc)

## Exemplos de Uso

### Em StyleSheet
```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
  },
  title: {
    color: Colors.text.primary,
  },
  button: {
    backgroundColor: Colors.button.primary,
  },
  successMessage: {
    color: Colors.status.success,
  },
});
```

### Em Componentes JSX
```typescript
// Ionicons com cor
<Ionicons name="copy-outline" size={20} color={Colors.primary.main} />

// ActivityIndicator
<ActivityIndicator size="large" color={Colors.primary.main} />

// Estilos dinâmicos
<View style={[
  styles.statusDot, 
  { backgroundColor: isConnected ? Colors.status.connected : Colors.status.disconnected }
]} />
```

### Gradientes
```typescript
// Usando as cores de gradiente pré-definidas
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={Colors.gradient.primary}
  style={styles.gradientButton}
>
  {/* Conteúdo */}
</LinearGradient>
```

## Compatibilidade com Temas

A paleta também mantém compatibilidade com o sistema de temas do Expo:

```typescript
// Para modo claro/escuro
Colors.light.background  // Fundo claro
Colors.dark.background   // Fundo escuro
Colors.light.text        // Texto claro
Colors.dark.text         // Texto escuro
```

## Boas Práticas

1. **Sempre use as cores da paleta** em vez de valores hardcoded
2. **Teste em diferentes temas** para garantir acessibilidade
3. **Use cores semânticas** (success, error, warning) para melhor UX
4. **Mantenha consistência** entre telas e componentes
5. **Evite criar novas cores** sem adicionar à paleta central

## Acessibilidade

- Todas as cores foram escolhidas para manter contraste adequado
- Cores de status seguem convenções universais
- Texto sempre tem contraste suficiente com o fundo

## Atualizações

Para adicionar novas cores:
1. Edite o arquivo `constants/Colors.ts`
2. Adicione a nova cor na categoria apropriada
3. Atualize este guia de documentação
4. Teste em todos os componentes afetados
