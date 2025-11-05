import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Import db and firestore functions
import { Link } from 'expo-router'; // We don't need useRouter here anymore
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../firebaseConfig.js';

const SignupScreen = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    if (displayName === '' || email === '' || password === '' || confirmPassword === '') {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        
        // Update auth profile
        return updateProfile(user, {
          displayName: displayName
        }).then(() => user); // Pass user object to the next .then()
      })
      .then((user) => {
        // Create a new document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        return setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          hasFamily: false, // <-- This is the new, important flag!
        });
      })
      .then(() => {
        console.log('User account created and profile saved in Firestore!');
        // Auth listener in _layout.tsx will now handle the redirect
        // to /family-choice because hasFamily is false.
      })
      .catch((error) => {
        console.error(error);
        Alert.alert("Sign Up Error", error.message);
      });
  };

  return (
    // ... rest of your JSX (no changes needed)
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        placeholderTextColor="#6c757d"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email-ID"
        placeholderTextColor="#6c757d"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#6c757d"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#6c757d"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.signupButton} onPress={handleSignUp}>
        <Text style={styles.signupButtonText}>Signup</Text>
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>Back To Login</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

// ... styles (no changes needed)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  input: {
    width: '90%',
    height: 55,
    backgroundColor: '#e9f5e9',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
  },
  signupButton: {
    width: '90%',
    height: 55,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    width: '90%',
    height: 55,
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignupScreen;