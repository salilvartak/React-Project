// app/family-choice.tsx
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
// Import arrayUnion, getDoc, and updateDoc
import { arrayUnion, doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../firebaseConfig.js';

const FamilyChoiceScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Create Family Modal
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [familyName, setFamilyName] = useState("");

  // --- NEW: State for Join Family Modal ---
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [familyCode, setFamilyCode] = useState("");

  const router = useRouter(); 

  const generateFamilyCode = () => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // --- Create Family Modal Logic ---
  const handleCreateFamily = () => {
    setIsCreateModalVisible(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
    setFamilyName("");
  };

  const handleSubmitFamilyName = () => {
    if (familyName && familyName.trim() !== "") {
      closeCreateModal();
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

    let newFamilyCode = '';
    try {
      const batch = writeBatch(db);
      let familyDocRef;
      let familyDocSnap;

      do {
        newFamilyCode = generateFamilyCode();
        familyDocRef = doc(db, "families", newFamilyCode);
        familyDocSnap = await getDoc(familyDocRef);
      } while (familyDocSnap.exists());
      
      batch.set(familyDocRef, {
        name: name,
        code: newFamilyCode,
        admin: user.uid,
        members: [
          { uid: user.uid, name: user.displayName, role: 'admin' }
        ],
        createdAt: serverTimestamp(),
      });

      const userDocRef = doc(db, "users", user.uid);
      batch.set(userDocRef, {
        hasFamily: true,
        familyId: newFamilyCode,
      }, { merge: true });

      await batch.commit();
      
      Alert.alert(
        "Family Created!",
        `Your new family code is: ${newFamilyCode}\n\nYou will now be taken to the app.`
      );
      
      // Navigation is handled by onSnapshot in _layout.tsx

    } catch (error) {
      console.error("Error creating family: ", error);
      Alert.alert("Error", "Could not create family. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  // --- NEW: Join Family Modal Logic ---
  
  const handleJoinFamily = () => {
    // This now opens the join modal
    setIsJoinModalVisible(true);
  };

  const closeJoinModal = () => {
    setIsJoinModalVisible(false);
    setFamilyCode("");
  };

  const handleSubmitFamilyCode = async () => {
    const code = familyCode.toUpperCase().trim();
    if (code.length !== 6) {
      Alert.alert("Error", "Invite code must be 6 characters long.");
      return;
    }

    setIsLoading(true);
    const user = auth.currentUser;
    if (!user) {
      setIsLoading(false);
      Alert.alert("Error", "You must be logged in to join a family.");
      return;
    }

    try {
      // 1. Check if family exists
      const familyDocRef = doc(db, "families", code);
      const familyDocSnap = await getDoc(familyDocRef);

      if (!familyDocSnap.exists()) {
        throw new Error("Family code not found. Please check the code and try again.");
      }

      // 2. Add user to family and update user's profile in a batch
      const batch = writeBatch(db);

      // Add user to the family's members array
      const newMember = {
        uid: user.uid,
        name: user.displayName || user.email,
        role: 'member'
      };
      batch.update(familyDocRef, {
        members: arrayUnion(newMember)
      });

      // Update the user's document
      const userDocRef = doc(db, "users", user.uid);
      batch.set(userDocRef, {
        hasFamily: true,
        familyId: code,
      }, { merge: true });

      // 3. Commit the batch
      await batch.commit();

      Alert.alert("Success!", `You have joined the "${familyDocSnap.data().name}" family!`);
      closeJoinModal();
      
      // Navigation will be handled by the onSnapshot listener in _layout.tsx

    } catch (error: any) {
      console.error("Error joining family: ", error);
      Alert.alert("Error", error.message || "Could not join family. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };


  // --- Sign Out Logic ---
  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <View style={styles.container}>
      {/* Create Family Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isCreateModalVisible}
        onRequestClose={closeCreateModal}
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
                onPress={closeCreateModal}
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

      {/* --- NEW: Join Family Modal --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isJoinModalVisible}
        onRequestClose={closeJoinModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Join a Family</Text>
            <Text style={styles.modalSubtitle}>Enter the 6-character invite code.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ABC123"
              placeholderTextColor="#999"
              value={familyCode}
              onChangeText={setFamilyCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeJoinModal}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonCancelText]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={handleSubmitFamilyCode} // Use the new handler
              >
                <Text style={[styles.modalButtonText, styles.modalButtonCreateText]}>Join</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Screen Content */}
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
        onPress={handleJoinFamily} // This now opens the join modal
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