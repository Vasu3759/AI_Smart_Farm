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

  // Market Prices & Recommendations State
  const [marketPrices, setMarketPrices] = useState([]);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);

  // Farms state
  const [farms, setFarms] = useState([]);
  const [activeFarmId, setActiveFarmId] = useState(farmId);
  const [farmModal, setFarmModal] = useState(false);

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
    setActiveFarmId(farmId);
  }, [farmId]);

  useEffect(() => {
    fetchWeather();
    fetchMarketPrices();
    fetchFarms();
  }, [activeFarmId]);

  const fetchFarms = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const farmList = response.data.data;
      setFarms(farmList);
      
      // Auto-select first active farm if none is chosen
      if (!activeFarmId && farmList.length > 0) {
        const firstFarm = farmList[0];
        setActiveFarmId(firstFarm._id);
        updateForm('area', firstFarm.area ? firstFarm.area.toString() : form.area);
        
        // Find matching crop value ID
        const matchedCrop = CROPS.find(c => 
          c.label.toLowerCase().includes((firstFarm.cropType || '').toLowerCase())
        );
        if (matchedCrop) {
          updateForm('crop', matchedCrop.value);
        }
      }
    } catch (error) {
      console.log('Error fetching farms:', error);
    }
  };


  const fetchMarketPrices = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/market`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarketPrices(response.data.data);
    } catch (error) {
      console.log('Error fetching market prices:', error);
    }
  };

  const handleCompareCrops = async () => {
    setComparing(true);
    setComparisonResults([]);
    try {
      const token = await AsyncStorage.getItem('token');
      const results = [];
      
      for (const cropItem of CROPS) {
        const payload = {};
        for (const key in form) {
          if (key !== 'soilType') {
            payload[key] = parseFloat(form[key]) || 0;
          }
        }
        
        payload['crop'] = parseFloat(cropItem.value);
        if (activeFarmId) {
          payload.farmId = activeFarmId;
        }

        try {
          const response = await axios.post(`${API_URL}/api/ai/predict`, payload, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const predictedYield = response.data.data.predicted_yield_per_area;
          const priceObj = marketPrices.find(p => p.cropId === cropItem.value);
          const pricePerQuintal = priceObj ? priceObj.pricePerQuintal : 0;
          
          const farmArea = parseFloat(form.area) || 1.0;
          const totalQuintals = predictedYield * farmArea * 10;
          const grossRevenue = totalQuintals * pricePerQuintal;

          results.push({
            cropId: cropItem.value,
            cropLabel: cropItem.label,
            predictedYield: predictedYield,
            pricePerQuintal: pricePerQuintal,
            grossRevenue: grossRevenue
          });
        } catch (itemErr) {
          console.log(`Failed yield prediction for crop ${cropItem.label}:`, itemErr.message);
        }
      }

      results.sort((a, b) => b.grossRevenue - a.grossRevenue);
      setComparisonResults(results);
      setComparisonModalVisible(true);
    } catch (error) {
      Alert.alert('Comparison Failed', 'Error running bulk predictions. Please try again.');
    } finally {
      setComparing(false);
    }
  };


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
      if (activeFarmId) {
        payload.farmId = activeFarmId;
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

  // Calculate if the NPK fields are matching the soil presets
  let isUsingPreset = false;
  const matchedSoil = SOIL_TYPES.find(s => s.value === form.soilType);
  if (matchedSoil) {
    let expectedN = '80', expectedP = '40', expectedK = '40';
    if (form.soilType === 'black') { expectedN = '70'; expectedP = '50'; expectedK = '30'; }
    else if (form.soilType === 'red') { expectedN = '50'; expectedP = '30'; expectedK = '40'; }
    else if (form.soilType === 'laterite') { expectedN = '40'; expectedP = '20'; expectedK = '30'; }
    else if (form.soilType === 'sandy') { expectedN = '30'; expectedP = '20'; expectedK = '20'; }
    else if (form.soilType === 'clayey_loamy') { expectedN = '90'; expectedP = '50'; expectedK = '50'; }
    
    isUsingPreset = form.N === expectedN && form.P === expectedP && form.K === expectedK;
  }

  const calculateFertilizerBags = () => {
    const area = parseFloat(form.area) || 1.0;
    const N_actual = parseFloat(form.N) || 0;
    const P_actual = parseFloat(form.P) || 0;
    const K_actual = parseFloat(form.K) || 0;

    // Ideal NPK requirements in kg/hectare per crop
    const idealNPK = {
      '41': { N: 120, P: 60, K: 60 },   // Rice
      '54': { N: 120, P: 60, K: 40 },   // Wheat
      '24': { N: 150, P: 75, K: 40 },   // Maize
      '47': { N: 250, P: 80, K: 120 },  // Sugarcane
      '11': { N: 100, P: 50, K: 50 },   // Cotton
      '38': { N: 120, P: 100, K: 120 }, // Potato
      '31': { N: 100, P: 50, K: 80 },   // Onion
      '3':  { N: 200, P: 100, K: 300 }, // Banana
      '4':  { N: 80,  P: 40,  K: 30 }    // Barley
    };

    const cropKey = form.crop ? form.crop.toString() : '41';
    const ideal = idealNPK[cropKey] || { N: 120, P: 60, K: 60 };

    const defN = Math.max(0, (ideal.N - N_actual) * area);
    const defP = Math.max(0, (ideal.P - P_actual) * area);
    const defK = Math.max(0, (ideal.K - K_actual) * area);

    // DAP satisfies P deficit. DAP is 46% P2O5 and 18% N
    const weightDAP = defP / 0.46;
    const bagsDAP = Math.ceil(weightDAP / 50); // 50kg bag
    const nFromDAP = weightDAP * 0.18;

    // Urea satisfies remaining N deficit. Urea is 46% N
    const remainingN = Math.max(0, defN - nFromDAP);
    const weightUrea = remainingN / 0.46;
    const bagsUrea = Math.ceil(weightUrea / 45); // 45kg bag

    // MOP satisfies K deficit. MOP is 60% K2O
    const weightMOP = defK / 0.60;
    const bagsMOP = Math.ceil(weightMOP / 50); // 50kg bag

    return {
      urea: bagsUrea,
      dap: bagsDAP,
      mop: bagsMOP,
      hasDeficit: (bagsUrea + bagsDAP + bagsMOP) > 0,
      ideal
    };
  };

  const fertRecommendation = calculateFertilizerBags();


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
              <Text style={styles.brandText}>AgriYield</Text>
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
          <Text style={styles.sectionSub}>Input local parameters or choose a registered field to auto-fill metrics.</Text>

          {/* Active Farm Field Selector */}
          <Text style={styles.groupLabel}>TARGET FIELD</Text>
          <View style={styles.selectCard}>
            <TouchableOpacity style={styles.selectRow} onPress={() => setFarmModal(true)}>
              <View style={styles.selectTextGroup}>
                <Text style={styles.selectLabel}>ACTIVE FIELD</Text>
                <Text style={styles.selectValue}>
                  {farms.find(f => f._id === activeFarmId)?.name || 'Select a Registered Field'}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="#0F766E" />
            </TouchableOpacity>
          </View>


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
              <Text style={styles.cardTitle}>SOIL NUTRIENTS (NPK)</Text>
              {isUsingPreset && (
                <View style={styles.presetBadge}>
                  <Text style={styles.presetBadgeText}>Autofilled</Text>
                </View>
              )}
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

              {/* Revenue Optimization Card */}
              {marketPrices.length > 0 && (
                <View style={styles.revenueCard}>
                  <View style={styles.revenueHeader}>
                    <MaterialCommunityIcons name="currency-inr" size={22} color="#064E3B" style={{marginRight: 6}} />
                    <Text style={styles.revenueTitle}>REVENUE OPTIMIZER</Text>
                  </View>
                  <Text style={styles.revenueSub}>Estimated gross revenue based on current commodity rates:</Text>
                  <Text style={styles.revenueAmount}>
                    ₹{((prediction || 0) * (parseFloat(form.area) || 1.0) * 10 * (marketPrices.find(p => p.cropId === form.crop)?.pricePerQuintal || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <View style={styles.revenueDetailRow}>
                    <Text style={styles.revenueDetailText}>Price Index: ₹{marketPrices.find(p => p.cropId === form.crop)?.pricePerQuintal || 0}/Quintal</Text>
                    <Text style={styles.revenueDetailText}>Total Production: {((prediction || 0) * (parseFloat(form.area) || 1.0)).toFixed(2)} Tons</Text>
                  </View>
                </View>
              )}
              {/* Fertilizer Recommendation Card */}
              <View style={styles.fertilizerCard}>
                <View style={styles.fertilizerHeader}>
                  <MaterialCommunityIcons name="flask-outline" size={22} color="#075E54" style={{marginRight: 6}} />
                  <Text style={styles.fertilizerTitle}>SOIL NUTRIENT OPTIMIZER</Text>
                </View>
                
                {fertRecommendation.hasDeficit ? (
                  <>
                    <Text style={styles.fertilizerSub}>
                      Target NPK requirements for this crop are not fully satisfied. Add the following commercial bags to maximize yield:
                    </Text>
                    
                    <View style={styles.fertilizerList}>
                      {fertRecommendation.urea > 0 && (
                        <View style={styles.fertilizerItem}>
                          <View style={styles.fertBulletBg}>
                            <Text style={styles.fertBulletText}>N</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fertItemName}>Urea (46% Nitrogen)</Text>
                            <Text style={styles.fertItemSub}>Spread to satisfy crop vegetative growth needs</Text>
                          </View>
                          <Text style={styles.fertItemBags}>{fertRecommendation.urea} Bags</Text>
                        </View>
                      )}

                      {fertRecommendation.dap > 0 && (
                        <View style={styles.fertilizerItem}>
                          <View style={styles.fertBulletBg}>
                            <Text style={styles.fertBulletText}>P</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fertItemName}>DAP (Diammonium Phosphate)</Text>
                            <Text style={styles.fertItemSub}>Aids root development and crop strength</Text>
                          </View>
                          <Text style={styles.fertItemBags}>{fertRecommendation.dap} Bags</Text>
                        </View>
                      )}

                      {fertRecommendation.mop > 0 && (
                        <View style={styles.fertilizerItem}>
                          <View style={styles.fertBulletBg}>
                            <Text style={styles.fertBulletText}>K</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fertItemName}>MOP (Muriate of Potash)</Text>
                            <Text style={styles.fertItemSub}>Boosts pest resistance and water absorption</Text>
                          </View>
                          <Text style={styles.fertItemBags}>{fertRecommendation.mop} Bags</Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <View style={styles.optimizedSoilRow}>
                    <Feather name="check-circle" size={18} color="#065F46" style={{marginRight: 6}} />
                    <Text style={styles.optimizedSoilText}>
                      Your NPK values are fully optimized for this crop! No deficits detected.
                    </Text>
                  </View>
                )}
              </View>


              {/* Compare & Recommend Button */}
              <TouchableOpacity 
                style={styles.optimizeBtn} 
                onPress={() => {
                  setResultModalVisible(false);
                  handleCompareCrops();
                }}
                disabled={comparing}
              >
                {comparing ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Feather name="trending-up" size={18} color="#FFF" style={{marginRight: 8}} />
                    <Text style={styles.optimizeBtnText}>Compare Crops & Optimize Profit</Text>
                  </>
                )}
              </TouchableOpacity>

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

        {/* Crop Comparison & Recommendation Modal */}
        <Modal visible={comparisonModalVisible} transparent={false} animationType="slide">
          <View style={styles.fullScreenOverlay}>
            <View style={styles.comparisonHeader}>
              <View style={styles.reportBadgeGreen}>
                <Feather name="award" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.reportBadgeText}>PROFIT OPTIMIZATION ENGINE</Text>
              </View>
              <Text style={styles.reportTitle}>Profitability Rankings</Text>
              <Text style={styles.reportSubtitle}>Ranked evaluation of 9 crops calculated dynamically under your current weather, soil, and field area constants.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.comparisonScroll} showsVerticalScrollIndicator={false}>
              {comparisonResults.map((res, index) => {
                const isBest = index === 0;
                return (
                  <View key={res.cropId} style={[styles.comparisonCard, isBest && styles.bestComparisonCard]}>
                    {isBest && (
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeText}>⭐ HIGHEST PROFIT RECOMMENDATION</Text>
                      </View>
                    )}
                    <View style={styles.comparisonRowMain}>
                      <Text style={styles.comparisonCropName}>{res.cropLabel}</Text>
                      <Text style={[styles.comparisonRevValue, isBest && styles.bestComparisonRevValue]}>
                        ₹{res.grossRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                    <View style={styles.comparisonDetailsRow}>
                      <Text style={styles.comparisonDetailText}>Est. Yield: {res.predictedYield.toFixed(2)} Tons/HA</Text>
                      <Text style={styles.comparisonDetailText}>Market Rate: ₹{res.pricePerQuintal}/Quintal</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeReportButton} onPress={() => setComparisonModalVisible(false)}>
                <Text style={styles.closeReportText}>Return to Form</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>


        {/* Select Modals */}
        <SelectionModal visible={cropModal} data={CROPS} selectedValue={form.crop} onValueChange={(val) => { updateForm('crop', val); setCropModal(false); }} onClose={() => setCropModal(false)} title="Select Target Crop" />
        <SelectionModal visible={seasonModal} data={SEASONS} selectedValue={form.season} onValueChange={(val) => { updateForm('season', val); setSeasonModal(false); }} onClose={() => setSeasonModal(false)} title="Select Crop Season" />
        <SelectionModal visible={stateModal} data={STATES} selectedValue={form.state} onValueChange={(val) => { updateForm('state', val); setStateModal(false); }} onClose={() => setStateModal(false)} title="Select Farm Region" />
        
        {/* Soil Type Modal */}
        <SelectionModal visible={soilModal} data={SOIL_TYPES} selectedValue={form.soilType} onValueChange={handleSoilSelect} onClose={() => setSoilModal(false)} title="Select Soil Type" />

        {/* Farm Selector Modal */}
        <SelectionModal 
          visible={farmModal} 
          data={farms.map(f => ({ label: `${f.name} (${f.cropType || 'Crop'})`, value: f._id }))} 
          selectedValue={activeFarmId} 
          onValueChange={(val) => { 
            const selected = farms.find(f => f._id === val);
            if (selected) {
              setActiveFarmId(val);
              updateForm('area', selected.area ? selected.area.toString() : form.area);
              const cropValue = CROPS.find(c => c.label.toLowerCase().includes((selected.cropType || '').toLowerCase()))?.value || form.crop;
              updateForm('crop', cropValue);
            }
            setFarmModal(false); 
          }} 
          onClose={() => setFarmModal(false)} 
          title="Select Target Field" 
        />
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
  },
  // Revenue and Optimization Styles
  revenueCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: 20,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: 1.5,
  },
  revenueSub: {
    fontSize: 13,
    color: '#064E3B',
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '600',
  },
  revenueAmount: {
    fontSize: 36,
    fontWeight: '950',
    color: '#064E3B',
    marginBottom: 10,
    letterSpacing: -1,
  },
  revenueDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 78, 59, 0.1)',
    paddingTop: 10,
  },
  revenueDetailText: {
    fontSize: 11,
    color: '#064E3B',
    fontWeight: '700',
    opacity: 0.8,
  },
  optimizeBtn: {
    backgroundColor: '#064E3B',
    height: 55,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 25,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  optimizeBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  comparisonHeader: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reportBadgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  comparisonScroll: {
    padding: 20,
    flexGrow: 1,
  },
  comparisonCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  bestComparisonCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#ECFDF5',
  },
  bestBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  bestBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  comparisonRowMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  comparisonCropName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  comparisonRevValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  bestComparisonRevValue: {
    color: '#064E3B',
    fontSize: 22,
  },
  comparisonDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonDetailText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  presetBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
    alignSelf: 'center',
  },
  presetBadgeText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  // Fertilizer Card Styles
  fertilizerCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 20,
  },
  fertilizerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fertilizerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F766E',
    letterSpacing: 1.5,
  },
  fertilizerSub: {
    fontSize: 13,
    color: '#0F766E',
    opacity: 0.8,
    marginBottom: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
  fertilizerList: {
    marginTop: 5,
  },
  fertilizerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fertBulletBg: {
    backgroundColor: '#0F766E',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fertBulletText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  fertItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  fertItemSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  fertItemBags: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F766E',
    marginLeft: 10,
  },
  optimizedSoilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: 14,
    borderRadius: 14,
  },
  optimizedSoilText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  }
});
