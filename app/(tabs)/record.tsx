import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LineChart } from "react-native-chart-kit"; // Graph library for real-time updates
import { router } from 'expo-router';

export default function RecordScreen() {
  const [dataPoints, setDataPoints] = useState([70]); // Initial dummy data for heart rate
  const [heartRate, setHeartRate] = useState(70); // Current numerical value for live feed

  // Dummy Data Generator (Simulates live feed)
  useEffect(() => {
    const interval = setInterval(() => {
      const newRate = Math.max(60, Math.min(120, heartRate + (Math.random() * 10 - 5))); // Simulate random values between 60-120
      setHeartRate(newRate);
      setDataPoints((prev) => [...prev.slice(-20), newRate]); // Keep only the last 20 data points
    }, 500); // Updates every second

    return () => clearInterval(interval); // Cleanup on unmount
  }, [heartRate]);

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.topButton}>
          <Ionicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Workout</Text>
        </View>

        {/* Live Heart Rate Numerical Value */}
        <View style={styles.liveValueContainer}>
          <Text style={styles.liveValueText}>Live Heart Rate:</Text>
          <Text style={styles.heartRate}>{Math.round(heartRate)} bpm</Text>
        </View>

        {/* Real-Time Graph */}
        <LineChart
          data={{
            labels: Array.from({ length: dataPoints.length }, (_, i) => (i + 1).toString()),
            datasets: [{ data: dataPoints }],
          }}
          width={350} // Adjust width
          height={200} // Adjust height
          yAxisSuffix=" bpm"
          chartConfig={{
            backgroundGradientFrom: "#1e2923",
            backgroundGradientTo: "#08130d",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          }}
          bezier
          style={styles.graph}
        />
      </ScrollView>

      {/* Bottom Navigation */}
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },
  liveValueContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  liveValueText: {
    fontSize: 20,
    color: '#fff',
  },
  heartRate: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ff4d4d',
    marginTop: 10,
  },
  graph: {
    marginVertical: 20,
    borderRadius: 10,
    alignSelf: 'center',
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
