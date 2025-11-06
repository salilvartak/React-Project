// app/_layout.tsx
import { Href, Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth, db } from '../firebaseConfig.js';
// --- THIS IS THE FIX ---
// Import onSnapshot instead of getDoc
import { doc, DocumentData, onSnapshot } from 'firebase/firestore';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function useProtectedRoute(user: User | null | undefined, profile: DocumentData | null | undefined) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const isLoading = user === undefined || (user && profile === undefined);
    if (isLoading) {
      return; 
    }

    const onAuthPages = segments[0] === 'login' || segments[0] === 'signup';
    const onFamilyChoice = segments[0] === 'family-choice';
    // We remove onFamilyCreated, as we will no longer navigate there
    const inApp = segments[0] === '(tabs)';

    if (!user && !onAuthPages) {
      router.replace('/login' as Href);
    } else if (user && onAuthPages) {
      router.replace('/'); 
    } else if (user && profile && profile.hasFamily && !inApp) {
      // User has a family, send them to the app
      router.replace('/(tabs)' as Href);
    } else if (user && profile && !profile.hasFamily && !onFamilyChoice) {
      // User has no family, send them to the choice screen
      router.replace('/family-choice' as Href);
    } else if (user && !profile && !onFamilyChoice && !onAuthPages) {
      // User has no profile doc, send them to the choice screen
      router.replace('/family-choice' as Href);
    }

  }, [user, profile, segments, router]);
}

export default function RootLayout() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<DocumentData | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setProfile(undefined); 
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // --- THIS IS THE FIX ---
    // Use onSnapshot to listen for real-time changes
    if (user) {
      const docRef = doc(db, "users", user.uid);
      const unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          console.warn("No user profile found in Firestore for UID:", user.uid);
          setProfile(null); 
        }
      }, (error) => {
        console.error("Error with profile snapshot:", error);
        setProfile(null);
      });

      // Cleanup listener
      return () => unsubscribeProfile();
    }
  }, [user]); // This effect re-runs when the user changes

  useProtectedRoute(user, profile);

  const isLoading = user === undefined || (user && profile === undefined);
  if (isLoading) {
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
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="family-choice" options={{ headerShown: false }} />
      {/* We no longer need the family-created screen, so it can be removed */}
      {/* <Stack.Screen name="family-created" options={{ headerShown: false }} /> */ } 
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}