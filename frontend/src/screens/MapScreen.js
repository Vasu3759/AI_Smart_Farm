import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

const CROPS_KEYS = [
  { key: 'crops.rice', value: 'Rice' },
  { key: 'crops.wheat', value: 'Wheat' },
  { key: 'crops.maize', value: 'Maize' },
  { key: 'crops.sugarcane', value: 'Sugarcane' },
  { key: 'crops.cotton', value: 'Cotton' },
  { key: 'crops.potato', value: 'Potato' },
  { key: 'crops.onion', value: 'Onion' },
  { key: 'crops.banana', value: 'Banana' },
  { key: 'crops.barley', value: 'Barley' }
];

export default function MapScreen({ navigation }) {
  const { t } = useTranslation();
  const CROPS = CROPS_KEYS.map(c => ({ label: t(c.key), value: c.value }));
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [cropType, setCropType] = useState('Rice');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coordinates, setCoordinates] = useState([77.1025, 28.7041]); // Default to New Delhi
  const [cropModal, setCropModal] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: t('map.header_title') });
    fetchCurrentLocation();
  }, [navigation, t]);

  const fetchCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCoordinates([loc.coords.longitude, loc.coords.latitude]);
      }
    } catch (e) {
      console.log('Error fetching GPS for field:', e.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSaveField = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', t('map.validation_name'));
      return;
    }
    const areaVal = parseFloat(area);
    if (isNaN(areaVal) || areaVal <= 0) {
      Alert.alert('Validation Error', t('map.validation_area'));
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {
        name: name.trim(),
        area: areaVal,
        cropType: cropType,
        location: {
          type: 'Point',
          coordinates: coordinates
        },
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [coordinates[0] - 0.001, coordinates[1] - 0.001],
            [coordinates[0] + 0.001, coordinates[1] - 0.001],
            [coordinates[0] + 0.001, coordinates[1] + 0.001],
            [coordinates[0] - 0.001, coordinates[1] + 0.001],
            [coordinates[0] - 0.001, coordinates[1] - 0.001]
          ]]
        }
      };

      await axios.post(`${API_URL}/api/farms`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', t('map.success'));
      setName('');
      setArea('');
      navigation.navigate('MainTabs');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || t('map.error'));
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.brandSub}>{t('map.field_register')}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{t('map.add_new_field')}</Text>
        <Text style={styles.pageSubtitle}>{t('map.subtitle')}</Text>

        <View style={styles.card}>
          <Text style={styles.inputLabel}>{t('map.farm_name')}</Text>
          <View style={styles.inputWrapper}>
            <Feather name="map" size={18} color="#0F766E" style={{ marginRight: 10 }} />
            <TextInput 
              style={styles.input} 
              placeholder={t('map.farm_name_placeholder')} 
              placeholderTextColor="#94A3B8"
              value={name} 
              onChangeText={setName} 
            />
          </View>

          <Text style={styles.inputLabel}>{t('map.field_size')}</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons name="arrow-expand" size={18} color="#0F766E" style={{ marginRight: 10 }} />
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 2.5" 
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={area} 
              onChangeText={setArea} 
            />
            <Text style={styles.inputUnit}>HA</Text>
          </View>

          <Text style={styles.inputLabel}>{t('map.target_crop')}</Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setCropModal(true)}>
            <MaterialCommunityIcons name="leaf" size={18} color="#0F766E" style={{ marginRight: 10 }} />
            <Text style={styles.selectorText}>{CROPS.find(c => c.value === cropType)?.label || cropType}</Text>
            <Feather name="chevron-down" size={18} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* GPS Location Tracker Card */}
        <View style={styles.gpsCard}>
          <View style={styles.gpsHeader}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#0369A1" style={{ marginRight: 6 }} />
            <Text style={styles.gpsTitle}>{t('map.gps')}</Text>
          </View>
          <Text style={styles.gpsSub}>{t('map.gps_sub')}</Text>
          <Text style={styles.gpsCoordinates}>
            {gpsLoading ? t('map.acquiring') : `${coordinates[1].toFixed(5)}° N, ${coordinates[0].toFixed(5)}° E`}
          </Text>
          <TouchableOpacity style={styles.gpsRefreshBtn} onPress={fetchCurrentLocation} disabled={gpsLoading}>
            <Feather name="refresh-cw" size={14} color="#0369A1" style={{ marginRight: 6 }} />
            <Text style={styles.gpsRefreshText}>{t('map.update_gps')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveField} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>{t('map.register')}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Crop Selector Modal */}
      <Modal visible={cropModal} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('map.select_crop')}</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {CROPS.map((crop) => (
                <TouchableOpacity 
                  key={crop.value} 
                  style={[styles.modalItem, cropType === crop.value && styles.activeModalItem]}
                  onPress={() => {
                    setCropType(crop.value);
                    setCropModal(false);
                  }}
                >
                  <Text style={[styles.modalItemText, cropType === crop.value && styles.activeModalItemText]}>
                    {crop.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCropModal(false)}>
              <Text style={styles.closeBtnText}>{t('map.cancel')}</Text>
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
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 45,
    paddingBottom: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  inputUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#F8FAFC',
  },
  selectorText: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  gpsCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    marginBottom: 15,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0369A1',
    letterSpacing: 1.5,
  },
  gpsSub: {
    fontSize: 13,
    color: '#0369A1',
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '600',
  },
  gpsCoordinates: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 12,
  },
  gpsRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  gpsRefreshText: {
    fontSize: 11,
    fontWeight: '850',
    color: '#0369A1',
  },
  saveBtn: {
    backgroundColor: '#064E3B',
    height: 55,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
  },
  activeModalItem: {
    backgroundColor: '#ECFDF5',
  },
  modalItemText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '700',
  },
  activeModalItemText: {
    color: '#065F46',
    fontWeight: '800',
  },
  closeBtn: {
    marginTop: 15,
    backgroundColor: '#F1F5F9',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  }
});
