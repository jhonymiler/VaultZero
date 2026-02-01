export * from './types'
export * from './VaultZeroSDK'
export * from './utils'

// Hooks são exportados apenas se React estiver disponível
export type { UseVaultZeroLoginResult } from './hooks'

// Tentar exportar hooks, mas falhar silenciosamente se React não estiver disponível
let useVaultZeroLogin: any
try {
  const hooks = require('./hooks')
  useVaultZeroLogin = hooks.useVaultZeroLogin
} catch {
  // React não está disponível, hooks não serão exportados
}

export { useVaultZeroLogin }

// Exportações default
export { VaultZeroSDK as default } from './VaultZeroSDK'
