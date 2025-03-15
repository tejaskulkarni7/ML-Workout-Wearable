import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { newGoalFunction } from '@/lib/appwrite'; // Your goal creation function
import { databases, appwriteConfig, account, deleteGoal } from '@/lib/appwrite'; // Adjust as necessary for fetching goals
import { Query } from 'react-native-appwrite';

// Define the Document type for your goal
type GoalDocument = {
  $id: string;
  exercise: string;
  reps_goal: number;
  current_rep: number;
  user_id: string;
};

export default function GoalsScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility
  const [newGoal, setNewGoal] = useState(''); // State for input field
  const [selectedExercise, setSelectedExercise] = useState('bench press'); // State for selected exercise
  const [goals, setGoals] = useState<GoalDocument[]>([]);

  // Toggle modal visibility
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  // Goal input validation to ensure it's a number
  const handleGoalChange = (text: string) => {
    const value = text.replace(/[^0-9.]/g, ''); // Allow only numbers and decimals
    setNewGoal(value);
  };

  // Fetch goals from the Appwrite database
  const fetchGoals = async () => {
  try {
    // Fetch goals for the current user
    const user = await account.get();
    const userId = user.$id;
    
    // Query Appwrite database for the user's goals
    const response = await databases.listDocuments(
      appwriteConfig.databaseId, // Your database ID
      appwriteConfig.goalCollectionId, // Your collection ID
      [Query.equal('user_id', userId)] // Query goals by user_id
    );

    // Map the fetched documents to GoalDocument[] type
    const goalsData: GoalDocument[] = response.documents.map((doc: any) => ({
      $id: doc.$id,
      exercise: doc.exercise,
      reps_goal: doc.reps_goal,
      current_rep: doc.current_rep,
      user_id: doc.user_id,
      createdAt: doc.createdAt
    }));

    setGoals(goalsData); // Store mapped goals in state
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching goals:', error.message);
    } else {
      console.error('Error fetching goals:', error);
    }
  }
};

  // Create a new goal
  const handleCreateGoal = async () => {
    try {
      // Ensure the goal is numeric before calling the function
      const numericGoal = parseFloat(newGoal);
      if (isNaN(numericGoal)) {
        throw new Error('Goal must be a valid number.');
      }

      await newGoalFunction(selectedExercise, numericGoal);
      toggleModal(); // Close the modal after creating the goal
      fetchGoals(); // Refresh goals after adding a new one
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error creating goals:', error.message);
      } else {
        console.error('Error creating goals:', error);
      }
    }
  };

  // Fetch goals on initial render
  useEffect(() => {
    fetchGoals();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.topButton}>
          <Ionicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleModal} style={styles.addButton}>
          <Ionicons name="add-circle" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>My Goals</Text>
          </View>
        </View>

        {/* Displaying User's Goals */}
        <View style={styles.goalsList}>
          {goals.length === 0 ? (
            <Text style={styles.noGoalsText}>No goals added yet.</Text>
          ) : (
            goals.map((goal) => {
              let currentRep = parseInt(goal.current_rep as unknown as string, 10);
              const goalRep = parseInt(goal.reps_goal as unknown as string, 10);
              if (currentRep > goalRep) {
                currentRep = goalRep;
              }
              const progress = Math.min((currentRep / goalRep) * 100, 100); // Progress in percentage
            
              return (
                <View key={goal.$id} style={styles.goalItem}>
                  {/* Trash Can Icon */}
                  <TouchableOpacity
                    style={styles.trashIcon}
                    onPress={() => deleteGoal(goal.$id)} // Call the deleteGoal function
                  >
                    <Ionicons name="trash" size={20} color="red" />
                  </TouchableOpacity>
              
                  {/* Exercise Name */}
                  <Text style={styles.goalText}>
                    {goal.exercise} - Goal: {goal.reps_goal} reps
                  </Text>
                  <Text style={styles.goalText}>Current: {goal.current_rep} reps</Text>
              
                  {/* Progress Bar */}
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${progress}%` }]} // Adjust width based on progress
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => router.push('/history')} style={styles.bottomButton}>
          <Ionicons name="time" size={30} color="#fff" />
          <Text style={styles.buttonText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/record')} style={styles.bottomButton}>
          <Ionicons name="play-circle" size={50} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/goals')} style={styles.bottomButton}>
          <Ionicons name="pencil" size={30} color="#fff" />
          <Text style={styles.buttonText}>Goals</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for adding goal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header with Title and Close Button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a New Goal</Text>

              {/* Close (X) button */}
              <TouchableOpacity onPress={toggleModal} style={styles.closeButton}>
                <Ionicons name="close-circle" size={25} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Exercise selection dropdown */}
            <Text style={styles.label}>Select Exercise:</Text>
            <Picker
              selectedValue={selectedExercise}
              onValueChange={(itemValue) => setSelectedExercise(itemValue)}
              style={[styles.picker, selectedExercise ? styles.selectedPicker : {}]} // Conditional styling
              dropdownIconColor="#fff" // Optional: Makes dropdown arrow white
            >
              <Picker.Item label="Bench Press" value="bench press" color="#000" />
              <Picker.Item label="Squat" value="squat" color="#000" />
              <Picker.Item label="Deadlift" value="deadlift" color="#000" />
            </Picker>

            {/* Goal input field */}
            <TextInput
              style={styles.input}
              placeholder="Enter your goal..."
              placeholderTextColor="#aaa"
              value={newGoal}
              onChangeText={handleGoalChange} // Using the handleGoalChange function to ensure number input
              keyboardType="numeric" // Only allow numeric input on the keyboard
            />

            {/* Create button */}
            <TouchableOpacity onPress={handleCreateGoal} style={styles.createButton}>
              <Text style={styles.buttonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
  },
  selectedPicker: {
    color: '#fff', // Change selected item's font color to white
  },
  topBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#151718',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topButton: {
    padding: 10,
  },
  addButton: {
    padding: 10,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#151718',
    padding: 20,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  goalsList: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  goalItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  goalText: {
    color: '#fff',
    fontSize: 16,
  },
  noGoalsText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#151718',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  bottomButton: {
    alignItems: 'center',
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    flex: 1, // Ensures the title takes the available space on the left
    bottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 5,
    padding: 10,
    color: '#fff',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#e63946',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    color: '#000',
  },
  trashIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#444',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
});
