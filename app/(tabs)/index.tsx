// app/(tabs)/index.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebaseConfig';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// ChoreItem Component (Unchanged)
const ChoreItem = ({ item, onToggle, onDelete }: { item: any, onToggle: (id: string, isCompleted: boolean) => void, onDelete: (id: string) => void }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.choreItem, { backgroundColor: theme.background, shadowColor: theme.text }]}>
      <TouchableOpacity onPress={() => onToggle(item.id, item.isCompleted)} style={styles.choreDetails}>
        <View style={[
          styles.checkBox, 
          { borderColor: item.isCompleted ? '#999' : theme.tint },
          item.isCompleted && { backgroundColor: '#999' }
        ]}>
          {item.isCompleted && <Text style={styles.checkMark}>✓</Text>}
        </View>
        <View style={styles.choreInfo}>
          <Text style={[
            styles.choreText, 
            { color: item.isCompleted ? '#999' : theme.text },
            item.isCompleted && styles.choreTextCompleted
          ]}>{item.title}</Text>
          <Text style={[styles.choreSubText, { color: item.isCompleted ? '#aaa' : theme.icon }]}>
            Assigned to: {item.assignedToName || 'Anyone'}
          </Text>
          {item.dueDate && (
            <Text style={[styles.choreSubText, { color: item.isCompleted ? '#aaa' : '#E57373' }]}>
              Due: {item.dueDate}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
        <IconSymbol name="trash" size={22} color="#E57373" />
      </TouchableOpacity>
    </View>
  );
};

// MemberSelectItem Component (Unchanged)
const MemberSelectItem = ({ item, isSelected, onSelect }: { item: any, isSelected: boolean, onSelect: () => void }) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const avatarColor = isSelected ? theme.tint : (theme.tint + '20');
  const avatarTextColor = isSelected ? '#FFF' : theme.tint;
  const cardColor = isSelected ? (theme.tint + '20') : theme.background;
  const nameColor = isSelected ? theme.tint : theme.text;

  return (
    <TouchableOpacity onPress={onSelect} style={[styles.memberCard, { backgroundColor: cardColor, borderColor: isSelected ? theme.tint : (theme.icon + '30') }]}>
      <View style={[styles.memberAvatar, { backgroundColor: avatarColor }]}>
        <Text style={[styles.memberAvatarText, { color: avatarTextColor }]}>
          {item.name ? item.name[0].toUpperCase() : 'U'}
        </Text>
      </View>
      <Text style={[styles.memberName, { color: nameColor }]} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );
}

