# NEXT UPDATE

Current baseline: `0.11.33 · Voice Engine Major Hardening`

## 목표 버전

`0.11.34 · Neural Voice Field Playback & Release Gate`

### 핵심 기능

1. 실제 rights-cleared v4 reference/model이 준비된 성우부터 desktop/Android/iOS에서 neural WAV 재생을 관찰하고 first-playing/playback-complete/cache-hit를 증거화합니다.
2. 5개 preset의 실제 성우 자산 intake가 시작되면 0.11.33의 16 kHz mono·5~30초·RMS·무음·clipping gate를 통과한 asset만 승인합니다.
3. MY VOICE는 실제 기기 마이크 샘플로 20~30초 권장 flow, 서버 재검증, profile recovery, local-only 재등록을 실기기에서 인증합니다.
4. `neural-voice-runtime-certification/1`의 PC/mobile shared 결과를 Release Readiness neural gate에 연결하되 실제 asset/재생이 없으면 CERTIFIED로 승격하지 않습니다.
5. 로컬에서 실행하지 못한 Web ESLint/Vitest/typecheck/build/Chromium을 GitHub Actions에서 최종 확인하고 실패 시 기능 추가보다 안정화를 먼저 처리합니다.

### 예상 변경 영역

- field-device neural playback evidence
- approved voice reference intake / diagnostics
- MY VOICE real-device capture and recovery evidence
- release readiness neural gate
- shared preview cache aggregate diagnostics

### 선행 조건과 위험 요소

- 실제 성우 reference WAV/model은 권리·동의·라이선스가 확인된 운영 자산만 사용합니다.
- 원본 WAV, 모델, 동의 문서는 Git/전달 ZIP에 포함하지 않습니다.
- valid-format fixture나 Browser Speech fallback을 실제 neural 음질 성공 증거로 사용하지 않습니다.
- Kakao WebView에서 공개 HTTPS API/media 정책이 막히면 외부 브라우저 fallback 경계를 유지합니다.
- 0.11.33에서 제거한 Final Export UI/API와 오래된 apply payload를 다시 도입하지 않습니다.

### 이번 릴리스에서 넘기는 결정

- MY VOICE reference canonical contract: 16 kHz mono, 5~30초, 20~30초 권장.
- 성우 preset canonical contract: 16 kHz mono, 5~30초 + RMS/무음/clipping + evidence/rights/review/SHA.
- local-only 사용자 음성은 명시적 사용자 동작 없이 서버로 자동 업로드하지 않습니다.
- 공개 `최종 MP3 + 자막` / `최종 WAV + 자막` 제품 기능은 퇴역 상태를 유지합니다.
