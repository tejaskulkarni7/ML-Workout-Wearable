import React, { useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { Account } from 'react-native-appwrite'; // Assuming you're using Appwrite for session management
import { client } from '@/lib/appwrite';

export default function HomeScreen() {
  useEffect(() => {
    // Check if a session exists, if not, navigate to the signup page
    const account = new Account(client); // Use the initialized client

    account.getSession('current')
      .then(session => {
        // Session exists; user is logged in
        console.log('User session:', session);
      })
      .catch(error => {
        // No session found; navigate to signup page
        console.error('No active session found:', error);
        router.push('/signup');
      });
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        {/* Home Button on the Left */}
        <TouchableOpacity onPress={() => router.push('/')} style={styles.topButton}>
          <Ionicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
        
        {/* Spacer to push the settings button to the right */}
        <View style={styles.spacer} />
  
        {/* Settings Button on the Right */}
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.topButton}>
          <Ionicons name="settings" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.contentContainer}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>Your Weekly Snapshot</Text>
        </View>
      </View>
      </ScrollView>
  
      {/* Centered Rectangular Component */}
      <View style={styles.centeredComponent}>
        <Text style={styles.componentText}>Current Goal</Text>
      </View>
  
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
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#151718',
    alignItems: 'center',
  },
  topButton: {
    padding: 10,
  },
  header: {
    backgroundColor: '#151718',
    paddingVertical: 20,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  centeredComponent: {
    backgroundColor: '#222',
    width: '80%',
    height: 150,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  componentText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
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
  contentContainer: {
    flex: 1,
  },
  spacer: {
    flex: 1, // Takes up all the remaining space
  },  
  buttonText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
  },
});
