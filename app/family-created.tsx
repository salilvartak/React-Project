// Create this new file at: app/family-created.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig';

// Simple copy icon (text) for the button
const CopyIcon = () => <Text style={{ fontSize: 20 }}>📋</Text>;

export default function FamilyCreatedScreen() {
  const router = useRouter();
  const user = auth.currentUser; 
  const params = useLocalSearchParams();
  const { name, code } = params;

  const handleDone = () => {
    // Replace to go to the main app, clearing the auth flow from history
    router.replace('/(tabs)');
  };

  const handleCopyToClipboard = () => {
    // TODO: Install expo-clipboard to make this work
    // Run: npx expo install expo-clipboard
    // Then uncomment the following lines:
    
    // import * as Clipboard from 'expo-clipboard';
    // Clipboard.setStringAsync(code as string);
    // Alert.alert("Copied!", "Invite code copied to clipboard.");

    // For now, we'll just show an alert
    Alert.alert("Your Code", `Your family invite code is: ${code}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.familyName}>{name}</Text>
        <Text style={styles.inviteLabel}>Invite Code</Text>
        <View style={styles.codeContainer}>
          <Text style={styles.codeText}>{code}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyToClipboard}>
            <CopyIcon />
          </TouchableOpacity>
        </View>
        <Text style={styles.shareText}>Share this code for others to join your family</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.membersTitle}>Family Members (1)</Text>
        <View style={styles.memberRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName ? user.displayName[0] : (user?.email ? user.email[0] : 'U')}
            </Text>
          </View>
          <View>
            <Text style={styles.memberName}>{user?.displayName || 'Admin'}</Text>
            <Text style={styles.memberEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

// Add the styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f8',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  familyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inviteLabel: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9f5e9',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    letterSpacing: 2,
    marginRight: 15,
  },
  copyButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  shareText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 10,
  },
  membersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e9f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberEmail: {
    fontSize: 14,
    color: '#6c757d',
  },
  doneButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});