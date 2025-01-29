import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Account, Query } from 'react-native-appwrite';
import { client, databases, appwriteConfig } from '@/lib/appwrite'; // Replace with your actual imports

type GoalDocument = {
  $id: string;
  exercise: string;
  reps_goal: number;
  current_rep: number;
  user_id: string;
  createdAt: string;
};

export default function HomeScreen() {
  const [currentGoal, setCurrentGoal] = useState<GoalDocument | null>(null); // State for most recent goal

  useEffect(() => {
    const account = new Account(client);

    account
      .getSession('current')
      .then((session) => {
        console.log('User session:', session);
        fetchMostRecentGoal(); // Fetch the most recent goal after confirming the session
      })
      .catch((error) => {
        console.error('No active session found:', error);
        router.push('/signup'); // Redirect if no session
      });
  }, []);

  const fetchMostRecentGoal = async () => {
    try {
      const account = new Account(client);
      const user = await account.get();
      const userId = user.$id;

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.goalCollectionId,
        [Query.equal('user_id', userId)]
      );

      const goalsData: GoalDocument[] = response.documents.map((doc: any) => ({
        $id: doc.$id,
        exercise: doc.exercise,
        reps_goal: doc.reps_goal,
        current_rep: doc.current_rep,
        user_id: doc.user_id,
        createdAt: doc.createdAt,
      }));

      const sortedGoals = goalsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCurrentGoal(sortedGoals[0] || null);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.topButton}>
          <Ionicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={styles.spacer} />
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

      {/* Current Goal Section */}
      <View style={styles.centeredComponent}>
        {currentGoal ? (
          <>
            <Text style={styles.componentText}>Current Goal: {currentGoal.exercise}</Text>
            <Text style={styles.componentText}>Target Reps: {currentGoal.reps_goal}</Text>
            <Text style={styles.componentText}>Completed: {currentGoal.current_rep}</Text>

            {/* Custom Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(currentGoal.current_rep / currentGoal.reps_goal) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>
              {Math.min(+((currentGoal.current_rep / currentGoal.reps_goal) * 100).toFixed(1), 100)}%
            </Text>
          </>
        ) : (
          <Text style={styles.componentText}>No current goal available.</Text>
        )}
      </View>

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
  contentContainer: {
    flex: 1,
  },
  spacer: {
    flex: 1,
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
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 20,
    padding: 10,
  },
  componentText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#444',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00ff00',
    borderRadius: 10,
  },
  progressPercentage: {
    color: '#fff',
    fontSize: 16,
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
  buttonText: {
    color: '#fff',
    marginTop: 5,
    fontSize: 14,
  },
});
