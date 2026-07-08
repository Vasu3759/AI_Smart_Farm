import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function DashboardScreen({ navigation }) {
  const [weatherData, setWeatherData] = useState(null);
  const [farms, setFarms] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch Weather
      const weatherRes = await axios.get(`${API_URL}/api/weather?lat=28.7041&lon=77.1025`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeatherData(weatherRes.data.data);

      // Fetch Farms
      const farmRes = await axios.get(`${API_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFarms(farmRes.data.data);

      // Fetch Predictions
      const predRes = await axios.get(`${API_URL}/api/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPredictions(predRes.data.data);

    } catch (error) {
      console.log('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="tractor" size={28} color="#064E3B" />
            <Text style={styles.brandTitle}>AgriYield AI</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionSubtitle}>DASHBOARD OVERVIEW</Text>
        <Text style={styles.greetingTitle}>Good Morning, Farmer{'\n'}John</Text>

        {/* Weather Card */}
        <View style={styles.weatherCard}>
          {loading ? (
            <ActivityIndicator size="large" color="#064E3B" style={{marginVertical: 20}}/>
          ) : weatherData ? (
            <>
              <View style={styles.weatherTopRow}>
                <View>
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={16} color="#4B5563" />
                    <Text style={styles.locationText}>{weatherData.location}</Text>
                  </View>
                  <View style={styles.tempRow}>
                    <Text style={styles.tempLarge}>{weatherData.temperature}°</Text>
                    <View>
                      <Text style={styles.tempDescMain}>Partly</Text>
                      <Text style={styles.tempDescMain}>Sunny</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.weatherRight}>
                  <Feather name="sun" size={50} color="#064E3B" />
                  <Text style={styles.perfectForText}>Perfect for{'\n'}Harvest</Text>
                </View>
              </View>

              <View style={styles.weatherBottomRow}>
                <View style={styles.weatherStat}>
                  <Text style={styles.statLabel}>Humidity</Text>
                  <Text style={styles.statValue}>42%</Text>
                </View>
                <View style={styles.weatherStat}>
                  <Text style={styles.statLabel}>Precip</Text>
                  <Text style={styles.statValue}>10%</Text>
                </View>
                <View style={styles.weatherStat}>
                  <Text style={styles.statLabel}>Wind</Text>
                  <Text style={styles.statValue}>8 mph</Text>
                </View>
                <Feather name="cloud" size={80} color="#F3F4F6" style={styles.bgCloud} />
              </View>
            </>
          ) : (
            <Text style={styles.locationText}>No weather data available</Text>
          )}
        </View>

        {/* AI Live Monitoring Card */}
        <View style={styles.aiCard}>
          <View style={styles.aiHeaderRow}>
            <View style={styles.greenDot} />
            <Text style={styles.aiTitle}>AI LIVE MONITORING</Text>
          </View>
          <Text style={styles.aiText}>3 active fields are showing optimal nitrogen levels.</Text>
          
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>Overall Farm Health</Text>
            <Text style={styles.progressPercent}>85%</Text>
          </View>
        </View>

        {/* Active Fields Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Fields</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Map')}>
            <Text style={styles.viewAllText}>+ Add Field</Text>
          </TouchableOpacity>
        </View>

        {farms.length === 0 ? (
          <Text style={{color: '#6B7280', marginBottom: 20}}>No fields added yet. Draw a boundary to add one!</Text>
        ) : (
          farms.map((farm) => (
            <TouchableOpacity key={farm._id} style={styles.fieldCard} onPress={() => navigation.navigate('Predict', { area: farm.area, farmId: farm._id })}>
              <View style={styles.fieldIconBg}>
                <MaterialCommunityIcons name="leaf" size={24} color="#064E3B" />
              </View>
              <View>
                <Text style={styles.fieldName}>{farm.name}</Text>
                <Text style={styles.fieldSub}>{farm.cropType} • {farm.area} hectares</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Predictions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Predictions</Text>
          <Feather name="filter" size={20} color="#374151" />
        </View>

        {predictions.length === 0 ? (
          <Text style={{color: '#6B7280', marginBottom: 20}}>No predictions run yet.</Text>
        ) : (
          predictions.slice(0, 3).map((pred) => (
            <View key={pred._id} style={styles.predictionCard}>
              <View style={styles.predLeft}>
                <View style={styles.predIconBg}>
                  <Feather name="trending-up" size={20} color="#1F2937" />
                </View>
                <View>
                  <Text style={styles.predTitle}>{pred.farm?.name || 'Field'} - Yield</Text>
                  <Text style={styles.predSub}>{new Date(pred.date).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.predRight}>
                <Text style={styles.predValue}>{pred.predictedYield ? pred.predictedYield.toFixed(0) : '0'}</Text>
                <Text style={styles.predUnit}>bu/ac</Text>
                <Text style={styles.predGrowth}>AI Est.</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light cream
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
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
  iconButton: {
    padding: 5,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 5,
  },
  greetingTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 30,
    lineHeight: 40,
  },
  weatherCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 25,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  weatherTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
    marginLeft: 6,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tempLarge: {
    fontSize: 55,
    fontWeight: '900',
    color: '#064E3B',
    marginRight: 15,
  },
  tempDescMain: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
  },
  weatherRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  perfectForText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981', // Brighter green
    textAlign: 'center',
    marginTop: 8,
  },
  weatherBottomRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 15,
    position: 'relative',
  },
  weatherStat: {
    marginRight: 25,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  bgCloud: {
    position: 'absolute',
    right: -20,
    bottom: -10,
    opacity: 0.8,
  },
  aiCard: {
    backgroundColor: '#115E59', // Dark elegant green
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    shadowColor: '#115E59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginRight: 10,
  },
  aiTitle: {
    color: '#D1FAE5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  aiText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 25,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressBarFill: {
    width: '85%',
    height: '100%',
    backgroundColor: '#A7F3D0',
    borderRadius: 3,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '600',
  },
  progressPercent: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#064E3B',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#064E3B',
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  fieldIconBg: {
    backgroundColor: '#ECFDF5',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 3,
  },
  fieldSub: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  predictionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  predLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  predIconBg: {
    backgroundColor: '#F3F4F6',
    width: 45,
    height: 45,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  predTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 3,
  },
  predSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  predRight: {
    alignItems: 'flex-end',
  },
  predValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#064E3B',
  },
  predUnit: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 3,
  },
  predGrowth: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  }
});
