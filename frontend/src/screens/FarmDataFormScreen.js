import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function FarmDataFormScreen({ route, navigation }) {
  const passedArea = route.params?.area || '';

  const [form, setForm] = useState({
    crop: '1', year: '2024', season: '1', state: '1',
    temperature: '24', rainfall: '420', humidity: '65',
    N: '50', P: '40', K: '30', pH: '6.5',
    fertilizer: '100', pesticide: '0.5', area: passedArea
  });
  
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const updateForm = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    try {
      const token = await AsyncStorage.getItem('token');
      const payload = {};
      for (const key in form) {
        payload[key] = parseFloat(form[key]) || 0;
      }

      const response = await axios.post(`${API_URL}/api/ai/predict`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPrediction(response.data.data.predicted_yield_per_area);
    } catch (error) {
      Alert.alert('Prediction Failed', error.response?.data?.message || 'Check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="tractor" size={28} color="#064E3B" />
          <Text style={styles.brandTitle}>AgriYield AI</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Feather name="bell" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <Text style={styles.pageTitle}>Predict Yield</Text>
      <Text style={styles.pageSubtitle}>Configure your farm parameters for an AI-powered harvest estimation.</Text>

      {/* Grid Variables */}
      <View style={styles.gridContainer}>
        {/* Location */}
        <View style={styles.gridBox}>
          <View style={styles.gridHeaderRow}>
            <Feather name="map-pin" size={14} color="#1F2937" />
            <Text style={styles.gridLabel}>LOCATION</Text>
          </View>
          <Text style={styles.gridValue}>Central{'\n'}Valley, CA</Text>
          <Text style={styles.gridFooter}>AUTO-DETECTED</Text>
        </View>

        {/* Rainfall */}
        <View style={styles.gridBox}>
          <View style={styles.gridHeaderRow}>
            <Feather name="cloud-rain" size={14} color="#1F2937" />
            <Text style={styles.gridLabel}>RAINFALL</Text>
          </View>
          <View style={styles.rowAlign}>
            <TextInput style={styles.gridInput} value={form.rainfall} onChangeText={(v)=>updateForm('rainfall',v)} keyboardType="numeric" />
            <Text style={styles.gridUnit}>mm/yr</Text>
          </View>
          <Text style={styles.gridFooter}>SENSOR ACTIVE</Text>
        </View>

        {/* Temp */}
        <View style={[styles.gridBox, { height: 100 }]}>
          <View style={styles.gridHeaderRow}>
            <Text style={styles.gridLabel}>TEMP</Text>
          </View>
          <View style={styles.rowAlignBetween}>
            <View style={styles.rowAlign}>
              <TextInput style={styles.gridInput} value={form.temperature} onChangeText={(v)=>updateForm('temperature',v)} keyboardType="numeric" />
              <Text style={styles.gridUnit}>°C</Text>
            </View>
            <Feather name="thermometer" size={20} color="#9CA3AF" />
          </View>
        </View>

        {/* Humidity */}
        <View style={[styles.gridBox, { height: 100 }]}>
          <View style={styles.gridHeaderRow}>
            <Text style={styles.gridLabel}>HUMIDITY</Text>
          </View>
          <View style={styles.rowAlignBetween}>
            <View style={styles.rowAlign}>
              <TextInput style={styles.gridInput} value={form.humidity} onChangeText={(v)=>updateForm('humidity',v)} keyboardType="numeric" />
              <Text style={styles.gridUnit}>%</Text>
            </View>
            <Feather name="droplet" size={20} color="#9CA3AF" />
          </View>
        </View>
      </View>

      {/* Selectors */}
      <Text style={styles.inputLabel}>CROP TYPE</Text>
      <View style={styles.pickerContainer}>
        <TextInput 
          style={styles.pickerInput} 
          placeholder="Enter crop code (e.g. 1)" 
          value={form.crop} 
          onChangeText={(v)=>updateForm('crop',v)} 
          keyboardType="numeric"
        />
        <Feather name="chevrons-down" size={20} color="#6B7280" />
      </View>

      <Text style={styles.inputLabel}>SOIL TYPE</Text>
      <View style={styles.pickerContainer}>
        <TextInput 
          style={styles.pickerInput} 
          placeholder="Enter soil pH (e.g. 6.5)" 
          value={form.pH} 
          onChangeText={(v)=>updateForm('pH',v)} 
          keyboardType="numeric"
        />
        <Feather name="chevrons-down" size={20} color="#6B7280" />
      </View>

      <Text style={styles.inputLabel}>FARM SIZE (HECTARES)</Text>
      <View style={styles.pickerContainer}>
        <TextInput 
          style={styles.pickerInput} 
          placeholder="0.00" 
          value={form.area} 
          onChangeText={(v)=>updateForm('area',v)} 
          keyboardType="numeric"
        />
        <Text style={styles.unitRight}>HA</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.primaryButton} onPress={handlePredict} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Feather name="activity" size={20} color="#FFF" style={{marginRight: 10}} />
            <Text style={styles.buttonText}>Predict Yield</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Result */}
      {prediction !== null && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Estimated Harvest Output</Text>
          <Text style={styles.resultValue}>{prediction.toFixed(2)}</Text>
          <Text style={styles.resultUnit}>Units per Hectare</Text>
        </View>
      )}

      <View style={styles.footerBrand}>
        <View style={styles.dot} />
        <Text style={styles.footerText}>AI ENGINE CALIBRATED FOR 2024 SEASONS</Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#064E3B',
    marginBottom: 10,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 30,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridBox: {
    width: '48%',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    height: 140,
    justifyContent: 'space-between',
  },
  gridHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2937',
    marginLeft: 6,
    letterSpacing: 1,
  },
  gridValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 5,
  },
  gridInput: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    padding: 0,
    margin: 0,
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rowAlignBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridUnit: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
    marginLeft: 2,
  },
  gridFooter: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '700',
    marginTop: 'auto',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 5,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    height: 55,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  pickerInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  unitRight: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  primaryButton: {
    backgroundColor: '#115E59',
    height: 60,
    borderRadius: 30, // Extremely rounded like the design
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#115E59',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 25,
    marginTop: 25,
    alignItems: 'center',
  },
  resultTitle: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '700',
  },
  resultValue: {
    color: '#FFF',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 5,
  },
  resultUnit: {
    color: '#FFF',
    fontSize: 14,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#064E3B',
    marginRight: 8,
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
    letterSpacing: 1,
  }
});
