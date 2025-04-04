import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ScrollView, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Account, Query } from 'react-native-appwrite';
import { client, databases, appwriteConfig } from '@/lib/appwrite';
import Loading from '@/components/Loading';


export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentGoal, setCurrentGoal] = useState<{ exercise: string; reps_goal: number; current_rep: number } | null>(null);
  const [progressAnim] = useState(new Animated.Value(0));
  const [counter, setCounter] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState({ totalReps: 0, exercises: {}, averageHeartRate: 'N/A' });

  useEffect(() => {
    const account = new Account(client);
    account.getSession('current')
      .then(() => {fetchMostRecentGoal() 
                   fetchWeeklyWorkoutSummary();})
      .catch(() => router.push('/signup'));
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
        const sortedGoals = response.documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestGoal = sortedGoals[0] || null;
        setCurrentGoal(latestGoal as unknown as null);
        if (latestGoal) {
          Animated.timing(progressAnim, {
            toValue: (latestGoal.current_rep / latestGoal.reps_goal) * 100,
            duration: 1000,
            useNativeDriver: false,
          }).start();
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
  };
  const fetchWeeklyWorkoutSummary = async () => {
    try {
      const account = new Account(client);
      const user = await account.get();
      const userId = user.$id;
  
      // Get the date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
      // Fetch all workouts within the last 7 days
      const workoutResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.workoutCollectionId,
        [
          Query.equal('user_id', userId),
          Query.greaterThan('date', sevenDaysAgo.toISOString()) // Ensure proper date filtering
        ]
      );
  
      const workoutData = workoutResponse.documents;
  
      // Fetch sets and aggregate data
      let totalReps = 0;
      let totalHeartRate = 0;
      let setCount = 0;
      let exercisesMap: { [key: string]: number } = {};
  
      for (const workout of workoutData) {
        const setsResponse = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.setCollectionId,
          [Query.equal('workout_id', workout.$id)]
        );
  
        const setsData = setsResponse.documents;
  
        for (const set of setsData) {
          totalReps += set.rep_count;
          totalHeartRate += set.avghr;
          setCount += 1;
  
          if (exercisesMap[set.exercise]) {
            exercisesMap[set.exercise] += set.rep_count;
          } else {
            exercisesMap[set.exercise] = set.rep_count;
          }
        }
      }
  
      // Calculate average heart rate
      const averageHeartRate = setCount > 0 ? (totalHeartRate / setCount).toFixed(1) : 'N/A';
  
      // Update state
      setWeeklySummary({
        totalReps,
        exercises: exercisesMap,
        averageHeartRate
      });
    } catch (error) {
      console.error('Error fetching weekly workouts:', error);
    }
    finally{
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && <Loading/>}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.topButton}>
          <Ionicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.topButton}>
          <Ionicons name="settings" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.headerText}>Your Weekly Snapshot</Text>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.centeredComponent}>
          <Text style={styles.componentText}>
            <Text style={styles.boldText}>Total Reps:</Text> {weeklySummary.totalReps}
          </Text>
          <Text style={styles.componentText}>
            <Text style={styles.boldText}>Avg Heart Rate:</Text> {weeklySummary.averageHeartRate}
          </Text>
          <Text style={styles.componentText}>
            <Text style={styles.boldText}>Exercises:</Text>
          </Text>
          {Object.entries(weeklySummary.exercises).map(([exercise, reps]) => (
            <Text key={exercise} style={styles.componentText}>
              <Text>{exercise}:</Text> {reps as number} reps
            </Text>
          ))}
        </View>
      </ScrollView>



      <View style={styles.centeredComponent}>
        {currentGoal ? (
          <>
            <Text style={styles.componentText}>Current Goal: {currentGoal.exercise}</Text>
            <Text style={styles.componentText}>Target Reps: {currentGoal.reps_goal}</Text>
            <Text style={styles.componentText}>Completed: {currentGoal.current_rep}</Text>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
            </View>
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
  boldText: {fontWeight: 'bold', color: '#fff' },  
  container: { flex: 1, backgroundColor: '#151718' },
  topBar: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  topButton: { padding: 10 },
  spacer: { flex: 1 },
  contentContainer: { flex: 1, marginTop: 35},
  headerText: { color: 'white', fontSize: 30, fontWeight: 'bold', textAlign: 'center' },
  centeredComponent: { backgroundColor: '#222', width: '80%', borderRadius: 20, alignSelf: 'center', padding: 10, marginBottom: 35},
  componentText: { color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 10 },
  progressBarContainer: { width: '100%', height: 20, backgroundColor: '#444', borderRadius: 10, overflow: 'hidden', marginVertical: 10 },
  progressBarFill: { height: '100%', backgroundColor: '#00ff00', borderRadius: 10 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#333'},
  bottomButton: { alignItems: 'center', padding: 10 },
  buttonText: { color: '#fff', fontSize: 14 },
});
