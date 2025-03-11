import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LineChart } from "react-native-chart-kit"; 
import { router } from 'expo-router';
import { uploadRecording } from '@/lib/appwrite';

export default function RecordScreen() {
  const [dataPoints, setDataPoints] = useState([70]); // Initial dummy data for heart rate
  const [heartRate, setHeartRate] = useState(70); // Current numerical value for live feed
  const [isPlaying, setIsPlaying] = useState(false); // Play/Pause state
  const [totalHeartRate, setTotalHeartRate] = useState(70); // Sum of heart rates for average calculation
  const [heartRateCount, setHeartRateCount] = useState(1); // Number of recorded heart rates


  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        const newRate = Math.max(60, Math.min(120, heartRate + (Math.random() * 10 - 5)));
        setTotalHeartRate((prev) => prev + newRate);
        setHeartRateCount((prev) => prev + 1);
        setHeartRate(newRate);
        setDataPoints((prev) => [...prev.slice(-20), newRate]); //keeps previous 20 data points on the graph
      }, 500);
    }
    
    return () => clearInterval(interval); // Cleanup on unmount or pause
  }, [isPlaying, heartRate]);


  const averageHeartRate = heartRateCount > 0 ? (totalHeartRate / heartRateCount).toFixed(1) : "N/A";

  const stopSimulation = () => {
    setIsPlaying(false);
    setHeartRate(70);
    setDataPoints([70]);
    handleRecordingUpload();
  };

  const handleRecordingUpload = async () => {
    try {

      await uploadRecording(averageHeartRate, "bench press", 15);
      await uploadRecording(averageHeartRate, "deadlift", 9);

    } catch (error) {
      if (error instanceof Error) {
        console.error('Error uploading recording:', error.message);
      } else {
        console.error('Error uploading recording:', error);
      }
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

      {/* Main Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Record Workout</Text>
        </View>

        {/* Live Heart Rate Numerical Value */}
        <View style={styles.liveValueContainer}>
          <Text style={styles.liveValueText}>Live Heart Rate:</Text>
          <Text style={styles.heartRate}>{Math.round(heartRate)} bpm</Text>
          <Text>Average Heart Rate: {averageHeartRate} bpm</Text>
        </View>

        {/* Real-Time Graph */}
        <LineChart
          data={{
            labels: Array.from({ length: dataPoints.length }, (_, i) => (i + 1).toString()),
            datasets: [{ data: dataPoints }],
          }}
          width={350}
          height={200}
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

      {/*Stop Button*/}
      {!isPlaying && (
        <TouchableOpacity onPress={stopSimulation} style={styles.stopButton}>
          <Ionicons name="stop-circle" size={70} color="red" />
        </TouchableOpacity>
      )}
      {/* Bottom Navigation */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={() => router.push('/history')} style={styles.bottomButton}>
          <Ionicons name="time" size={30} color="#fff" />
          <Text style={styles.buttonText}>History</Text>
        </TouchableOpacity>

        {/* Play/Pause Button */}
        <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.bottomButton}>
          <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={50} color="#fff" />
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
  stopButton: {
    position: 'absolute',
    alignSelf: 'center',
    top: '83%',
    marginTop: -35,
  },  
});
