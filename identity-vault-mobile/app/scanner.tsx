import React from 'react';
import { View } from 'react-native';
import QRScannerScreen from '../src/screens/QRScannerScreen';

/**
 * Scanner page component for VaultZero
 * Expo Router requires this default export
 * Mobile-optimized QR scanner for identity authentication
 */
function Scanner() {
  return (
    <View style={{ flex: 1 }}>
      <QRScannerScreen />
    </View>
  );
}

// Ensure proper default export for Expo Router
export default Scanner;
