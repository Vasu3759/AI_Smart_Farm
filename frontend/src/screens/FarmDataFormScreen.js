import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Modal, FlatList, Animated } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { API_URL } from '../config';

const CROPS = [
  { label: 'Rice 🌾', value: '41' },
  { label: 'Wheat 🌾', value: '54' },
  { label: 'Maize 🌽', value: '24' },
  { label: 'Sugarcane 🎋', value: '47' },
  { label: 'Cotton ☁️', value: '11' },
  { label: 'Potato 🥔', value: '38' },
  { label: 'Onion 🧅', value: '31' },
  { label: 'Banana 🍌', value: '3' },
  { label: 'Barley 🌾', value: '4' }
];

const SEASONS = [
  { label: 'Kharif (Monsoon) 🌧️', value: '1' },
  { label: 'Rabi (Winter) ❄️', value: '2' },
  { label: 'Summer ☀️', value: '3' },
  { label: 'Whole Year 📅', value: '4' },
  { label: 'Winter 🌨️', value: '5' },
  { label: 'Autumn 🍂', value: '0' }
];

const STATES = [
  { label: 'Uttar Pradesh 🏛️', value: '27' },
  { label: 'Maharashtra 🏗️', value: '15' },
  { label: 'Madhya Pradesh 🗺️', value: '14' },
  { label: 'Punjab 🌾', value: '22' },
  { label: 'Haryana 🚜', value: '8' },
  { label: 'Delhi 🗼', value: '5' },
  { label: 'West Bengal 🏝️', value: '29' },
  { label: 'Gujarat 🏬', value: '7' },
  { label: 'Karnataka 🏛️', value: '12' },
  { label: 'Tamil Nadu 🛕', value: '24' }
];

const SOIL_TYPES = [
  { label: 'Alluvial Soil 🪵', value: 'alluvial', pH: '6.5' },
  { label: 'Black Soil 🌑', value: 'black', pH: '7.8' },
  { label: 'Red Soil 🧱', value: 'red', pH: '5.5' },
  { label: 'Laterite Soil 🧱', value: 'laterite', pH: '5.0' },
  { label: 'Sandy/Desert Soil 🏜️', value: 'sandy', pH: '7.0' },
  { label: 'Clayey/Loamy Soil 🥣', value: 'clayey_loamy', pH: '6.0' }
];

