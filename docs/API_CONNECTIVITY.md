# API CONNECTIVITY

현재 기준 버전: `0.9.0`

## 배포 경계

```text
GitHub Pages / Mobile PWA
        │ HTTPS
Public FastAPI Gateway
        │ private HMAC
CosyVoice Worker / GPU
```

GitHub Pages에는 Python API가 포함되지 않는다. 정적 Web과 Voice API는 별도 배포물이며,
사용자에게 주소 입력 UI를 제공하지 않고 운영 배포 설정으로 자동 연결한다. 로컬 API는 `npm run dev:api`로 실행한다.

## 공개 배포 설정

GitHub 저장소의 Actions Variable을 설정한다.

```text
SORION_PUBLIC_API_BASE_URLS=https://voice-api-a.example.com,https://voice-api-b.example.com
```

Workflow가 복수 값을 런타임 JSON과 Web build의 `VITE_API_BASE_URLS`로 주입한다.
단일 주소만 운영할 때는 호환 변수 `SORION_PUBLIC_API_BASE_URL`도 사용할 수 있다. 값은
`/api/v1`이 없어도 정규화된다. 브라우저에는 공개 API Origin만 들어가며 Worker Secret은
절대 넣지 않는다.


## 브라우저 음성 안전망

공개 API가 설정되지 않았거나 timeout·CORS·offline·mixed-content 오류가 발생해도 Web Speech API를
지원하는 브라우저에서는 `browser-speech` 엔진을 즉시 준비한다. 이 엔진은 문장 블록과 Player
Queue에서 실제 한국어 음성을 재생하지만 파일 URL을 만들지 않는다. 따라서 다운로드·seek·복제는
비활성화한다. 실제 API 엔진이 준비되면 브라우저 엔진은 자동 추천 우선순위를 가로채지 않는다.

## 자동 탐색 순서

1. 런타임 JSON과 빌드에 주입된 복수 공개 HTTPS API
2. 마지막 성공 주소와 최근 정상 주소
3. GitHub Pages가 아닌 same-origin `/api/v1`
4. localhost 개발 후보 또는 HTTP LAN Web의 현재 호스트 `:8000`
5. 자체 운영 HTTPS Web의 `:8443` 후보

현재 연결 주소가 health 검사에 실패하면 해당 주소를 이번 탐색에서 제외하고 다음 정상 후보를
즉시 승계한다. 저장된 과거 주소 하나에 고정되어 무한 재시도하지 않는다.

`*.github.io`는 정적 호스트이므로 same-origin과 `:8443` 후보를 모두 만들지 않는다.
따라서 `https://junl-im.github.io/api/v1`과 `https://junl-im.github.io:8443/api/v1`을
Voice API로 호출하지 않는다.

## 재연결

연결 실패 시 주소 입력창을 열지 않는다. online 이벤트, 네트워크 변경, 앱 포그라운드 복귀와
5초 → 12초 → 30초 → 60초 backoff에서 단일 탐색을 재실행한다. 장문 제작 버튼을 이미 누른
상태라면 타임라인을 보존하고 서버가 준비되는 즉시 같은 원고 생성을 이어서 시작한다.

## 상태 구분

| 상태 | 의미 |
|---|---|
| unconfigured | 공개 API 배포 주소가 빌드에 없음 |
| offline | 기기 네트워크가 끊김 |
| mobile-localhost | 휴대폰에서 PC 대신 휴대폰 자신을 가리키는 후보 |
| mixed-content | HTTPS Web에서 HTTP API가 브라우저에 차단됨 |
| timeout | 후보 서버 응답 시간 초과 |
| cors-or-network | CORS, 방화벽, DNS 또는 서버 접근 실패 |
| degraded | API는 준비됐지만 일부 엔진·Worker 계층이 제한됨 |
| online | API와 실제 TTS가 준비됨 |

API·TTS·Worker·GPU를 별도 계층으로 표시한다. Mock만 준비된 경우 실제 TTS 준비로 표시하지
않는다. `/connectivity`와 `/engines`는 같은 EngineOrchestrator 추천·health 정보를 사용한다.

## 확인 API

```text
GET /api/v1/health
GET /api/v1/connectivity
GET /api/v1/engines
GET /api/v1/setup
POST /api/v1/tts/synthesize
GET /api/v1/tts/jobs/{job_id}
GET /api/v1/tts/jobs/{job_id}/events
GET /api/v1/tts/jobs/{job_id}/result
```

## 모바일 결과 복구

Web은 생성 POST를 네트워크 오류만으로 자동 재전송하지 않는다. 응답 단절, 세션 복원과
프로젝트 불러오기는 기존 job ID 상태와 `/result`를 먼저 조회한다.

- 진행 중 결과 요청: 409
- 알 수 없는 job: 404
- 결과 TTL 만료: 410

## CORS와 Private Network

기본 개발 Origin:

```text
http://localhost:5173
http://127.0.0.1:5173
https://junl-im.github.io
```

공개 API의 `SORION_CORS_ORIGINS`에는 실제 Web Origin을 추가한다. 로컬 LAN 개발은
`SORION_ALLOW_PRIVATE_NETWORK=true`와 브라우저 Private Network preflight가 함께 필요하다.

## 0.8.9 복수 API 자동 장애 전환

정적 Web은 `public/sorion-runtime-config.json`, 빌드 환경의 `VITE_API_BASE_URLS`, 마지막 성공 주소를
합쳐 후보를 만든다. GitHub Actions는 `SORION_PUBLIC_API_BASE_URLS`를 런타임 JSON에 기록한다.
후보는 순서대로 `/health`를 검사하며 실패하면 현재 주소를 제외하고 다음 HTTPS API로 자동 전환한다.
Secret은 Web에 넣지 않고 FastAPI 서버에만 둔다. 사용자 화면에는 주소 입력이나 엔진 선택 기능을
제공하지 않는다.

## 0.9.0 무료 우선 연결 규칙

API 주소 자동 탐색과 엔진 비용 정책은 별개다. 연결된 API가 있더라도 기본 `free-only`에서는
CosyVoice·Melo·System 같은 무료 후보만 자동 실행한다. 과금형 공급자 키가 있더라도 `balanced`를
서버에서 명시하지 않으면 등록하지 않는다. 진행률은 SSE를 우선하고 실패 시 polling으로 대체한다.
