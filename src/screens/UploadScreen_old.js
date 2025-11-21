import React, {useState, useEffect, useRef} from 'react';
import { canvasConfig } from '../config/compositeConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import API from '../config/api';
import Share from 'react-native-share';
import ImageComposer from '../components/ImageComposer';
import NavigationMenu from '../components/NavigationMenu';

const {width: screenWidth} = Dimensions.get('window');
const THUMB_SIZE = 80;
// 회전 각도에 따라 캔버스 크기 동적 계산
function getCanvasDims(rotation) {
  // 캔버스 크기는 항상 고정 (회전해도 width/height swap 없음)
  const baseWidth = Math.floor(screenWidth * 0.7);
  const baseHeight = Math.floor(baseWidth * canvasConfig.height / canvasConfig.width);
  return { width: baseWidth, height: baseHeight };
}
const cellPaddingX = canvasConfig.table.cellPaddingX;
const cellPaddingY = canvasConfig.table.cellPaddingY;

const UploadScreen = ({navigation}) => {
  const [user, setUser] = useState(null);
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [images, setImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false); // Removed the extra character 'd'
  // 업로드 진행 상태
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [datePickerField, setDatePickerField] = useState(null);
  const canvasRef = useRef(null);

  // Derived state - must be after all hooks
  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  useEffect(() => {
    loadUser();
    fetchForms();
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ]);
        console.log('Permission granted:', granted);
      } catch (err) {
        console.warn(err);
      }
    } else {
      // iOS에서는 권한 요청 후 설정 열기 안내
      Alert.alert(
        "권한 필요",
        "카메라 및 저장소 권한이 필요합니다. 설정에서 권한을 활성화하세요.",
        [
          { text: "취소", style: "cancel" },
          { text: "설정 열기", onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const fetchForms = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      if (!userObj || !userObj.token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.replace('Login');
        return;
      }

      const response = await fetch(API.forms, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userObj.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        const activeForms = (data.forms || [])
          .filter(f => f.isActive !== false)
          .map(f => ({
            ...f,
            fields: Array.isArray(f.fields) ? f.fields : [],
            fieldOptions: f.fieldOptions || {},
          }));
        setForms(activeForms);
      } else {
        Alert.alert('오류', data.error || '양식 목록을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Fetch forms error:', error);
      Alert.alert('오류', '양식 목록을 불러오지 못했습니다\n' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForm = form => {
    setSelectedForm(form);
    const initialData = {};
    const today = new Date().toISOString().split('T')[0];
    
    const fields = Array.isArray(form.fields) ? form.fields : [];
    fields.forEach(field => {
      const fieldLower = String(field).toLowerCase();
      if (fieldLower.includes('일자') || 
          fieldLower.includes('날짜') || 
          fieldLower.includes('공사일') ||
          fieldLower.includes('date')) {
        initialData[field] = today;
      } else {
        initialData[field] = '';
      }
    });
    setFormData(initialData);
    setImages([]);
    setSelectedImageIndex(null);
    setRotation(0);
    setValidationErrors({});
  };

  const validateForm = () => {
    if (!selectedForm) return false;
    
    const errors = {};
    selectedForm.fields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors[field] = true;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const takePicture = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
    };

    launchCamera(options, response => {
      if (!response.didCancel && !response.errorCode && response.assets?.[0]) {
        const newImages = [...images, response.assets[0]];
        setImages(newImages);
        setSelectedImageIndex(newImages.length - 1);
        setRotation(0);
      }
    });
  };

  const pickImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 10,
    };

    launchImageLibrary(options, response => {
      if (!response.didCancel && !response.errorCode && response.assets) {
        const newImages = [...images, ...response.assets];
        setImages(newImages);
        setSelectedImageIndex(images.length);
        setRotation(0);
      }
    });
  };

  const rotateImage = () => {
    setRotation((rotation + 90) % 360);
  };

  const removeImage = index => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (selectedImageIndex === index) {
      setSelectedImageIndex(newImages.length > 0 ? 0 : null);
      setRotation(0);
    } else if (selectedImageIndex > index) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '정말 로그아웃하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '확인',
        onPress: async () => {
          await AsyncStorage.clear();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const saveToPhone = async () => {
    if (!selectedForm) {
      Alert.alert('오류', '양식을 선택해주세요');
      return;
    }

    if (images.length === 0) {
      Alert.alert('오류', '사진을 추가해주세요');
      return;
    }

    if (!validateForm()) {
      Alert.alert('입력 오류', '모든 필수 항목을 입력해주세요 (빨간색 표시된 항목)');
      return;
    }

    setSaving(true);
    try {
      for (let i = 0; i < images.length; i++) {
        setSelectedImageIndex(i);
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!canvasRef.current) throw new Error('캔버스 참조를 찾을 수 없습니다');
        const uri = await canvasRef.current.capture();
        const fileName = `합성이미지_${i+1}_${Date.now()}.jpg`;
        const destPath = Platform.OS === 'android'
          ? `${RNFS.ExternalStorageDirectoryPath}/DCIM/Camera/${fileName}`
          : `${RNFS.PicturesDirectoryPath}/${fileName}`;
        const destDir = Platform.OS === 'android'
          ? `${RNFS.ExternalStorageDirectoryPath}/DCIM/Camera`
          : RNFS.PicturesDirectoryPath;
        const dirExists = await RNFS.exists(destDir);
        if (!dirExists) await RNFS.mkdir(destDir);
        await RNFS.copyFile(uri, destPath);
        if (Platform.OS === 'android') await RNFS.scanFile(destPath);
      }
      Alert.alert('성공', `모든 합성 이미지가 저장되었습니다 (사진앨범)`);
    } catch (error) {
      console.error('❌ Save error:', error);
      Alert.alert('오류', '이미지 저장에 실패했습니다\n\n' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedForm) {
      Alert.alert('오류', '양식을 선택해주세요');
      return;
    }

    if (images.length === 0) {
      Alert.alert('오류', '사진을 추가해주세요');
      return;
    }

    if (!validateForm()) {
      Alert.alert('입력 오류', '모든 필수 항목을 입력해주세요 (빨간색 표시된 항목)');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const userData = await AsyncStorage.getItem('user');
      const userObj = userData ? JSON.parse(userData) : null;
      if (!userObj || !userObj.token) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.replace('Login');
        return;
      }
      let uploadCount = 0;
      for (let i = 0; i < images.length; i++) {
        setSelectedImageIndex(i);
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!canvasRef.current) continue;
        const compositeUri = await canvasRef.current.capture();
        const base64Image = await RNFS.readFile(compositeUri, 'base64');
        const fileNameParts = selectedForm.folderStructure || [];
        let fileName = fileNameParts
          .map(field => formData[field] || field)
          .filter(Boolean)
          .join('_');
        if (!fileName) {
          fileName = `${selectedForm.formName}_${i + 1}`;
        }
        fileName += `_${Date.now()}.jpg`;
        const uploadData = {
          thumbnails: `data:image/jpeg;base64,${base64Image}`,
          filename: fileName,
          formId: selectedForm._id,
          formName: selectedForm.formName,
          imageCount: images.length,
          fieldData: formData
        };
        const response = await fetch(API.uploadPhoto, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${userObj.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(uploadData),
        });
        const data = await response.json();
        if (data.success) {
          uploadCount++;

        }
        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }
        if (uploadCount > 0) {
            const resdb = await fetch(API.uploads, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${userObj.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(uploadData),
          });
          const datadb = await resdb.json();
          if (datadb.success) {          
          Alert.alert('성공DB', `${uploadCount}개의 사진이${datadb} 업로드되었습니다`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('오류', '업로드 중 오류가 발생했습니다\n' + error.message);
    } finally {
      setUploading(false);
    }

       
  
   


  const handleKakaoShare = async () => {
    if (!selectedImage) return;
    if (!canvasRef.current) return;
    try {
      const uri = await canvasRef.current.capture();
      await Share.open({
        url: uri,
        title: '카카오톡으로 공유',
        message: '합성 이미지를 카카오톡으로 공유합니다.',
        social: Share.Social.KAKAO,
      });
    } catch (e) {
      Alert.alert('공유 오류', e.message);
    }
  };

  // 캔버스/이미지/표 오버레이 동적 스타일 계산
  // 회전 각도에 따라 캔버스 크기만 동적으로 계산, 표는 항상 원래 비율 유지
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = getCanvasDims(rotation);
  // 표 비율: 항상 CANVAS_WIDTH 기준으로 계산 (회전 무관)
  const MIN_TABLE_WIDTH = CANVAS_WIDTH * canvasConfig.table.widthRatio;
  const MAX_TABLE_WIDTH = CANVAS_WIDTH * 0.95;
  const col1Width = CANVAS_WIDTH * canvasConfig.table.col1Ratio * (2/3);
  // 항목명만 우선 표시, 모든 필드에 대해 행 생성
  const entries = (selectedForm?.fields || []).map(field => ({ field }));
  // 폰트 사이즈: config.font에서 px 추출
  const fontPx = parseInt((canvasConfig.table.font.match(/(\d+)px/)||[])[1]||'16', 10);
  const fontSize = Math.max(10, Math.floor(CANVAS_WIDTH * fontPx / canvasConfig.width));
  // 두 번째 열 텍스트 길이 대략 계산 (React Native는 measureText 없음)
  // 한글 기준 최소 너비 계산 (5글자 기준)
  const minCol1Width = fontSize * 5 * 1.1; // 5글자 기준
  const minCol2Width = fontSize * 7 * 1.1; // 7글자 기준으로 좁게
  // 기존 col1Width, col2Width 계산 (항목값의 최대 글자수 기준)
  let maxCol2TextWidth = entries.reduce((max, entry) => {
    const value = formData[entry.field] || '';
    return Math.max(max, value.length * fontSize * 0.6);
  }, 0);
  let requiredCol1Width = Math.max(col1Width, minCol1Width);
  // 2열 너비: 최대 텍스트 길이 + cellPaddingX*2 + 4px(여유)
  // 2열 너비: 최대 텍스트 길이 + cellPaddingX*2 + 8px(여유)
  // 2열 너비: 최대 텍스트 길이 + cellPaddingX*2 + 12px(여유)
  let requiredCol2Width = Math.max(maxCol2TextWidth + cellPaddingX * 2 + 12, minCol2Width);
  let requiredTableWidth = requiredCol1Width + requiredCol2Width;
  let tableWidth = Math.min(Math.max(MIN_TABLE_WIDTH, requiredTableWidth), MAX_TABLE_WIDTH);
  let col1FinalWidth = requiredCol1Width;
  let col2FinalWidth = tableWidth - col1FinalWidth;
  // 행 높이: 기본값 사용
  const rowHeight = fontSize * 2.2;
  // 표 전체 높이: 항목 개수 × 행 높이
  const tableHeight = entries.length * rowHeight;

  if (loading || !user) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#3b82f6" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.companyName}>{user?.companyName || '회사명'}</Text>
            <Text style={styles.userName}>
              {user?.name || '사용자'} {user?.username ? `(${user.username})` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutButton}>로그아웃</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.menuContainer}>
          <NavigationMenu navigation={navigation} activeScreen="Upload" />
        </View>
      </View>
      <ScrollView style={styles.content}>
        {/* 1. 양식 선택 */}
        <Text style={styles.sectionTitle}>1. 양식 선택</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{minHeight: 56, maxHeight: 72}}>
          {forms.map(form => (
            <TouchableOpacity
              key={form._id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 10,
                paddingHorizontal: 18,
                marginRight: 10,
                borderWidth: 1,
                borderColor: selectedForm?._id === form._id ? '#2563eb' : '#d1d5db',
                borderRadius: 16,
                backgroundColor: selectedForm?._id === form._id ? '#e0e7ff' : '#fff',
                elevation: selectedForm?._id === form._id ? 2 : 0,
              }}
              onPress={() => handleSelectForm(form)}>
              <Text style={{
                fontSize: 15,
                color: selectedForm?._id === form._id ? '#2563eb' : '#222',
                fontWeight: selectedForm?._id === form._id ? 'bold' : 'normal',
              }}>{form.formName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* 2. 정보 입력 */}
        {selectedForm && (
          <View>
            {/* 정보입력 표 - 위쪽 */}
            <View style={{marginBottom: 16}}>
              <Text style={styles.sectionTitle}>2. 정보 입력</Text>
              <View style={{borderWidth:1,borderColor:'#d1d5db',borderRadius:8,overflow:'hidden',marginBottom:12}}>
                {(selectedForm.fields || []).map(field => {
                  const isDateField = ['일자','날짜','공사일','date'].some(k=>field.toLowerCase().includes(k));
                  const options = selectedForm.fieldOptions?.[field] && selectedForm.fieldOptions[field].length > 0
                    ? selectedForm.fieldOptions[field]
                    : null;
                  return (
                    <View key={field} style={{flexDirection:'row',alignItems:'center',borderBottomWidth:1,borderBottomColor:'#eee',backgroundColor:'#fff'}}>
                      <Text style={{width:'16.66%',textAlign:'left',padding:8,fontWeight:'bold',color:'#222',fontSize:14}}>{field}</Text>
                      <View style={{flex:1,marginLeft:'0%'}}>
                        {isDateField ? (
                          <>
                            <TouchableOpacity
                              style={{padding:8,backgroundColor:'#f9fafb',borderRadius:6,borderWidth:validationErrors[field]?2:1,borderColor:validationErrors[field]?'#ef4444':'#d1d5db',margin:4,justifyContent:'flex-start',alignItems:'flex-start'}}
                              onPress={()=>setDatePickerField(field)}>
                              <Text style={{fontSize:14,color:'#222',textAlign:'left'}}>{formData[field]||'날짜 선택'}</Text>
                            </TouchableOpacity>
                            {datePickerField===field && (
                              <DateTimePicker
                                value={formData[field]?new Date(formData[field]):new Date()}
                                mode="date"
                                display="default"
                                onChange={(event,date)=>{
                                  setDatePickerField(null);
                                  if(date){
                                    const iso = date.toISOString().split('T')[0];
                                    setFormData({...formData,[field]:iso});
                                    setValidationErrors({...validationErrors,[field]:false});
                                  }
                                }}
                              />
                            )}
                          </>
                        ) : options ? (
                          <ScrollView horizontal style={{padding:4}} showsHorizontalScrollIndicator={false}>
                            {options.map(option => (
                              <TouchableOpacity
                                key={option}
                                style={{paddingHorizontal:10,paddingVertical:6,borderRadius:6,backgroundColor:formData[field]===option?'#3b82f6':'#f3f4f6',marginRight:6,alignItems:'flex-start'}}
                                onPress={()=>{
                                  setFormData({...formData,[field]:option});
                                  setValidationErrors({...validationErrors,[field]:false});
                                }}>
                                <Text style={{color:formData[field]===option?'#fff':'#222',fontWeight:'bold',textAlign:'left'}}>{option === '' ? '값 없음' : option}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        ) : (
                          <TextInput
                            style={{padding:8,fontSize:14,color:'#222',backgroundColor:'#f9fafb',borderRadius:6,borderWidth:validationErrors[field]?2:1,borderColor:validationErrors[field]?'#ef4444':'#d1d5db',margin:4,textAlign:'left'}}
                            value={formData[field]}
                            onChangeText={text=>{
                              // 위치 입력값 자동 변환: "숫자-숫자" => "숫자동-숫자호"
                              let newText = text;
                              if (/^\d{1,3}-\d{1,4}$/.test(text) && (field.includes('위치') || field.includes('호') || field.includes('동'))) {
                                const [dong, ho] = text.split('-');
                                newText = `${dong}동-${ho}호`;
                              }
                              setFormData({...formData,[field]:newText});
                              setValidationErrors({...validationErrors,[field]:false});
                            }}
                            placeholder={field}
                            placeholderTextColor="#9ca3af"
                          />
                        )}
                        {validationErrors[field] && <Text style={{color:'#ef4444',fontSize:12,paddingRight:8}}>(필수)</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
            {/* 미리보기(캔버스/표 오버레이) - 정보입력 바로 아래로 이동 */}
            {selectedImage && (
              <ImageComposer
                ref={canvasRef}
                selectedImage={selectedImage}
                rotation={rotation}
                canvasDims={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
                tableOverlay={
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: tableWidth,
                      height: tableHeight,
                      backgroundColor: canvasConfig.table.backgroundColor,
                      borderColor: canvasConfig.table.borderColor,
                      borderWidth: canvasConfig.table.borderWidth,
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Table rows and columns */}
                    {entries.map((entry, index) => (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          borderBottomWidth: index < entries.length - 1 ? 1 : 0,
                          borderBottomColor: canvasConfig.table.borderColor,
                        }}
                      >
                        <Text
                          style={{
                            width: col1FinalWidth,
                            paddingHorizontal: cellPaddingX,
                            paddingVertical: cellPaddingY,
                            fontSize: fontSize,
                            color: canvasConfig.table.textColor,
                            fontWeight: 'bold',
                            divider: 'right',
                            borderRightWidth: 1,
                            borderRightColor: canvasConfig.table.borderColor
                          }}
                        >
                          {entry.field}
                        </Text>
                        <Text
                          style={{
                            width: col2FinalWidth,
                            paddingHorizontal: cellPaddingX,
                            paddingVertical: cellPaddingY,
                            fontSize: fontSize,
                            color: canvasConfig.table.textColor,
                          }}
                        >
                          {formData[entry.field] || ''}
                        </Text>
                      </View>
                    ))}
                    {/* Add a vertical divider between column 1 and column 2 */}
                    <View
                      style={{
                        width: 1,
                        backgroundColor: canvasConfig.table.borderColor,
                      }}
                    />
                  </View>
                }
              />
            )}
            {/* 사진촬영/버튼/썸네일 - 미리보기 아래로 이동 */}
            <View>
              <Text style={styles.sectionTitle}>3. 사진 촬영</Text>
              {/* 업로드 진행 바를 버튼 위에 위치 */}
              {uploading && (
                <View style={{
                  position: 'absolute',
                  top: 16, // Adjusted to avoid overlapping with other elements
                  left: 16,
                  right: 16,
                  padding: 8,
                  backgroundColor: '#ffffff', // Added background for better visibility
                  borderRadius: 8,
                  elevation: 4, // Shadow for better distinction
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 14, color: '#111827', marginBottom: 4 }}>
                    {uploadProgress}% 전송 중...
                  </Text>
                  <View style={{
                    width: '100%',
                    height: 8,
                    backgroundColor: '#e5e7eb',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    <View style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: '#2563eb',
                    }} />
                  </View>
                </View>
              )}
              <View style={styles.compactButtonRow}>
                <TouchableOpacity style={styles.compactButton} onPress={takePicture}>
                  <Text style={styles.compactButtonText}>📷</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.compactButton} onPress={pickImage}>
                  <Text style={styles.compactButtonText}>🖼️</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.compactButton, (!selectedImage || saving) && styles.buttonDisabled]} 
                  onPress={saveToPhone}
                  disabled={!selectedImage || saving}>
                  <Text style={styles.compactButtonText}>💾 저장</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.compactButton, styles.uploadBtn, (images.length === 0 || uploading) && styles.buttonDisabled]} 
                  onPress={handleUpload}
                  disabled={images.length === 0 || uploading}>
                  <Text style={styles.compactButtonText}>☁️ 전송 {images.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.compactButton, styles.kakaoBtn]} 
                  onPress={handleKakaoShare}
                  disabled={!selectedImage}
                >
                  <Text style={styles.compactButtonText}>카카오톡 공유</Text>
                </TouchableOpacity>
              </View>
              {images.length > 0 && (
                <ScrollView horizontal style={styles.thumbnailScroll} showsHorizontalScrollIndicator={false}>
                  {images.map((img, index) => (
                    <View key={index} style={{position: 'relative'}}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImageIndex(index);
                          setRotation(0);
                        }}
                        style={[styles.thumbnail, selectedImageIndex === index && styles.thumbnailSelected]}>
                        <Image source={{uri: img.uri}} style={styles.thumbnailImage} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.thumbnailRemove}
                        onPress={() => removeImage(index)}>
                        <Text style={styles.thumbnailRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      {/* 토큰값 하단 표시 */}
      <View style={{width: '100%', padding: 12, marginTop: 24, alignItems: 'center'}}>
        <Text style={{fontSize: 12, color: '#444', backgroundColor: '#f3f4f6', padding: 8, borderRadius: 8}}>
          토큰: {user?.token || '없음'}
        </Text>
      </View>
    </View>
  );
};
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: StatusBar.currentHeight,
    paddingBottom: 8,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userName: {
    fontSize: 14,
    color: '#e0e7ff',
  },
  logoutButton: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  menuContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  menuTextActive: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  menuText: {
    fontSize: 16,
    color: '#e0e7ff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  formList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formButton: {
    flexBasis: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  formButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  formButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    textAlign: 'center',
  },
  formButtonTextActive: {
    color: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  canvasContainer: {
    // borderRadius: 8, // 둥근 모서리 제거
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#fff',
  },
  canvas: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotateButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  rotateButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  compactButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  compactButton: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  compactButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  buttonDisabled: {
    backgroundColor: '#d1d5db',
  },
  uploadBtn: {
    backgroundColor: '#2563eb',
  },
  kakaoBtn: {
    backgroundColor: '#f9e84e',
  },
  progressContainer: {
    position: 'absolute',
    top: 16, // Adjusted to avoid overlapping with other elements
    left: 16,
    right: 16,
    padding: 8,
    backgroundColor: '#ffffff', // Added background for better visibility
    borderRadius: 8,
    elevation: 4, // Shadow for better distinction
    alignItems: 'center',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  thumbnailScroll: {
    marginTop: 8,
    marginBottom: 16,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  thumbnailSelected: {
    borderColor: '#3b82f6',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  thumbnailRemoveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadScreen;
