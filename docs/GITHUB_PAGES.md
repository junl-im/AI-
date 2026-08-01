# GitHub Pages 배포

현재 저장소: `junl-im/AI-`

Pages URL: `https://junl-im.github.io/AI-/`

## 배포 구조

GitHub Pages는 `dist`의 정적 Web/PWA만 제공한다. FastAPI와 CosyVoice Worker를 Pages에서
실행할 수 없으므로 공개 HTTPS Voice API를 별도 서버에 배포한다.

```text
GitHub Pages Web → HTTPS FastAPI → private CosyVoice Worker
```

## 최초 1회 GitHub 설정

1. 저장소 `Settings → Pages`에서 Source를 `GitHub Actions`로 선택한다.
2. `Settings → Secrets and variables → Actions → Variables`를 연다.
3. 다음 Repository Variable을 만든다.

```text
Name: SORION_PUBLIC_API_BASE_URL
Value: https://voice-api.example.com
```

4. FastAPI의 `SORION_CORS_ORIGINS`에 `https://junl-im.github.io`를 포함한다.
5. `main`에 push해 Web·API·Worker quality와 Pages deploy를 확인한다.

이 설정은 운영자가 한 번 수행하며 앱 사용자에게 API 주소를 묻지 않는다.

## Workflow 동작

- PR: lint, typecheck, test, build, API·Worker 검사
- main push: 같은 검사 후 Pages artifact와 deploy
- build 환경:
  - `VITE_BASE_PATH=/${repository-name}/`
  - `VITE_API_BASE_URL=${{ vars.SORION_PUBLIC_API_BASE_URL }}`
- 공개 API 변수가 비어 있으면 Actions warning을 남기고 Web은 잘못된 Pages API를 탐색하지 않음

## 정상 확인

브라우저 Network에서 다음을 확인한다.

```text
https://voice-api.example.com/api/v1/health
https://voice-api.example.com/api/v1/connectivity
```

다음 요청은 발생하면 안 된다.

```text
https://junl-im.github.io/api/v1/*
https://junl-im.github.io:8443/api/v1/*
```

## PWA 아이콘과 캐시

- `public/sorion-icon.svg`: Web 브랜드 원본
- `favicon-64.png`: 브라우저 favicon fallback
- `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`: 설치 아이콘
- 아이콘·manifest 변경 후 이전 화면이 남으면 Site data와 설치 PWA를 제거한 뒤 다시 설치

## 공개 API가 없는 경우

Web은 소개·원고 편집·로컬 세션 저장까지 동작하지만 실제 음성 생성은 할 수 없다.
화면은 raw 후보 URL을 나열하지 않고 “공개 음성 서버 배포 대기” 상태를 표시하며 자동 재검사한다.
이 상태를 실제 엔진 준비로 표시해서는 안 된다.
