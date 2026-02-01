import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Tipagem para as props do TabBar
interface CustomTabBarProps {
  state: any;
  navigation: any;
}

type TabBarItemProps = {
  label: string;
  icon: string;
  route: string;
  active: boolean;
  onPress: () => void;
};

const TabBarItem = ({ label, icon, active, onPress }: TabBarItemProps) => {
  const colorScheme = useColorScheme();
  const color = active ? Colors.component.tabActive : Colors.component.tabInactive;
  
  return (
    <TouchableOpacity 
      style={styles.tabItem} 
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
    >
      <IconSymbol name={icon as any} size={24} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, navigation }: CustomTabBarProps) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  // Mapea as informações de cada tab
  const tabInfo = [
    { label: 'Home', icon: 'house.fill', route: '/(tabs)' },
    { label: 'Config', icon: 'gear.fill', route: '/(tabs)/config' }
  ];

  const navigateToScanner = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scanner');
  };

  // Função para navegar de forma segura usando router
  const navigateToRoute = (routeIndex: number) => {
    try {
      console.log('Navigating to route index:', routeIndex);
      console.log('Available routes:', state.routeNames);
      console.log('Current index:', state.index);
      
      if (routeIndex === 0) {
        console.log('Navigating to Home');
        router.push('/(tabs)');
      } else if (routeIndex === 1) {
        console.log('Navigating to Config');
        router.push('/(tabs)/config');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback para navegação tradicional
      try {
        const routeName = state.routeNames[routeIndex];
        if (routeName) {
          console.log('Fallback navigation to:', routeName);
          navigation.navigate(routeName);
        }
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
      }
    }
  };

  // Verifica qual tab está ativa
  const activeIndex = state.index;

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' ? (
        <BlurView style={styles.blurContainer} intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'}>
          <View style={styles.tabBar}>
            <View style={styles.tabSection}>
              <TabBarItem
                label={tabInfo[0].label}
                icon={tabInfo[0].icon}
                route={tabInfo[0].route}
                active={activeIndex === 0}
                onPress={() => navigateToRoute(0)}
              />
            </View>
            
            <View style={styles.tabScannerContainer}>
              <TouchableOpacity
                style={[
                  styles.scanButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint }
                ]}
                onPress={navigateToScanner}
              >
                <IconSymbol name="qrcode" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.tabSection}>
              <TabBarItem
                label={tabInfo[1].label}
                icon={tabInfo[1].icon}
                route={tabInfo[1].route}
                active={activeIndex === 1}
                onPress={() => navigateToRoute(1)}
              />
            </View>
          </View>
        </BlurView>
      ) : (
        <View        style={[
          styles.tabBar,
          { backgroundColor: Colors.background.primary }
        ]}>
          <View style={styles.tabSection}>
            <TabBarItem
              label={tabInfo[0].label}
              icon={tabInfo[0].icon}
              route={tabInfo[0].route}
              active={activeIndex === 0}
              onPress={() => navigateToRoute(0)}
            />
          </View>
          
          <View style={styles.tabScannerContainer}>
            <TouchableOpacity
              style={[
                styles.scanButton,
                { backgroundColor: Colors.primary.main }
              ]}
              onPress={navigateToScanner}
            >
              <IconSymbol name="qrcode" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabSection}>
            <TabBarItem
              label={tabInfo[1].label}
              icon={tabInfo[1].icon}
              route={tabInfo[1].route}
              active={activeIndex === 1}
              onPress={() => navigateToRoute(1)}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: 80,
  },
  blurContainer: {
    overflow: 'hidden',
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  tabBar: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  tabSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  tabScannerContainer: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  scanButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});

export default CustomTabBar;
