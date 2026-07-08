import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, Alert, Modal, TextInput } from 'react-native';
import MapView, { Marker, Polygon, UrlTile } from 'react-native-maps';
import * as turf from '@turf/turf';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export default function MapComponent({ navigation }) {
  const [coordinates, setCoordinates] = useState([]);
  const [area, setArea] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [cropType, setCropType] = useState('Corn');
  const [isSaving, setIsSaving] = useState(false);

  const handleMapPress = (e) => {
    const { coordinate } = e.nativeEvent;
    setCoordinates([...coordinates, coordinate]);
  };

  const calculateArea = () => {
    if (coordinates.length < 3) {
      Alert.alert('Error', 'Please draw at least 3 points to form a farm boundary.');
      return;
    }
    
    // Format coordinates for turf: [longitude, latitude]
    // Turf expects the first and last positions to be identical to close the polygon
    const coords = coordinates.map((c) => [c.longitude, c.latitude]);
    coords.push([coordinates[0].longitude, coordinates[0].latitude]);

    const polygon = turf.polygon([coords]);
    const areaSqMeters = turf.area(polygon);
    const areaHectares = areaSqMeters / 10000;
    
    setArea(areaHectares.toFixed(2));
    setModalVisible(true);
  };

  const saveFarm = async () => {
    if (!farmName) {
      Alert.alert('Error', 'Please enter a farm name');
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
        mapType="none"
      >
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        {coordinates.map((coord, index) => (
          <Marker key={index} coordinate={coord} />
        ))}
        {coordinates.length > 2 && (
          <Polygon
            coordinates={coordinates}
            fillColor="rgba(0, 255, 0, 0.3)"
            strokeColor="rgba(0, 255, 0, 1)"
            strokeWidth={2}
          />
        )}
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.instruction}>
          Tap the map to draw farm boundaries.
        </Text>
        {area && (
          <Text style={styles.areaText}>
            Farm Area: {area} Hectares
          </Text>
        )}
        <View style={styles.buttonRow}>
          <Button title="Calculate & Save" onPress={calculateArea} />
          <Button title="Clear Map" color="red" onPress={clearMap} />
        </View>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save New Field</Text>
            <Text style={styles.modalLabel}>Field Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. North Corn 12" value={farmName} onChangeText={setFarmName} />
            <Text style={styles.modalLabel}>Crop Type</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Corn" value={cropType} onChangeText={setCropType} />
            <Text style={styles.modalSubText}>Calculated Area: {area} Hectares</Text>
            <View style={styles.buttonRow}>
              <Button title="Cancel" color="red" onPress={() => setModalVisible(false)} />
              <Button title={isSaving ? "Saving..." : "Save Field"} onPress={saveFarm} disabled={isSaving} />
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
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  instruction: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  areaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 25,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#064E3B', marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  modalInput: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 15 },
  modalSubText: { fontSize: 14, color: '#666', marginBottom: 20 },
});
