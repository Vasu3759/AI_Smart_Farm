import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function HistoryScreen() {
  const [predictions, setPredictions] = useState([]);
  const [marketPrices, setMarketPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrediction, setSelectedPrediction] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchHistoryAndPrices = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Fetch predictions history
      const response = await axios.get(`${API_URL}/api/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPredictions(response.data.data);

      // Fetch market prices for revenue calculations
      const priceResponse = await axios.get(`${API_URL}/api/market`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMarketPrices(priceResponse.data.data);

    } catch (error) {
      console.log('Error fetching history/prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistoryAndPrices();
    }, [])
  );

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleShowDetails = (pred) => {
    setSelectedPrediction(pred);
    setDetailModalVisible(true);
  };

  const getCropPriceAndRevenue = (pred) => {
    if (!pred) return { price: 0, revenue: 0, icon: '🌾' };
    const farmCrop = pred.crop || (pred.farm ? pred.farm.cropType : 'Rice');
    const priceObj = marketPrices.find(p => p.name.toLowerCase() === farmCrop.toLowerCase());
    
    const price = priceObj ? priceObj.pricePerQuintal : 2200; // fallback to 2200
    const icon = priceObj ? priceObj.icon : '🌾';
    const area = pred.farm ? (pred.farm.area || 1.0) : 1.0;
    const yieldVal = pred.predictedYield || 0;
    
    // Revenue: Yield (Tons/HA) * Area (HA) * 10 (Quintals/Ton) * Price (INR/Quintal)
    const revenue = yieldVal * area * 10 * price;
    return { price, revenue, icon };
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
            <Text style={styles.brandSub}>PRECISION ARCHIVE</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchHistoryAndPrices} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#064E3B" />
          ) : (
            <Feather name="refresh-cw" size={18} color="#064E3B" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Prediction History</Text>
        <Text style={styles.pageSubtitle}>Review and track historical crop yield estimations and metrics.</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#064E3B" style={{ marginTop: 50 }} />
        ) : predictions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Feather name="folder-minus" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyText}>No History Recorded</Text>
            <Text style={styles.emptySub}>Draw fields and run the AI prediction model to see results archived here.</Text>
          </View>
        ) : (
          predictions.map((pred) => {
            const { revenue, icon } = getCropPriceAndRevenue(pred);
            return (
              <TouchableOpacity 
                key={pred._id} 
                style={styles.predictionCard} 
                onPress={() => handleShowDetails(pred)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={styles.leafIconBg}>
                      <Text style={{ fontSize: 20 }}>{icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.predTitle}>
                        {pred.farm?.name ? pred.farm.name : 'Deleted Field / Archive'}
                      </Text>
                      <Text style={styles.predDate}>{new Date(pred.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                  </View>
                  <View style={styles.arrowIcon}>
                    <Feather name="chevron-right" size={20} color="#94A3B8" />
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
                  
                  {revenue > 0 && (
                    <View style={styles.metricItemRight}>
                      <Text style={styles.metricLabel}>EST. REVENUE</Text>
                      <Text style={styles.metricRevenueVal}>
                        ₹{revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Full Prediction Detail Modal */}
      {selectedPrediction && (
        <Modal visible={detailModalVisible} transparent={false} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.reportBadge}>
                <MaterialCommunityIcons name="brain" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.reportBadgeText}>HISTORICAL RECORD</Text>
              </View>
              <Text style={styles.reportTitle}>Harvest Analysis Details</Text>
              <Text style={styles.reportSubtitle}>Forecast constants and metrics retrieved from your database archives.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Yield Card */}
              <View style={styles.reportYieldCard}>
                <Text style={styles.yieldCardLabel}>RECORDED HARVEST YIELD</Text>
                <View style={styles.yieldCardValueRow}>
                  <Text style={styles.yieldCardLargeText}>
                    {selectedPrediction.predictedYield ? selectedPrediction.predictedYield.toFixed(2) : '0.00'}
                  </Text>
                  <Text style={styles.yieldCardUnit}> Tons/HA</Text>
                </View>
              </View>

              {/* Revenue Card */}
              <View style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                  <MaterialCommunityIcons name="currency-inr" size={22} color="#064E3B" style={{ marginRight: 6 }} />
                  <Text style={styles.revenueTitle}>REVENUE ARCHIVE</Text>
                </View>
                <Text style={styles.revenueSub}>Calculated revenue based on recorded parameters:</Text>
                <Text style={styles.revenueAmount}>
                  ₹{getCropPriceAndRevenue(selectedPrediction).revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <View style={styles.revenueDetailRow}>
                  <Text style={styles.revenueDetailText}>
                    Price Index: ₹{getCropPriceAndRevenue(selectedPrediction).price}/Quintal
                  </Text>
                  <Text style={styles.revenueDetailText}>
                    Field Size: {selectedPrediction.farm?.area || 0} HA
                  </Text>
                </View>
              </View>

              {/* Parameter Table Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryCardTitle}>RECORDED CONSTANTS</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Field Name</Text>
                  <Text style={styles.summaryValue}>{selectedPrediction.farm?.name || 'Deleted Field / Archive'}</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Crop Cultivated</Text>
                  <Text style={styles.summaryValue}>{selectedPrediction.crop || selectedPrediction.farm?.cropType || 'Rice'}</Text>
                </View>
                <View style={styles.summarySeparator} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Record Timestamp</Text>
                  <Text style={styles.summaryValue}>{formatDate(selectedPrediction.date)}</Text>
                </View>
                <View style={styles.summarySeparator} />

                {selectedPrediction.weatherContext && (
                  <>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Temperature</Text>
                      <Text style={styles.summaryValue}>{selectedPrediction.weatherContext.temperature ? `${selectedPrediction.weatherContext.temperature}°C` : 'N/A'}</Text>
                    </View>
                    <View style={styles.summarySeparator} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Rainfall Index</Text>
                      <Text style={styles.summaryValue}>{selectedPrediction.weatherContext.rainfall ? `${selectedPrediction.weatherContext.rainfall} mm` : 'N/A'}</Text>
                    </View>
                    <View style={styles.summarySeparator} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Atmospheric Humidity</Text>
                      <Text style={styles.summaryValue}>{selectedPrediction.weatherContext.humidity ? `${selectedPrediction.weatherContext.humidity}%` : 'N/A'}</Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.closeReportButton} onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.closeReportText}>Close Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
    paddingTop: 55,
    paddingBottom: 18,
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
  refreshButton: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 40,
    flexGrow: 1,
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
    marginBottom: 25,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  emptyIconBg: {
    backgroundColor: '#F8FAFC',
    padding: 20,
    borderRadius: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  predictionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
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
    backgroundColor: '#F8FAFC',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  predTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  predDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  arrowIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
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
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValLarge: {
    fontSize: 26,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  metricRevenueVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  reportBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  reportSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  modalContent: {
    padding: 20,
  },
  reportYieldCard: {
    backgroundColor: '#064E3B',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20,
  },
  yieldCardLabel: {
    color: '#A7F3D0',
    fontSize: 11,
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
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  yieldCardUnit: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
  },
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
    fontSize: 11,
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
    fontSize: 34,
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
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 25,
  },
  summaryCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 1.2,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    textTransform: 'uppercase',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '800',
  },
  summarySeparator: {
    height: 1,
    backgroundColor: '#F8FAFC',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFF',
  },
  closeReportButton: {
    backgroundColor: '#1E293B',
    height: 55,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  closeReportText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  }
});
