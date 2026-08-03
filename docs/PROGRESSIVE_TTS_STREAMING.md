# PROGRESSIVE TTS STREAMING

현재 기준 버전: `0.9.3-beta.3 Engine Heartbeat 6.4`

## 목적

장문 음성 제작에서 전체 내용 완료를 기다리지 않고 현재 문장의 생성 상태를 즉시 보여 준다.
서버 연결이 가능한 경우 SSE를 우선하며, 프록시·브라우저가 스트림을 지원하지 않으면 polling으로
자동 전환해 기존 복구 계약을 유지한다.

## API

```text
GET /api/v1/tts/jobs/{job_id}/events
Accept: text/event-stream
```

서버는 `event: progress`와 `JobProgressResponse` JSON을 전송하고, 장문 WAV 구간이 준비되면
`event: segment-ready`를 별도로 전송한다. 작업이 `completed`, `failed`, `cancelled` 중 하나가
되면 스트림을 닫는다.

응답 헤더:

```text
Cache-Control: no-cache, no-transform
X-Accel-Buffering: no
```

## Web 동작

1. 합성 POST 뒤 SSE 연결을 시도한다.
2. 각 progress 이벤트를 기존 타임라인 블록 상태에 반영한다.
3. 스트림을 열 수 없거나 파싱에 실패하면 기존 상태 polling으로 전환한다.
4. 첫 번째 `segment-ready`는 단기 서명 URL을 내려받아 Player Queue에 부분 트랙으로 연결한다.
5. 완료 뒤 `/result`의 최종 WAV를 같은 track ID로 교체하고 revision 보호를 그대로 사용한다.
6. 다음 블록이 완료돼 Queue에 추가돼도 사용자가 듣던 현재 트랙은 유지한다.

## 제한

현재 SSE는 작업 상태와 **완성된 WAV 파일 구간의 준비 알림**을 전달합니다. 실제 PCM chunk
스트리밍은 아니며 첫 구간만 조기 재생합니다. 후속 구간 gapless 재생과 최종 WAV 재생 위치 승계는
아직 제공하지 않습니다. 공개 reverse proxy는 SSE buffering을 비활성화해야 합니다.
