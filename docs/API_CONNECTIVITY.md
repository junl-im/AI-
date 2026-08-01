# API CONNECTIVITY

현재 기준 버전: `0.8.3`

## 배포 경계

```text
GitHub Pages / Mobile PWA
        │ HTTPS 또는 개발 LAN
FastAPI Gateway :8000
        │ 사설 HMAC 요청
CosyVoice Worker :9000
```

GitHub Pages에는 Python API가 포함되지 않는다. 정적 Web만 제공한다. TTS와 복제 기능을 사용하려면 별도 FastAPI가
필요하며 실제 CosyVoice는 모델과 GPU가 준비된 Worker가 추가로 필요하다.

로컬 API 실행:

```bash
npm run dev:api
```

## Web 진단 흐름

연결 바텀시트는 다음 순서로 검사한다.

1. `/api/v1/health`
2. `/api/v1/connectivity`
3. 깊은 검사에서 `/setup`, `/engines`, `/voice-clones/capabilities`

결과는 API·TTS·Worker·GPU 네 계층으로 표시한다. API가 응답해도 Mock만 준비된 경우
실제 TTS 준비로 표시하지 않는다.

## 주소 정규화와 후보

- `192.168.0.10:8000` → `http://192.168.0.10:8000/api/v1`
- `voice.example.com`을 HTTPS 페이지에서 입력 → `https://voice.example.com/api/v1`
- 이미 `/api/v1`이 있으면 중복 추가하지 않음
- 저장 주소, 마지막 성공 주소, 최근 주소 5개를 사용
- localhost 후보는 localhost에서 실행 중인 Web에만 자동 추가
- HTTPS 환경은 같은 Origin `/api/v1`과 `:8443` 후보만 안전하게 추가

전체 LAN 스캔은 하지 않는다.

## 모바일 오류 구분

| 종류 | 사용자 안내 |
|---|---|
| unconfigured | API 주소 연결 필요 |
| offline | 네트워크 복귀 후 자동 재검사 |
| mobile-localhost | PC LAN IP 또는 공개 HTTPS 주소 사용 |
| mixed-content | HTTPS API 필요 |
| timeout | 느린 모바일 연결 또는 서버 응답 지연 |
| cors-or-network | CORS·방화벽·주소·서버 상태 확인 |
| rate-limit | 잠시 후 재시도 |
| server | API 또는 Worker 내부 오류 확인 |

## Connectivity 응답 핵심

```json
{
  "version": "0.8.3",
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

Web은 음성 생성 POST를 자동 재전송하지 않는다. 응답이 끊기면 생성 전에 만든 job ID로
상태를 조회한 뒤 완료 결과를 복구한다.

```text
GET /api/v1/tts/jobs/{job_id}
GET /api/v1/tts/jobs/{job_id}/result
```

- 진행 중 결과 요청: 409
- 알 수 없는 job: 404
- 완료 결과가 SQLite result TTL에서 사라짐: 410

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

- Android Chrome
- iOS Safari
- Android 설치형 PWA
- iOS 홈 화면 Web App
- Wi-Fi → 셀룰러 전환
- 화면 잠금 → 포그라운드 복귀
- 느린 3G 또는 데이터 절약 모드
- HTTPS Web → HTTPS API
- HTTP 로컬 Web → HTTP LAN API

세부 정책은 [`MOBILE_ENGINE_RELIABILITY.md`](MOBILE_ENGINE_RELIABILITY.md)를 따른다.
