import { Href, Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../firebaseConfig.js';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function useProtectedRoute(user: User | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (user === undefined) {
      return; 
    }
    
    const onLogin = segments[0] === 'login';
    const onSignup = segments[0] === 'signup'; // Check if on signup page

    if (!user && !onLogin && !onSignup) { // If not logged in and not on auth pages
      router.replace('/login' as Href);
    } else if (user && (onLogin || onSignup)) { // If logged in and on auth pages
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
      <Stack.Screen name="signup" options={{ headerShown: false }} /> {/* THIS IS THE MISSING PIECE */}
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}