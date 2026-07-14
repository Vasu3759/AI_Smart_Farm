import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { API_URL } from '../config';

export default function DashboardScreen({ navigation }) {
  const [weatherData, setWeatherData] = useState(null);
  const [farms, setFarms] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadAlerts, setUnreadAlerts] = useState(true);
  const [alertsModalVisible, setAlertsModalVisible] = useState(false);
  const [frontendCity, setFrontendCity] = useState('');

  const handleShowAlerts = () => {
    setAlertsModalVisible(true);
    setUnreadAlerts(false);
  };

  const getWeatherAdvice = () => {
    if (!weatherData) return "Retrieving daily regional farming stats...";
    const temp = weatherData.temperature || 28;
    const cond = (weatherData.condition || '').toLowerCase();
    
    if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('shower')) {
      return "🌧️ Rainy conditions detected. Soil moisture is expected to rise. Skip manual irrigation today to prevent crop waterlogging.";
    } else if (temp > 32) {
      return "☀️ High heat detected. Ensure early morning irrigation to shield root structures from evaporation stress.";
    } else {
      return "🌤️ Moderate temperature and stable humidity. Ideal window for nitrogen application and generic crop monitoring.";
    }
  };

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch Farms first to get location
      const farmRes = await axios.get(`${API_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const farmList = farmRes.data.data;
      setFarms(farmList);

      // Default coords (New Delhi)
      let lat = 28.7041;
      let lon = 77.1025;

      try {
        // Request GPS Permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;

          // Lookup real city name on frontend
          const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (address && address.length > 0) {
            const city = address[0].city || address[0].region || address[0].district;
            if (city) {
              setFrontendCity(city);
            }
          }
        } else if (farmList.length > 0 && farmList[0].location?.coordinates) {
          // Fallback to first farm
          const coords = farmList[0].location.coordinates;
          lon = coords[0];
          lat = coords[1];
        }
      } catch (locError) {
        console.log("Failed to fetch live location, falling back:", locError);
        if (farmList.length > 0 && farmList[0].location?.coordinates) {
          const coords = farmList[0].location.coordinates;
          lon = coords[0];
          lat = coords[1];
        }
      }

      // Fetch Weather based on coordinates
      const weatherRes = await axios.get(`${API_URL}/api/weather?lat=${lat}&lon=${lon}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeatherData(weatherRes.data.data);

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
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="tractor" size={24} color="#FFF" />
          </View>
          <View>
            <Text style={styles.brandText}>AgriYield AI</Text>
            <Text style={styles.brandSub}>PRECISION HARVEST PLATFORM</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleShowAlerts}>
          <Feather name="bell" size={20} color="#374151" />
          {unreadAlerts && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeSubtitle}>WELCOME BACK</Text>
        <Text style={styles.welcomeTitle}>Smart Farm Hub</Text>
        <Text style={styles.welcomeDesc}>Monitor fields, retrieve weather, and evaluate predictions in real-time.</Text>

        {/* Live Weather Card */}
        <View style={styles.weatherCard}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFF" style={{ marginVertical: 20 }} />
          ) : weatherData ? (
            <View>
              <View style={styles.weatherRow}>
                <View style={styles.weatherLeft}>
                  <View style={styles.locationContainer}>
                    <Feather name="map-pin" size={14} color="#A7F3D0" style={{ marginRight: 6 }} />
                    <Text style={styles.weatherLocation}>{frontendCity || weatherData.location || 'New Delhi'}</Text>
                  </View>
                  <View style={styles.tempGroup}>
                    <Text style={styles.weatherTemp}>{weatherData.temperature}°C</Text>
                    <Text style={styles.weatherDesc}>{weatherData.condition || 'Sunny'}</Text>
                  </View>
                </View>
                <View style={styles.weatherRight}>
                  <MaterialCommunityIcons 
                    name={
                      (weatherData.condition || '').toLowerCase().includes('rain') ? 'weather-rainy' :
                      (weatherData.condition || '').toLowerCase().includes('cloud') ? 'weather-cloudy' : 'weather-sunny'
                    } 
                    size={46} 
                    color="#FBBF24" 
                  />
                  <Text style={styles.weatherStatusText}>Optimal Harvest Period</Text>
                </View>
              </View>
              
              <View style={styles.weatherBottomRow}>
                <View style={styles.weatherSubMetric}>
                  <Feather name="droplet" size={14} color="#A7F3D0" style={{ marginRight: 4 }} />
                  <Text style={styles.weatherSubText}>Humidity: {weatherData.humidity}%</Text>
                </View>
                <View style={styles.weatherSubSeparator} />
                <View style={styles.weatherSubMetric}>
                  <Feather name="cloud-rain" size={14} color="#A7F3D0" style={{ marginRight: 4 }} />
                  <Text style={styles.weatherSubText}>Rain: {weatherData.rainfall || 0}mm</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.weatherStatusText}>Weather service unavailable</Text>
          )}
        </View>

        {/* Overview Stats Row */}
        <View style={styles.overviewStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{farms.length}</Text>
            <Text style={styles.statLabel}>Active Fields</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{predictions.length}</Text>
            <Text style={styles.statLabel}>AI Models Run</Text>
          </View>
        </View>

        {/* Active Fields Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Active Fields</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Map')}>
            <Feather name="plus" size={16} color="#0F766E" style={{ marginRight: 4 }} />
            <Text style={styles.addButtonText}>Add Field</Text>
          </TouchableOpacity>
        </View>

        {farms.length === 0 ? (
          <View style={styles.emptyFieldsCard}>
            <Feather name="map" size={30} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyCardText}>No fields registered yet</Text>
            <Text style={styles.emptyCardSub}>Draw field boundaries on the map to start tracking.</Text>
          </View>
        ) : (
          farms.map((farm) => (
            <TouchableOpacity key={farm._id} style={styles.fieldCard} onPress={() => navigation.navigate('Predict', { area: farm.area, farmId: farm._id })}>
              <View style={styles.fieldLeft}>
                <View style={styles.fieldIconBg}>
                  <MaterialCommunityIcons name="leaf" size={22} color="#0F766E" />
                </View>
                <View>
                  <Text style={styles.fieldName}>{farm.name}</Text>
                  <Text style={styles.fieldDetail}>{farm.cropType || 'Crop'} • {farm.area} hectares</Text>
                </View>
              </View>
              <Feather name="arrow-up-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        )}

        {/* Recent Predictions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent AI Yield Predictions</Text>
        </View>

        {predictions.length === 0 ? (
          <View style={styles.emptyFieldsCard}>
            <Feather name="trending-up" size={30} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyCardText}>No predictions recorded</Text>
            <Text style={styles.emptyCardSub}>Configure fields and run AI predictions to see results.</Text>
          </View>
        ) : (
          predictions.slice(0, 3).map((pred) => (
            <View key={pred._id} style={styles.predictionCard}>
              <View style={styles.predLeft}>
                <View style={styles.predIconBg}>
                  <Feather name="bar-chart-2" size={18} color="#0F766E" />
                </View>
                <View>
                  <Text style={styles.predFieldName}>{pred.farm?.name || 'Field'}</Text>
                  <Text style={styles.predDate}>{new Date(pred.date).toLocaleDateString()}</Text>
                </View>
              </View>
              <View style={styles.predRight}>
                <Text style={styles.predYieldValue}>{pred.predictedYield ? pred.predictedYield.toFixed(2) : '0.00'}</Text>
                <Text style={styles.predYieldUnit}>Tons/HA</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* Custom Alerts Modal */}
      <Modal visible={alertsModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color="#0F766E" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Daily Weather Alert</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setAlertsModalVisible(false)}>
                <Feather name="x" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.alertContent}>
              <View style={styles.alertLocRow}>
                <Feather name="map-pin" size={16} color="#4B5563" style={{ marginRight: 6 }} />
                <Text style={styles.alertLocText}>{frontendCity || weatherData?.location || 'Your Farm Location'}</Text>
              </View>

              {/* Weather parameters display inside modal */}
              <View style={styles.alertGrid}>
                <View style={styles.alertGridItem}>
                  <Text style={styles.alertGridLabel}>TEMP</Text>
                  <Text style={styles.alertGridValue}>{weatherData?.temperature || '28'}°C</Text>
                </View>
                <View style={styles.alertGridItem}>
                  <Text style={styles.alertGridLabel}>HUMIDITY</Text>
                  <Text style={styles.alertGridValue}>{weatherData?.humidity || '70'}%</Text>
                </View>
                <View style={styles.alertGridItem}>
                  <Text style={styles.alertGridLabel}>RAIN</Text>
                  <Text style={styles.alertGridValue}>{weatherData?.rainfall || '0'}mm</Text>
                </View>
              </View>

              <View style={styles.adviceCard}>
                <Text style={styles.adviceHeader}>AGRI-ADVICE RECOMMENDATION</Text>
                <Text style={styles.adviceText}>{getWeatherAdvice()}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.dismissButton} onPress={() => setAlertsModalVisible(false)}>
              <Text style={styles.dismissButtonText}>Acknowledge & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light gray background
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    backgroundColor: '#064E3B',
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#064E3B',
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.5,
  },
  notificationButton: {
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 12,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  welcomeSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
  },
  welcomeDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 25,
  },
  weatherCard: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  weatherLocation: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tempGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weatherTemp: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    marginRight: 10,
  },
  weatherDesc: {
    color: '#E6F4F1',
    fontSize: 16,
    fontWeight: '700',
  },
  weatherRight: {
    alignItems: 'center',
  },
  weatherStatusText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  weatherBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 14,
    justifyContent: 'space-around',
  },
  weatherSubMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherSubText: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '700',
  },
  weatherSubSeparator: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  overviewStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 18,
    marginBottom: 25,
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
    fontSize: 24,
    fontWeight: '950',
    color: '#064E3B',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: '60%',
    backgroundColor: '#E5E7EB',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '850',
    color: '#111827',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  emptyFieldsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  emptyCardText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
  },
  emptyCardSub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  fieldCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIconBg: {
    backgroundColor: '#E6F4F1',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  fieldDetail: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  predictionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  predLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predIconBg: {
    backgroundColor: '#F3F4F6',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  predFieldName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  predDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  predRight: {
    alignItems: 'flex-end',
  },
  predYieldValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#064E3B',
  },
  predYieldUnit: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#064E3B',
  },
  closeBtn: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 50,
  },
  alertContent: {
    paddingBottom: 20,
  },
  alertLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertLocText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
  },
  alertGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  alertGridItem: {
    alignItems: 'center',
    flex: 1,
  },
  alertGridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  alertGridValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1F2937',
  },
  adviceCard: {
    backgroundColor: '#E6F4F1',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0F766E',
  },
  adviceHeader: {
    fontSize: 10,
    fontWeight: '855',
    color: '#0F766E',
    letterSpacing: 1,
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    lineHeight: 18,
  },
  dismissButton: {
    backgroundColor: '#0F766E',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dismissButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '850',
  }
});
