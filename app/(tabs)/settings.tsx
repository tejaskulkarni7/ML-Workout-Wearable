import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { deleteAccount, logout } from '@/lib/appwrite'; // Import the deleteAccount function
import Ionicons from '@expo/vector-icons/Ionicons';


export default function SettingsScreen() {
  // Logout function
  const logoutAccount = async () => {
    try {
      // Call the Appwrite logout function
      await logout(); // Deletes the current session

      // Optionally, redirect to the login/signup screen after logging out
      router.push('/login'); // Or wherever the user should go after logout
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again later.');
    }
  };

  // Handle Delete Account button
  const handleDeleteAccount = async () => {
    try {
      // Confirm deletion
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete your account? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteAccount();
              router.push('/signup'); // Redirect to the signup screen
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Logout Button */}
      <TouchableOpacity onPress={() => router.push('/')} style={styles.topButton}>
          <Ionicons name="home" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={logoutAccount}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* Delete Account Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
    padding: 20,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#4caf50', // Green color for logout button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 20,
    backgroundColor: '#ff4d4d', // Red color for delete button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topButton: {
    padding: 10,
  },
});
