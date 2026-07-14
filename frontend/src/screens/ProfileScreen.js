import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ farms: 0, predictions: 0 });
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch User Info
      const userRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data.data);

      // Fetch Farms for stats
      const farmRes = await axios.get(`${API_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch Predictions for stats
      const predRes = await axios.get(`${API_URL}/api/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        farms: farmRes.data.data.length,
        predictions: predRes.data.data.length
      });
    } catch (error) {
      console.log('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 100 }} />
        ) : (
          <>
            {/* Header Image Background with Farm picture */}
            <ImageBackground 
              source={require('../../assets/login_bg.png')} 
              style={styles.headerBackground}
            >
              <View style={styles.headerOverlay}>
                <View style={styles.brandBadge}>
                  <MaterialCommunityIcons name="tractor" size={24} color="#FFF" />
                  <Text style={styles.brandText}>AgriYield AI</Text>
                </View>
              </View>
            </ImageBackground>

            {/* Profile Card overlapping the background */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Feather name="user" size={40} color="#064E3B" />
              </View>
              <Text style={styles.name}>{user?.name || 'Farmer Member'}</Text>
              <Text style={styles.email}>{user?.email || 'farmer@agriyield.ai'}</Text>
              {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.farms}</Text>
                <Text style={styles.statLabel}>ACTIVE FIELDS</Text>
              </View>
              <View style={styles.statSeparator} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.predictions}</Text>
                <Text style={styles.statLabel}>PREDICTIONS</Text>
              </View>
            </View>

            {/* Menu Options */}
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={styles.menuHeader}>SYSTEM SETTINGS</Text>
              <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Feather name="shield" size={18} color="#0F766E" />
                    </View>
                    <Text style={styles.menuText}>Security & Privacy</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                
                <View style={styles.separator} />

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Feather name="bell" size={18} color="#0F766E" />
                    </View>
                    <Text style={styles.menuText}>Notification Settings</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Feather name="help-circle" size={18} color="#0F766E" />
                    </View>
                    <Text style={styles.menuText}>Support & Help Center</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Logout Action */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Feather name="log-out" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={styles.logoutText}>Log Out Account</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerBackground: {
    height: 180,
    width: '100%',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 78, 59, 0.4)', // Dark green tint overlay
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  brandText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginLeft: 8,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -50, // Overlap the header background
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#FFF',
    marginTop: -20, // push up slightly
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  phone: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#064E3B',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: '60%',
    backgroundColor: '#E5E7EB',
  },
  menuHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1.2,
    marginTop: 10,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBg: {
    backgroundColor: '#E6F4F1',
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 15,
    borderRadius: 18,
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '800',
  }
});
