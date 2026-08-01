# API

기본 경로: `/api/v1`

## GET /health

```json
{
  "status": "ok",
  "service": "sorion-api",
  "version": "0.9.1",
  "default_engine": "auto"
}
```

## GET /engines

현재 프로세스에 등록된 무료 로컬 엔진의 준비 상태와 실행 통계를 반환합니다.

```json
[
  {
    "id": "system",
    "name": "System Voice",
    "kind": "tts",
    "mode": "local",
    "provider": "Operating System",
    "languages": ["ko-KR"],
    "output_formats": ["wav"],
    "supports_emotion": false,
    "supports_speed": true,
    "supports_pitch": false,
    "supports_voice_clone": false,
    "ready": true,
    "recommended": true,
    "health": "ready",
    "success_count": 0,
    "failure_count": 0
  }
]
```

비용 정책 필드는 제공하지 않습니다. 제품에 등록 가능한 일반 TTS가 모두 무료 로컬 실행이기 때문입니다.

## GET /engines/strategy

```json
{
  "version": "0.9.1",
  "free_only": true,
  "deployment_profile": "firebase-static-plus-local-runtime",
  "primary_tts_engine": "auto",
  "primary_clone_engine": "cosyvoice3",
  "local_fallback_engine": "melo",
  "browser_fallback_engine": "browser-speech",
  "auto_order": ["cosyvoice3", "melo", "system", "mock"]
}
```

## POST /tts/synthesize

```json
{
  "text": "회의는 2026-08-03 09:30에 시작합니다.",
  "voice_id": "sori-warm",
  "emotion": "neutral",
  "speed": 1.0,
  "pitch": 0,
  "output_format": "wav",
  "engine_id": "auto",
  "normalize_text": true,
  "job_id": "client-generated-uuid"
}
```

자동 모드는 CosyVoice·MeloTTS·System Voice 중 준비된 후보를 순서대로 시도합니다. 명시 엔진 요청은
해당 엔진만 사용합니다. 180자를 넘는 문장은 구간으로 나누고 같은 형식의 WAV로 병합합니다.

## GET /tts/jobs/{job_id}/events

작업 상태를 SSE로 전송합니다. Web은 SSE 연결 실패 시 polling으로 자동 전환합니다.

## GET /tts/jobs/{job_id}/result

완료 결과를 SQLite JobStore에서 복구합니다. 결과 TTL이 끝난 작업은 410을 반환합니다.

## DELETE /tts/jobs/{job_id}

진행 중인 작업에 취소를 요청합니다.

## GET /audio/{filename}

임시 WAV를 제공합니다. 기본 보관 시간은 30분이며 경로 이동 문자열을 거부합니다.

## 품질 API

- `GET /quality/diagnostics`: Python·운영체제·엔진 준비 상태
- `GET /quality/sentences`: 한국어 평가 문장
- `POST /quality/text-preview`: 숫자·날짜 정규화와 문장 분할 미리보기
- `POST /quality/compare`: 최대 두 무료 엔진의 생성 시간·RTF·파일 크기 비교
