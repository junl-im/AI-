# NEXT UPDATE

Current baseline: `0.11.32 R2 · CI Static Contract Completion`

## 목표 버전

`0.11.33 · Neural Voice Field Playback & Release Gate`

### 핵심 기능

1. 실제 rights-cleared v4 reference/model이 준비된 preset부터 Android/iOS/desktop에서 neural HTTP WAV 재생을 실기기 관찰하고 cache-hit/first-playing/playback-complete를 비교합니다.
2. Kakao WebView에서 server neural WAV가 가능한 경우 Web Speech보다 우선하고 HTTP media 정책/백그라운드/재진입 실패를 field evidence로 분리합니다.
3. `neural-voice-runtime-certification/1`의 5명 PC/mobile shared 결과를 Release Readiness에 별도 neural gate로 연결하되 실제 asset 미수집 상태를 CERTIFIED로 승격하지 않습니다.
4. server neural preview cache hit/miss/변조 거부/TTL 정리를 privacy-safe aggregate로 관찰해 cache 성능과 무결성을 분리합니다.
5. 0.11.31과 0.11.32가 GitHub에 순서대로 Push된 뒤 lint → Vitest → typecheck → build → Chromium/multi-scene green을 확인합니다.

### 선행 조건과 위험

- **Stabilization gate:** 0.11.32 R2 Push 뒤 API Ruff, Web critical/full Vitest, typecheck, Vite build, desktop/mobile Chromium/multi-scene까지 green을 먼저 확인합니다. 실패가 남으면 0.11.33 기능보다 CI 안정화를 우선합니다.
- GitHub main에는 0.11.31과 0.11.32가 순서대로 반영되었습니다. R1은 현재 0.11.32 위에만 적용합니다.
- 실제 reference WAV/model은 권리와 라이선스가 확인된 운영 자산만 사용합니다.
- 원본 WAV, 모델, 동의 문서는 Git/전달 ZIP에 포함하지 않습니다.
- valid-format verifier fixture는 실제 neural 음질/실기기 성공 증거가 아닙니다.
- 공개 HTTPS API가 없는 카카오 WebView에서는 server neural WAV를 검증할 수 없으며 기존 기기 음성 fallback 경계가 유지됩니다.

### 예상 변경 영역

- field-device neural playback evidence
- Kakao HTTP audio preferred path + fallback telemetry
- release readiness neural gate
- shared preview cache aggregate diagnostics
- real preset runtime certification docs/CLI
