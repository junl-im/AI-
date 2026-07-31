# API

기본 경로: `/api/v1`

## GET /health

API와 기본 엔진 설정 상태를 확인한다.

## GET /engines

등록된 엔진과 언어, 감정, 복제 지원 여부를 반환한다.

## POST /tts/synthesize

```json
{
  "text": "안녕하세요.",
  "voice_id": "sori-warm",
  "emotion": "calm",
  "speed": 1.0,
  "pitch": 0,
  "output_format": "wav",
  "engine_id": "mock"
}
```

Foundation의 Mock 응답은 `audio_url`이 `null`이다. 실제 엔진 연결 후 동기 생성 또는 작업 조회 방식으로 확장한다.

## 공통 규칙

- 모든 오류 문구는 사용자에게 보여줄 수 있는 한국어 메시지를 제공한다.
- 모든 응답에는 `X-Request-ID` 헤더를 포함한다.
- 원문 텍스트와 음성 파일은 로그에 남기지 않는다.
- API의 파괴적 변경은 버전 경로를 올린다.
