import { Href, Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth, db } from '../firebaseConfig.js';
// Import getDoc instead of onSnapshot
import { doc, DocumentData, getDoc } from 'firebase/firestore';

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
    const onFamilyCreated = segments[0] === 'family-created'; 
    const inApp = segments[0] === '(tabs)';

    if (!user && !onAuthPages) {
      router.replace('/login' as Href);
    } else if (user && onAuthPages) {
      router.replace('/'); 
    } else if (user && profile && profile.hasFamily && !inApp && !onFamilyCreated) {
      router.replace('/(tabs)' as Href);
    } else if (user && profile && !profile.hasFamily && !onFamilyChoice) {
      router.replace('/family-choice' as Href);
    } else if (user && !profile && !onFamilyChoice && !onAuthPages) {
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
    // Use getDoc for a one-time read. This stops the race condition.
    if (user) {
      const docRef = doc(db, "users", user.uid);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // This is the warning you are seeing. It's OK.
          console.warn("No user profile found in Firestore for UID:", user.uid);
          setProfile(null); 
        }
      }).catch((error) => {
        console.error("Error fetching user profile:", error);
        setProfile(null);
      });
    }
  }, [user]); 

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
      {/* Add the new screen here */}
      <Stack.Screen name="family-created" options={{ headerShown: false }} /> 
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}