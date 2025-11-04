import { Href, Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
// Import from firebase.js, not firebaseConfig.js
import { auth } from '../firebaseConfig';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function useProtectedRoute(user: User | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) {
      return; // Still loading, do nothing
    }

    const inApp = segments[0] === '(tabs)';
    
    // Check the *first segment* as a string
    const onLogin = segments[0] === 'login';

    if (!user && !onLogin) {
      // Not logged in and not on the login page.
      router.replace('/login' as Href);
    } else if (user && onLogin) {
      // Logged in and on the login page.
      router.replace('/(tabs)' as Href);
    }
  }, [user, segments, router]);
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useProtectedRoute(user);

  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}