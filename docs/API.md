# API

기본 경로: `/api/v1`

## GET /health

```json
{
  "status": "ok",
  "service": "sorion-api",
  "version": "0.7.2",
  "default_engine": "auto"
}
```

## GET /engines

엔진 모드, 준비 여부, 실패 이유와 제어 기능 지원 여부를 반환합니다.

```json
[
  {
    "id": "melo",
    "name": "MeloTTS Korean",
    "kind": "tts",
    "mode": "ai",
    "provider": "MyShell MeloTTS",
    "languages": ["ko-KR"],
    "output_formats": ["wav"],
    "supports_emotion": false,
    "supports_speed": true,
    "supports_pitch": false,
    "supports_voice_clone": false,
    "ready": false,
    "reason": "MeloTTS 선택 설치가 필요합니다."
  }
]
```

## GET /engines/strategy

SoriON의 주력·보조·대체·평가 전용 엔진 결정을 반환합니다. 실제 설치 상태가 아니라 제품 엔진 방향을 제공하는 API입니다.

```json
{
  "version": "0.7.2",
  "primary_tts_engine": "cosyvoice3",
  "primary_clone_engine": "cosyvoice3",
  "local_fallback_engine": "melo",
  "candidates": [
    {
      "id": "cosyvoice3",
      "role": "primary",
      "status": "planned",
      "languages": ["ko-KR", "en-US", "ja-JP", "zh-CN"]
    }
  ]
}
```

라이선스와 선정 근거는 `docs/ENGINE_STRATEGY.md`를 확인합니다.

## POST /tts/synthesize

```json
{
  "text": "회의는 2026-08-03 09:30에 시작합니다.",
  "voice_id": "sori-warm",
  "emotion": "neutral",
  "speed": 1.0,
  "pitch": 0,
  "output_format": "wav",
  "engine_id": "melo",
  "normalize_text": true,
  "job_id": "client-generated-uuid"
}
```

`engine_id`를 생략하면 준비된 실제 엔진을 우선 선택합니다. `normalize_text`가 참이면 숫자와 날짜를 한국어 읽기 형태로 바꿉니다. 거짓이면 공백만 정리하고 원문 표기를 유지합니다. API는 180자를 넘는 문장을 나누어 생성하고 같은 형식의 PCM WAV를 하나로 병합합니다.

### 실제 음원 응답

```json
{
  "job_id": "uuid",
  "status": "completed",
  "engine_id": "melo",
  "engine_mode": "ai",
  "audio_url": "http://localhost:8000/api/v1/audio/uuid.wav",
  "estimated_duration_seconds": 8.4,
  "message": "긴 문장을 3개 구간으로 나눠 하나의 WAV로 연결했습니다.",
  "normalized_text": "회의는 이천이십육년 팔월 삼일 구시 삼십분에 시작합니다.",
  "segment_count": 3,
  "processing_ms": 4210,
  "file_size_bytes": 372044,
  "realtime_factor": 0.501
}
```

## DELETE /tts/jobs/{job_id}

진행 중인 작업에 취소를 요청합니다.

## GET /audio/{filename}

임시 WAV를 제공합니다. 경로 이동 문자열은 거부하며 `private, no-store` 응답을 사용합니다. 기본 보관 시간은 30분입니다.

## GET /quality/diagnostics

Python, 운영체제, 프로세스 메모리와 엔진별 설치·로딩 상태를 반환합니다.

## GET /quality/sentences

한국어 평가 문장 세트를 반환합니다.

## POST /quality/text-preview

```json
{
  "text": "결제는 38,500원이고 AI 정확도는 95%입니다.",
  "max_chars": 180
}
```

정규화된 문장, 변경 종류, 생성 구간을 반환합니다.

## POST /quality/compare

```json
{
  "text": "안녕하세요.",
  "engine_ids": ["melo", "system"],
  "voice_id": "sori-warm",
  "emotion": "neutral",
  "speed": 1.0,
  "pitch": 0
}
```

각 엔진 결과의 음원 URL, 생성 시간, 음원 길이, RTF, 파일 크기, 구간 수를 반환합니다. 한 엔진이 실패해도 다른 엔진 결과는 유지합니다.

## 오류 코드

- `SOA-4001`: 요청 엔진 사용 불가
- `SOA-4002`: 엔진 실행 실패
- `SOA-4007`: 사용자 취소
- `SOA-4008`: 생성 제한 시간 초과
- `SOA-4009`: 중복 작업 ID
- `SOA-4104`: 음원 파일 없음 또는 만료

## 공통 규칙

- 원문 텍스트와 음성 파일은 애플리케이션 로그에 남기지 않습니다.
- Mock, Demo, Local TTS, AI 상태를 같은 것으로 위장하지 않습니다.
- 모든 응답에 `X-Request-ID`를 포함합니다.

## 0.5.0 Setup 상태

### `GET /api/v1/setup`

웹 연결 전에 Python 버전, 임시 음원 폴더, 실제 한국어 엔진, FFmpeg, CORS 상태를 확인한다.

주요 응답:

```json
{
  "version": "0.7.2",
  "ready": true,
  "real_engine_count": 1,
  "steps": [
    {
      "id": "real-engine",
      "label": "실제 한국어 음성 엔진",
      "status": "ready",
      "required": true,
      "detail": "SoriON Local Korean Voice",
      "action": null
    }
  ]
}
```

## 0.5.0 작업 진행률

