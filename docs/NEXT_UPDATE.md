# NEXT UPDATE

Current baseline: `0.11.27 · Field Device & MY VOICE Runtime Certification`

## 목표 버전

`0.11.28 · Certification Intake & Release Readiness`

### 핵심 기능

1. `field-device-certification/1` Android/iOS JSON을 Quality Lab에서 불러와 schema/privacy/READY 조건을 즉시 검증하고 저장소/API evidence intake와 연결합니다.
2. GitHub Actions의 desktop/mobile Chromium multi-scene manifest를 함께 불러와 18개 PNG SHA/assertion 결과를 release readiness에 연결합니다.
3. `my-voice-recovery-runtime/1` 실제 completed evidence가 있으면 consent/Worker/model/first-audio/playback/recovery subset 계약을 같은 release readiness에 합칩니다.
4. `field ready`, `chromium ready`, `MY VOICE pending`처럼 증거 등급별 상태를 분리하고, synthetic fixture나 미수집 값을 전체 RELEASE READY로 승격하지 않습니다.
5. 실제 0.11.26 R1/0.11.27 GitHub Actions 결과를 확인해 lint, critical regression, full Vitest, typecheck, build, desktop/mobile Chromium이 녹색인지 release gate에 포함합니다.

### 예상 변경 영역

- `src/components/evaluation/*Certification*`, `src/quality/*Evidence*`
- `services/api/app/{schemas,api/routes,services}/evidence*` (필요한 최소 intake 확장)
- GitHub Actions artifact/release readiness verification scripts
- `docs/FIELD_DEVICE_RUNTIME_CERTIFICATION.md`, evidence intake 문서, HANDOVER/CHANGELOG

### 선행 조건과 위험

- 0.11.27 PATCH는 `0.11.26 R1` 기준입니다. Actions run `32117983645`에서 R1 lint는 통과했고 critical regression 64/65 뒤 exit-history test harness 1건이 교정됐으므로, 최신 0.11.27 ZIP을 Push한 뒤 Web quality 전체 녹색을 확인해야 합니다.
- 카카오 Android/iOS JSON은 실제 기기 수행자 확인이 있어야 하며 전체 UA·기기명·원문·오디오를 저장하지 않습니다.
- MY VOICE는 실제 동의된 프로필과 Worker/model이 없으면 pending으로 유지합니다.
- Chromium fixture는 `realWorkerClaimed=false`이므로 MY VOICE 운영 성공을 대신하지 않습니다.
