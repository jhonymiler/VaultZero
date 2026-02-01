# 📱 VaultZero Mobile - React Native App

The mobile application for VaultZero provides a secure, passwordless authentication experience using biometrics and QR codes.

## 🎯 Overview

VaultZero Mobile is your digital identity wallet:
- **Biometric Authentication**: Fingerprint and Face ID
- **QR Code Scanner**: Scan to authenticate
- **Secure Storage**: Encrypted key storage
- **Self-Sovereign Identity**: Full control over your data
- **Multi-Platform**: iOS and Android support

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

```bash
cd identity-vault-mobile
npm install
```

### Running

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web
```

## 📁 Project Structure

```
identity-vault-mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   ├── auth/              # Authentication screens
│   └── wallet/            # Wallet screens
├── components/            # Reusable components
│   ├── auth/              # Auth-related components
│   ├── ui/                # UI components
│   └── crypto/            # Crypto utilities
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── services/              # Business logic
│   ├── crypto.ts          # Cryptographic operations
│   ├── storage.ts         # Secure storage
│   └── p2p.ts             # P2P communication
└── constants/             # App constants
```

## 🔑 Key Features

### Authentication
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- QR code scanning for login
- Secure session management
- Multi-device support

### Identity Management
- Create and manage digital identities
- BIP39 mnemonic phrase backup
- Identity recovery
- Encrypted local storage

### Security
- Hardware-backed keystore
- Secure enclave integration
- End-to-end encryption
- No server-side data storage

### User Experience
- Dark/Light theme support
- Smooth animations
- Offline functionality
- Real-time status updates

## ⚙️ Configuration

### Environment Variables

The app connects to the core backend. Configure in your environment:

```javascript
// constants/config.ts
export const API_CONFIG = {
  CORE_URL: 'http://localhost:3000',
  WS_URL: 'ws://localhost:3000',
};
```

### Permissions

Required permissions (automatically handled by Expo):
- Camera (QR code scanning)
- Biometric authentication
- Secure storage

## 🧪 Testing

```bash
# Run tests
npm test

# Lint code
npm run lint
```

## 📱 Screens

### Home / Dashboard
- Identity overview
- Quick authentication
- Recent activity

### Scan QR Code
- Camera-based QR scanner
- Authentication flow
- Success/error feedback

### Identity Wallet
- View identity details
- Manage credentials
- Backup and recovery

### Settings
- Biometric preferences
- Theme selection
- Security options
- About and help

## 🎨 Design System

### Colors
- **Primary**: Electric blue (#3B82F6)
- **Secondary**: Purple (#8B5CF6)
- **Success**: Green (#10B981)
- **Error**: Red (#EF4444)

### Typography
- **Headings**: SF Pro Display / Roboto
- **Body**: SF Pro Text / Roboto

### Components
- Custom button styles
- Card components
- Input fields
- Modal dialogs

## 🔧 Development

### Adding a New Screen

1. Create screen in `app/` directory
2. Add navigation if needed
3. Implement UI with components
4. Connect to services
5. Test on both platforms

### State Management

Uses React Context for global state:
```typescript
// contexts/AuthContext.tsx
- User authentication state
- Identity management
- Session handling
```

## 🛠️ Technologies

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform framework |
| **Expo** | Development platform |
| **Expo Router** | File-based navigation |
| **TypeScript** | Type safety |
| **Expo SecureStore** | Encrypted storage |
| **Expo LocalAuth** | Biometric auth |
| **jsQR** | QR code scanning |

## 📊 Performance

- **App size**: ~50MB
- **Launch time**: < 2 seconds
- **Authentication**: < 2 seconds
- **QR scan**: Near instant

## 🐛 Troubleshooting

### Camera Not Working
- Check camera permissions
- Restart the app
- Verify device compatibility

### Biometrics Not Available
- Ensure device has biometric hardware
- Enable biometrics in device settings
- Grant permission to the app

### Connection Issues
- Check core backend is running
- Verify API_CONFIG URLs
- Review network permissions

### Build Issues
```bash
# Clear cache and rebuild
npm start -- --clear
```

## 📦 Building for Production

### Android
```bash
# Build APK
npm run android -- --variant release

# Build AAB for Play Store
eas build --platform android
```

### iOS
```bash
# Build for iOS
eas build --platform ios
```

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines

---

**Part of [VaultZero](../README.md)** - Your identity, your control 🔐
