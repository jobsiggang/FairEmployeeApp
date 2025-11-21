import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import API from '../config/api';
import {StyleSheet} from 'react-native';

const LoginScreen = ({navigation}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      console.log('업체 목록 요청:', API.companiesList);
      
      const response = await fetch(API.companiesList, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('업체 목록 응답:', data);
      
      if (data.success && data.companies && data.companies.length > 0) {
        setCompanies(data.companies);
        setSelectedCompany(data.companies[0]._id);
      } else {
        console.warn('업체 데이터 없음 또는 빈 배열');
        Alert.alert('알림', '등록된 업체가 없습니다.');
      }
    } catch (error) {
      console.error('업체 목록 조회 오류:', error);
      
      let errorMessage = '업체 목록을 불러올 수 없습니다.';
      errorMessage += `\n${error.message}`;
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const checkAuth = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const user = userData ? JSON.parse(userData) : null;
      if (user && user.token) {
        navigation.replace('Upload'); // Main 대신 Upload로
      }
    } catch (error) {
      console.log('Auth check error:', error);
    }
  };

  const handleLogin = async () => {
    if (!selectedCompany) {
      Alert.alert('오류', '업체를 선택하세요');
      return;
    }
    if (!username || !password) {
      Alert.alert('오류', '아이디와 비밀번호를 입력하세요');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          companyId: selectedCompany,
        }),
      });

      const data = await response.json();
      console.log('로그인 응답:', data);

      if (data.success) {
        // user 객체에 token, userId, role, companyId, name 등 모두 포함해서 저장
        const selectedCompanyData = companies.find(c => c._id === selectedCompany);
        const userObj = {
          userId: data.user._id,
          username: data.user.username,
          role: data.user.role,
          companyId: data.user.companyId,
          name: data.user.name,
          token: data.token,
          companyName: selectedCompanyData ? selectedCompanyData.name : '',
        };
        await AsyncStorage.setItem('user', JSON.stringify(userObj));
        // 로그인 성공 후 바로 업로드 화면으로 이동 (Stack에 정의된 'Upload')
        navigation.replace('Upload');
      } else {
        Alert.alert('로그인 실패', data.message || '로그인에 실패했습니다');
      }
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = '서버 연결에 실패했습니다';
      errorMessage += '\n' + error.message;
      
      Alert.alert('오류', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      <View style={styles.header}>
        <Text style={styles.title}>📸 현장사진 업로드</Text>
        <Text style={styles.subtitle}>직원 로그인</Text>
      </View>

      <ScrollView style={styles.form}>
        {loadingCompanies ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>업체 목록 불러오는 중...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.label}>업체 선택</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedCompany}
                onValueChange={(itemValue) => {
                  console.log('업체 선택됨:', itemValue);
                  setSelectedCompany(itemValue);
                }}
                style={styles.picker}
                enabled={true}
                mode="dropdown">
                <Picker.Item label="업체를 선택하세요" value="" />
                {companies.map((company) => (
                  <Picker.Item
                    key={company._id}
                    label={company.name}
                    value={company._id}
                  />
                ))}
              </Picker>
            </View>

            {selectedCompany ? (
              <Text style={styles.selectedText}>
                선택된 업체: {companies.find(c => c._id === selectedCompany)?.name || '없음'}
              </Text>
            ) : null}

            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              placeholder="아이디"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={[styles.input, { color: '#111', fontWeight: 'bold' }]}
              placeholder="비밀번호"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true} // Re-enabled password masking
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>로그인</Text>
              )}
            </TouchableOpacity>

          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  form: {
    padding: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 5,
    height:60, // Increased height for better visibility
  },
  picker: {
    height: '100%', // Ensure Picker fills the container height
    flex: 1, // Allow flexible resizing within the container
    color: '#000',
  },
  selectedText: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 8, // Adjusted margin for better spacing
    marginBottom: 8,
    lineHeight: 20, // Ensure proper line height
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    height: 56, // 높이 증가로 글자 잘 보이게
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoginScreen;
