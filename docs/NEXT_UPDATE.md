# NEXT UPDATE

현재 기준: `0.11.25 R1 · Mobile WebView Playback & Exit Guard`

## 목표 버전

`0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery`

### 핵심 기능

1. 0.11.25 R1을 GitHub main에 반영한 뒤 `critical-regression` → full Vitest → build가 녹색인지 확인하고, 실제 카카오톡 Android/iOS에서 preset 미리듣기와 종료 확인 `계속 만들기`를 재검증합니다. 실패하면 multi-scene 기능보다 모바일 failure domain을 우선 수정합니다.
2. desktop 1024/1280/1440과 mobile 360/390/430 Chromium에서 `workspace`, `voice-picker/drawer`, `recovery-impact`를 별도 scene으로 캡처하고 PNG SHA-256 + layout assertion을 artifact에 보존합니다.
3. Voice Drawer/Picker의 ▶가 다른 성우를 먼저 선택한 뒤 preview하는지, multi stale recovery dialog가 선택 3개 중 unavailable 2개만 대상으로 표시하는지를 브라우저 interaction evidence로 확인합니다.
4. 실제 MY VOICE Worker와 동의된 프로필이 준비된 환경에서만 `교체 후 재생성`, 실패/취소 recovery, first-audio latency를 기록합니다. synthetic/static 결과를 실운영 성공으로 표현하지 않습니다.

### 선행 조건

- GitHub Actions run `32096206966`의 stale Browser Speech pace expectation은 0.11.25에서 수정됐고, R1은 카카오 WebView direct user-gesture speech + 1.8초 watchdog + 단순화한 exit guard를 추가합니다.
- Web quality report는 `web-quality/1`, heartbeat `6.7`, 8개 phase를 사용합니다.
- stale ready audio는 명시적 복구 실행 전까지 유지합니다.
- 다중 복구는 unavailable MY VOICE subset만 변경합니다.
- Undo는 semantic Voice 배정을 복원하되 폐기된 과거 audio/job/track은 부활시키지 않습니다.
- 실제 모델/동의/브라우저 evidence가 없으면 READY 또는 운영 성공으로 표시하지 않습니다.
