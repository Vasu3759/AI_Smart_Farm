import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, ImageBackground, Modal, TextInput, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../config';

export default function ProfileScreen({ navigation }) {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ farms: 0, predictions: 0 });
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updating, setUpdating] = useState(false);

  // New Modals
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Notification State
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(`${API_URL}/api/auth/update`, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data.data);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Validation Error', 'Please fill all password fields.');
      return;
    }
    setPasswordUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/api/auth/password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Success', 'Password updated successfully!');
      setSecurityModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordUpdating(false);
    }
  };

  const handleUpdateNotifications = async (type, value) => {
    try {
      if (type === 'push') setPushEnabled(value);
      if (type === 'email') setEmailEnabled(value);
      
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/api/auth/update`, {
        pushEnabled: type === 'push' ? value : pushEnabled,
        emailEnabled: type === 'email' ? value : emailEnabled
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences.');
    }
  };

  const fetchProfileData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Fetch User Info
      const userRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data.data);
      setPushEnabled(userRes.data.data.pushEnabled ?? true);
      setEmailEnabled(userRes.data.data.emailEnabled ?? true);

      // Fetch Farms for stats
      const farmRes = await axios.get(`${API_URL}/api/farms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch Predictions for stats
      const predRes = await axios.get(`${API_URL}/api/predictions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats({
        farms: farmRes.data.data.length,
        predictions: predRes.data.data.length
      });
    } catch (error) {
      console.log('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
    Alert.alert(
      newLang === 'en' ? 'Language Changed' : 'भाषा बदली गई',
      newLang === 'en' ? 'App language set to English' : 'ऐप की भाषा हिंदी में सेट हो गई है'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#0F766E" style={{ marginTop: 100 }} />
        ) : (
          <>
            {/* Header Image Background with Farm picture */}
            <ImageBackground 
              source={require('../../assets/login_bg.png')} 
              style={styles.headerBackground}
            >
              <View style={styles.headerOverlay}>
                <View style={styles.brandBadge}>
                  <MaterialCommunityIcons name="tractor" size={24} color="#FFF" />
                  <Text style={styles.brandText}>AgriYield</Text>
                </View>
              </View>
            </ImageBackground>

            {/* Profile Card overlapping the background */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <Feather name="user" size={40} color="#064E3B" />
              </View>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{user?.name || 'Farmer Member'}</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setEditName(user?.name || '');
                    setEditPhone(user?.phone || '');
                    setEditEmail(user?.email || '');
                    setEditModalVisible(true);
                  }} 
                  style={styles.editIconBtn}
                  activeOpacity={0.6}
                >
                  <Feather name="edit-2" size={14} color="#064E3B" />
                </TouchableOpacity>
              </View>
              <Text style={styles.email}>{user?.email || 'No email registered'}</Text>
              <Text style={styles.phone}>{user?.phone || 'No phone number registered'}</Text>
              <View style={styles.memberSinceRow}>
                <Feather name="calendar" size={12} color="#64748B" style={{ marginRight: 4 }} />
                <Text style={styles.memberSinceText}>
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'July 2026'}
                </Text>
              </View>
            </View>

            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.farms}</Text>
                <Text style={styles.statLabel}>{t('profile.active_fields')}</Text>
              </View>
              <View style={styles.statSeparator} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.predictions}</Text>
                <Text style={styles.statLabel}>{t('profile.predictions')}</Text>
              </View>
            </View>

            {/* Menu Options */}
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={styles.menuHeader}>{t('profile.system_settings')}</Text>
              <View style={styles.menuCard}>
                <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Feather name="globe" size={18} color="#0F766E" />
                    </View>
                    <Text style={styles.menuText}>
                      {t('profile.language')} / भाषा : {i18n.language === 'hi' ? 'हिंदी (Hindi)' : 'English'}
                    </Text>
                  </View>
                  <Feather name="refresh-cw" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.menuItem} onPress={() => setSecurityModalVisible(true)}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Feather name="shield" size={18} color="#0F766E" />
                    </View>
                    <Text style={styles.menuText}>{t('profile.security')}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
                
                <View style={styles.separator} />

                <TouchableOpacity style={styles.menuItem} onPress={() => setNotificationsModalVisible(true)}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Feather name="bell" size={18} color="#0F766E" />
                    </View>
                    <Text style={styles.menuText}>{t('profile.notifications')}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>

                <View style={styles.separator} />

                <TouchableOpacity style={styles.menuItem} onPress={() => setSupportModalVisible(true)}>
                  <View style={styles.menuItemLeft}>
                    <View style={styles.menuIconBg}>
                      <Feather name="help-circle" size={18} color="#0F766E" />
                    </View>
                    <Text style={styles.menuText}>{t('profile.support')}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Logout Action */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Feather name="log-out" size={20} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={styles.logoutText}>{t('profile.logout')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.edit_profile_info')}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t('profile.full_name')}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="user" size={18} color="#0F766E" style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('profile.name_placeholder')} 
                  value={editName} 
                  onChangeText={setEditName} 
                />
              </View>

              <Text style={styles.inputLabel}>{t('profile.phone_number')}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="phone" size={18} color="#0F766E" style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('profile.phone_placeholder')} 
                  keyboardType="numeric"
                  value={editPhone} 
                  onChangeText={setEditPhone} 
                />
              </View>

              <Text style={styles.inputLabel}>{t('profile.email_address')}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={18} color="#0F766E" style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder={t('profile.email_placeholder')} 
                  autoCapitalize="none"
                  value={editEmail} 
                  onChangeText={setEditEmail} 
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateProfile} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Feather name="check" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>{t('profile.save_changes')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal visible={securityModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.security')}</Text>
              <TouchableOpacity onPress={() => setSecurityModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>{t('profile.current_password')}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color="#0F766E" style={{ marginRight: 10 }} />
                <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
              </View>
              <Text style={styles.inputLabel}>{t('profile.new_password')}</Text>
              <View style={styles.inputWrapper}>
                <Feather name="shield" size={18} color="#0F766E" style={{ marginRight: 10 }} />
                <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} />
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword} disabled={passwordUpdating}>
                {passwordUpdating ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <Feather name="check" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>{t('profile.change_password')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notificationsModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.notifications')}</Text>
              <TouchableOpacity onPress={() => setNotificationsModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: 20 }}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('profile.push_notifications')}</Text>
                <Switch value={pushEnabled} onValueChange={(val) => handleUpdateNotifications('push', val)} trackColor={{ false: '#E2E8F0', true: '#0F766E' }} />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('profile.email_alerts')}</Text>
                <Switch value={emailEnabled} onValueChange={(val) => handleUpdateNotifications('email', val)} trackColor={{ false: '#E2E8F0', true: '#0F766E' }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Support Modal */}
      <Modal visible={supportModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.support_center')}</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.faqHeader}>{t('profile.contact_us')}</Text>
              <Text style={styles.faqText}>support@agriyield.com</Text>
              <Text style={styles.faqText}>+91 1800 123 456</Text>
              <View style={styles.separator} />
              <Text style={styles.faqHeader}>{t('profile.faq')}</Text>
              <Text style={styles.faqQ}>{t('profile.faq_1_q')}</Text>
              <Text style={styles.faqA}>{t('profile.faq_1_a')}</Text>
              <Text style={styles.faqQ}>{t('profile.faq_2_q')}</Text>
              <Text style={styles.faqA}>{t('profile.faq_2_a')}</Text>
            </ScrollView>
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
  headerBackground: {
    height: 180,
    width: '100%',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 78, 59, 0.45)', // Richer green tint overlay
    paddingTop: 50,
    paddingHorizontal: 24,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  brandText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: -50, // Overlap the header background
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarContainer: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 4,
    borderColor: '#FFF',
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  phone: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statSeparator: {
    width: 1,
    height: '60%',
    backgroundColor: '#F1F5F9',
  },
  menuHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 12,
    paddingLeft: 4,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBg: {
    backgroundColor: '#F0FDF4', // Soft sage-green background
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2', // Elegant very soft red
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 15,
    borderRadius: 18,
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  editIconBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  memberSinceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  memberSinceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  faqHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 10,
    marginBottom: 6,
  },
  faqText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 4,
  },
  faqA: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  }
});
