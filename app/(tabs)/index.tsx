// app/(tabs)/index.tsx
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/firebaseConfig';
import RNDateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Use the light theme colors directly
const theme = Colors.light;

// ChoreItem Component (Unchanged)
const ChoreItem = ({ item, onToggle, onDelete }: { item: any, onToggle: (id: string, isCompleted: boolean) => void, onDelete: (id: string) => void }) => {
  return (
    <View style={styles.card}>
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
  const avatarColor = isSelected ? theme.tint : '#e9f5e9';
  const avatarTextColor = isSelected ? '#FFF' : theme.tint;
  const cardColor = isSelected ? '#e9f5e9' : '#fff';
  const nameColor = theme.text;

  return (
    <TouchableOpacity onPress={onSelect} style={[styles.memberCard, { backgroundColor: cardColor, borderColor: isSelected ? theme.tint : '#ddd' }]}>
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

  // --- Date Picker State ---
  const [dueDate, setDueDate] = useState(""); // This will hold the formatted string "YYYY-MM-DD"
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  // --- End Date Picker State ---

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

  // closeModal (Updated)
  const closeModal = () => {
    setIsModalVisible(false);
    setNewChoreTitle("");
    setSelectedMemberId(null);
    setDueDate(""); // Clear formatted date string
    setDate(new Date()); // Reset date picker to today
  }

  // handleAddChore (Unchanged)
  const handleAddChore = async () => {
    if (newChoreTitle.trim() === "") {
      Alert.alert("Error", "Please enter a chore title.");
      return;
    }
    if (!profile?.familyId || !family) {
      Alert.alert("Error", "Family data is not loaded. Please try again in a moment.");
      console.error("AddChore failed: profile or family not loaded.", { profile, family });
      return;
    }
    
    const selectedMember = family.members.find((m: any) => m.uid === selectedMemberId);

    const choresCollectionRef = collection(db, 'families', profile.familyId, 'chores');
    try {
      await addDoc(choresCollectionRef, {
        title: newChoreTitle.trim(),
        assignedTo: selectedMemberId, 
        assignedToName: selectedMember ? selectedMember.name : "Anyone",
        dueDate: dueDate.trim() || null, // Use the formatted string
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

  // --- Date Picker Handlers ---
  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false); // Android picker closes itself
    }
    
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      // Format date to "YYYY-MM-DD"
      const formatted = selectedDate.toISOString().split('T')[0];
      setDueDate(formatted);
    }
  };
  // --- End Date Picker Handlers ---


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
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
      />
    );
  };

  // Main component render
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}></Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <IconSymbol name="plus" size={28} color={theme.tint} />
        </TouchableOpacity>
      </View>
      
      {renderContent()}

      {/* Add Chore Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalView, { backgroundColor: '#fff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add New Chore</Text>
              <TouchableOpacity onPress={closeModal}>
                <IconSymbol name="xmark" size={24} color={theme.icon} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.text }]}>Chore Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Clean the kitchen"
              placeholderTextColor="#6c757d"
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
            
            {/* --- NEW: Date Picker Input --- */}
            <Pressable onPress={toggleDatePicker}>
              <TextInput
                style={styles.modalInput}
                placeholder="Select a due date"
                placeholderTextColor="#6c757d"
                value={dueDate} // Show the formatted date string
                editable={false} // Make it not editable
              />
            </Pressable>

            {/* --- NEW: Date Picker Component --- */}
            {showDatePicker && (
              <RNDateTimePicker
                testID="dateTimePicker"
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()} // Optional: prevent past dates
              />
            )}
            
            {/* On iOS, the picker can be part of the modal. We need a button to close it. */}
            {showDatePicker && Platform.OS === 'ios' && (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={toggleDatePicker} style={styles.datePickerDoneButton}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* --- End Date Picker --- */}


            <TouchableOpacity
                style={styles.modalButtonCreate}
                onPress={handleAddChore}
              >
              <Text style={styles.modalButtonCreateText}>Create Chore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '5%',
    paddingVertical: 15,
    paddingTop: 20, // More space at top
  },
  title: {
    fontSize: 38, // Bigger title
    fontWeight: 'bold',
  },
  addButton: {
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#6c757d',
  },
  // --- CARD STYLE ---
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  // --- MODAL STYLES ---
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
    marginLeft: 24, 
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 10,
  },
  // Input style from signup/login
  modalInput: {
    width: '100%',
    height: 55,
    backgroundColor: '#e9f5e9',
    borderRadius: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333',
  },
  // Button style from signup/login
  modalButtonCreate: {
    width: '100%',
    height: 55,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonCreateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Member Select Styles
  memberCard: {
    borderWidth: 1.5,
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
  // Date Picker Button (for iOS)
  datePickerDoneButton: {
    padding: 10,
  },
  datePickerDoneText: {
    color: theme.tint,
    fontSize: 16,
    fontWeight: '600',
  },
});