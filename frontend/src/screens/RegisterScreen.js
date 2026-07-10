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
  const [otp, setOtp] = useState('');

  const handleRegister = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, { 
        name: name.trim(), 
        identifier: identifier.trim().toLowerCase(), 
        otp: otp.trim() 
      });
      // The backend returns { status: 'success', data: { token: '...' } }
      await AsyncStorage.setItem('token', response.data.data.token);
      navigation.replace('Dashboard');
    } catch (error) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please check your inputs.');
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/login_bg.png')} 
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="tractor" size={35} color="#FFF" />
            </View>
            <Text style={styles.brandTitle}>Join AgriYield AI</Text>
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

            <Text style={styles.inputLabel}>OTP</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="1234 (For Mentoring)"
                placeholderTextColor="#9CA3AF"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                secureTextEntry
              />
              <TouchableOpacity style={styles.getOtpButton} onPress={() => setOtp('1234')}>
                <Text style={styles.getOtpText}>Get OTP</Text>
              </TouchableOpacity>
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
          
          <Text style={styles.footer}>© 2024 AgriYield AI Systems. All rights reserved.</Text>
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  iconCircle: {
    backgroundColor: '#064E3B',
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
    textAlign: 'center',
  },
  glassCard: {
    borderRadius: 24,
    padding: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 55,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputIconRight: {
    marginLeft: 'auto',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#115E59',
    height: 55,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  socialText: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#374151',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  alreadyHaveText: {
    color: '#4B5563',
    fontSize: 15,
  },
  loginText: {
    color: '#064E3B',
    fontWeight: '700',
    fontSize: 15,
  },
  getOtpButton: {
    marginLeft: 'auto',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  getOtpText: {
    color: '#115E59',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    alignSelf: 'center',
    color: 'rgba(0,0,0,0.4)',
    fontSize: 12,
  }
});
