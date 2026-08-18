# NEXT UPDATE

Current baseline: `0.11.26 R1 - Web Lint Stabilization`


## Stabilization gate before 0.11.27

- Push 0.11.26 R1 and require GitHub Actions Web quality to pass lint, critical regression, full Vitest, typecheck, build, and Chromium evidence before starting field/runtime certification changes.
- If Web quality still fails, fix that failure first and keep 0.11.27 feature work paused.
## 목표 버전

`0.11.27 · Field Device & MY VOICE Runtime Certification`

### 핵심 기능

1. 0.11.26을 GitHub main에 반영해 Web quality, 기존 desktop/mobile layout runner, 신규 multi-scene desktop/mobile runner가 모두 녹색인지 확인하고 artifact의 18개 PNG + manifest SHA/assertion을 검토합니다.
2. 실제 카카오톡 Android/iOS에서 preset 미리듣기 direct user-gesture 경로, 1.8초 watchdog, 외부 브라우저 복구 안내, 뒤로가기 `계속 만들기` 종료 guard를 실기기 evidence로 닫습니다.
3. 실제 Voice Clone Worker/model과 동의된 MY VOICE 프로필이 준비되면 `replace-and-regenerate`를 수행하고 `my-voice-recovery-runtime/1` observed evidence를 수집해 first-audio, 완료 재생, stale subset count, historical audio 비복원 계약을 검증합니다.
4. 실제 환경이 없으면 synthetic/static fixture를 운영 성공으로 승격하지 않고 pending 상태를 유지합니다.

### 선행 조건과 위험

- 0.11.26 multi-scene runner는 UI interaction evidence이며 `realWorkerClaimed=false`입니다.
- MY VOICE 실 runtime 증거에는 raw profile ID, 샘플 파일 경로, Blob/원본 오디오를 넣지 않고 SHA-256 profile fingerprint만 사용합니다.
- stale recovery는 선택 전체가 아니라 unavailable MY VOICE subset만 변경합니다.
- Undo는 Voice 배정을 복원하되 폐기된 과거 audio/job/track을 부활시키지 않습니다.
- 카카오/WKWebView Speech Synthesis 성공은 실제 기기별 제약이 있으므로 desktop Chromium 통과로 대체 인증하지 않습니다.
