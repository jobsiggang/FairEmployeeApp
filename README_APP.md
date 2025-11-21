# 📱 현장사진 업로드 - 직원 앱 (React Native CLI)

React Native CLI로 개발된 직원용 네이티브 모바일 앱입니다.

## 🎯 주요 기능

- 📱 **직원 로그인**: 아이디/비밀번호 인증
- 📸 **사진 촬영**: 네이티브 카메라로 현장 사진 촬영
- 🖼️ **갤러리 선택**: 기존 사진 선택 (다중 선택 가능)
- 📝 **양식 입력**: 동적 양식 필드 및 옵션 선택
- ☁️ **자동 업로드**: 서버로 사진 및 데이터 전송
- 📋 **전송 기록**: 업로드 내역 조회 (썸네일 포함)
- 🔄 **당겨서 새로고침**: Pull to refresh

## 🚀 시작하기

### 1. 의존성 설치

```bash
cd FairEmployeeApp
npm install
```

### 2. Android 설정

#### AndroidManifest.xml 권한 추가

`android/app/src/main/AndroidManifest.xml` 파일에 추가:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    
    <!-- 기존 application 태그... -->
</manifest>
```

#### build.gradle 설정

`android/app/build.gradle` 확인:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 34
    }
}
```

### 3. iOS 설정 (macOS만 가능)

#### Podfile 권한 추가

`ios/FairEmployeeApp/Info.plist`에 추가:

```xml
<key>NSCameraUsageDescription</key>
<string>현장 사진을 촬영하기 위해 카메라 권한이 필요합니다</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>사진을 선택하기 위해 갤러리 접근 권한이 필요합니다</string>
```

#### Pod 설치

```bash
cd ios
pod install
cd ..
```

### 4. 개발 서버 실행

#### Metro 서버 시작

```bash
npm start
```

#### Android 실행

```bash
npm run android
```

또는

```bash
npx react-native run-android
```

#### iOS 실행 (macOS)

```bash
npm run ios
```

### 5. API 서버 설정

`src/config/api.js` 파일에서 백엔드 서버 URL 확인:

```javascript
const API_BASE_URL = 'https://fairworks.vercel.app';
```

로컬 개발 시:

```javascript
const API_BASE_URL = 'http://10.0.2.2:3000'; // Android 에뮬레이터
// const API_BASE_URL = 'http://localhost:3000'; // iOS
```

## 📦 프로젝트 구조

```
FairEmployeeApp/
├── src/
│   ├── config/
│   │   └── api.js           # API 엔드포인트
│   └── screens/
│       ├── LoginScreen.js   # 로그인 화면
│       ├── MainScreen.js    # 메인 메뉴
│       ├── UploadScreen.js  # 사진 업로드
│       └── HistoryScreen.js # 전송 기록
├── android/                 # Android 네이티브 코드
├── ios/                     # iOS 네이티브 코드
└── App.tsx                  # 네비게이션 설정
```

## 🔧 주요 라이브러리

- **@react-navigation/native**: 화면 네비게이션
- **@react-navigation/stack**: 스택 네비게이터
- **react-native-image-picker**: 카메라/갤러리
- **@react-native-async-storage/async-storage**: 로컬 저장소
- **axios**: HTTP 클라이언트
- **react-native-gesture-handler**: 제스처 처리
- **react-native-reanimated**: 애니메이션

## 📱 APK 빌드 (Android)

### Debug APK

```bash
cd android
./gradlew assembleDebug
```

APK 위치: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK

1. **키스토어 생성**:

```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore fair-upload-key.keystore -alias fair-upload-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **gradle.properties 설정**:

`android/gradle.properties`에 추가:

```properties
MYAPP_UPLOAD_STORE_FILE=fair-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=fair-upload-key
MYAPP_UPLOAD_STORE_PASSWORD=비밀번호
MYAPP_UPLOAD_KEY_PASSWORD=비밀번호
```

3. **build.gradle 설정**:

`android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

4. **빌드**:

```bash
cd android
./gradlew assembleRelease
```

APK 위치: `android/app/build/outputs/apk/release/app-release.apk`

## 🌐 백엔드 연동

이 앱은 기존 Next.js 백엔드와 연동됩니다:

- **로그인**: `/api/login`
- **양식 조회**: `/api/fetchSheet`
- **사진 업로드**: `/api/uploadPhoto`
- **전송 기록**: `/api/uploads`

## 🛠️ 개발 가이드

### Android 에뮬레이터 사용

1. Android Studio 설치
2. AVD Manager에서 에뮬레이터 생성
3. 에뮬레이터 실행 후 `npm run android`

### 실제 기기 테스트 (Android)

1. USB 디버깅 활성화
2. 기기 연결
3. `adb devices` 로 연결 확인
4. `npm run android` 실행

### 로그 확인

```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

### 문제 해결

#### Metro 서버 재시작

```bash
npx react-native start --reset-cache
```

#### Android 빌드 캐시 삭제

```bash
cd android
./gradlew clean
cd ..
```

#### node_modules 재설치

```bash
rm -rf node_modules
npm install
```

## 📄 라이선스

MIT

## 🤝 기여

Pull Request를 환영합니다!
