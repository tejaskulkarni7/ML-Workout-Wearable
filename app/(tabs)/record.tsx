import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LineChart } from "react-native-chart-kit"; 
import { router } from 'expo-router';
import { uploadRecording } from '@/lib/appwrite';
import { BleManager, Device } from 'react-native-ble-plx';

const bleManager = new BleManager();

export default function RecordScreen() {
  const [dataPoints, setDataPoints] = useState([70]); // Initial dummy data for heart rate
  const [heartRate, setHeartRate] = useState(70); // Current numerical value for live feed
  const [isPlaying, setIsPlaying] = useState(false); // Play/Pause state
  const [totalHeartRate, setTotalHeartRate] = useState(70); // Sum of heart rates for average calculation
  const [heartRateCount, setHeartRateCount] = useState(1); // Number of recorded heart rates
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [exercise, setExercise] = useState(''); // Exercise name
  const [reps, setReps] = useState(0); // Repetition count

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
    disconnectFromDevice();
  };

  const handleRecordingUpload = async () => {
    try {
      await uploadRecording(averageHeartRate, exercise, reps);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error uploading recording:', error.message);
      } else {
        console.error('Error uploading recording:', error);
      }
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      if (
        granted['android.permission.ACCESS_FINE_LOCATION'] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.BLUETOOTH_SCAN'] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.BLUETOOTH_CONNECT'] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.error("Location or Bluetooth permission denied");
        return;
      }
    }
  };

  const startScanning = async () => {
    console.log('Starting Bluetooth scan...');
    await requestPermissions();
    const timeout = setTimeout(() => {
      bleManager.stopDeviceScan();
      console.log('Scan timeout reached. Stopped scanning.');
    }, 10000); // 10-second timeout for scanning
   
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Error scanning for devices:', error);
        clearTimeout(timeout); // Clear the timeout if scanning stops early
        return;
      }
      console.log('Scanning for devices...');
      if (device && device.name === 'Tejas Ad') {
        console.log('Device found: ', device.name);
        clearTimeout(timeout); // Clear the timeout when device is found
        bleManager.stopDeviceScan();
        connectToDevice(device);
      }
    });
  };
  

  const connectToDevice = async (device: Device) => {
    try {
        // Connect to the device
        const connectedDevice = await device.connect();
        setConnectedDevice(connectedDevice);
        console.log('Connected to device:', connectedDevice.name);

        // Discover all services and characteristics
        await connectedDevice.discoverAllServicesAndCharacteristics();
        console.log('Discovered services and characteristics');

        await device.requestMTU(512);
        // Read the characteristic value
        bleManager.monitorCharacteristicForDevice(
          connectedDevice.id, // device identifier
          '181C', // service UUID
          '2AB4', // characteristic UUID
          (error, characteristic) => {
              if (error) {
                  console.error('Error monitoring characteristic:', error);
                  return;
              }
              if (characteristic?.value) {
                  console.log('Raw characteristic value:', characteristic.value);
                  try {
                      const data = atob(characteristic.value);
                      console.log('Received data:', data);
                      handleReceivedData(data);
                  } catch (parseError) {
                      console.error('Error parsing characteristic value:', parseError);
                  }
              } else {
                  console.log('Characteristic value is null or undefined');
              }
          }
      );
  } catch (error) {
      console.error('Error connecting to device:', error);
  }
};

const handleReceivedData = (data: string) => {
    try {
        // Assuming the server sends JSON data
        const parsedData = JSON.parse(data);
        const { exercise, reps, heartRate } = parsedData;

        setExercise(exercise);
        setReps(reps);
        setHeartRate(heartRate);
        setDataPoints((prev) => [...prev.slice(-20), heartRate]); // Update chart data
    } catch (error) {
        console.error('Error parsing received data:', error);
    }
};

  const disconnectFromDevice = async () => {
    if (connectedDevice) {
      try {
        await connectedDevice.cancelConnection();
        setConnectedDevice(null);
        console.log('Disconnected from device');
      } catch (error) {
        console.error('Error disconnecting from device:', error);
      }
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      // Pause simulation, but do not disconnect the device
      setIsPlaying(false);
    } else {
      // Start scanning and device connection, and simulate data if not already connected
      if (!connectedDevice) {
        startScanning();
      }
      setIsPlaying(true);
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
        <TouchableOpacity onPress={handlePlayPause} style={styles.bottomButton}>
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