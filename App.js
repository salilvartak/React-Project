import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { auth } from './firebaseConfig';
import AuthScreen from './screens/AuthScreen';

// This will be our app's main screen *after* login
// We'll replace this in the next step
const HomeScreen = () => {
  
  const handleSignOut = () => {
    signOut(auth).catch((error) => console.error("Sign Out Error", error));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the App!</Text>
      <Text>You are logged in.</Text>
      <Button title="Sign Out" onPress={handleSignOut} />
    </View>
  );
};

// This is our main App component
export default function App() {
  const [user, setUser] = useState(null); // Keep track of the user
  const [loading, setLoading] = useState(true); // Handle loading state

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show a loading indicator while checking auth
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Conditionally render the correct screen
  return user ? <HomeScreen /> : <AuthScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});