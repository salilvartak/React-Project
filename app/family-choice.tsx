import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore"; // Import Firestore functions
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig.js'; // Import db

const FamilyChoiceScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Generates a 6-digit alphanumeric (A-Z, 0-9) code.
  // We remove '0' and 'O' to avoid confusion.
  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateFamily = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      Alert.alert("Error", "You must be logged in to create a family.");
      return;
    }

    try {
      // Create a new batch
      const batch = writeBatch(db);
      
      // We need to make sure the code is unique.
      // For 2.1B+ combinations, a simple check is fine.
      let familyCode: string;
      let familyDocRef;
      let familyDocSnap;

      do {
        familyCode = generateFamilyCode();
        familyDocRef = doc(db, "families", familyCode);
        familyDocSnap = await getDoc(familyDocRef);
      } while (familyDocSnap.exists());
      
      // 1. Create the new family document
      batch.set(familyDocRef, {
        code: familyCode,
        admin: user.uid,
        members: [
          { uid: user.uid, name: user.displayName, role: 'admin' }
        ],
        createdAt: serverTimestamp(),
      });

      // 2. Update the user's document
      const userDocRef = doc(db, "users", user.uid);
      batch.update(userDocRef, {
        hasFamily: true,
        familyId: familyCode,
      });

      // Commit both writes at the same time
      await batch.commit();

      Alert.alert(
        "Family Created!",
        `Your new family code is: ${familyCode}\n\nShare this code with family members to let them join.`
      );
      router.replace('/(tabs)'); // Navigate to the main app

    } catch (error) {
      console.error("Error creating family: ", error);
      Alert.alert("Error", "Could not create family. Please try again.");
      setIsLoading(false);
    }
  };

  const handleJoinFamily = () => {
    // We will add logic here in the next step
    alert("Join Family logic goes here!");
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {auth.currentUser?.displayName}!</Text>
      <Text style={styles.subtitle}>You're almost ready to start tracking chores.</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleCreateFamily} 
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create a Family</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.buttonOutline} 
        onPress={handleJoinFamily} 
        disabled={isLoading}
      >
        <Text style={styles.buttonOutlineText}>Join a Family</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  button: {
    width: '90%',
    height: 55,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonOutline: {
    width: '90%',
    height: 55,
    borderColor: '#4CAF50',
    borderWidth: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  buttonOutlineText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signOutButton: {
    position: 'absolute',
    bottom: 60,
  },
  signOutText: {
    color: '#888',
    fontSize: 16,
  }
});

export default FamilyChoiceScreen;