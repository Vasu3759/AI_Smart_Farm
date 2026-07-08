import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapComponent from '../components/MapComponent';

export default function MapScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <MapComponent navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
