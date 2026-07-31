# API CONNECTIVITY

## 핵심 결론

GitHub Pages에는 Python API가 포함되지 않는다. Pages는 React 빌드 결과만 제공하고,
FastAPI, MeloTTS, 시스템 음성, CosyVoice Worker는 별도 프로세스나 서버에서 실행해야 한다.

0.6.1까지는 공개 Pages가 `/api/v1`을 같은 사이트에서 찾다가 실패한 뒤 Demo WAV로
조용히 전환될 수 있었다. 0.6.2부터는 공개 정적 배포에서 API 주소가 없으면
`API 미설정`으로 명확히 표시하며 잘못된 GitHub Pages API 호출을 하지 않는다.

## 로컬 PC 실행

프로젝트 루트에서 웹과 API를 각각 실행한다.

```bash
npm install
npm run dev:api
```

다른 터미널에서:

```bash
npm run dev
```

로컬 Vite는 `/api` 요청을 `http://localhost:8000`으로 프록시하므로 별도
`VITE_API_BASE_URL`이 필요하지 않다.

확인 주소:

```text
http://127.0.0.1:8000/api/v1/health
http://127.0.0.1:8000/api/v1/connectivity
http://127.0.0.1:8000/api/v1/engines
http://127.0.0.1:8000/api/v1/voice-clones/capabilities
```

## GitHub Pages에서 PC 로컬 API 연결

설정의 Voice API 주소에 다음을 입력한다.

```text
http://127.0.0.1:8000
```

이 방식은 같은 PC의 브라우저에서만 의미가 있다. 브라우저와 API가 같은 기기에서
실행되어야 한다.

## 휴대폰 연결

휴대폰에서 `127.0.0.1`과 `localhost`는 PC가 아니라 휴대폰 자신을 뜻한다.
개발 중 같은 Wi-Fi에서 연결하려면 API를 `0.0.0.0:8000`으로 실행하고 PC의 LAN IP를
입력해야 한다.

```text
http://192.168.x.x:8000
```

공개 HTTPS 웹앱에서 로컬 HTTP API를 호출하는 방식은 브라우저의 로컬 네트워크 접근,
혼합 콘텐츠, 방화벽 정책에 따라 차단될 수 있다. 실제 모바일 서비스는 공개 HTTPS
FastAPI 게이트웨이를 사용한다.

## 0.6.2 통합 점검

설정 화면의 `전체 연결 검사`는 다음 경로를 각각 확인한다.

1. `/api/v1/health`
2. `/api/v1/setup`
3. `/api/v1/engines`
4. `/api/v1/voice-clones/capabilities`
5. `/api/v1/connectivity`

결과에는 경로별 성공 여부, 응답 시간, 실제 TTS 준비 상태, CosyVoice Worker 상태,
임시 음원 폴더와 CORS 허용 Origin이 표시된다.

## 엔진 상태 해석

- `AI ENGINE`: 실제 AI TTS 패키지와 실행 조건이 준비됨
- `LOCAL TTS`: 운영체제 한국어 음성 도구가 준비됨
- `DEMO`: Mock 계약 또는 브라우저 테스트 WAV
- `API 미설정`: 정적 웹만 배포되고 FastAPI 주소가 없음
- `연결 실패`: 주소는 있지만 서버, CORS, 방화벽 또는 HTTPS 조건이 맞지 않음
- `Worker 준비 필요`: FastAPI는 연결됐지만 CosyVoice 모델 Worker가 없음

## CORS 기본값

0.6.2의 기본 허용 Origin은 다음과 같다.

```text
http://localhost:5173
http://127.0.0.1:5173
https://junl-im.github.io
```

다른 도메인에 배포하면 `SORION_CORS_ORIGINS`에 정확한 Origin을 추가한다.

## CosyVoice Worker

`SORION_COSYVOICE_WORKER_URL`을 설정하면 FastAPI가 Worker의 `/health`를 실제로
확인한다. URL 문자열만 존재한다고 준비 완료로 표시하지 않는다.

```env
SORION_COSYVOICE_WORKER_URL=http://127.0.0.1:9000
SORION_COSYVOICE_WORKER_TIMEOUT_SECONDS=2.5
```

0.6.2는 Worker health 연결까지만 검증한다. 실제 스트리밍 생성과 제로샷 복제 실행은
0.7.0에서 추가한다.
