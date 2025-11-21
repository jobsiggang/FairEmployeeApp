import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API from '../config/api';

const HistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [groupedHistory, setGroupedHistory] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [user, setUser] = useState(null); // Ensure user state is initialized

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    };
    loadUser();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      setUser(userObj); // Ensure user is set here as well

      if (!userObj || !userObj.token) {
        Alert.alert('Authentication Error', 'Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.get(API.uploads, {
        headers: {
          Authorization: `Bearer ${userObj.token}`,
        },
      });

      if (response.data.success) {
        const uploads = response.data.uploads || [];
        const grouped = uploads.reduce((acc, upload) => {
          const date = new Date(upload.createdAt).toLocaleDateString();
          if (!acc[date]) acc[date] = [];
          acc[date].push(upload);
          return acc;
        }, {});
        setGroupedHistory(grouped);
      } else {
        Alert.alert('Server Error', response.data.error || 'Failed to fetch upload history.');
      }
    } catch (error) {
      if (error.response) {
        Alert.alert('Server Error', `Status: ${error.response.status}\nMessage: ${error.response.data?.error || 'Error occurred'}`);
      } else {
        Alert.alert('Network Error', 'Unable to connect to the server.');
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>{user?.companyName || '회사명'}</Text>
          <Text style={styles.userName}>
            {user?.name || '사용자'} {user?.username ? `(${user.username})` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.logoutButton}>로그아웃</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => navigation.navigate('Upload')}
        >
          <Text style={styles.tabButtonText}>📸 사진 업로드</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, styles.activeTab]}
        >
          <Text style={[styles.tabButtonText, styles.activeTabText]}>📋 전송내역</Text>
        </TouchableOpacity>
      </View>
      {selectedDate ? (
        <ScrollView>
          <Text style={styles.sectionTitle}>Uploads for {selectedDate}</Text>
          {groupedHistory[selectedDate].map((item) => (
            <View key={item._id} style={styles.card}>
              <Text style={styles.title}>{item.formName || 'No Form Name'}</Text>
              {item.imageUrls && item.imageUrls.length > 0 && (
                <Image
                  source={{ uri: item.imageUrls[0] }}
                  style={styles.thumbnail}
                />
              )}
              {Object.entries(item.data || {}).map(([key, value]) => (
                <Text key={key} style={styles.subtitle}>{`${key}: ${value}`}</Text>
              ))}
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          ))}
          <Text style={styles.backButton} onPress={() => setSelectedDate(null)}>
            Back to Dates
          </Text>
        </ScrollView>
      ) : (
        <ScrollView>
          {Object.keys(groupedHistory).map((date) => (
            <View key={date} style={styles.card}>
              <Text style={styles.title} onPress={() => setSelectedDate(date)}>
                {date}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
    marginTop: 16,
    textAlign: 'center',
  },
  thumbnail: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    borderRadius: 8,
    marginVertical: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 16,
    color: '#555',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  activeTabText: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#3b82f6',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    color: '#fff',
  },
  logoutButton: {
    fontSize: 14,
    color: '#fff',
    textDecorationLine: 'underline',
  },
});

export default HistoryScreen;