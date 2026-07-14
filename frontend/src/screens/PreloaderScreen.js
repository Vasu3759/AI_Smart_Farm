import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LOADING_STEPS = [
  'Initializing AgriYield Engine...',
  'Connecting to XGBoost AI service...',
  'Fetching localized weather indices...',
  'Loading satellite field mapping...',
  'Syncing secure farm databases...'
];

export default function PreloaderScreen({ navigation }) {
  const [statusText, setStatusText] = useState(LOADING_STEPS[0]);
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Rotation animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.ease,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Change status text every 500ms
    let textIndex = 0;
    const textInterval = setInterval(() => {
      textIndex++;
      if (textIndex < LOADING_STEPS.length) {
        setStatusText(LOADING_STEPS[textIndex]);
      }
    }, 500);

    // Navigate to MainTabs after 2.8 seconds
    const navigateTimeout = setTimeout(() => {
      navigation.replace('MainTabs');
    }, 2800);

    return () => {
      clearInterval(textInterval);
      clearTimeout(navigateTimeout);
    };
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        {/* Pulsing logo icon */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseValue }] }]}>
          <MaterialCommunityIcons name="tractor" size={60} color="#A7F3D0" />
        </Animated.View>

        {/* Brand Name */}
        <Text style={styles.brandTitle}>AgriYield AI</Text>
        <Text style={styles.brandSubtitle}>PRECISION HARVEST ENGINE</Text>

        {/* Spinning loader ring */}
        <View style={styles.loaderContainer}>
          <Animated.View style={[styles.loaderRing, { transform: [{ rotate: spin }] }]} />
        </View>

        {/* Status text */}
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064E3B', // Deep forest green
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '80%',
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    marginBottom: 20,
    shadowColor: '#A7F3D0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 2,
    marginBottom: 50,
  },
  loaderContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  loaderRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopColor: '#A7F3D0', // Glowing green loader part
  },
  statusText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
    opacity: 0.8,
  }
});