### `GET /api/v1/tts/jobs/{job_id}`

생성 요청에 사용한 UUID로 현재 상태를 조회한다. 작업이 끝난 뒤에도 최근 스냅샷을 조회할 수 있다.

```json
{
  "job_id": "UUID",
  "status": "processing",
  "phase": "generating",
  "progress": 48,
  "current_segment": 2,
  "total_segments": 4,
  "message": "4개 중 2번째 구간을 생성하고 있습니다.",
  "error": null,
  "updated_at": "2026-07-31T05:18:00+00:00"
}
```

`phase`는 `queued`, `normalizing`, `generating`, `merging`, `completed`, `cancelled`, `failed` 중 하나다.


## GET /voice-clones/capabilities

현재 복제 Worker 준비 상태, 최대 파일 크기, 권장 녹음 길이, 허용 확장자를 반환한다.

```json
{
  "engine_id": "cosyvoice3-worker",
  "engine_name": "Fun-CosyVoice 3 Worker",
  "ready": false,
  "reason": "SORION_COSYVOICE_WORKER_URL을 설정하면 별도 모델 Worker와 연결됩니다.",
  "recommended_seconds": 10,
  "max_file_bytes": 26214400,
  "accepted_extensions": [".m4a", ".mp3", ".ogg", ".wav", ".webm"]
}
```

## POST /voice-clones/profiles

`multipart/form-data` 요청을 사용한다.

- `sample`: 음성 파일
- `display_name`: 프로필 표시 이름
- `consent_json`: 권리, AI 고지, 금지 용도, 동의 시각, 사용 목적
- `client_analysis_json`: 길이, 무음, 클리핑, 음량 분석

세 가지 동의 확인이 모두 참이 아니면 `SOA-5001`로 거부한다. 차단된 품질은 `SOA-5007`로 거부한다. WAV는 서버에서 컨테이너와 5초 최소 길이를 다시 확인한다. 실제 Worker가 없으면 `engine-unavailable`이며 복제 성공으로 표시하지 않는다.

## DELETE /voice-clones/profiles/{profile_id}

UUID에 연결된 원본 샘플과 JSON 동의 메타데이터를 삭제한다. 원본 샘플은 공개 조회 API로 제공하지 않는다.

## 음성 복제 오류 코드

- `SOA-5001`: 권한·AI 고지·금지 용도 동의 누락
- `SOA-5002`: 지원하지 않는 음성 확장자
- `SOA-5003`: 25MB 파일 크기 초과
- `SOA-5004`: 빈 파일
- `SOA-5005`: 잘못된 동의 JSON
- `SOA-5006`: 잘못된 품질 분석 JSON
- `SOA-5007`: 클라이언트 품질 검사 차단
- `SOA-5008`: 손상된 WAV
- `SOA-5009`: 5초 미만 WAV

## Engine connectivity

```http
GET /api/v1/connectivity
```

FastAPI 게이트웨이, 임시 음원 저장소, 실제 TTS 엔진, CORS Origin,
CosyVoice Worker health를 한 번에 반환합니다. 웹 설정 화면은 이 경로와 health,
setup, engines, voice-clones/capabilities를 함께 호출해 경로별 연결 실패를 구분합니다.

GitHub Pages는 이 API를 실행하지 않습니다. 로컬 또는 공개 HTTPS FastAPI 주소를
별도로 연결해야 합니다.


## 0.7.0 Voice Clone Worker API

### `GET /voice-clones/worker`

Worker health/readiness 스냅샷, 버전, 지연 시간, GPU·CUDA·VRAM·모델 진단을 반환한다.

### `POST /voice-clones/profiles/{profile_id}/jobs`

```json
{ "text": "내 목소리로 만들 문장입니다." }
```

동의된 프로필의 원본 샘플을 Worker에 전달해 문장별 복제 작업을 만든다. Worker가
준비되지 않았으면 `SOA-5103`과 HTTP 503을 반환한다.

### 작업 상태와 제어

- `GET /voice-clones/jobs/{job_id}`
- `GET /voice-clones/jobs/{job_id}/events`
- `POST /voice-clones/jobs/{job_id}/cancel`
- `POST /voice-clones/jobs/{job_id}/retry`
- `GET /voice-clones/jobs/{job_id}/audio`
- `GET /voice-clones/jobs/{job_id}/segments/{index}/audio`

응답에는 전체 진행률, 첫 음성 지연, 문장별 상태와 구간 음원 URL이 포함된다.

### 추가 오류 코드

- `SOA-5100`: Worker 미등록
- `SOA-5101`: Worker 요청 실패
- `SOA-5102`: 음성 프로필 없음
- `SOA-5103`: Worker 또는 모델 readiness 실패


## 0.7.2 Worker 인증 헤더

FastAPI는 Worker의 `/ready`와 `/v1/*` 호출에 다음 헤더를 자동으로 붙인다.

```text
X-SoriON-Service-Token
X-SoriON-Timestamp
X-SoriON-Signature
```

서명 입력은 HTTP method, path, timestamp, request body SHA-256이다. Worker는 기본 30초보다
오래된 요청과 body가 바뀐 요청을 거부한다. `/health`는 로드밸런서 확인을 위해 공개한다.

SSE 재연결 시 브라우저의 `Last-Event-ID`를 API가 Worker까지 전달한다. Worker는 각 이벤트에
revision 기반 `id`를 넣어 이미 받은 상태를 중복 전송하지 않는다.
