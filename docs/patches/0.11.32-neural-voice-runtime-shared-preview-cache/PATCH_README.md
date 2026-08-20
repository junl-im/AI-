# 0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache PATCH

## 기준

- Base: `0.11.31 · Studio Entry & Voice Character Overhaul`
- Target: `0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache`
- 적용: PATCH ZIP의 내용을 저장소 루트에 그대로 덮어씁니다.
- 삭제 파일: 없음.
- 주의: GitHub `main`은 작업 시작 시 아직 `0.11.30 R1`이므로 이 PATCH를 `0.11.30 R1`에 직접 적용하지 않습니다. 먼저 0.11.31을 적용·Push합니다.

## 핵심 변경

1. `POST /api/v1/tts/neural-preview`에서 현재 v4 preset provenance와 Worker `model_digest`를 매 요청 재검증해 승인된 model/reference fingerprint와 일치할 때만 neural runtime을 허용합니다.
2. `previewCacheKey + text SHA-256 + style SHA-256` 기반 `neural-preview-cache/1` content-addressed shared WAV cache를 추가하고 변조된 WAV는 cache hit로 인정하지 않습니다.
3. Home의 built-in preset 미리듣기는 neural READY일 때 전용 endpoint를 사용하며 runtime/cache 검증 실패 시 기존 Browser Speech 기기 음성으로 복구합니다.
4. 실제 `<audio>`의 `playing`과 `ended`를 관찰해 `neural-voice-runtime-certification/1` evidence를 기록하며 API 성공만으로 playback complete를 만들지 않습니다.
5. Quality Lab에서 desktop/mobile evidence를 합치고 cache/audio/model/reference identity가 모두 같은 성우만 `SHARED READY`로 표시합니다.
6. `verify-neural-voice-runtime-certification.mjs --require-shared`는 5개 성우 모두 PC·모바일 playback completed와 동일 source identity를 요구합니다.
7. evidence/cache metadata에는 raw 대본, audio URL/blob, 전체 User-Agent, 기기명, reference/sample path를 저장하지 않습니다.

## 검증

- Product version sync: 0.11.32 PASS
- Repository preflight: 55/55 PASS
- Neural runtime/shared cache static contract: PASS
- Targeted cache/setup/CosyVoice API tests: 19/19 PASS
- Runtime model digest route tests: 2/2 PASS
- API pytest: 232/232 PASS (기존 FastAPI deprecated status alias warning 1건)
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- All TS/TSX dependency-free syntax: 261/261 PASS
- Neural runtime verifier 5/5 shared valid-format fixture: PASS (검증기 로직 확인용, 실제 runtime 증거 아님)
- Dependency-based ESLint/Vitest/typecheck/build/Chromium: 로컬 미실행, GitHub Actions final gate

## 품질 경계

- 실제 rights-cleared v4 reference WAV/model은 저장소와 전달 ZIP에 포함하지 않습니다.
- 실제 neural 5/5 `SHARED READY`, 실제 성우 음질, Kakao 실기기 HTTP WAV 성공은 아직 미수집이며 성공으로 표시하지 않습니다.
- valid-format verifier fixture는 schema/verifier 로직 검증용이며 실제 제품 runtime evidence가 아닙니다.
- 서버가 현재 reference/model provenance를 재검증하지 못하면 neural cache를 사용하지 않고 기존 안전한 fallback 경계를 유지합니다.
