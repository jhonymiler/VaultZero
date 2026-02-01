import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSimple } from '../src/contexts/SimpleContext';
import { Colors } from '../constants/Colors';

export default function Index() {
  const { hasIdentity, isLoading } = useSimple();

  useEffect(() => {
    const navigate = () => {
      if (!isLoading) {
        if (hasIdentity()) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      }
    };

    // Pequeno delay para garantir que o layout esteja montado
    const timer = setTimeout(navigate, 100);
    return () => clearTimeout(timer);
  }, [isLoading, hasIdentity]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: Colors.background.primary 
    }}>
      <ActivityIndicator size="large" color={Colors.primary.main} />
    </View>
  );
}
