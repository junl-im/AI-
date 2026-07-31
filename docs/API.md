# API

기본 경로: `/api/v1`

## GET /health

```json
{
  "status": "ok",
  "service": "sorion-api",
  "version": "0.5.5",
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
  "version": "0.5.5",
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
  "job_id": "client-generated-uuid"
}
```

`engine_id`를 생략하면 준비된 실제 엔진을 우선 선택합니다. API는 한국어 전처리 후 180자를 넘는 문장을 나누어 생성하고 같은 형식의 PCM WAV를 하나로 병합합니다.

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
  "version": "0.5.5",
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
