// MainHeader.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const MainHeader = ({ navigation, activeTab }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUser();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>

      {/* ───────────── 상단 사용자 정보 ───────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>
            {user?.companyName || '회사명'}
          </Text>

          <Text style={styles.userName}>
            {user?.name || '사용자'}
            {user?.username ? ` (${user.username})` : ''}
          </Text>
        </View>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutButton}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* ───────────── 탭 메뉴 (Upload / History) ───────────── */}
      <View style={styles.tabBar}>
        
        {/* 업로드 */}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'upload' && styles.activeTab]}
          onPress={() => navigation.navigate('Upload')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'upload' && styles.activeTabText,
            ]}
          >
            📸 사진 업로드
          </Text>
        </TouchableOpacity>

        {/* 전송내역 */}
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
          onPress={() => navigation.navigate('History')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            📋 전송내역
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', backgroundColor: '#fff' },
  header: {
    padding: 16,
    backgroundColor: '#f3f3f3',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  companyName: { fontSize: 18, fontWeight: 'bold' },
  userName: { fontSize: 14, color: '#333' },
  logoutButton: { color: 'red', marginTop: 5 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabButtonText: { fontSize: 16 },
  activeTab: {
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#000',
  },
});

export default MainHeader;
