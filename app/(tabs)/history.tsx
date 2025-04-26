import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { databases, appwriteConfig, account } from "@/lib/appwrite";
import { Query } from "react-native-appwrite";
import Loading from "@/components/Loading";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

interface Exercise {
  exercise: string;
  reps: number;
}

interface Workout {
  workoutId: string;
  date: string;
  exercises: Exercise[];
  averageHeartRate: string;
  totalElapsedTime: number;
  elapsedTimeByExercise: Record<string, number>;
}

const MET_VALUES: Record<string, number> = {
  "bench press": 6.0,
  deadlift: 6.5,
  squat: 5.5,
};

const calculateCalories = (
  exercise: string,
  weightKg: number,
  timeMinutes: number
): number => {
  const MET = MET_VALUES[exercise] || 5.0;
  return ((MET * weightKg * 3.5) / 200) * timeMinutes;
};
const BarChartSection = ({
  workout,
  weightKg,
}: {
  workout: Workout;
  weightKg: number;
}) => {
  const chartData = workout.exercises.map((ex) => {
    const minutes = (workout.elapsedTimeByExercise[ex.exercise] || 0) / 60;
    return {
      label: ex.exercise,
      calories: calculateCalories(ex.exercise, weightKg, minutes),
    };
  });

  const totalCalories = chartData.reduce((sum, e) => sum + e.calories, 0);

  return (
    <View>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
        Total Calories Burned: {totalCalories.toFixed(1)} kcal
      </Text>
      <BarChart
        data={{
          labels: chartData.map((d) => d.label),
          datasets: [{ data: chartData.map((d) => d.calories) }],
        }}
        width={screenWidth - 60}
        height={220}
        fromZero
        yAxisLabel=""
        yAxisSuffix=" kcal"
        chartConfig={{
          backgroundGradientFrom: "#1E2923",
          backgroundGradientTo: "#08130D",
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: () => "#fff",
          barPercentage: 0.5,
        }}
        style={{ marginVertical: 10, borderRadius: 16 }}
      />
    </View>
  );
};

export default function HistoryScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(
    null
  );
  const [userWeight, setUserWeight] = useState<number>(75);

  useEffect(() => {
    const fetchUserWeight = async () => {
      try {
        const user = await account.get();
        const accountId = user.$id;
  
        const userDocList = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.userCollectionId, // user profiles collection
          [Query.equal("accountId", accountId)]
        );
  
        if (userDocList.total > 0) {
          const userDoc = userDocList.documents[0];
          if (userDoc.weight) {
            setUserWeight(userDoc.weight);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user weight:", error);
      }
    };
  
    fetchUserWeight();
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
        [Query.equal("user_id", userId)]
      );

      const workoutData = workoutResponse.documents;

      // Fetch all sets for each workout and aggregate data
      const workoutHistory = await Promise.all(
        workoutData.map(async (workout) => {
          const setsResponse = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.setCollectionId,
            [Query.equal("workout_id", workout.$id)]
          );

          const setsData = setsResponse.documents;

          // Aggregate data for the workout
          const aggregatedData = setsData.reduce(
            (
              acc: {
                exercises: Exercise[];
                totalHeartRate: number;
                setCount: number;
                elapsedTimeByExercise: Record<string, number>;
              },
              set: any
            ) => {
              const existingExercise = acc.exercises.find(
                (ex) => ex.exercise === set.exercise
              );
              if (existingExercise) {
                existingExercise.reps += set.rep_count;
              } else {
                acc.exercises.push({
                  exercise: set.exercise,
                  reps: set.rep_count,
                });
              }

              // Track elapsed time for each exercise
              if (acc.elapsedTimeByExercise[set.exercise]) {
                acc.elapsedTimeByExercise[set.exercise] += set.elapsedTime;
              } else {
                acc.elapsedTimeByExercise[set.exercise] = set.elapsedTime;
              }

              acc.totalHeartRate += set.avghr;
              acc.setCount += 1;
              return acc;
            },
            { exercises: [], totalHeartRate: 0, setCount: 0, elapsedTimeByExercise: {} }
          );

          const averageHeartRate =
            aggregatedData.setCount > 0
              ? (
                  aggregatedData.totalHeartRate / aggregatedData.setCount
                ).toFixed(1)
              : "N/A";

          return {
            workoutId: workout.$id,
            date: workout.date,
            exercises: aggregatedData.exercises,
            elapsedTimeByExercise: aggregatedData.elapsedTimeByExercise,
            averageHeartRate,
            totalElapsedTime: Object.values(aggregatedData.elapsedTimeByExercise).reduce(
              (sum, time) => sum + time,
              0
            ),
          };
        })
      );

      // Sort workouts by date in descending order
      workoutHistory.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setWorkouts(workoutHistory);
    } catch (error) {
      console.error("Error fetching workout history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && <Loading />}
      {/* Header Section */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.push("/")}
          style={styles.topButton}
        >
          <Ionicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={{ color: "white", fontSize: 30, fontWeight: "bold" }}>
              Workout History
            </Text>
          </View>
        </View>

        {/* Display Workout History */}
        <View style={styles.content}>
          {workouts.length === 0 ? (
            <Text style={styles.noWorkoutsText}>
              No workout history available.
            </Text>
          ) : (
            workouts.map((workout) => (
              <TouchableOpacity
                key={workout.workoutId}
                onPress={() =>
                  setExpandedWorkoutId(
                    expandedWorkoutId === workout.workoutId
                      ? null
                      : workout.workoutId
                  )
                }
                style={styles.workoutItem}
              >
                <Text style={styles.workoutDate}>
                  Date: {new Date(workout.date).toLocaleString()}
                </Text>
                <Text style={styles.workoutAverageHeartRate}>
                  Average Heart Rate: {workout.averageHeartRate} bpm
                </Text>
                <Text style={styles.workoutElapsedTime}>
                  Total Elapsed Time: {workout.totalElapsedTime} seconds
                </Text>

                {workout.exercises.map((exercise, index) => (
                  <Text key={index} style={styles.exerciseText}>
                    {exercise.exercise}: {exercise.reps} reps
                  </Text>
                ))}

                {expandedWorkoutId === workout.workoutId && (
                  <View style={{ marginTop: 10 }}>
                    <BarChartSection
                      workout={workout}
                      weightKg={userWeight * 0.453592} // Replace this with actual user weight if needed
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => router.push("/history")}
          style={styles.bottomButton}
        >
          <Ionicons name="time" size={30} color="#fff" />
          <Text style={styles.buttonText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/record")}
          style={styles.bottomButton}
        >
          <Ionicons name="play-circle" size={50} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push("/goals")}
          style={styles.bottomButton}
        >
          <Ionicons name="pencil" size={30} color="#fff" />
          <Text style={styles.buttonText}>Goals</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  workoutElapsedTime: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#151718",
  },
  topBar: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#151718",
    alignItems: "center",
  },
  topButton: {
    padding: 10,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: "#151718",
    padding: 20,
    alignItems: "center",
  },
  titleContainer: {
    flexDirection: "row",
    marginTop: 10,
    gap: 8,
  },
  content: {
    padding: 20,
  },
  noWorkoutsText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  workoutItem: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
  },
  workoutDate: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 5,
  },
  workoutAverageHeartRate: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
  },
  exerciseText: {
    color: "#fff",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#151718",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  bottomButton: {
    alignItems: "center",
    padding: 10,
  },
  buttonText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14,
  },
});
