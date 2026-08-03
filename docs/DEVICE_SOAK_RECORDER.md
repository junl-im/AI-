# Device Soak Recorder

현재 기준: `0.9.3-beta.3 · Engine Heartbeat 6.5`

## 목적

Quality Lab에서 Android Chrome·iOS Safari의 10·30·60분 실기기 시나리오를 사람이 직접 시작·종료하고 측정 결과를 API와 JSON으로 남깁니다. 저장소와 CI는 실제 기기 READY 값을 자동 생성하지 않습니다.

## 시나리오

- `baseline`: 공개 HTTPS에서 기본 장문 생성과 재생 완료
- `network-switch`: Wi-Fi·셀룰러 전환 뒤 SSE와 음원 fetch 복구
- `background-resume`: 탭 또는 PWA를 백그라운드로 보낸 뒤 복귀
- `installed-pwa`: 설치형 PWA에서 동일 조건 완료

## 기록 필드

- wall-clock soak 시간과 목표 시간
- 기기·브라우저, 엔진·모델·프리셋
- first audio와 RTF 계산용 처리·음원 시간
- SSE 재연결 시간
- 음원 fetch 복구 시간
- 실제 재생 중단 시간
- 생성 대기 포함 seam P95와 순수 decode 전환 P95
- 최종 WAV handoff 위치 오차
- 재생 완료·시나리오 성공 여부와 운영 메모

복구 시나리오는 성공 boolean만으로 READY가 되지 않습니다. 세 가지 복구 시간 필드가 없거나 목표 시간의 98% 미만으로 끝난 기록은 warning입니다. 명시적인 SSE·fetch 실패, 재생 실패 또는 생성 실패는 failed입니다.

## 집계

`GET /api/v1/quality/device-benchmarks/summary`는 기기 profile·engine ID·preset ID별로 다음을 계산합니다.

- first audio P95
- SSE reconnect P95
- audio fetch recovery P95
- playback interruption P95
- generation-wait seam P95
- decode-only seam P95
- 평균 RTF와 실패율

P95는 nearest-rank 방식이며 실제 표본이 없는 항목은 null입니다.