export default function FarmDataFormScreen({ route, navigation }) {
  const passedArea = route.params?.area || '';
  const farmId = route.params?.farmId || null;

  const [form, setForm] = useState({
    crop: '41', // Default to Rice
    year: '2024',
    season: '1', // Default to Kharif
    state: '27', // Default to UP
    soilType: 'alluvial', // Default to Alluvial
    temperature: '28',
    rainfall: '800',
    humidity: '70',
    N: '80', P: '40', K: '40', pH: '6.5',
    fertilizer: '150', pesticide: '1.2', 
    area: passedArea ? passedArea.toString() : '2.5'
  });
  
  const [loading, setLoading] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [npkExpanded, setNpkExpanded] = useState(false);

  // Selector Modals
  const [cropModal, setCropModal] = useState(false);
  const [seasonModal, setSeasonModal] = useState(false);
  const [stateModal, setStateModal] = useState(false);
  const [soilModal, setSoilModal] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (passedArea) {
      updateForm('area', passedArea.toString());
    }
  }, [passedArea]);

  useEffect(() => {
    fetchWeather();
  }, [farmId]);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      let lat = 28.7041;
      let lon = 77.1025;

      try {
        // Request GPS Permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          lat = loc.coords.latitude;
          lon = loc.coords.longitude;

          // Reverse geocode to find State / Region name
          const address = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (address && address.length > 0) {
            const detectedRegion = address[0].region; // e.g. "Delhi", "Punjab", "Uttar Pradesh"
            if (detectedRegion) {
              const matchedState = STATES.find(st => 
                detectedRegion.toLowerCase().includes(st.label.replace(/[^a-zA-Z\s]/g, '').trim().toLowerCase())
              );
              if (matchedState) {
                setForm(prev => ({ ...prev, state: matchedState.value }));
                console.log("Auto-selected state from location:", matchedState.label);
              }
            }
          }
        } else {
          // Fallback to active farm coordinates or first farm coordinates
          const farmRes = await axios.get(`${API_URL}/api/farms`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const farmList = farmRes.data.data;
          
          if (farmId) {
            const currentFarm = farmList.find(f => f._id === farmId);
            if (currentFarm && currentFarm.location?.coordinates) {
              lon = currentFarm.location.coordinates[0];
              lat = currentFarm.location.coordinates[1];
            }
          } else if (farmList.length > 0 && farmList[0].location?.coordinates) {
            lon = farmList[0].location.coordinates[0];
            lat = farmList[0].location.coordinates[1];
          }
        }
      } catch (locError) {
        console.log("Failed to fetch live location, falling back:", locError);
        // Fallback to active farm coordinates or first farm coordinates
        const farmRes = await axios.get(`${API_URL}/api/farms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const farmList = farmRes.data.data;
        if (farmId) {
          const currentFarm = farmList.find(f => f._id === farmId);
          if (currentFarm && currentFarm.location?.coordinates) {
            lon = currentFarm.location.coordinates[0];
            lat = currentFarm.location.coordinates[1];
          }
        } else if (farmList.length > 0 && farmList[0].location?.coordinates) {
          lon = farmList[0].location.coordinates[0];
          lat = farmList[0].location.coordinates[1];
        }
      }

      // Fetch Weather based on coordinates
      const response = await axios.get(`${API_URL}/api/weather?lat=${lat}&lon=${lon}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const weather = response.data.data;
      if (weather) {
        setForm(prev => ({
          ...prev,
          temperature: Math.round(weather.temperature).toString(),
          humidity: Math.round(weather.humidity || 70).toString(),
          rainfall: weather.rainfall ? Math.round(weather.rainfall).toString() : '800'
        }));
      }
    } catch (error) {
      console.log('Failed to fetch weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const updateForm = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSoilSelect = (soilVal) => {
    const matchedSoil = SOIL_TYPES.find(s => s.value === soilVal);
    let N = '80', P = '40', K = '40';
    if (soilVal === 'black') { N = '70'; P = '50'; K = '30'; }
    else if (soilVal === 'red') { N = '50'; P = '30'; K = '40'; }
    else if (soilVal === 'laterite') { N = '40'; P = '20'; K = '30'; }
    else if (soilVal === 'sandy') { N = '30'; P = '20'; K = '20'; }
    else if (soilVal === 'clayey_loamy') { N = '90'; P = '50'; K = '50'; }

    setForm(prev => ({
      ...prev,
      soilType: soilVal,
      pH: matchedSoil ? matchedSoil.pH : prev.pH,
      N, P, K
    }));
    setSoilModal(false);
  };

  const runPopUpAnimation = () => {
    // Reset animation
    scaleAnim.setValue(0.7);
    opacityAnim.setValue(0);
    
    // Scale and Fade In Spring Animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true
      })
    ]).start();
  };

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {};
      for (const key in form) {
        // Exclude the UI-only soilType parameter from payload
        if (key !== 'soilType') {
          payload[key] = parseFloat(form[key]) || 0;
        }
      }
      if (farmId) {
        payload.farmId = farmId;
      }

      const response = await axios.post(`${API_URL}/api/ai/predict`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPrediction(response.data.data.predicted_yield_per_area);
      setResultModalVisible(true);
      runPopUpAnimation();
    } catch (error) {
      Alert.alert('Prediction Failed', error.response?.data?.message || 'Check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCropName = CROPS.find(c => c.value === form.crop)?.label || 'Rice 🌾';
  const selectedSeasonName = SEASONS.find(s => s.value === form.season)?.label || 'Kharif 🌧️';
  const selectedStateName = STATES.find(st => st.value === form.state)?.label || 'Uttar Pradesh 🏛️';
  const selectedSoilName = SOIL_TYPES.find(st => st.value === form.soilType)?.label || 'Alluvial Soil 🪵';

  return (
    <View style={styles.mainWrapper}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Premium Top Bar */}
        <View style={styles.topHeader}>
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <MaterialCommunityIcons name="tractor" size={24} color="#FFF" />
            </View>
            <View>
              <Text style={styles.brandText}>AgriYield AI</Text>
              <Text style={styles.brandSub}>PRECISION HARVEST ENGINE</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchWeather} disabled={weatherLoading}>
            {weatherLoading ? (
              <ActivityIndicator size="small" color="#115E59" />
            ) : (
              <Feather name="refresh-cw" size={18} color="#115E59" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionHeader}>Configure Yield Model</Text>
          <Text style={styles.sectionSub}>Input local parameters or use auto-filled parameters to run the AI estimator.</Text>

          {/* Environmental Factors Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Feather name="cloud-drizzle" size={18} color="#115E59" />
              <Text style={styles.cardTitle}>ENVIRONMENTAL FACTORS</Text>
            </View>
            
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>TEMPERATURE</Text>
                <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                  <Text style={styles.readOnlyText}>{form.temperature}</Text>
                  <Text style={styles.inputUnit}>°C</Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>RAINFALL</Text>
                <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                  <Text style={styles.readOnlyText}>{form.rainfall}</Text>
                  <Text style={styles.inputUnit}>mm</Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>HUMIDITY</Text>
                <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                  <Text style={styles.readOnlyText}>{form.humidity}</Text>
                  <Text style={styles.inputUnit}>%</Text>
                </View>
              </View>

              <View style={styles.gridItem}>
                <Text style={styles.itemLabel}>SOIL pH VALUE</Text>
                <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                  <Text style={styles.readOnlyText}>{form.pH}</Text>
                  <Text style={styles.inputUnit}>pH</Text>
                </View>
              </View>
            </View>
          </View>

          {/* NPK & Nutrients Accordion (Optional setting) */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => setNpkExpanded(!npkExpanded)}>
              <MaterialCommunityIcons name="flask-outline" size={18} color="#115E59" />
              <Text style={styles.cardTitle}>SOIL NUTRIENTS (NPK) - OPTIONAL</Text>
              <Feather name={npkExpanded ? "chevron-up" : "chevron-down"} size={18} color="#115E59" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            
            {npkExpanded && (
              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.itemLabel}>NITROGEN (N)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} value={form.N} onChangeText={(v)=>updateForm('N',v)} keyboardType="numeric" />
                    <Text style={styles.inputUnit}>kg/h</Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.itemLabel}>PHOSPHORUS (P)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} value={form.P} onChangeText={(v)=>updateForm('P',v)} keyboardType="numeric" />
                    <Text style={styles.inputUnit}>kg/h</Text>
                  </View>
                </View>

                <View style={styles.gridItem}>
                  <Text style={styles.itemLabel}>POTASSIUM (K)</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput style={styles.input} value={form.K} onChangeText={(v)=>updateForm('K',v)} keyboardType="numeric" />
                    <Text style={styles.inputUnit}>kg/h</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Selection Cards */}
          <Text style={styles.groupLabel}>REGIONAL & CROP PARAMETERS</Text>
          
          <View style={styles.selectCard}>
            <TouchableOpacity style={styles.selectRow} onPress={() => setCropModal(true)}>
              <View style={styles.selectTextGroup}>
                <Text style={styles.selectLabel}>CROP TYPE</Text>
                <Text style={styles.selectValue}>{selectedCropName}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#115E59" />
            </TouchableOpacity>
            
            <View style={styles.separator} />

            <TouchableOpacity style={styles.selectRow} onPress={() => setSoilModal(true)}>
              <View style={styles.selectTextGroup}>
                <Text style={styles.selectLabel}>SOIL TYPE</Text>
                <Text style={styles.selectValue}>{selectedSoilName}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#115E59" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.selectRow} onPress={() => setSeasonModal(true)}>
              <View style={styles.selectTextGroup}>
                <Text style={styles.selectLabel}>SEASON</Text>
                <Text style={styles.selectValue}>{selectedSeasonName}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#115E59" />
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.selectRow} onPress={() => setStateModal(true)}>
              <View style={styles.selectTextGroup}>
                <Text style={styles.selectLabel}>STATE / TERRITORY</Text>
                <Text style={styles.selectValue}>{selectedStateName}</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#115E59" />
            </TouchableOpacity>
          </View>

          {/* Standalone Farm Size Input */}
          <Text style={styles.groupLabel}>FIELD METRICS</Text>
          <View style={styles.sizeCard}>
            <Text style={styles.itemLabel}>FARM SIZE (HECTARES)</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="arrow-expand" size={18} color="#115E59" style={{ marginRight: 8 }} />
              <TextInput style={styles.input} value={form.area} onChangeText={(v)=>updateForm('area',v)} keyboardType="numeric" placeholder="e.g. 2.5" />
              <Text style={styles.inputUnit}>HA</Text>
            </View>
          </View>
        </View>

        {/* Full-Screen Prediction Report Modal */}
        <Modal visible={resultModalVisible} transparent={false} animationType="slide">
          <View style={styles.fullScreenOverlay}>
            <ScrollView contentContainerStyle={styles.fullScreenContent} showsVerticalScrollIndicator={false}>
              <View style={styles.reportBadge}>
                <MaterialCommunityIcons name="brain" size={24} color="#FFF" />
                <Text style={styles.reportBadgeText}>AI ANALYSIS REPORT</Text>
              </View>

              <Text style={styles.reportTitle}>Harvest Yield Forecast</Text>
              <Text style={styles.reportSubtitle}>Precision agricultural forecast generated by the XGBoost regression model.</Text>

              {/* Scale-animated Yield Value Display Card */}
              <Animated.View style={[styles.reportYieldCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
                <Text style={styles.yieldCardLabel}>ESTIMATED HARVEST YIELD</Text>
                <View style={styles.yieldCardValueRow}>
                  <Text style={styles.yieldCardLargeText}>{prediction ? prediction.toFixed(2) : '0.00'}</Text>
                  <Text style={styles.yieldCardUnit}> Tons/HA</Text>
                </View>
                

              </Animated.View>

              {/* Parameter Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>FORECAST CONSTANTS & METRICS</Text>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Crop Type</Text>
                  <Text style={styles.summaryValue}>{selectedCropName}</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Soil Type</Text>
                  <Text style={styles.summaryValue}>{selectedSoilName}</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Season</Text>
                  <Text style={styles.summaryValue}>{selectedSeasonName}</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Region/State</Text>
                  <Text style={styles.summaryValue}>{selectedStateName}</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Temperature</Text>
                  <Text style={styles.summaryValue}>{form.temperature}°C</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Rainfall</Text>
                  <Text style={styles.summaryValue}>{form.rainfall} mm</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Soil pH</Text>
                  <Text style={styles.summaryValue}>{form.pH} pH</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.closeReportButton} onPress={() => setResultModalVisible(false)}>
                <Text style={styles.closeReportText}>Dismiss Report</Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </Modal>

        {/* Select Modals */}
        <SelectionModal visible={cropModal} data={CROPS} selectedValue={form.crop} onValueChange={(val) => { updateForm('crop', val); setCropModal(false); }} onClose={() => setCropModal(false)} title="Select Target Crop" />
        <SelectionModal visible={seasonModal} data={SEASONS} selectedValue={form.season} onValueChange={(val) => { updateForm('season', val); setSeasonModal(false); }} onClose={() => setSeasonModal(false)} title="Select Crop Season" />
        <SelectionModal visible={stateModal} data={STATES} selectedValue={form.state} onValueChange={(val) => { updateForm('state', val); setStateModal(false); }} onClose={() => setStateModal(false)} title="Select Farm Region" />
        
        {/* Soil Type Modal */}
        <SelectionModal visible={soilModal} data={SOIL_TYPES} selectedValue={form.soilType} onValueChange={handleSoilSelect} onClose={() => setSoilModal(false)} title="Select Soil Type" />
      </ScrollView>

      {/* Floating Sticky Predict Action Button */}
      <TouchableOpacity style={styles.predictBtn} onPress={handlePredict} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <MaterialCommunityIcons name="brain" size={22} color="#FFF" style={{marginRight: 10}} />
            <Text style={styles.predictBtnText}>Run Prediction Model</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

function SelectionModal({ visible, data, selectedValue, onValueChange, onClose, title }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Feather name="x" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.itemContainer, item.value === selectedValue && styles.selectedItem]} onPress={() => onValueChange(item.value)}>
                <Text style={[styles.itemText, item.value === selectedValue && styles.selectedItemText]}>{item.label}</Text>
                {item.value === selectedValue && <Feather name="check-circle" size={18} color="#064E3B" />}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  refreshButton: {
    backgroundColor: '#E6F4F1',
    padding: 10,
    borderRadius: 12,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },
  sectionHeader: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#115E59',
    marginLeft: 8,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '47%',
    marginBottom: 15,
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  readOnlyWrapper: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  inputUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7280',
    letterSpacing: 1.2,
    marginTop: 10,
    marginBottom: 12,
    paddingLeft: 4,
  },
  selectCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  selectTextGroup: {
    flex: 1,
  },
  selectLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  selectValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  predictBtn: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    backgroundColor: '#0F766E',
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  predictBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultContainer: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  resultSubtitle: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  resultBigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  resultLargeText: {
    color: '#FFF',
    fontSize: 46,
    fontWeight: '900',
  },
  resultUnits: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
  },
  confBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    marginTop: 15,
  },
  confText: {
    color: '#064E3B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '70%',
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  selectedItem: {
    backgroundColor: '#E6F4F1',
  },
  itemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  selectedItemText: {
    color: '#0F766E',
    fontWeight: '800',
  },
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  fullScreenContent: {
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    paddingBottom: 60,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 16,
  },
  reportBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  reportTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  reportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  reportYieldCard: {
    backgroundColor: '#064E3B',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 25,
  },
  yieldCardLabel: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  yieldCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  yieldCardLargeText: {
    color: '#FFF',
    fontSize: 50,
    fontWeight: '950',
  },
  yieldCardUnit: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    marginTop: 20,
  },
  accuracyBadgeText: {
    color: '#064E3B',
    fontSize: 11,
    fontWeight: '850',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 30,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '850',
    color: '#115E59',
    letterSpacing: 1.2,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '800',
  },
  summarySeparator: {
    height: 1,
    backgroundColor: '#F9FAFB',
  },
  closeReportButton: {
    backgroundColor: '#1F2937',
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  closeReportText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '850',
  },
  sizeCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  }
});