export default function MyChoresScreen() {
  const { user, profile, family } = useAuth();
  const [chores, setChores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const [newChoreTitle, setNewChoreTitle] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Fetch chores (Unchanged)
  useEffect(() => {
    if (!profile?.familyId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const choresCollectionRef = collection(db, 'families', profile.familyId, 'chores');
    const q = query(choresCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const choresList: any[] = [];
      querySnapshot.forEach((doc) => {
        choresList.push({ id: doc.id, ...doc.data() });
      });
      choresList.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      });
      setChores(choresList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching chores:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  // handleToggleChore (Unchanged)
  const handleToggleChore = async (id: string, isCompleted: boolean) => {
    if (!profile?.familyId) return;
    const choreDocRef = doc(db, 'families', profile.familyId, 'chores', id);
    try {
      await updateDoc(choreDocRef, {
        isCompleted: !isCompleted,
        completedAt: !isCompleted ? serverTimestamp() : null,
        completedBy: !isCompleted ? user?.uid : null
      });
    } catch (error) {
      console.error("Error toggling chore:", error);
    }
  };

  // handleDeleteChore (Unchanged)
  const handleDeleteChore = (id: string) => {
    if (!profile?.familyId) return;

    Alert.alert(
      "Delete Chore",
      "Are you sure you want to delete this chore?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const choreDocRef = doc(db, 'families', profile.familyId, 'chores', id);
            try {
              await deleteDoc(choreDocRef);
            } catch (error) {
              console.error("Error deleting chore:", error);
              Alert.alert("Error", "Could not delete chore.");
            }
          },
        },
      ]
    );
  };

  // closeModal (Unchanged)
  const closeModal = () => {
    setIsModalVisible(false);
    setNewChoreTitle("");
    setSelectedMemberId(null);
    setDueDate("");
  }

  // --- UPDATED: Add Chore Function ---
  const handleAddChore = async () => {
    // Specific check for title
    if (newChoreTitle.trim() === "") {
      Alert.alert("Error", "Please enter a chore title.");
      return;
    }

    // --- THIS IS THE FIX ---
    // Specific check for family data
    if (!profile?.familyId || !family) {
      Alert.alert("Error", "Family data is not loaded. Please try again in a moment.");
      console.error("AddChore failed: profile or family not loaded.", { profile, family });
      return;
    }
    // --- END FIX ---
    
    // Find member name from ID
    const selectedMember = family.members.find((m: any) => m.uid === selectedMemberId);

    const choresCollectionRef = collection(db, 'families', profile.familyId, 'chores');
    try {
      await addDoc(choresCollectionRef, {
        title: newChoreTitle.trim(),
        assignedTo: selectedMemberId, 
        assignedToName: selectedMember ? selectedMember.name : "Anyone",
        dueDate: dueDate.trim() || null,
        isCompleted: false,
        createdAt: serverTimestamp(),
        createdBy: user?.uid,
      });
      closeModal();
    } catch (error) {
      console.error("Error adding chore:", error);
      Alert.alert("Error", "Could not add chore.");
    }
  };

  // renderContent (Unchanged)
  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" style={{ marginTop: 20 }} />;
    }
    if (chores.length === 0) {
      return <Text style={[styles.emptyText, { color: theme.text }]}>No chores yet. Add one!</Text>;
    }
    return (
      <FlatList
        data={chores}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChoreItem 
            item={item} 
            onToggle={handleToggleChore} 
            onDelete={handleDeleteChore} 
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    );
  };

  // Main component render (Unchanged)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.icon + '30' }]}>
        <Text style={[styles.title, { color: theme.text }]}>My Chores</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <IconSymbol name="plus" size={28} color={theme.tint} />
        </TouchableOpacity>
      </View>
      
      {renderContent()}

      {/* Add Chore Modal (Unchanged) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalView, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Chore</Text>
              <TouchableOpacity onPress={closeModal}>
                <IconSymbol name="xmark" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.text }]}>Chore Title</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.icon + '20', color: theme.text }]}
              placeholder="e.g. Clean the kitchen"
              placeholderTextColor="#999"
              value={newChoreTitle}
              onChangeText={setNewChoreTitle}
            />

            <Text style={[styles.modalLabel, { color: theme.text }]}>Assign To</Text>
            <FlatList
              data={family?.members || []}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.uid}
              renderItem={({ item }) => (
                <MemberSelectItem 
                  item={item} 
                  isSelected={selectedMemberId === item.uid}
                  onSelect={() => {
                    setSelectedMemberId(prevId => prevId === item.uid ? null : item.uid)
                  }}
                />
              )}
              contentContainerStyle={{ paddingVertical: 10 }}
            />

            <Text style={[styles.modalLabel, { color: theme.text }]}>Due Date (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.icon + '20', color: theme.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
              value={dueDate}
              onChangeText={setDueDate}
              maxLength={10}
            />

            <TouchableOpacity
                style={[styles.modalButtonCreate]}
                onPress={handleAddChore}
              >
              <Text style={[styles.modalButtonCreateText]}>Create Chore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles (Unchanged)
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
  addButton: {
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#666',
  },
  choreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  choreDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  checkMark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  choreInfo: {
    flex: 1,
  },
  choreText: {
    fontSize: 18,
    fontWeight: '500',
  },
  choreTextCompleted: {
    textDecorationLine: 'line-through',
  },
  choreSubText: {
    fontSize: 14,
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  // --- UPDATED MODAL STYLES ---
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 25,
    paddingBottom: 40,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    marginLeft: 24, // to balance the close button
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtonCreate: {
    height: 55,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonCreateText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Member Select Styles
  memberCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginRight: 10,
    minWidth: 90,
    maxWidth: 120,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});