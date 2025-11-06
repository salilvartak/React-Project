// app/family-choice.tsx
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig.js';

const FamilyChoiceScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const router = useRouter(); // We keep this for the (unused) join button

  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateFamily = () => {
    setIsModalVisible(true);
  };

  const handleSubmitFamilyName = () => {
    if (familyName && familyName.trim() !== "") {
      closeModal();
      executeCreateFamily(familyName.trim());
    } else {
      Alert.alert("Error", "Family name cannot be empty.");
    }
  };

  const executeCreateFamily = async (name: string) => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      Alert.alert("Error", "You must be logged in to create a family.");
      return;
    }

    let familyCode = ''; // To store the generated code
    try {
      const batch = writeBatch(db);
      let familyDocRef;
      let familyDocSnap;

      do {
        familyCode = generateFamilyCode();
        familyDocRef = doc(db, "families", familyCode);
        familyDocSnap = await getDoc(familyDocRef);
      } while (familyDocSnap.exists());
      
      batch.set(familyDocRef, {
        name: name,
        code: familyCode,
        admin: user.uid,
        members: [
          { uid: user.uid, name: user.displayName, role: 'admin' }
        ],
        createdAt: serverTimestamp(),
      });

      const userDocRef = doc(db, "users", user.uid);
      batch.set(userDocRef, {
        hasFamily: true,
        familyId: familyCode,
      }, { merge: true });

      await batch.commit();
      
      // --- THIS IS THE FIX ---
      // 1. Show an Alert with the new code
      Alert.alert(
        "Family Created!",
        `Your new family code is: ${familyCode}\n\nYou will now be taken to the app.`
      );
      
      // 2. DO NOT navigate. The `onSnapshot` in _layout.tsx
      //    will detect the change and navigate automatically.
      
      // router.replace(...) // <-- REMOVED

    } catch (error) {
      console.error("Error creating family: ", error);
      Alert.alert("Error", "Could not create family. Please try again.");
    } finally {
      // 3. We can now safely set loading to false.
      // The onSnapshot will fire AFTER this state update.
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setFamilyName("");
  };

  const handleJoinFamily = () => {
    alert("Join Family logic goes here!");
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  // --- No other changes to the JSX or Styles ---

  return (
    <View style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Name Your Family</Text>
            <Text style={styles.modalSubtitle}>Please enter a name for your new family.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. The Smith Family"
              placeholderTextColor="#999"
              value={familyName}
              onChangeText={setFamilyName}
            />
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeModal}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleSubmitFamilyName}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonCreateText]}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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

// Styles (no changes)
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
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 25,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 2,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonCancelText: {
    color: '#555',
  },
  modalButtonCreate: {
    backgroundColor: '#4CAF50',
  },
  modalButtonCreateText: {
    color: 'white',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FamilyChoiceScreen;