# API CONNECTIVITY

현재 기준 버전: `0.8.4`

## 배포 경계

```text
GitHub Pages / Mobile PWA
        │ HTTPS 또는 개발 LAN
FastAPI Gateway :8000
        │ 사설 HMAC 요청
CosyVoice Worker :9000
```

GitHub Pages에는 Python API가 포함되지 않는다. 정적 Web만 제공하므로 TTS와 복제 기능에는
별도 FastAPI가 필요하며 실제 CosyVoice는 모델과 GPU가 준비된 Worker가 추가로 필요하다.

로컬 API 실행:

```bash
npm run dev:api
```

## 자동 연결 흐름

사용자에게 API 주소 입력창이나 엔진 수동 연결 화면을 제공하지 않는다. Web bootstrap이
다음 후보를 순서대로 확인한다.

1. 현재 Web과 같은 Origin의 `/api/v1`
2. 빌드 시 주입된 `VITE_API_BASE_URL`
3. 마지막 성공 주소와 최근 자동 발견 주소
4. localhost 개발 후보 또는 현재 HTTP 호스트의 안전한 API 포트

후보의 `/api/v1/health`와 `/api/v1/connectivity`가 유효하면 주소를 내부 저장하고 엔진
목록을 읽어 준비된 실제 TTS 엔진을 자동 선택한다. 필요 시 `/setup`, `/engines`,
`/voice-clones/capabilities`로 상세 진단한다.

연결 실패 시 주소 입력 UI를 열지 않는다. online, 네트워크 변경, 앱 포그라운드 복귀와
5초 → 12초 → 30초 → 60초 backoff에서 단일 탐색을 다시 실행한다.

## 주소 정규화와 후보

- `VITE_API_BASE_URL=http://192.168.0.10:8000` → `http://192.168.0.10:8000/api/v1`
- 공개 도메인은 현재 HTTPS 배포 정책에 맞춰 HTTPS 사용
- 이미 `/api/v1`이 있으면 중복 추가하지 않음
- localhost 후보는 localhost Web 개발에서만 자동 추가
- HTTPS 환경은 같은 Origin 또는 명시된 HTTPS API만 안전 후보로 사용
- 전체 사설 LAN 대역은 스캔하지 않음

## 상태와 오류 구분

| 종류 | 시스템 동작 |
|---|---|
| unconfigured | 자동 후보 탐색과 단계적 재시도 |
| offline | 네트워크 복귀 뒤 자동 재검사 |
| mobile-localhost | 후보에서 제외하고 배포 HTTPS 또는 현재 호스트 후보 사용 |
| mixed-content | HTTP 후보를 연결하지 않고 HTTPS API 필요 상태 표시 |
| timeout | 다음 backoff 주기에 재검사 |
| cors-or-network | 수동 입력 없이 후보·Origin·서버 상태 재검사 |
| rate-limit | Retry-After 또는 backoff 뒤 재시도 |
| server | API/Worker 오류 상태를 표시하고 자동 재검사 |

API·TTS·Worker·GPU 네 계층을 구분한다. API가 응답해도 Mock만 준비된 경우 실제 TTS
준비로 표시하지 않는다.

## Connectivity 응답 핵심

```json
{
  "version": "0.8.4",
  "api_ready": true,
  "tts_ready": true,
  "worker_configured": true,
  "worker_healthy": true,
  "voice_clone_ready": false,
  "gpu_ready": false,
  "gpu_name": null,
  "vram_total_mb": null,
  "request_id": "request-uuid",
  "recommended_recheck_seconds": 15
}
```

`worker_healthy=true`, `gpu_ready=false`는 Worker 프로세스는 살아 있지만 CUDA·모델이
실제 추론 준비 상태가 아니라는 의미다.

## TTS 모바일 결과 복구

Web은 음성 생성 POST를 자동 재전송하지 않는다. 응답이 끊기거나 프로젝트를 불러오면
저장한 job ID로 상태와 완료 결과를 먼저 복구한다.

```text
GET /api/v1/tts/jobs/{job_id}
GET /api/v1/tts/jobs/{job_id}/result
```

- 진행 중 결과 요청: 409
- 알 수 없는 job: 404
- SQLite result TTL 만료: 410

## CORS와 Private Network

기본 개발 Origin:

```text
http://localhost:5173
http://127.0.0.1:5173
https://junl-im.github.io
```

환경 변수 `SORION_CORS_ORIGINS`에서 실제 배포 Origin만 허용한다. 개발 LAN 연결은
`SORION_ALLOW_PRIVATE_NETWORK=true`일 때 Private Network preflight를 허용한다.

## 실기기 점검

- Android Chrome, iOS Safari, 설치형 PWA
- Wi-Fi → 셀룰러 전환, 화면 잠금 → 포그라운드 복귀
- HTTPS Web → HTTPS API
- HTTP 로컬 Web → 현재 PC 호스트의 HTTP API
- 자동 탐색 실패 시 수동 연결 UI가 나타나지 않는지 확인

세부 정책은 [`MOBILE_ENGINE_RELIABILITY.md`](MOBILE_ENGINE_RELIABILITY.md)를 따른다.
