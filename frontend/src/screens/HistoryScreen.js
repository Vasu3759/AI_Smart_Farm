import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
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
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="tractor" size={24} color="#FFF" />
          </View>
          <View>
            <Text style={styles.brandText}>AgriYield AI</Text>
            <Text style={styles.brandSub}>PRECISION ARCHIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchHistory} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#115E59" />
          ) : (
            <Feather name="refresh-cw" size={18} color="#115E59" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Prediction History</Text>
        <Text style={styles.pageSubtitle}>Review and track historical crop yield estimations and metrics.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={{marginTop: 50}} />
        ) : predictions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Feather name="folder-minus" size={40} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyText}>No History Recorded</Text>
            <Text style={styles.emptySub}>Draw fields and run the AI prediction model to see results archived here.</Text>
          </View>
        ) : (
          predictions.map((pred) => (
            <View key={pred._id} style={styles.predictionCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.leafIconBg}>
                    <MaterialCommunityIcons name="leaf" size={20} color="#0F766E" />
                  </View>
                  <View>
                    <Text style={styles.predTitle}>
                      {pred.farm?.name ? pred.farm.name : 'Unknown Field'}
                    </Text>
                    <Text style={styles.predDate}>{formatDate(pred.date)}</Text>
                  </View>
                </View>

              </View>

              <View style={styles.separator} />

              <View style={styles.cardBody}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>ESTIMATED OUTPUT</Text>
                  <View style={styles.metricValRow}>
                    <Text style={styles.metricValLarge}>{pred.predictedYield ? pred.predictedYield.toFixed(2) : '0.00'}</Text>
                    <Text style={styles.metricUnit}> Tons/HA</Text>
                  </View>
                </View>
                <View style={styles.metricItemRight}>
                  <Text style={styles.metricLabel}>FIELD AREA</Text>
                  <Text style={styles.metricValSmall}>{pred.farm?.area ? `${pred.farm.area} HA` : 'N/A'}</Text>
                </View>
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
  refreshButton: {
    backgroundColor: '#E6F4F1',
    padding: 10,
    borderRadius: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 25,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyIconBg: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  predictionCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leafIconBg: {
    backgroundColor: '#E6F4F1',
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  predTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  predDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  confBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  confText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 15,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  metricItem: {
    flex: 1,
  },
  metricItemRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValLarge: {
    fontSize: 26,
    fontWeight: '900',
    color: '#064E3B',
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  metricValSmall: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  }
});
