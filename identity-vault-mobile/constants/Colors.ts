/**
 * Paleta de cores do VaultZero Identity App
 * Cores organizadas para modo claro e escuro, incluindo todas as variações 
 * utilizadas em botões, backgrounds, textos e elementos de interface.
 */

// Cores principais do sistema
const primaryBlue = '#0066cc';
const primaryBlueDark = '#004499';
const backgroundDark = '#1a2332';
const backgroundSecondary = '#2a2a2a';
const backgroundCard = '#121212';

// Cores de status
const successGreen = '#4CAF50';
const warningOrange = '#ff9500';
const errorRed = '#ff3b30';
const infoBlue = '#0066cc';

// Cores de texto
const textPrimary = '#ffffff';
const textSecondary = '#cccccc';
const textMuted = '#666666';
const textDisabled = '#999999';

// Cores de accent
const accentGreen = '#00aa44';
const accentOrange = '#ff9500';
const accentPurple = '#9333ea';
const accentTeal = '#0d9488';

export const Colors = {
  // Cores base do sistema
  primary: {
    main: primaryBlue,
    dark: primaryBlueDark,
    light: '#3399ff',
    contrast: '#ffffff',
  },

  // Backgrounds
  background: {
    primary: backgroundDark,
    secondary: backgroundSecondary,
    card: backgroundCard,
    overlay: 'rgba(0, 0, 0, 0.5)',
    glass: 'rgba(255, 255, 255, 0.1)',
  },

  // Status e estados
  status: {
    success: successGreen,
    successLight: '#00ff88',
    warning: warningOrange,
    error: errorRed,
    errorLight: '#ff4444',
    info: infoBlue,
    connected: '#00ff88',
    disconnected: '#ff4444',
  },

  // Textos
  text: {
    primary: textPrimary,
    secondary: textSecondary,
    muted: textMuted,
    disabled: textDisabled,
    inverse: '#000000',
    link: primaryBlue,
  },

  // Bordas e divisores
  border: {
    primary: '#333333',
    secondary: '#444444',
    accent: primaryBlue,
    light: '#e0e0e0',
  },

  // Botões
  button: {
    primary: primaryBlue,
    primaryHover: primaryBlueDark,
    secondary: backgroundSecondary,
    secondaryHover: '#3a3a3a',
    danger: errorRed,
    dangerHover: '#d32f2f',
    success: successGreen,
    successHover: '#45a049',
    disabled: '#555555',
  },

  // Gradientes
  gradient: {
    primary: [primaryBlue, primaryBlueDark] as const,
    secondary: [backgroundSecondary, backgroundCard] as const,
    accent: [accentPurple, accentTeal] as const,
    success: [successGreen, accentGreen] as const,
    warning: [warningOrange, '#ff7700'] as const,
  },

  // Cores específicas para componentes
  component: {
    tabActive: primaryBlue,
    tabInactive: '#999999',
    inputBackground: backgroundSecondary,
    inputBorder: '#444444',
    cardBackground: backgroundCard,
    modalBackground: 'rgba(0, 0, 0, 0.8)',
    loadingSpinner: primaryBlue,
    placeholder: textMuted,
  },

  // Cores de destaque para diferentes contextos
  accent: {
    biometric: accentGreen,
    security: accentPurple,
    network: accentTeal,
    device: primaryBlue,
    warning: warningOrange,
  },

  // Compatibilidade com tema claro/escuro (Expo)
  light: {
    text: '#11181C',
    background: '#ffffff',
    tint: primaryBlue,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryBlue,
  },
  dark: {
    text: textPrimary,
    background: backgroundDark,
    tint: textPrimary,
    icon: textSecondary,
    tabIconDefault: textMuted,
    tabIconSelected: textPrimary,
  },
};
