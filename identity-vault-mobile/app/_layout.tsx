// Importar polyfills PRIMEIRO (antes de qualquer outra coisa)
import '../src/polyfills';

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { SimpleProvider } from '../src/contexts/SimpleContext';
import { IdentityProvider } from '../src/contexts/IdentityContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SimpleProvider>
      <IdentityProvider>
        <ThemeProvider value={DarkTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="scanner" options={{ headerShown: false }} />
            <Stack.Screen name="devices" options={{ headerShown: false }} />
            <Stack.Screen name="backup" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </IdentityProvider>
    </SimpleProvider>
  );
}
