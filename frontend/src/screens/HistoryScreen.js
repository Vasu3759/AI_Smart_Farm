import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function HistoryScreen() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPredictions(response.data.data);
    } catch (error) {
      console.log('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="tractor" size={28} color="#064E3B" />
          <Text style={styles.brandTitle}>AgriYield AI</Text>
        </View>
      </View>

      <Text style={styles.pageTitle}>Prediction History</Text>
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#064E3B" style={{marginTop: 50}} />
        ) : predictions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={50} color="#9CA3AF" />
            <Text style={styles.emptyText}>No predictions found.</Text>
            <Text style={styles.emptySub}>Go to the Predict tab to run your first AI harvest estimation.</Text>
          </View>
        ) : (
          predictions.map((pred) => (
            <View key={pred._id} style={styles.predictionCard}>
              <View style={styles.predLeft}>
                <View style={styles.predIconBg}>
                  <Feather name="trending-up" size={20} color="#1F2937" />
                </View>
                <View>
                  <Text style={styles.predTitle}>
                    {pred.farm?.name ? `${pred.farm.name} - Yield Est.` : 'Field - Yield Est.'}
                  </Text>
                  <Text style={styles.predSub}>{formatDate(pred.date)}</Text>
                </View>
              </View>
              <View style={styles.predRight}>
                <Text style={styles.predValue}>{pred.predictedYield ? pred.predictedYield.toFixed(0) : '0'}</Text>
                <Text style={styles.predUnit}>bu/ac</Text>
                <Text style={styles.predGrowth}>AI Generated</Text>
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
    backgroundColor: '#F9FAFB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
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
  pageTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#064E3B',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 15,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 30,
    lineHeight: 22,
  },
  predictionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
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
