# Live Voice + MY VOICE · 0.11.33 Hardening Report

## 현재 계약

`내 목소리` 프로필은 `myvoice:<profileId>` ID로 built-in voice와 같은 selector에 노출되지만 실제 생성은 generic TTS가 아니라 Voice Clone API/CosyVoice Worker 경로를 사용한다.

노출 위치:

1. Home voice selection
2. Desktop Voice Drawer
3. Voice Picker Sheet
4. Timeline voice selection
5. My Voice Lab

## 0.11.33 MY VOICE 강화

- 20~30초 reference를 권장하고 30초를 hard maximum으로 사용한다.
- recorder는 timer drift를 고려해 29.5초에 자동 정지한다.
- zero-byte 녹음과 reset/stop race를 차단한다.
- 브라우저 분석 뒤에도 API가 실제 오디오를 다시 디코딩해 RMS, silence, clipping, duration을 검증한다.
- FFmpeg가 있으면 WAV/MP3/M4A/WEBM/OGG를 검사하고 16 kHz mono PCM WAV로 정규화한다.
- 서버 profile ID는 local ID와 맞춰 재시도 중복을 줄인다.
- 저장 profile 조회 시 Worker readiness를 다시 반영해 엔진 복구 뒤 stale 상태를 회복한다.
- local-only profile은 개인정보 경계 때문에 자동 업로드하지 않고 사용자의 명시적 서버 재등록을 요구한다.

## Worker 계약

CosyVoice adapter는 reference가 16 kHz mono WAV, 5~30초인지 다시 확인한다. Cross-lingual 호출은 `stream=True` keyword argument를 사용해 위치 인수 오해를 차단한다.

## 5개 성우

성우 preset reference는 MY VOICE Worker와 같은 16 kHz mono·5~30초 기준을 사용하고 RMS·무음·clipping까지 검사한다. 기존의 서로 다른 preset 간 동일 WAV 중복 차단, 반대 성별 대체 차단, consent/rights/human-review/SHA gate는 유지한다.

현재 저장소에는 실제 rights-cleared 5개 성우 WAV가 없고 evidence manifest도 pending이다. 따라서 임의 reference를 넣지 않으며 실제 neural 음질 성공을 주장하지 않는다.

## Final Export 퇴역

과거 `최종 MP3 + 자막` / `최종 WAV + 자막` 사용자 기능은 0.11.33에서 공개 제품 표면에서 제거됐다.

- Timeline Final Export controls/dialog 제거
- Web final export adapter/archive 제거
- FastAPI `/exports` route/schema 제거
- 관련 테스트 제거
- 과거 Final Export hotfix 제거
- 0.11.15 Live Voice/MY VOICE apply script와 stale payload snapshots 제거

내부 WAV/자막 장시간 결합 soak는 Quality 검사 도구이며 공개 제품 기능이 아니다.

`VERIFY_LIVE_VOICE_MYVOICE.mjs`는 최신 계약뿐 아니라 위 폐기 파일/route가 다시 생기는 것도 실패 처리한다.

## 검증

- API pytest: 235/235 PASS
- Worker pytest: 16/16 PASS
- Live Voice / MY VOICE hardening verifier: 51/51 PASS
- Repository preflight: 55/55 PASS
- TypeScript dependency-free syntax: 254/254 PASS
- Dependency 기반 Web lint/Vitest/typecheck/build: npm registry DNS `EAI_AGAIN`으로 로컬 실행 불가, GitHub Actions final gate
