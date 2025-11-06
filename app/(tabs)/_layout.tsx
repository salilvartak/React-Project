// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
// import { useColorScheme } from '@/hooks/use-color-scheme'; // No longer needed

export default function TabLayout() {
  // const colorScheme = useColorScheme(); // No longer needed

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint, // Set active color
        tabBarInactiveTintColor: Colors.light.tabIconDefault, // Set inactive color
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#ffffff', // Explicitly set tab bar background to white
          borderTopColor: '#f0f0f0', // Add a light border
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Chores',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}