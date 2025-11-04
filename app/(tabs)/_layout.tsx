import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
// Import Href for type-safe routing
import { Href, Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
// Make sure this import is correct and includes .js
import { auth } from '../firebaseConfig.js';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// This hook will protect the route access based on user authentication.
// Updated to accept 'undefined' for the initial loading state
function useProtectedRoute(user: User | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Wait until the user state is determined (not undefined)
    if (user === undefined) {
      return; 
    }

    const inApp = segments[0] === '(tabs)';
    const onLogin = segments[0] === 'login';

    if (!user && !onLogin) {
      // Redirect to the login page if the user is not authenticated
      // and not already on the login page.
      // We use 'as Href' to satisfy TypeScript's strict path types.
      router.replace('/login' as Href);
    } else if (user && onLogin) {
      // Redirect to the main app (tabs) if the user is authenticated
      // and currently on the login page.
      router.replace('/(tabs)' as Href);
    }
  }, [user, segments, router]);
}

export default function RootLayout() {
  // Start user as 'undefined' to signify "loading"
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Will be 'null' or a 'User' object
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Pass the user state (which could be undefined) to the hook
  useProtectedRoute(user);

  // Show a loading indicator while 'user' is still 'undefined'
  if (user === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render the app layout
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}