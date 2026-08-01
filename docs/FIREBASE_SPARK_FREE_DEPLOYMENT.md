# Firebase Spark 무료 배포

현재 기준 버전: `0.9.2`

## 가능한 범위

Firebase Hosting Spark에는 React/Vite 정적 Web과 PWA 파일만 올린다. `firebase.json`은
`hosting` 설정만 가지며 Functions, App Hosting, Cloud Run 연결을 사용하지 않는다.

```bash
npm install
npm run build
firebase deploy --only hosting
```

Firebase 환경변수는 로그인과 프로젝트 동기화에만 사용한다. 음성 모델과 Python API를 Firebase에
올리지 않는다.

## 음성 실행 구조

```text
Firebase Hosting / GitHub Pages
  ├─ 모바일: Browser Speech 자동 재생
  └─ 데스크톱: localhost 무료 런타임 자동 탐색
                   └─ FastAPI → CosyVoice / Melo / System Voice
```

로컬 개발은 다음 한 명령으로 Web과 API를 함께 시작한다.

```bash
npm run dev:free
```

Windows에서는 `start-sorion-free.cmd`를 실행할 수 있다. CosyVoice 모델 경로가 준비돼 있으면
`--worker` 옵션으로 Worker도 함께 시작한다.

```bat
start-sorion-free.cmd --worker
```

## 자동 연결 확인

정적 Web의 Network 탭에서 호스트 자체 `/api/v1/health` 요청이 반복되면 안 된다. 데스크톱에서는
로컬 런타임이 켜져 있을 때 다음 주소가 자동으로 선택된다.

```text
http://127.0.0.1:8000/api/v1/health
```

모바일에서는 localhost를 시도하지 않고 브라우저 내장 한국어 음성을 사용한다.
