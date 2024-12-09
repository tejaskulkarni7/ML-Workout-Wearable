import React from 'react';
import { StyleSheet, ScrollView, View, Text, Image, Platform, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Collapsible } from '@/components/Collapsible';
import { ExternalLink } from '@/components/ExternalLink';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';

export default function HistoryScreen() {
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

        {/* Content Section */}
        <View style={styles.content}>
          <ThemedText>This app includes example code to help you get started.</ThemedText>

          {/* Collapsible Sections */}
          <Collapsible title="File-based routing">
            <ThemedText>
              This app has two screens:{' '}
              <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> and{' '}
              <ThemedText type="defaultSemiBold">app/(tabs)/history.tsx</ThemedText>
            </ThemedText>
            <ThemedText>
              The layout file in{' '}
              <ThemedText type="defaultSemiBold">app/(tabs)/_layout.tsx</ThemedText> sets up the
              tab navigator.
            </ThemedText>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <ThemedText type="link">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title="Android, iOS, and web support">
            <ThemedText>
              You can open this project on Android, iOS, and the web. To open the web version, press{' '}
              <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
            </ThemedText>
          </Collapsible>

          <Collapsible title="Images">
            <ThemedText>
              For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText>{' '}
              and <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
              different screen densities
            </ThemedText>
            <Image
              source={require('@/assets/images/react-logo.png')}
              style={{ alignSelf: 'center' }}
            />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <ThemedText type="link">Learn more</ThemedText>
            </ExternalLink>
          </Collapsible>
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
