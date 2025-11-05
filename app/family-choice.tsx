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
  const router = useRouter();

  // Generates a 6-digit alphanumeric (A-Z, 0-9) code.
  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // 1. This function just opens the modal
  const handleCreateFamily = () => {
    setIsModalVisible(true);
  };

  // 2. This handles the modal's "Create" button press
  const handleSubmitFamilyName = () => {
    if (familyName && familyName.trim() !== "") {
      closeModal();
      executeCreateFamily(familyName.trim());
    } else {
      Alert.alert("Error", "Family name cannot be empty.");
    }
  };

  // 3. This is the main creation logic
  const executeCreateFamily = async (name: string) => {
    setIsLoading(true); // Show loading spinner
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      Alert.alert("Error", "You must be logged in to create a family.");
      return;
    }

    let success = false; // Flag to prevent re-render on success
    let familyCode = ''; // To store the generated code
    try {
      const batch = writeBatch(db);
      let familyDocRef;
      let familyDocSnap;

      // Find a unique family code
      do {
        familyCode = generateFamilyCode();
        familyDocRef = doc(db, "families", familyCode);
        familyDocSnap = await getDoc(familyDocRef);
      } while (familyDocSnap.exists());
      
      // 1. Create the new family document
      batch.set(familyDocRef, {
        name: name,
        code: familyCode,
        admin: user.uid,
        members: [
          { uid: user.uid, name: user.displayName, role: 'admin' }
        ],
        createdAt: serverTimestamp(),
      });

      // 2. Create or update the user's document
      const userDocRef = doc(db, "users", user.uid);
      // Use set with { merge: true }
      // This will CREATE the doc if it's missing (fixing your error)
      // or UPDATE it if it already exists.
      batch.set(userDocRef, {
        hasFamily: true,
        familyId: familyCode,
      }, { merge: true });

      // 3. Commit both changes at once
      await batch.commit();
      
      success = true; // Mark as successful
      
      // 4. Navigate to the success screen
      router.replace({
        pathname: '/family-created',
        params: { code: familyCode, name: name }
      });

    } catch (error) {
      console.error("Error creating family: ", error);
      Alert.alert("Error", "Could not create family. Please try again.");
    } finally {
      // 5. ONLY stop loading if it failed.
      // If it succeeded, the screen will navigate away,
      // and setting state here would cause a race condition.
      if (!success) {
        setIsLoading(false);
      }
    }
  };

  // Helper to close and reset the modal state
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

  return (
    <View style={styles.container}>
      {/* --- Modal for entering family name --- */}
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

      {/* --- Main Screen Content --- */}
      <Text style={styles.title}>Welcome, {auth.currentUser?.displayName}!</Text>
      <Text style={styles.subtitle}>You're almost ready to start tracking chores.</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleCreateFamily} // Opens the modal
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

// --- Styles ---
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