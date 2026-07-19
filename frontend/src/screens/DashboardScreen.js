import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

export default function DashboardScreen({ navigation }) {
  const { t } = useTranslation();
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
      
      // Step 1: Load from Cache First (Offline Mode)
      try {
        const cachedDataStr = await AsyncStorage.getItem('dashboard_cache');
        if (cachedDataStr) {
          const cached = JSON.parse(cachedDataStr);
          if (cached.farms) setFarms(cached.farms);
          if (cached.weatherData) setWeatherData(cached.weatherData);
          if (cached.predictions) setPredictions(cached.predictions);
          if (cached.frontendCity) setFrontendCity(cached.frontendCity);
          setLoading(false); // Stop loading spinner immediately
        }
      } catch (cacheErr) {
        console.log('Cache read error:', cacheErr);
      }
      
      // Step 2: Fetch Farms silently in background
      const farmRes = await axios.get(`${API_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const farmList = farmRes.data.data;
      setFarms(farmList);

      // Default coords (New Delhi)
      let lat = 28.7041;
      let lon = 77.1025;
      let currentCity = frontendCity;

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
              currentCity = city;
              setFrontendCity(city);
            }
          }
        } else if (farmList.length > 0 && farmList[0].location?.coordinates) {
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

      // Step 3: Update Cache on successful network fetch
      await AsyncStorage.setItem('dashboard_cache', JSON.stringify({
        farms: farmList,
        weatherData: weatherRes.data.data,
        predictions: predRes.data.data,
        frontendCity: currentCity
      }));

    } catch (error) {
      console.log('Dashboard fetch error:', error);
      // If network fails, cached data remains on screen. We don't wipe it!
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFarm = (id, name) => {
    Alert.alert(
      'Delete Field',
      `Are you sure you want to delete "${name}"? This will also remove its associated yield prediction archives.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/farms/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Field deleted successfully');
              fetchData();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete field.');
            }
          }
        }
      ]
    );
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
            <Text style={styles.brandText}>AgriYield</Text>
            <Text style={styles.brandSub}>PRECISION HARVEST PLATFORM</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleShowAlerts}>
          <Feather name="bell" size={20} color="#374151" />
          {unreadAlerts && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcomeSubtitle}>{t('dashboard.welcome_back')}</Text>
        <Text style={styles.welcomeTitle}>{t('dashboard.smart_farm_hub')}</Text>
        <Text style={styles.welcomeDesc}>{t('dashboard.description')}</Text>

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
                  <Text style={styles.weatherStatusText}>{t('dashboard.optimal_harvest')}</Text>
                </View>
              </View>
              
              <View style={styles.weatherBottomRow}>
                <View style={styles.weatherSubMetric}>
                  <Feather name="droplet" size={14} color="#A7F3D0" style={{ marginRight: 4 }} />
                  <Text style={styles.weatherSubText}>{t('dashboard.humidity')}: {weatherData.humidity}%</Text>
                </View>
                <View style={styles.weatherSubSeparator} />
                <View style={styles.weatherSubMetric}>
                  <Feather name="cloud-rain" size={14} color="#A7F3D0" style={{ marginRight: 4 }} />
                  <Text style={styles.weatherSubText}>{t('dashboard.rain')}: {weatherData.rainfall || 0}mm</Text>
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
            <Text style={styles.statLabel}>{t('dashboard.active_fields')}</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{predictions.length}</Text>
            <Text style={styles.statLabel}>{t('dashboard.ai_models_run')}</Text>
          </View>
        </View>

        {/* Active Fields Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('dashboard.active_fields')}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Map')}>
            <Feather name="plus" size={16} color="#0F766E" style={{ marginRight: 4 }} />
            <Text style={styles.addButtonText}>{t('dashboard.add_field')}</Text>
          </TouchableOpacity>
        </View>

        {farms.length === 0 ? (
          <View style={styles.emptyFieldsCard}>
            <Feather name="map" size={30} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyCardText}>{t('dashboard.no_fields_yet')}</Text>
            <Text style={styles.emptyCardSub}>{t('dashboard.enter_field_area')}</Text>
          </View>
        ) : (
          farms.map((farm) => (
            <View key={farm._id} style={styles.fieldCard}>
              <TouchableOpacity 
                style={styles.fieldCardMain} 
                onPress={() => navigation.navigate('Predict', { area: farm.area, farmId: farm._id })}
                activeOpacity={0.6}
              >
                <View style={styles.fieldIconBg}>
                  <MaterialCommunityIcons name="leaf" size={22} color="#0F766E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldName} numberOfLines={1}>{farm.name}</Text>
                  <Text style={styles.fieldDetail}>{farm.cropType || 'Crop'} • {farm.area} hectares</Text>
                </View>
                <Feather name="arrow-up-right" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteIconButton} 
                onPress={() => handleDeleteFarm(farm._id, farm.name)}
                activeOpacity={0.5}
              >
                <Feather name="trash-2" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Recent Predictions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('dashboard.recent_predictions')}</Text>
        </View>

        {predictions.length === 0 ? (
          <View style={styles.emptyFieldsCard}>
            <Feather name="trending-up" size={30} color="#9CA3AF" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyCardText}>{t('dashboard.no_predictions')}</Text>
            <Text style={styles.emptyCardSub}>{t('dashboard.configure_fields')}</Text>
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
    backgroundColor: '#F8FAFC', // Sleek, modern off-white background
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', // Muted clean separator
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    backgroundColor: '#064E3B',
    padding: 10,
    borderRadius: 14,
    marginRight: 12,
  },
  brandText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  notificationButton: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 14,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  welcomeSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  welcomeDesc: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 24,
  },
  weatherCard: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
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
    marginTop: 2,
  },
  weatherTemp: {
    color: '#FFF',
    fontSize: 46,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 48,
  },
  weatherDesc: {
    color: '#F0FDFA',
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  weatherRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 10,
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
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    paddingTop: 16,
    justifyContent: 'space-around',
  },
  weatherSubMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherSubText: {
    color: '#E0F2FE',
    fontSize: 13,
    fontWeight: '700',
  },
  weatherSubSeparator: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  overviewStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statSeparator: {
    width: 1,
    height: '60%',
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
  },
  emptyFieldsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
  },
  emptyCardText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
  },
  emptyCardSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    paddingRight: 16,
  },
  fieldCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
  },
  deleteIconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIconBg: {
    backgroundColor: '#F0FDF4', // Softer light green
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  fieldName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  fieldDetail: {
    fontSize: 12,
    color: '#64748B',
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
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  predLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predIconBg: {
    backgroundColor: '#F8FAFC',
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  predFieldName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  predDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  predRight: {
    alignItems: 'flex-end',
  },
  predYieldValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  predYieldUnit: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Premium darker blur effect overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#064E3B',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  alertGridItem: {
    alignItems: 'center',
    flex: 1,
  },
  alertGridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  alertGridValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  adviceCard: {
    backgroundColor: '#ECFDF5', // Sage / emerald tint
    borderRadius: 18,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  adviceHeader: {
    fontSize: 11,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  adviceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#064E3B',
    lineHeight: 20,
  },
  dismissButton: {
    backgroundColor: '#064E3B',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dismissButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});
