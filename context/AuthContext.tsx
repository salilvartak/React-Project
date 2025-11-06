// context/AuthContext.tsx
import { Href, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, DocumentData, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig'; // Use your firebaseConfig

// Define the shape of your context data
interface AuthContextType {
  user: User | null;
  profile: DocumentData | null;
  family: DocumentData | null;
  isLoading: boolean;
}

// Create the context
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  family: null,
  isLoading: true,
});

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Custom hook to protect routes
function useProtectedRoute(
  user: User | null,
  profile: DocumentData | null,
  isLoading: boolean
) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // Wait until loading is finished
    }

    const onAuthPages = segments[0] === 'login' || segments[0] === 'signup';
    const onFamilyChoice = segments[0] === 'family-choice';
    const inApp = segments[0] === '(tabs)';

    if (!user && !onAuthPages) {
      router.replace('/login' as Href);
    } else if (user && onAuthPages) {
      router.replace('/');
    } else if (user && profile && profile.hasFamily && !inApp) {
      router.replace('/(tabs)' as Href);
    } else if (user && profile && !profile.hasFamily && !onFamilyChoice) {
      router.replace('/family-choice' as Href);
    } else if (user && !profile && !onFamilyChoice && !onAuthPages) {
      // User exists but profile hasn't loaded or is null (edge case)
      router.replace('/family-choice' as Href);
    }
  }, [user, profile, segments, router, isLoading]);
}

// Create the provider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [family, setFamily] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setIsLoading(true);
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        setProfile(null);
        setFamily(null);
        setIsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen for user profile changes
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubProfile = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setProfile(null);
      setIsLoading(false);
    });

    return () => unsubProfile();
  }, [user]);

  // Listen for family data changes
  useEffect(() => {
    if (profile && profile.hasFamily && profile.familyId) {
      const unsubFamily = onSnapshot(doc(db, "families", profile.familyId), (docSnap) => {
        if (docSnap.exists()) {
          setFamily(docSnap.data());
        } else {
          setFamily(null);
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching family data:", error);
        setFamily(null);
        setIsLoading(false);
      });

      return () => unsubFamily();
    } else if (user && profile && !profile.hasFamily) {
      // User is logged in, has a profile, but no family
      setFamily(null);
      setIsLoading(false);
    }
  }, [profile, user]); // Depend on profile

  useProtectedRoute(user, profile, isLoading);

  const value = {
    user,
    profile,
    family,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};