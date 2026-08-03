# Real Device Certification Contract

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.5`

## 인증 조합

Android Chrome과 iOS Safari 각각에 대해 다음 네 시나리오를 10·30·60분으로 기록합니다.

- `baseline`: 공개 HTTPS에서 기본 장문 생성·재생 완료
- `network-switch`: Wi-Fi/셀룰러 전환 뒤 SSE와 음원 fetch 복구
- `background-resume`: 백그라운드 복귀 뒤 SSE와 음원 fetch 복구
- `installed-pwa`: 설치형 PWA에서 동일 조건 완료

## 상태 계산

- `ready`: 생성 성공, 재생 완료, 필요한 복구 필드가 모두 true이며 주요 경고 임계값을 넘지 않음
- `warning`: 복구 필드가 미측정이거나 RTF·첫 음성·seam P95·handoff 오차가 경고 기준을 넘음
- `failed`: 생성 또는 재생 실패, 실패 횟수 존재, 필요한 SSE 또는 음원 fetch 복구가 false

Quality Lab은 단순 장치 기록 15개와 모바일 인증 24개를 분리해 표시합니다. 저장소와 CI는 실제 기기 결과를 임의로 만들지 않습니다.

## 요청 확장 필드

`POST /api/v1/quality/device-benchmarks`는 `scenario`, `browser_version`, `preset_id`, `soak_elapsed_seconds`, `playback_completed`, `sse_reconnected`, `audio_fetch_recovered`, `sse_reconnect_ms`, `audio_fetch_recovery_ms`, `playback_interruption_ms`, `seam_p95_waited_ms`, `seam_p95_decode_ms`, `final_handoff_error_ms`를 받습니다. 복구 시나리오는 boolean과 시간 필드가 모두 필요하고 기존 클라이언트는 기본 `baseline`으로 계속 동작합니다.

상세 recorder 계약은 `DEVICE_SOAK_RECORDER.md`를 따릅니다.
