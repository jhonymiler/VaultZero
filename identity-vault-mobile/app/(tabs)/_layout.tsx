import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import CustomTabBar from '@/components/ui/CustomTabBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}
      tabBar={props => {
        console.log('TabBar props:', {
          state: props.state,
          routeNames: props.state?.routeNames,
          index: props.state?.index,
          navigation: typeof props.navigation
        });
        return <CustomTabBar {...props} />;
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: '/',
        }}
      />
      <Tabs.Screen
        name="config" 
        options={{
          title: 'Configurações',
          href: '/config',
        }}
      />
    </Tabs>
  );
}
