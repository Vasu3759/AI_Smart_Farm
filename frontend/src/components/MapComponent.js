import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import * as turf from '@turf/turf';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function MapComponent({ navigation }) {
  const [coordinates, setCoordinates] = useState([]);
  const [area, setArea] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [cropType, setCropType] = useState('Rice');
  const [isSaving, setIsSaving] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const handleMapPress = (e) => {
    // Read the press coordinate
    const coordinate = e.nativeEvent.coordinate;
    if (coordinate) {
      setCoordinates(prev => [...prev, coordinate]);
    }
  };

  const markCurrentLocation = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS location permissions are required to mark points at your current location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newCoord = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      };
      setCoordinates(prev => [...prev, newCoord]);
    } catch (err) {
      Alert.alert('GPS Error', 'Failed to acquire location. Please verify your phone GPS is turned on.');
    } finally {
      setLocLoading(false);
    }
  };

  const calculateArea = () => {
    if (coordinates.length < 3) {
      Alert.alert('Field Boundary Error', 'Please mark at least 3 points to outline a field boundary.');
      return;
    }
    
    // Format coordinates for turf: [longitude, latitude]
    const coords = coordinates.map((c) => [c.longitude, c.latitude]);
    coords.push([coordinates[0].longitude, coordinates[0].latitude]); // close polygon

    const polygon = turf.polygon([coords]);
    const areaSqMeters = turf.area(polygon);
    const areaHectares = areaSqMeters / 10000;
    
    setArea(areaHectares.toFixed(2));
    setModalVisible(true);
  };

  const saveFarm = async () => {
    if (!farmName) {
      Alert.alert('Field Name Missing', 'Please enter a name for your field.');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const location = { type: 'Point', coordinates: [coordinates[0].longitude, coordinates[0].latitude] };
      
      const boundaryCoords = coordinates.map(c => [c.longitude, c.latitude]);
      boundaryCoords.push([coordinates[0].longitude, coordinates[0].latitude]);
      const boundary = { type: 'Polygon', coordinates: [boundaryCoords] };

      await axios.post(`${API_URL}/api/farms`, {
        name: farmName,
        location,
        boundary,
        area: area,
        cropType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setModalVisible(false);
      Alert.alert('Success', 'Farm field saved successfully!');
      if (navigation) navigation.navigate('MainTabs');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save farm');
    } finally {
      setIsSaving(false);
    }
  };

  const clearMap = () => {
    setCoordinates([]);
    setArea(null);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 28.7041, // Defaulting to New Delhi coordinates
          longitude: 77.1025,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
        mapType="hybrid" // Hybrid map view makes it easier to spot green vegetation fields
      >
        {coordinates.map((coord, index) => (
          <Marker key={index} coordinate={coord} title={`Point ${index + 1}`} />
        ))}
        {coordinates.length > 2 && (
          <Polygon
            coordinates={coordinates}
            fillColor="rgba(16, 185, 129, 0.3)"
            strokeColor="rgba(16, 185, 129, 1)"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.instruction}>
          Tap the map OR walk and mark coordinates to outline field boundaries.
        </Text>
        
        {area && (
          <Text style={styles.areaText}>
            Calculated Size: {area} Hectares
          </Text>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.gpsBtn]} 
            onPress={markCurrentLocation}
            disabled={locLoading}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#FFF" style={{marginRight: 4}} />
            <Text style={styles.btnText}>{locLoading ? 'Acquiring...' : 'Mark GPS'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.saveBtn]} 
            onPress={calculateArea}
          >
            <Feather name="check" size={16} color="#FFF" style={{marginRight: 4}} />
            <Text style={styles.btnText}>Outline & Save</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionBtn, styles.clearBtn]} 
            onPress={clearMap}
          >
            <Feather name="trash-2" size={16} color="#FFF" style={{marginRight: 4}} />
            <Text style={styles.btnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save New Field</Text>
            
            <Text style={styles.modalLabel}>Field Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. North Field 1" value={farmName} onChangeText={setFarmName} />
            
            <Text style={styles.modalLabel}>Target Crop Type</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Rice" value={cropType} onChangeText={setCropType} />
            
            <Text style={styles.modalSubText}>Calculated Area: {area} Hectares</Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={saveFarm} disabled={isSaving}>
                <Text style={styles.modalBtnText}>{isSaving ? "Saving..." : "Save Field"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 25,
    left: 15,
    right: 15,
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  instruction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  areaText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 3,
  },
  gpsBtn: {
    backgroundColor: '#0284C7',
  },
  saveBtn: {
    backgroundColor: '#059669',
  },
  clearBtn: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    color: '#FFF',
    fontSize: 11,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 18,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  modalSubText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '800',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  confirmBtn: {
    backgroundColor: '#064E3B',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  }
});
