import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ImageBackground, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    console.log('handleRegister button pressed! Fields:', { name, identifier, passwordLength: password.length });
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, { 
        name: name.trim(), 
        identifier: identifier.trim().toLowerCase(), 
        password: password
      });
      // The backend returns { status: 'success', data: { token: '...' } }
      await AsyncStorage.setItem('token', response.data.data.token);
      navigation.replace('Preloader');
    } catch (error) {
      console.error('Registration Error Details:', {
        message: error.message,
        responseData: error.response?.data,
        responseStatus: error.response?.status,
        url: error.config?.url
      });
      const errorMessage = error.response?.data?.message || 
        (error.message === 'Network Error' ? 'Cannot connect to server. Please verify your backend server is running locally.' : error.message) || 
        'Please check your inputs.';
      Alert.alert('Registration Failed', errorMessage);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/login_bg.jpg')} 
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="tractor" size={35} color="#FFF" />
            </View>
            <Text style={styles.brandTitle}>Join AgriYield</Text>
            <Text style={styles.subtitle}>Start your smart farming journey today.</Text>
          </View>

          <BlurView intensity={80} tint="light" style={styles.glassCard}>
            
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={styles.inputLabel}>Email or Mobile Number</Text>
            <View style={styles.inputContainer}>
              <Feather name="user" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email or Mobile No."
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
              <Text style={styles.buttonText}>Create Account</Text>
              <Feather name="arrow-right" size={20} color="#FFF" style={{marginLeft: 10}} />
            </TouchableOpacity>



            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginContainer}>
              <Text style={styles.alreadyHaveText}>Already have an account? </Text>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

          </BlurView>
          
          <Text style={styles.footer}>© 2024 AgriYield Systems. All rights reserved.</Text>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 78, 59, 0.35)', // Darker, rich forest green tinted overlay
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 35,
    marginTop: 20,
  },
  iconCircle: {
    backgroundColor: '#064E3B',
    width: 65,
    height: 65,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF', // Clean white for contrast
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#E0F2FE', // Very soft blue-white
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.92)', // Slightly more solid for readability
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    height: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#064E3B', // Rich deep green
    height: 54,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  alreadyHaveText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  loginText: {
    color: '#10B981', // Clean emerald color
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  }
});


