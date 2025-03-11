import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { databases, appwriteConfig, account } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';

interface Exercise {
  exercise: string;
  reps: number;
}

interface Workout {
  workoutId: string;
  date: string;
  exercises: Exercise[];
  averageHeartRate: string;
}

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  useEffect(() => {
    fetchWorkoutHistory();
  }, []);

  const fetchWorkoutHistory = async () => {
    try {
      const user = await account.get();
      const userId = user.$id;

      // Fetch all workouts for the current user
      const workoutResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.workoutCollectionId,
        [Query.equal('user_id', userId)]
      );

      const workoutData = workoutResponse.documents;

      // Fetch all sets for each workout and aggregate data
      const workoutHistory = await Promise.all(
        workoutData.map(async (workout) => {
          const setsResponse = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.setCollectionId,
            [Query.equal('workout_id', workout.$id)]
          );

          const setsData = setsResponse.documents;

          // Aggregate data for the workout
          const aggregatedData = setsData.reduce(
            (acc: { exercises: Exercise[]; totalHeartRate: number; setCount: number }, set: any) => {
              const existingExercise = acc.exercises.find(ex => ex.exercise === set.exercise);
              if (existingExercise) {
                existingExercise.reps += set.rep_count;
              } else {
                acc.exercises.push({ exercise: set.exercise, reps: set.rep_count });
              }
              acc.totalHeartRate += set.avghr;
              acc.setCount += 1;
              return acc;
            },
            { exercises: [], totalHeartRate: 0, setCount: 0 }
          );

          const averageHeartRate = aggregatedData.setCount > 0 ? (aggregatedData.totalHeartRate / aggregatedData.setCount).toFixed(1) : 'N/A';

          return {
            workoutId: workout.$id,
            date: workout.date,
            exercises: aggregatedData.exercises,
            averageHeartRate,
          };
        })
      );

      // Sort workouts by date in descending order
      workoutHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setWorkouts(workoutHistory);
    } catch (error) {
      console.error('Error fetching workout history:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.topButton}>
          <Ionicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={{ color: 'white', fontSize: 30, fontWeight: 'bold' }}>Workout History</Text>
          </View>
        </View>

        {/* Display Workout History */}
        <View style={styles.content}>
          {workouts.length === 0 ? (
            <Text style={styles.noWorkoutsText}>No workout history available.</Text>
          ) : (
            workouts.map((workout) => (
              <View key={workout.workoutId} style={styles.workoutItem}>
                <Text style={styles.workoutDate}>Date: {new Date(workout.date).toLocaleString()}</Text>
                <Text style={styles.workoutAverageHeartRate}>Average Heart Rate: {workout.averageHeartRate} bpm</Text>
                {workout.exercises.map((exercise, index) => (
                  <Text key={index} style={styles.exerciseText}>
                    {exercise.exercise}: {exercise.reps} reps
                  </Text>
                ))}
              </View>
            ))
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151718',
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
  content: {
    padding: 20,
  },
  noWorkoutsText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  workoutItem: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  workoutDate: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  workoutAverageHeartRate: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  exerciseText: {
    color: '#fff',
    fontSize: 14,
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