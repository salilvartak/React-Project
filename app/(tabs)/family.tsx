// app/(tabs)/family.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Clipboard from 'expo-clipboard';
import { arrayRemove, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform // <-- IMPORT PLATFORM
    ,
    SafeAreaView,
    StyleSheet,
    Text,
    ToastAndroid,
    TouchableOpacity,
    View
} from 'react-native';

const MemberItem = ({ item }: { item: any }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const avatarColor = theme.tint + '20';
  const avatarTextColor = theme.tint;

  return (
    <View style={[styles.memberRow, { borderBottomColor: theme.icon + '20' }]}>
      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
        <Text style={[styles.avatarText, { color: avatarTextColor }]}>
          {item.name ? item.name[0].toUpperCase() : 'U'}
        </Text>
      </View>
      <View>
        <Text style={[styles.memberName, { color: theme.text }]}>{item.name} {item.uid === auth.currentUser?.uid && '(You)'}</Text>
        <Text style={[styles.memberEmail, { color: theme.icon }]}>{item.role}</Text>
      </View>
    </View>
  );
};

export default function FamilyScreen() {
  const { user, profile, family, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const handleCopyToClipboard = async () => {
    if (family?.code) {
      await Clipboard.setStringAsync(family.code);
      
      // --- THIS IS THE FIX ---
      if (Platform.OS === 'android') {
        ToastAndroid.show("Invite code copied to clipboard!", ToastAndroid.SHORT);
      } else {
        // Fallback for iOS and Web
        Alert.alert("Copied!", "Invite code copied to clipboard.");
      }
      // --- END FIX ---
    }
  };

  const handleLeaveFamily = async () => {
    if (!user || !profile || !family) return;

    if (family.admin === user.uid) {
      if (family.members.length > 1) {
        Alert.alert(
          "Admin Error",
          "You are the family admin. Please transfer admin rights to another member before leaving."
        );
        return;
      }
      Alert.alert(
        "Leave Family?",
        "You are the last member. Leaving will permanently delete this family. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Leave & Delete", style: "destructive", onPress: () => performLeave(true) }
        ]
      );
    } else {
      Alert.alert(
        "Leave Family?",
        "Are you sure you want to leave this family?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Leave", style: "destructive", onPress: () => performLeave(false) }
        ]
      );
    }
  };

  const performLeave = async (isLastMember: boolean) => {
    if (!user || !profile || !family) return;
    
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userUpdatePromise = updateDoc(userDocRef, {
        hasFamily: false,
        familyId: null
      });

      let familyUpdatePromise;
      const familyDocRef = doc(db, "families", profile.familyId);

      if (isLastMember) {
         familyUpdatePromise = deleteDoc(familyDocRef);
      } else {
        const memberToRemove = family.members.find((m: any) => m.uid === user.uid);
        if (memberToRemove) {
          familyUpdatePromise = updateDoc(familyDocRef, {
            members: arrayRemove(memberToRemove)
          });
        }
      }

      await Promise.all([userUpdatePromise, familyUpdatePromise].filter(Boolean));
      
      if (Platform.OS === 'android') {
        ToastAndroid.show("You have left the family.", ToastAndroid.SHORT);
      }
      // Note: Navigation is handled automatically by the AuthContext listener

    } catch (error) {
      console.error("Error leaving family:", error);
      Alert.alert("Error", "Could not leave family. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }
  
  if (!family) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text, fontSize: 18, padding: 20, textAlign: 'center' }}>
          No family data found.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.icon + '30' }]}>
        <Text style={[styles.title, { color: theme.text }]}>Family</Text>
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveFamily}>
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color={theme.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.background, shadowColor: theme.text }]}>
          <Text style={[styles.familyName, { color: theme.text }]}>{family.name}</Text>
          <Text style={[styles.inviteLabel, { color: theme.icon }]}>Invite Code</Text>
          <View style={[styles.codeContainer, { backgroundColor: theme.tint + '20' }]}>
            <Text style={[styles.codeText, { color: theme.tint }]}>{family.code}</Text>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyToClipboard}>
              <IconSymbol name="doc.on.doc" size={22} color={theme.tint} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.shareText, { color: theme.icon }]}>Share this code for others to join your family</Text>
        </View>

        <Text style={[styles.membersTitle, { color: theme.text }]}>
          Family Members ({family.members?.length || 0})
        </Text>
        
        <FlatList
          data={family.members}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => <MemberItem item={item} />}
        />
      </View>
    </SafeAreaView>
  );
}

// (Styles are unchanged)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  leaveButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 15,
    padding: 25,
    marginBottom: 30,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  familyName: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inviteLabel: {
    fontSize: 16,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  codeText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginRight: 15,
  },
  copyButton: {
    padding: 10,
  },
  shareText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  membersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 14,
  },
});