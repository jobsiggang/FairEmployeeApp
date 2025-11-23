// HistoryScreen.js
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUser(JSON.parse(userData));
    };
    loadUser();
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      setUser(userObj);

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
        Alert.alert(
          'Server Error',
          `Status: ${error.response.status}\nMessage: ${error.response.data?.error || 'Error occurred'}`
        );
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

  const renderCard = (item) => (
    <View key={item._id} style={styles.card}>
      <Text style={styles.title}>{item.formName || 'No Form Name'}</Text>

      {/* 썸네일 여러 개 가로 배치 */}
      {item.thumbnails && item.thumbnails.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
          {item.thumbnails.map((thumb, idx) => (
            <Image key={idx} source={{ uri: thumb }} style={styles.thumbnail} />
          ))}
        </ScrollView>
      )}

      {/* 데이터 필드 */}
      {Object.entries(item.data || {}).map(([key, value]) => (
        <Text key={key} style={styles.subtitle}>{`${key}: ${value}`}</Text>
      ))}

      <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView>
        {Object.keys(groupedHistory).map((date) => (
          <View key={date} style={styles.card}>
            <Text
              style={styles.title}
              onPress={() => setSelectedDate(selectedDate === date ? null : date)}
            >
              {date}
            </Text>
            {selectedDate === date && (
              <>
                <Text style={styles.sectionTitle}>Uploads for {date}</Text>
                {groupedHistory[date].map(item => (
                  <View key={item._id}>
                    {renderCard(item)}
                  </View>
                ))}
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
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
    lineHeight: 20,
    marginBottom: 4, // 제목 아래 여백 최소화
  },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  date: { fontSize: 12, color: '#999', marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  backButton: { fontSize: 16, color: '#3b82f6', marginTop: 16, textAlign: 'center' },
  thumbnailContainer: { flexDirection: 'row', marginTop: 4 },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 8 },
});

export default HistoryScreen;
