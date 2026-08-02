# Firebase Spark 무료 배포

현재 기준 버전: `0.9.3-beta.3 CI Hardening 6`

## 연결 상태

- Firebase 프로젝트: `device-streaming-96b2272c`
- `.firebaserc` 기본 프로젝트 연결 완료
- Google 로그인용 Firebase Web 공개 설정 등록 완료
- 개발 빌드: `.env.development`
- production 빌드와 GitHub Pages: `.env.production`
- Firestore·Storage: 현재 미사용이므로 deny-by-default 규칙 적용

Firebase Web API key와 app id는 브라우저 번들에 포함되는 공개 식별값입니다. Admin SDK private key,
service account JSON, Worker token과 사용자 음원은 저장소에 넣지 않습니다.

## 공개 Web 환경 변수

```env
VITE_FIREBASE_API_KEY=AIzaSyDAwQhnPTFQJCRuPbIrntrR9Eo4d2hWnj4
VITE_FIREBASE_AUTH_DOMAIN=device-streaming-96b2272c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=device-streaming-96b2272c
VITE_FIREBASE_STORAGE_BUCKET=device-streaming-96b2272c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=443705861764
VITE_FIREBASE_APP_ID=1:443705861764:web:6b40c902871dfbc7d184d1
```

`vite build`는 `.env.production`을 자동으로 읽으므로 GitHub Actions에서 별도 secret 등록 없이 동일한
공개 Web 설정을 사용합니다. 저장소 Variables로 덮어쓰는 구조가 필요해질 때만 별도 전환합니다.

## 보안 규칙

`firestore.rules`와 `storage.rules`는 Console에 붙여넣을 deny-by-default 기준본입니다. 현재 SoriON은 Firebase
Authentication만 사용하며 `firebase.json`은 Spark 정적 hosting 전용으로 유지합니다. Firestore 또는 Storage 기능을 실제로 추가할 때 데이터 모델과 테스트를
먼저 만든 뒤 사용자별 최소 권한 규칙으로 변경합니다.

## 배포 범위

Firebase Hosting Spark 또는 GitHub Pages에는 React/Vite 정적 Web과 PWA 파일만 올립니다. Python API,
CosyVoice Worker, 모델 파일과 사용자 음원은 Firebase에 배포하지 않습니다.

```bash
npm run quality:firebase
npm run quality:pwa-assets
npm run build
firebase deploy --only hosting
```

Firebase Console의 Authentication에서 Google 공급자를 활성화하고 실제 배포 도메인과 로컬 테스트용
`localhost`를 Authorized domains에 등록해야 로그인 redirect가 완료됩니다. Firestore·Storage 규칙은 각 Console Rules 탭에서 게시합니다.
