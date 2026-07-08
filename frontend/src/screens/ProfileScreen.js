import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.data);
      } catch (error) {
        console.log('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="tractor" size={28} color="#064E3B" />
          <Text style={styles.brandTitle}>AgriYield AI</Text>
        </View>
      </View>

      <Text style={styles.pageTitle}>Profile</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#064E3B" style={{marginTop: 50}} />
      ) : (
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Feather name="user" size={40} color="#064E3B" />
          </View>
          <Text style={styles.name}>{user?.name || 'Farmer'}</Text>
          <Text style={styles.email}>{user?.email || 'farmer@agriyield.ai'}</Text>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#EF4444" style={{marginRight: 10}} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064E3B',
    marginLeft: 10,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#064E3B',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    width: '100%',
    marginVertical: 25,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  }
});
