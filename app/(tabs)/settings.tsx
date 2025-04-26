import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Modal, TextInput } from "react-native";
import { router } from "expo-router";
import { deleteAccount, logout } from "@/lib/appwrite"; // Import the deleteAccount function
import Ionicons from "@expo/vector-icons/Ionicons";
import { newWeightFunction } from '@/lib/appwrite';

export default function SettingsScreen() {
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility 
  const [newWeight, setNewWeight] = useState(''); // State for input field
    // Toggle modal visibility
  const toggleWeightModal = () => {
    setIsModalVisible(!isModalVisible);
  };
    // Goal input validation to ensure it's a number
  const handleWeightChange = (text: string) => {
    const value = text.replace(/[^0-9.]/g, ''); // Allow only numbers and decimals
    setNewWeight(value);
  };
  // Logout function
  const logoutAccount = async () => {
    try {
      // Call the Appwrite logout function
      await logout(); // Deletes the current session

      router.replace("/login"); 
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again later.");
    }
  };

  // Handle Delete Account button
  const handleDeleteAccount = async () => {
    try {
      // Confirm deletion
      Alert.alert(
        "Confirm Delete",
        "Are you sure you want to delete your account? This action cannot be undone.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteAccount();
              router.push("/signup"); // Redirect to the signup screen
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to delete account. Please try again later.");
    }
  };
  
  const handleConfigureWeight = async () => {
    try {
      // Ensure the goal is numeric before calling the function
      const numericWeight = parseFloat(newWeight);
      if (isNaN(numericWeight)) {
        throw new Error('Weight must be a valid number.');
      }

      await newWeightFunction(numericWeight);
      toggleWeightModal(); // Close the modal after creating the goal
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating Weight:', error.message);
      } else {
        console.error('Error updating Weight:', error);
      }
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Logout Button */}
      <TouchableOpacity
        onPress={() => router.push("/")}
        style={styles.topButton}
      >
        <Ionicons name="home" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.weightButton} onPress={toggleWeightModal}>
        <Text style={styles.logoutButtonText}>Configure Body Weight</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logoutAccount}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Delete Account Button */}
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
      {/* Modal for adding weight */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleWeightModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header with Title and Close Button */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Configure Your Weight (lbs)</Text>

              {/* Close (X) button */}
              <TouchableOpacity onPress={toggleWeightModal} style={styles.closeButton}>
                <Ionicons name="close-circle" size={25} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Goal input field */}
            <TextInput
              style={styles.input}
              placeholder="Enter your Weight in Pounds..."
              placeholderTextColor="#aaa"
              value={newWeight}
              onChangeText={handleWeightChange} // Using the handleGoalChange function to ensure number input
              keyboardType="numeric" // Only allow numeric input on the keyboard
            />

            {/* Create button */}
            <TouchableOpacity onPress={handleConfigureWeight} style={styles.createButton}>
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
    backgroundColor: "#151718",
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
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
  weightButton: {
    marginTop: 20,
    backgroundColor: "#4caf50", // Green color for logout button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButton: {
    marginTop: 100,
    backgroundColor: "#4caf50", // Green color for logout button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    marginTop: 20,
    backgroundColor: "#ff4d4d", // Red color for delete button
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  topButton: {
    padding: 10,
  },
});
