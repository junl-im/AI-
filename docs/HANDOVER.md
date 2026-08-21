# SoriON AI MASTER HANDOVER
상태: **절대 필독 · 임시채팅 영구 메모리 원본**
Current baseline: **0.11.33 · Voice Engine Major Hardening**
기준 버전: **0.7.3 Handover Memory Baseline**
최종 갱신: **2026-08-21 18:01 KST**
제품 소유·디자인: **곰같은여우**
서비스명: **SoriON AI / 소리온 AI** · 내부 코드명: **SOA**
> 이 프로젝트는 임시채팅에서 개발 중이다. 대화 메모리를 신뢰하지 않는다.
> 다음 AI 또는 개발자는 작업 전에 이 파일과 루트 `DELIVERY_RULES.md`를 끝까지 읽는다.
> 이 파일은 목표, 사용자 결정, 구현 상태, 연결 현실, 금지 규칙과 다음 작업을 보존하는
> 단일 프로젝트 메모리 원본이다.

## 2026-08-21 KST · 0.11.33 Voice Engine Major Hardening
1. **작업 일시(KST)**: 2026-08-21 18:01 KST.
2. **대상/기준 버전**: `0.11.33 · Voice Engine Major Hardening` / `0.11.32 R2 · CI Static Contract Completion`.
3. **변경 내용**: MY VOICE 실제 서버 파형 재검증·16 kHz mono 정규화·20~30초 권장/30초 상한·29.5초 녹음 hard stop·zero-byte/race 차단, idempotent profile 등록과 Worker 복구 readiness 동기화, CosyVoice `stream=True` 호출 교정, 5개 성우 preset RMS/무음/clipping/canonical WAV gate를 적용했습니다. 사용자용 Final Export UI/API와 과거 0.11.15 apply payload를 제거하고 재유입 verifier를 최신 구조로 교체했습니다.
4. **변경 이유**: 브라우저 분석값 신뢰, Worker 복구 뒤 stale profile, reference format 불일치, 잘못된 CosyVoice positional 인수, 오래된 패치가 폐기 UI를 되살릴 수 있는 위험을 함께 닫기 위해서입니다.
5. **영향 범위**: Web MY VOICE capture/library/voice selection, FastAPI voice-clone/preset diagnostics, CosyVoice Worker adapter, Final Export 공개 표면, 릴리스/검증 문서입니다. 내부 장시간 WAV/자막 soak 도구는 Quality 전용으로 유지합니다.
   릴리스 packaging은 실제 `.env.development/.env.production` 없이 `.env.example`을 검증하는 release-safe Firebase preflight도 포함합니다.
6. **변경·추가된 주요 파일**: `src/{hooks/useVoiceRecorder.ts,voiceclone/*,pages/VoiceClonePage.tsx,voice/voiceChoices.ts}`, `services/api/app/{api/routes/voice_clones.py,storage/voice_clone_store.py,services/voice_preset_validation.py}`, `services/worker/app/adapters/cosyvoice3.py`, `VERIFY_LIVE_VOICE_MYVOICE.mjs`, `docs/VOICE_ENGINE_MAJOR_HARDENING_0_11_33.md`, 관련 테스트와 patch 문서입니다. 공개 export UI/API와 stale apply/payload 파일은 삭제합니다.
7. **검증 결과**: Product version sync **0.11.33 PASS**, API pytest **235/235 PASS**(108+127 분할, 기존 FastAPI deprecated alias warning 1건), Worker pytest **16/16 PASS**, Python compileall **PASS**, Live Voice/MY VOICE verifier **51/51 PASS**, Repository preflight **55/55 PASS**, TypeScript dependency-free syntax **254/254 PASS**, voice preset/evidence/device soak/release readiness/internal verification 계약 **PASS**. 단일 API full run은 88%까지 실패 없이 진행 후 실행 제한으로 중단됐고 동일 40개 test file을 분할해 모두 통과했습니다. Web dependency 기반 lint/Vitest/typecheck/build는 npm registry DNS `EAI_AGAIN` 때문에 로컬에서 완료하지 못해 GitHub Actions final gate입니다.
8. **알려진 제한과 주의사항**: 실제 rights-cleared 5개 성우 WAV/model/동의 문서는 저장소에 없고 manifest는 pending이므로 실제 neural 5/5 음질 성공을 주장하지 않습니다. local-only MY VOICE는 개인정보 경계 때문에 자동 업로드하지 않습니다. 내부 `final_export.py`/export soak는 공개 Final Export 기능이 아니라 품질검사용입니다.
9. **생성 산출물**: `SoriON-AI-0.11.33-voice-engine-major-hardening-full.zip`, `SoriON-AI-0.11.32-r2-to-0.11.33-voice-engine-major-hardening-patch.zip`, `SoriON-AI-0.11.33-voice-engine-major-hardening-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.34 · Neural Voice Field Playback & Release Gate`. 실제 승인 성우 asset과 실기기 MY VOICE/neural playback 증거가 준비된 경우에만 runtime 품질 인증으로 진행하고, GitHub Actions Web gate 실패가 있으면 기능보다 CI 안정화를 우선합니다.

## 2026-08-20 KST · 0.11.32 R2 CI Static Contract Completion
1. **작업 일시(KST)**: 2026-08-20.
2. **대상/기준 버전**: `0.11.32 R2 · CI Static Contract Completion` / `0.11.32 R1 · CI Static Contract Stabilization`, GitHub `main` head `f9d2e8d86f516f6e8aac0141c452830653c2e19b`. 제품 semver는 `0.11.32`를 유지합니다.
3. **변경 내용**: R1 Push 뒤 API Ruff가 같은 `neural_preview_cache.py`의 다음 explicit UTF-8 encode(`style_digest`, `cache_id`)를 UP012로 추가 검출한 것을 확인해 해당 파일의 SHA 입력 문자열을 모두 기본 `str.encode()`로 통일했습니다. Web full Vitest는 `dam-calm`의 의도된 natural speed upper bound `1.16`과 달리 `1.15`를 기대하던 `voiceRecommendation.test.ts` stale assertion에서 실패해 `1.16`으로 갱신했습니다. `check-neural-voice-runtime-cache.mjs`는 neural cache 파일에 `.encode("utf-8")`가 다시 남으면 실패하도록, `check-studio-voice-overhaul.mjs`는 소리 clamp `1.16` 계약을 확인하도록 보강했습니다.
4. **변경 이유**: R1이 첫 UP012 지점만 교정해 같은 파일의 다음 명시적 UTF-8 인자가 연쇄적으로 노출된 문제를 완전히 닫고, 0.11.31의 성우 pace overhaul에서 소리의 상한을 `1.16`으로 올린 production 계약과 테스트를 다시 일치시키기 위해서입니다.
5. **영향 범위**: neural preview cache의 UTF-8 인코딩 표현식과 Web recommendation 테스트/정적 계약, 릴리스 문서만 변경합니다. `str.encode()`의 기본값은 UTF-8이므로 text/style/cache SHA 의미와 neural cache identity는 바뀌지 않으며, 소리의 production natural speed range도 기존 `1.16` 그대로입니다. Neural runtime, Kakao 모바일, Timeline, MY VOICE, 5개 voice persona/pace/cadence production 값은 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `services/api/app/services/neural_preview_cache.py`, `src/tts/voiceRecommendation.test.ts`, `scripts/check-{neural-voice-runtime-cache,studio-voice-overhaul}.mjs`, `FOUNDATION_REPORT.md`, `README.md`, `START_HERE.md`, `docs/{CHANGELOG,HANDOVER,NEXT_UPDATE}.md`, `docs/CI_STATIC_CONTRACT_COMPLETION_0.11.32_R2.md`, `docs/archive/HANDOVER_HISTORY_0.11.4_TO_0.11.9.md`, `docs/patches/0.11.32-r2-ci-static-contract-completion/*`.
7. **검증 결과**: Repository preflight **55/55 PASS**, API pytest **232/232 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 전체 TS/TSX dependency-free syntax **261/261 PASS**, `dam-calm` clamp runtime smoke **speed=1.16 / pitch=1 PASS**, neural cache 파일 explicit `.encode("utf-8")` 잔여 **0건**. 로컬에는 Python 3.10/Ruff package와 Web `node_modules`가 없고 네트워크도 차단되어 실제 Ruff 0.15.22/Vitest 재실행은 다음 GitHub Actions final gate입니다.
8. **알려진 제한과 주의사항**: 실제 Ruff/Vitest/semantic typecheck/Vite build/Chromium 성공은 R2 Push 후 GitHub Actions가 확인해야 합니다. 실제 rights-cleared neural asset과 5/5 SHARED READY도 아직 미수집입니다. HANDOVER 1200줄 안전 상한을 지키기 위해 v0.11.4~0.11.9 상세 이력은 archive로 이동했으며 기록은 삭제하지 않았습니다.
9. **생성 산출물**: `SoriON-AI-0.11.32-r2-ci-static-contract-completion-full.zip`, `SoriON-AI-0.11.32-r1-to-0.11.32-r2-ci-static-contract-completion-patch.zip`, `SoriON-AI-0.11.32-r2-ci-static-contract-completion-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: R2 GitHub Actions가 API Ruff → Web critical/full Vitest → typecheck → build → Chromium/multi-scene까지 green인지 먼저 확인한 뒤 `0.11.33 · Neural Voice Field Playback & Release Gate`로 진행합니다.

## 2026-08-20 KST · 0.11.32 R1 CI Static Contract Stabilization
1. **작업 일시(KST)**: 2026-08-20.
2. **대상/기준 버전**: `0.11.32 R1 · CI Static Contract Stabilization` / `0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache`, GitHub `main` head `f0a2a0d6e081a3e02be6abc80bb31eec297a488b`. 제품 semver는 `0.11.32`를 유지합니다.
3. **변경 내용**: 사용자 제공 GitHub Actions annotations에서 API Ruff UP012(`services/api/app/services/neural_preview_cache.py:52`)와 Web Vitest 준호 pitch assertion(`src/tts/browserSpeech.test.ts:151`)을 확인했습니다. SHA-256 text digest의 `text.encode("utf-8")`를 `text.encode()`로 교정하고, 준호 preset `-1.2 semitone`의 실제 Web Speech pitch `0.9330329915368074`에 맞춰 stale 테스트 하한을 `>0.94`에서 `>0.92`, 상한을 `<0.95`로 명시했습니다.
4. **변경 이유**: Python Ruff 현대화 규칙을 만족하고, 0.11.31에서 의도적으로 강화한 준호 deep persona pitch가 새 Browser Speech 안전 clamp `0.92~1.08` 안에서 정상인데도 이전 테스트 수치 때문에 CI가 실패하는 문제를 production 동작 변경 없이 해소하기 위해서입니다.
5. **영향 범위**: API cache digest 표현식 1곳, Browser Speech 테스트 assertion 2줄, CI 안정화/릴리스 문서입니다. neural preview endpoint/cache identity, audio SHA, preset pace/cadence/pitch production 계산, Kakao 모바일, Timeline/MY VOICE에는 runtime 변경이 없습니다.
6. **변경·추가된 주요 파일**: `services/api/app/services/neural_preview_cache.py`, `src/tts/browserSpeech.test.ts`, `FOUNDATION_REPORT.md`, `README.md`, `START_HERE.md`, `docs/{CHANGELOG,HANDOVER,NEXT_UPDATE}.md`, `docs/CI_STATIC_CONTRACT_STABILIZATION_0.11.32_R1.md`, `docs/patches/0.11.32-r1-ci-static-contract-stabilization/*`.
7. **검증 결과**: Repository preflight **55/55 PASS**, targeted neural preview API tests **4/4 PASS**, API pytest **232/232 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, Ruff UP012 source contract **PASS**, 준호 deep pitch numeric contract **0.9330329915368074 PASS**. 현재 로컬에는 Ruff/Vitest 실행 파일이 없어 실제 Ruff/Vitest 재실행은 다음 GitHub Actions final gate입니다.
8. **알려진 제한과 주의사항**: 사용자 annotations의 5 errors 중 이번에 concrete root cause로 제공된 것은 Ruff 1건과 Vitest assertion 1건입니다. wrapper/final gate 오류는 이 concrete failures의 결과일 수 있으므로 R1 Push 뒤 전체 Actions를 다시 확인해야 합니다. 실제 neural rights-cleared asset/SHARED READY는 여전히 미수집입니다.
9. **생성 산출물**: `SoriON-AI-0.11.32-r1-ci-static-contract-stabilization-full.zip`, `SoriON-AI-0.11.32-to-0.11.32-r1-ci-static-contract-stabilization-patch.zip`, `SoriON-AI-0.11.32-r1-ci-static-contract-stabilization-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: R1 GitHub Actions가 Ruff → critical/full Vitest → typecheck → build → Chromium/multi-scene까지 green인지 먼저 확인한 뒤 `0.11.33 · Neural Voice Field Playback & Release Gate`로 진행합니다.
## 2026-08-20 KST · 0.11.32 Neural Voice Runtime Certification & Shared Preview Cache
1. **작업 일시(KST)**: 2026-08-20.
2. **대상/기준 버전**: `0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache` / 로컬 전달 기준 `0.11.31 · Studio Entry & Voice Character Overhaul`. 작업 시작 시 GitHub `main` 최신 커밋은 `838f5adcaa37e42caea9f802c79814aadf3eafe9`(`0.11.30 R1`)이므로 0.11.31은 아직 Push되지 않았습니다. 이번 PATCH는 반드시 0.11.31 위에 적용합니다.
3. **변경 내용**: verified preset preview를 일반 `/tts/synthesize`에서 분리해 `POST /api/v1/tts/neural-preview` runtime gate를 추가했습니다. 서버는 현재 v4 preset diagnostic과 클라이언트 expected preview cache key를 다시 비교하고 CosyVoice Worker를 force probe해 runtime `model_digest`가 승인 `model_fingerprint`와 같아야 explicit `cosyvoice3` 생성을 허용합니다. `previewCacheKey + normalized text SHA + style SHA` 기반 content-addressed `neural-preview-cache/1`을 추가하고 WAV SHA-256 변조 검사를 수행합니다. 같은 cache ID는 deterministic JobManager ID로 생성 조정을 받습니다. Web은 neural READY에서 전용 endpoint를 사용하고 실패 시 기존 Browser Speech fallback을 유지합니다. 실제 audio `playing`/`ended`를 `neural-voice-runtime-certification/1` observed evidence로 기록하고 Quality Lab에서 PC/mobile cache/audio/model/reference identity가 모두 같을 때만 `SHARED READY`로 표시합니다. CLI verifier와 JSON import/export를 추가했습니다.
4. **변경 이유**: 0.11.30의 manifest READY는 등록 시점 provenance만 확인했으며 실제 요청 시 Worker에 올라온 모델이 같은지, PC와 모바일이 실제로 같은 neural WAV를 들었는지까지 증명하지 못했습니다. 미검증 모델 교체, stale cache, 서로 다른 device asset을 neural 성공으로 오인하지 않도록 runtime source identity와 실제 playback completion을 분리 인증하기 위해서입니다.
5. **영향 범위**: API TTS neural preview endpoint, runtime Worker fingerprint cross-check, server neural preview cache/config, Home preset preview routing, player playback evidence, Quality Lab neural runtime card, CLI verifier, critical Web test/preflight 계약, 릴리스 문서입니다. 0.11.31 studio entry/persona/cadence, MY VOICE, Timeline recovery, Kakao Browser Speech watchdog/exit guard, 일반 TTS endpoint는 유지합니다.
6. **변경·추가된 주요 파일**: `services/api/app/{api/routes/tts.py,schemas/tts.py,services/neural_preview_cache.py,services/setup_diagnostics.py,core/config.py,main.py}`, `services/api/tests/{test_neural_preview_cache.py,test_neural_preview_runtime.py,conftest.py}`, `src/tts/neuralPreviewApi.ts`, `src/quality/{neuralVoiceRuntimeCertification.ts,neuralVoiceRuntimeCertification.test.ts}`, `src/components/evaluation/NeuralVoiceRuntimeCertificationCard.tsx`, `src/components/navigation/LinkedPlayerDock.tsx`, `src/pages/{HomePage,QualityPage}.tsx`, `scripts/{check-neural-voice-runtime-cache.mjs,verify-neural-voice-runtime-certification.mjs,run-preflight.mjs}`, `docs/NEURAL_VOICE_RUNTIME_SHARED_CACHE.md` 및 version/release/patch 문서입니다.
7. **검증 결과**: Product version sync **0.11.32 PASS**, neural runtime/shared cache static contract **PASS**, targeted cache/setup/CosyVoice API **19/19 PASS**, runtime model digest route tests **2/2 PASS**, verifier 5/5 shared valid-format fixture **PASS(검증기 로직 확인용이며 실제 runtime 증거 아님)**, 최종 Repository preflight **55/55 PASS**, API pytest **232/232 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 전체 TS/TSX dependency-free syntax **261/261 PASS**. dependency 기반 ESLint/Vitest/semantic typecheck/Vite build/Chromium은 GitHub Actions final gate입니다.
8. **알려진 제한과 주의사항**: 실제 rights-cleared v4 reference WAV/model은 저장소에 없으므로 실제 neural 5/5 SHARED READY, 혜린 등 실제 neural 음질, Kakao 실기기 HTTP WAV 성공을 주장하지 않습니다. Cache에는 생성 WAV가 저장되지만 reference WAV/원문 대본/audio URL/User-Agent/기기명은 evidence metadata에 저장하지 않습니다. 0.11.31이 GitHub에 아직 없으므로 0.11.32를 main 0.11.30 R1에 직접 덮어쓰면 안 됩니다.
9. **생성 산출물**: `SoriON-AI-0.11.32-neural-voice-runtime-shared-preview-cache-full.zip`, `SoriON-AI-0.11.31-to-0.11.32-neural-voice-runtime-shared-preview-cache-patch.zip`, `SoriON-AI-0.11.32-neural-voice-runtime-shared-preview-cache-SHA256SUMS.txt`를 생성합니다.
10. **다음 예상 업데이트**: `0.11.33 · Neural Voice Field Playback & Release Gate`에서 실제 rights-cleared asset이 준비된 preset부터 Android/iOS/desktop neural HTTP audio를 관찰하고 neural shared evidence를 Release Readiness gate에 연결합니다.
## 2026-08-20 KST · 0.11.31 Studio Entry & Voice Character Overhaul
1. **작업 일시(KST)**: 2026-08-20.
2. **대상/기준 버전**: `0.11.31 · Studio Entry & Voice Character Overhaul` / `0.11.30 R1 · Web Lint Type-Only Import Stabilization`, GitHub `main` head `838f5adcaa37e42caea9f802c79814aadf3eafe9`. 제품 semver는 `0.11.31`로 올립니다. 작업 시작 시 공개/connector 경로로 R1 push-run green을 확정하지 못했지만 R1 코드가 main에 반영된 것은 확인했습니다. 사용자 첨부 화면은 `v0.11.29` Pages 빌드였습니다.
3. **변경 내용**: Landing의 `장문 음성 스튜디오 시작`이 `#text-to-speech-studio`를 sticky header 아래로 자동 정렬하도록 studio entry navigation을 추가했습니다. Masthead 오른쪽 기능형 Current Voice/Engine/CTA를 graphics-only SoriON Signature Visual로 교체했습니다. 5개 built-in preset에 persona/cadence/pace/rhythm metadata를 추가하고 pace를 혜린 1.06, 도윤 1.11, 소리 1.04, 준호 1.05, 민준 1.14로 상향했습니다. Browser Speech는 성우별 text cadence normalization과 더 보수적인 pitch 정책(사용자 pitch 30%, clamp 0.92~1.08)을 사용합니다. Windows System Speech rate quantization은 x16으로 높였습니다. Desktop Drawer/Voice Picker는 persona와 rhythm을 시각화합니다.
4. **변경 이유**: 사용자가 장문 스튜디오 진입 후 타임라인 중간으로 이동하는 UX, 5개 성우가 서로 비슷하게 보이고 들리는 문제, 기본 한국어 말속도가 느리고 어눅하게 느껴지는 문제를 대규모로 개선해달라고 요청했습니다. 시스템 TTS의 timbre 한계를 과한 pitch로 감추지 않고 pace/cadence/persona와 verified neural 경계를 분리하기 위함입니다.
5. **영향 범위**: Landing/Brand masthead, studio entry scroll navigation, built-in voice preset metadata/rate/pitch, Browser Speech text/prosody, Windows System TTS pace mapping, Desktop Voice Drawer/Voice Picker/current voice UI, voice recommendation, CSS, static/preflight/test/release 문서입니다. Neural v4 provenance/promotion, MY VOICE clone, Timeline recovery, Kakao direct user-gesture/watchdog/exit guard는 유지합니다.
6. **변경·추가된 주요 파일**: `src/navigation/studioEntryNavigation.ts`, `src/components/layout/BrandMasthead.tsx`, `src/styles/studio-voice-overhaul.css`, `src/tts/{voicePresets,browserSpeech,voiceRecommendation}.ts`, `src/voice/voiceChoices.ts`, `src/components/workspace/{VoiceRhythmSignature,DesktopVoiceDrawer,VoicePickerSheet,DubbingVoiceControls,VoiceLibrary,LongformComposer}.tsx`, `src/pages/LandingHome.tsx`, `services/api/app/{services/voice_presets.py,engines/tts/system_tts.py}`, 관련 tests, `scripts/check-studio-voice-overhaul.mjs`, `docs/STUDIO_ENTRY_VOICE_CHARACTER_OVERHAUL.md` 및 릴리스 문서입니다.
7. **검증 결과**: Product version sync **0.11.31 PASS**, studio/voice static contract **PASS**, Voice preset static contract **PASS**, mobile studio/reproducible Web static contract **PASS**, 변경 TS/TSX dependency-free syntax **17/17 PASS**, targeted API System/preset tests **16/16 PASS**. 최종 Repository preflight **54/54 PASS**, API pytest **228/228 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 전체 TS/TSX dependency-free syntax **257/257 PASS**입니다. dependency 기반 ESLint/Vitest/semantic typecheck/Vite build/Chromium은 로컬 `node_modules`가 없는 전달 환경이라 GitHub Actions를 최종 gate로 둡니다.
8. **알려진 제한과 주의사항**: OS에 호환 한국어 음성이 하나뿐이면 Browser/System fallback의 실제 timbre는 5개로 완전히 분리되지 않습니다. 이번 패치는 pace/cadence/prosody/UI distinction을 강화하지만 neural 음질 완성을 주장하지 않습니다. 실제 동일 성우 음색은 rights-cleared v4 reference/model이 필요합니다. Kakao WebView가 Speech Synthesis 자체를 막으면 기존 watchdog/외부 브라우저 fallback까지만 보장합니다. 실제 eslint/Vitest/typecheck/build/Chromium은 npm dependency toolchain이 준비된 GitHub Actions가 최종 gate입니다.
9. **생성 산출물**: `SoriON-AI-0.11.31-studio-entry-voice-character-overhaul-full.zip`, `SoriON-AI-0.11.30-r1-to-0.11.31-studio-entry-voice-character-overhaul-patch.zip`, `SoriON-AI-0.11.31-studio-entry-voice-character-overhaul-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache`에서 rights-cleared v4 reference/model이 실제 준비된 preset만 runtime source/cache identity와 PC·모바일 동일 neural preview를 인증합니다.
## 2026-08-20 KST · 0.11.30 R1 Web Lint Type-Only Import Stabilization
1. **작업 일시(KST)**: 2026-08-20.
2. **대상/기준 버전**: `0.11.30 R1 · Web Lint Type-Only Import Stabilization` / `0.11.30 · Neural Voice Reference Intake & Preview Promotion`, GitHub `main` head `a6dcc7e6c9a8008f3e629b52b78380adabb855cd`. 제품 semver는 `0.11.30`을 유지합니다.
3. **변경 내용**: Web quality annotation의 실제 lint 오류는 `src/workspace/homeWorkspaceHelpers.ts`에서 `synthesizeSpeech`가 `ReturnType<typeof synthesizeSpeech>` 타입 계산에만 사용되는데 일반 value import로 선언된 것입니다. `import { synthesizeSpeech }`를 `import type { synthesizeSpeech }`로 교정합니다.
4. **변경 이유**: TypeScript의 타입 전용 의존성을 runtime import로 남기지 않는 ESLint 규칙을 만족하고, 0.11.30 neural preview 기능과 emitted runtime 동작을 바꾸지 않은 채 CI를 안정화하기 위해서입니다.
5. **영향 범위**: TypeScript import declaration과 release/patch 문서만 변경합니다. Neural Voice v4 provenance, preset preview promotion/fallback, API/Worker synthesis, Kakao 모바일, Timeline recovery, MY VOICE runtime semantics는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/workspace/homeWorkspaceHelpers.ts`, `FOUNDATION_REPORT.md`, `README.md`, `START_HERE.md`, `docs/{CHANGELOG,HANDOVER,NEXT_UPDATE}.md`, `docs/WEB_LINT_STABILIZATION_0.11.30_R1.md`, `docs/patches/0.11.30-r1-web-lint-stabilization/*`.
7. **검증 결과**: Product semver `0.11.30` 유지, Repository preflight **53/53 PASS**, API pytest **223/223 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 변경 TypeScript syntax **1/1 PASS**. Local `npm ci --no-audit --no-fund`는 120초 timeout되어 `node_modules/.bin/eslint`가 생성되지 않았으므로 실제 local ESLint/Vitest/typecheck/build는 PASS를 주장하지 않습니다.
8. **알려진 제한과 주의사항**: R1의 최종 Web lint/critical regression/full Vitest/typecheck/build/Chromium 성공은 다음 GitHub Actions가 확인해야 합니다. 이 known CI failure가 green으로 닫히기 전에는 `0.11.31` 기능 패치를 진행하지 않습니다.
9. **생성 산출물**: `SoriON-AI-0.11.30-r1-web-lint-type-import-stabilization-full.zip`, `SoriON-AI-0.11.30-to-0.11.30-r1-web-lint-type-import-stabilization-patch.zip`, `SoriON-AI-0.11.30-r1-web-lint-type-import-stabilization-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: R1 Actions green을 먼저 확인한 뒤 `0.11.31 · Neural Voice Runtime Certification & Shared Preview Cache`로 진행합니다.
## 2026-08-19 KST · 0.11.30 Neural Voice Reference Intake & Preview Promotion
1. **작업 일시(KST)**: 2026-08-19.
2. **대상/기준 버전**: `0.11.30 · Neural Voice Reference Intake & Preview Promotion` / `0.11.29 · Certification Intake & Release Readiness`. 작업 시작 시 GitHub main 최신 커밋은 `70de02eeb19495b69af06bf623274bab383e10cf`(`0.11.29`)였으며 Push 직후라 0.11.29 Actions green은 확인하지 않았습니다.
3. **변경 내용**: Voice preset evidence manifest를 v4로 확장해 neural preview engine/model/reference fingerprint를 보존합니다. `/setup`은 기존 reference WAV/evidence 승인이 usable이고 v4, `cosyvoice3`, 유효한 model SHA-256, 실제 WAV와 일치하는 reference fingerprint가 모두 있을 때만 `neural_preview_ready`와 deterministic `preview_cache_key`를 노출합니다. Quality Lab은 5개 preset의 readiness/provenance를 표시하고 안전한 v4 manifest 템플릿을 다운로드합니다. Home preset preview는 READY가 캐시된 성우만 `cosyvoice3`를 명시적으로 우선 사용하며 미검증 preset은 Browser Speech 기기 음성을 유지합니다.
4. **변경 이유**: 0.11.28에서 시스템 TTS의 과한 pitch 변조는 줄였지만 기기 음성은 동일 성우의 최종 neural 음색이 아닙니다. 실제 reference/model이 존재할 때만 품질을 승격하고, 원본 음성·동의 문서를 제품 저장소에 넣지 않으면서 PC/모바일이 같은 provenance/cache identity를 공유할 운영 경계가 필요했습니다.
5. **영향 범위**: Voice preset manifest/setup diagnostics, Quality Lab reference intake UI, Home preset preview routing, neural preview cache identity, static/preflight 계약, 릴리스 문서입니다. MY VOICE clone, Timeline recovery, 0.11.28 speed/pitch naturalization, 카카오 direct user-gesture/watchdog/exit guard, 일반 v1~v3 preset 생성 호환성은 유지합니다.
6. **변경·추가된 주요 파일**: `services/api/app/schemas/{voice_preset_evidence,setup}.py`, `services/api/app/services/{voice_preset_evidence,voice_preset_approval,setup_diagnostics}.py`, `src/quality/{neuralVoiceReference.ts,neuralVoiceReference.test.ts}`, `src/components/evaluation/NeuralVoiceReferenceCard.tsx`, `src/pages/{HomePage,QualityPage}.tsx`, `src/workspace/homeWorkspaceHelpers.ts`, `scripts/check-neural-voice-reference-contracts.mjs`, `docs/NEURAL_VOICE_REFERENCE_PREVIEW.md`, version/release/patch 문서.
7. **검증 결과**: Product version sync **0.11.30 PASS**, neural Voice static contract **PASS**, targeted API setup/approval **13/13 PASS**, 전체 API pytest **223/223 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**. 최초 preflight는 3/53 실패였고 원인은 새 preview 변수에 대한 기존 mobile static token, `test:web-critical` exact contract, HomePage 1200줄 상한/CHANGELOG 미작성으로 확인했습니다. mobile/reproducible 계약은 수정 후 각각 PASS했고 HomePage helper 분리로 project rule 상한을 통과했습니다. 릴리스 문서 반영 후 final Repository preflight **53/53 PASS**, 변경 TS/TSX dependency-free transpile syntax **9/9 PASS**입니다. Global `tsc -b`는 `node_modules` 부재로 `vite/client`, `vitest/globals`, Node/Vite 패키지 타입을 찾지 못해 semantic PASS를 주장하지 않습니다.
8. **알려진 제한과 주의사항**: 0.11.30에는 실제 성우 reference WAV, 모델 파일, 동의/계약 문서를 포함하지 않습니다. 따라서 기본 설치의 neural READY는 pending일 수 있으며 실제 neural 음질·PC/모바일 동일 음색 성공은 아직 미인증입니다. v1~v3 manifest는 일반 생성에는 계속 usable일 수 있지만 neural preview default로 승격되지 않습니다. 승격된 API 요청 실패 후 Browser Speech fallback은 카카오 WebView 자체의 Speech Synthesis 제한을 없애지는 않으며 기존 watchdog/외부 브라우저 복구가 안전망입니다.
9. **생성 산출물**: `SoriON-AI-0.11.30-neural-voice-reference-preview-promotion-full.zip`, `SoriON-AI-0.11.29-to-0.11.30-neural-voice-reference-preview-promotion-patch.zip`, `SoriON-AI-0.11.30-neural-voice-reference-preview-promotion-SHA256SUMS.txt`. PATCH overlay는 FULL과 1078/1078 files, missing 0 / extra 0 / changed 0으로 일치했고 두 ZIP의 금지 경로는 0건입니다.
10. **다음 예상 업데이트**: `0.11.31 · Neural Voice Runtime Certification & Shared Preview Cache`에서 실제 rights-cleared preset v4 reference/model runtime이 준비된 경우 source/cache identity와 PC·모바일 동일 neural preview를 실증하고, 준비되지 않으면 neural READY를 pending으로 유지합니다.
## 2026-08-19 KST · 0.11.29 Certification Intake & Release Readiness
1. **작업 일시(KST)**: 2026-08-19.
2. **대상/기준 버전**: `0.11.29 · Certification Intake & Release Readiness` / `0.11.28 · Voice Naturalness & Preview Quality` FULL ZIP. 작업 시작 시 GitHub main 최신 커밋은 `0.11.27 R2` 계열이어서 0.11.28을 먼저 적용한 뒤 이번 PATCH를 적용해야 합니다.
3. **변경 내용**: Quality Lab에 Release Readiness 카드를 추가해 Web quality report, Kakao Android/iOS `field-device-certification/1`, Chromium desktop/mobile `chromium-multi-scene/1`, MY VOICE `my-voice-recovery-runtime/1`을 별도 슬롯으로 불러옵니다. CI/Device/Chromium/MY VOICE를 READY/PENDING/BLOCKED로 분리하고 6개가 전부 READY일 때만 Overall CERTIFIED를 허용합니다. Browser-side Web quality는 현재 app version, 8 phase PASS, report/evidence checksum 재계산을 확인합니다. CLI `verify-release-readiness.mjs`도 같은 6개 입력을 받아 `release-readiness/1` summary를 생성하고 `--require-certified`를 지원합니다.
4. **변경 이유**: 기존 인증 증거가 각각 존재했지만 사용자가 릴리스 전에 여러 JSON과 CI 상태를 따로 비교해야 했습니다. 일부 synthetic/UI evidence가 실제 device/runtime 성공과 혼동되지 않으면서 현재 릴리스의 준비 상태를 한눈에 확인할 단일 intake/checklist가 필요했습니다.
5. **영향 범위**: Quality Lab certification intake UI, browser-side evidence parser/checksum summary, release-readiness CLI/preflight 계약, 릴리스 문서입니다. Voice pitch/rate, Kakao direct speech/watchdog, Timeline recovery, MY VOICE 생성 로직, API/Worker synthesis는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/quality/{releaseReadiness.ts,releaseReadiness.test.ts}`, `src/components/evaluation/ReleaseReadinessCard.tsx`, `src/pages/QualityPage.tsx`, `scripts/{verify-release-readiness,check-release-readiness}.mjs`, `scripts/run-preflight.mjs`, `package.json`, `docs/RELEASE_READINESS.md`, 릴리스/패치 문서 및 version sync 파일.
7. **검증 결과**: Product version sync **0.11.29 PASS**, Repository preflight **52/52 PASS**, release readiness static contract **PASS**, 6/6 certified fixture CLI **PASS**, API pytest **220/220 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, TS/TSX dependency-free transpile syntax **250/250 PASS**. 로컬 dependency install은 완료되지 않아 eslint/vitest/tsc/vite 실행 파일이 생성되지 않았고, 전체 dependency 기반 lint/Vitest/typecheck/build/Chromium은 0.11.29 Push 뒤 GitHub Actions 최종 gate입니다.
8. **알려진 제한과 주의사항**: 0.11.29 자체의 GitHub Actions green은 아직 확인 전입니다. 실제 Kakao Android/iOS와 실제 MY VOICE runtime evidence가 없으면 Overall은 의도적으로 PENDING입니다. Browser UI는 GitHub API를 직접 제어하지 않고 Actions artifact의 report JSON을 사용합니다. raw MY VOICE profile/sample data는 readiness summary에 넣지 않습니다.
9. **생성 산출물**: `SoriON-AI-0.11.29-certification-intake-release-readiness-full.zip`, `SoriON-AI-0.11.28-to-0.11.29-certification-intake-release-readiness-patch.zip`, `SoriON-AI-0.11.29-certification-intake-release-readiness-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.30 · Neural Voice Reference Intake & Preview Promotion`에서 권리·동의가 확인된 per-preset reference WAV/model fingerprint를 intake하고 neural preview가 검증된 경우에만 기기 음성보다 우선하도록 승격합니다. 실제 reference가 없으면 Browser/System fallback을 유지하며 품질 성공을 가장하지 않습니다.

## 2026-08-19 KST · 0.11.28 Voice Naturalness & Preview Quality
1. **작업 일시(KST)**: 2026-08-19.
2. **대상/기준 버전**: `0.11.28 · Voice Naturalness & Preview Quality` / `0.11.27 R2 · Recovery Scene Selection Stabilization`.
3. **변경 내용**: 혜린의 시스템 근사 pitch offset을 `+1.5 -> +0.5`로 낮추고 도윤/소리/준호/민준도 `-0.5 / 0 / -1.0 / +0.25`로 재보정했습니다. Browser Speech는 사용자 pitch를 40%만 반영하고 preset offset과 합산한 semitone을 12음 평균율 ratio로 변환한 뒤 Web Speech pitch를 `0.90~1.12`로 제한합니다. Browser Speech UI 메시지는 `기기 음성` 근사 미리듣기임을 명시합니다.
4. **변경 이유**: 사용자 청취에서 특히 혜린이 전자음/금속성으로 들렸고, 기존 `1 + (request.pitch + preset.pitchOffset) / 12` 계산이 시스템 음성에 과한 pitch 변조를 적용했습니다. 시스템 근사에서 억지 캐릭터화를 줄이고 실제 neural voice identity/reference에 음색 책임을 옮기기 위함입니다.
5. **영향 범위**: built-in preset의 Browser Speech/System/eSpeak 근사 pitch 기본값, Browser Speech pitch 계산, preview 설명/테스트/문서입니다. 0.11.24 R1 speed multiplier, MY VOICE clone cadence, Timeline recovery, 카카오 user-gesture/watchdog/exit guard, API/Worker routing은 유지합니다.
6. **변경·추가된 주요 파일**: `src/tts/{voicePresets,browserSpeech}.ts`, 관련 tests, `services/api/app/services/voice_presets.py`, `services/api/tests/test_voice_presets.py`, `src/pages/HomePage.tsx`, `scripts/check-voice-preset-contracts.mjs`, `docs/VOICE_NATURALNESS_AND_PREVIEW_QUALITY.md`, 릴리스/패치 문서.
7. **검증 결과**: voice preset contract **PASS**, Repository preflight **51/51 PASS**, 관련 API preset/Melo tests **8/8 PASS**, API pytest **220/220 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, changed TS/TSX parse **6/6 PASS**입니다. 전체 dependency 기반 Web quality와 Chromium은 0.11.28 Push 뒤 GitHub Actions를 최종 gate로 둡니다. 직전 R2 Actions green은 사용자 확인으로 전달받았습니다.
8. **알려진 제한과 주의사항**: Browser Speech는 OS 설치 음성 자체의 품질 한계를 제거하지 못합니다. 카카오 WebView가 Speech Synthesis 시작을 차단하는 기기에서는 direct user-gesture + watchdog + 외부 브라우저 fallback까지만 보장하며 WebView 엔진 자체를 강제할 수 없습니다. 실제 동일 성우 음색은 검증된 neural reference/model이 필요합니다.
9. **생성 산출물**: `SoriON-AI-0.11.28-voice-naturalness-preview-quality-full.zip`, `SoriON-AI-0.11.27-r2-to-0.11.28-voice-naturalness-preview-quality-patch.zip`, `SoriON-AI-0.11.28-voice-naturalness-preview-quality-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.29 · Certification Intake & Release Readiness`에서 field-device/Chromium/MY VOICE evidence를 한 화면의 release readiness로 결합합니다. 실제 neural reference가 준비되면 별도 voice-quality 승격 경로로 수집합니다.

## 2026-08-19 KST · 0.11.27 R2 Recovery Scene Selection Stabilization
1. **작업 일시(KST)**: 2026-08-19.
2. **대상/기준 버전**: `0.11.27 R2 · Recovery Scene Selection Stabilization` / GitHub main `0.11.27 R1 · Chromium Multi-Scene Runner Stabilization`, Actions run `32206091853`, head `501c46478bfcb2bf15e7ef27d05cdbc978114e07`. 제품 semver는 `0.11.27`을 유지합니다.
3. **변경 내용**: run `32206091853`에서 Web quality/report와 기존 desktop/mobile layout은 실제 PASS했고, multi-scene desktop/mobile만 동일한 `recovery-fixture`의 `사용 불가 MY VOICE 2/3 recovery status` 대기에서 실패했습니다. R2 runner는 3개 카드를 직접 click/Ctrl-click/touch-toggle하지 않고 Timeline UI의 `대사 전체` 명령을 실제로 눌러 Voice clip 3개를 선택합니다. 이후 `voiceBlockCount=3`, `selectedVoiceBlockCount=3`, `unavailableVoiceBlockCount=2`, `selectedUnavailableVoiceBlockCount=2`를 단계별로 확인하고 recovery status/dialog를 검증합니다. 실패 시 `recovery-fixture-diagnostics.json`을 artifact에 남깁니다.
4. **변경 이유**: Vitest의 stale MY VOICE 2/3 계약은 `대사 전체` 선택에서 이미 통과하지만 Chromium runner만 카드별 programmatic 선택을 사용해 React selection update timing에 의존했습니다. production recovery를 바꾸는 대신 runner를 실제 사용자 명령과 같은 경로로 맞추는 것이 안전합니다.
5. **영향 범위**: `scripts/run-chromium-multi-scene-evidence.mjs`, `scripts/check-chromium-multi-scene-evidence.mjs`, CI evidence/릴리스 문서입니다. production Timeline recovery, Voice/TTS, Kakao WebView, MY VOICE Worker/model, API/Worker synthesis, 저장 schema는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `scripts/run-chromium-multi-scene-evidence.mjs`, `scripts/check-chromium-multi-scene-evidence.mjs`, `docs/CHROMIUM_RECOVERY_SCENE_SELECTION_STABILIZATION_0.11.27_R2.md`, `docs/{CHANGELOG,HANDOVER,NEXT_UPDATE}.md`, `README.md`, `START_HERE.md`, `FOUNDATION_REPORT.md`, `docs/patches/0.11.27-r2-recovery-scene-selection-stabilization/*`.
7. **검증 결과**: Repository preflight **51/51 PASS**, Chromium multi-scene static contract **PASS**, changed Node `.mjs` syntax **PASS**, API pytest **220/220 PASS**(기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**입니다. 수정 전 Actions run `32206091853`은 reproducible Web quality/report verify와 기존 desktop/mobile Chromium layout을 실제 PASS했고 multi-scene recovery fixture에서만 실패했습니다. corrected 18-scene runtime은 다음 GitHub Actions를 최종 gate로 둡니다.
8. **알려진 제한과 주의사항**: R2를 Push하기 전에는 18-scene 전체 PASS를 선언하지 않습니다. diagnostics에는 DOM의 aria-label/class와 fixture 문장만 포함하며 실제 사용자 원문/오디오/프로필 정보는 넣지 않습니다. 실 MY VOICE runtime과 Kakao field certification은 실제 evidence가 없으면 계속 pending입니다.
9. **생성 산출물**: `SoriON-AI-0.11.27-r2-recovery-scene-selection-stabilization-full.zip`, `SoriON-AI-0.11.27-r1-to-0.11.27-r2-recovery-scene-selection-stabilization-patch.zip`, `SoriON-AI-0.11.27-r2-recovery-scene-selection-stabilization-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: R2 Web quality가 green이면 `0.11.28 · Voice Naturalness & Preview Quality`로 이동해 혜린을 우선으로 Browser Speech pitch 변조와 neural preview 경계를 개선합니다. 실패가 남으면 해당 CI 실패를 먼저 안정화합니다.

## 2026-08-18 KST · 0.11.27 R1 Chromium Multi-Scene Runner Stabilization
1. **작업 일시(KST)**: 2026-08-18.
2. **대상/기준 버전**: `0.11.27 R1 · Chromium Multi-Scene Runner Stabilization` / GitHub main `0.11.27 · Field Device & MY VOICE Runtime Certification` corrected release, head run `32120737467`. 제품 semver는 `0.11.27`을 유지하고 전달 리비전만 R1로 구분합니다.
3. **변경 내용**: Actions run `32120737467`의 Web quality는 reproducible lint/critical/full Vitest/typecheck/build/report verify와 기존 desktop/mobile layout을 실제 통과했고, 새 multi-scene desktop/mobile runner만 실패했습니다. Desktop `voice-surface-1024`에서는 기본 접힘 상태의 Voice Drawer를 runner가 먼저 펼치고 preview controls mount를 기다린 뒤 상호작용/캡처하며, runner가 펼쳤다면 다시 접어 다음 workspace scene을 compact 상태로 복원합니다. Recovery fixture에서는 `openStudio()`가 reload 후 이미 `.soa-dubbing-workspace`가 복원된 상태를 정상 입력으로 허용하고, 기본 접힘 project rail을 명시적으로 펼쳐 seeded project를 연 뒤 다시 원상복원합니다. `check-chromium-multi-scene-evidence.mjs`가 이 계약을 정적으로 고정합니다.
4. **변경 이유**: 실제 Actions 로그에서 desktop은 `Desktop Voice Drawer 미리듣기 대상을 찾지 못했습니다`, mobile은 `장문 음성 스튜디오 시작 버튼 준비 대기 시간이 초과되었습니다`로 실패했습니다. 두 오류 모두 제품 기능 자체보다 runner가 hidden/collapsed panel과 session-restored workspace를 고려하지 않은 orchestration 가정 때문입니다. Chromium D-Bus/UPower stderr는 headless 환경 노이즈이며 실패 predicate가 아닙니다.
5. **영향 범위**: `scripts/run-chromium-multi-scene-evidence.mjs`, `scripts/check-chromium-multi-scene-evidence.mjs`, CI evidence 문서/릴리스 메타데이터입니다. production Voice 선택/미리듣기, Kakao Speech Synthesis/watchdog, Timeline stale recovery, MY VOICE Worker/model, Voice pace/pitch, API/Worker synthesis 및 저장 schema는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `scripts/run-chromium-multi-scene-evidence.mjs`, `scripts/check-chromium-multi-scene-evidence.mjs`, `docs/CHROMIUM_MULTI_SCENE_RUNNER_STABILIZATION_0.11.27_R1.md`, `docs/{CHANGELOG,HANDOVER,NEXT_UPDATE}.md`, `README.md`, `START_HERE.md`, `FOUNDATION_REPORT.md`, `docs/patches/0.11.27-r1-chromium-multi-scene-runner-stabilization/*`.
7. **검증 결과**: Repository preflight **51/51 PASS**, Chromium multi-scene static contract **PASS**, changed Node `.mjs` syntax **PASS**, API pytest **220/220 PASS** (기존 FastAPI deprecation warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 0.11.27 기준 PATCH overlay **1052/1052 files · missing 0 / extra 0 / changed 0**입니다. 수정 전 GitHub run `32120737467`은 Web quality/report/기존 desktop+mobile Chromium까지 실제 PASS했고 multi-scene 두 단계에서만 실패했습니다. corrected 18-scene runtime은 이 전달 환경에 설치된 Web toolchain/dist가 없어 다음 GitHub Actions를 최종 gate로 둡니다.
8. **알려진 제한과 주의사항**: R1을 GitHub에 Push하기 전에는 multi-scene 18장 전체 PASS를 선언하지 않습니다. runner는 panel을 programmatic click으로 노출하지만 production UI 상태를 변경하는 기능 패치가 아닙니다. 실 MY VOICE runtime과 Kakao 실기기 certification은 기존대로 실제 evidence가 없으면 pending입니다. 사용자 피드백으로 확인된 혜린 등 Browser Speech의 전자음/자연스러움 개선은 CI green 이후 별도 Voice Naturalness 패치에서 처리합니다.
9. **생성 산출물**: `SoriON-AI-0.11.27-r1-chromium-multi-scene-runner-stabilization-full.zip`, `SoriON-AI-0.11.27-to-0.11.27-r1-chromium-multi-scene-runner-stabilization-patch.zip`, `SoriON-AI-0.11.27-r1-chromium-multi-scene-runner-stabilization-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: R1 Web quality가 green이면 `0.11.28 · Voice Naturalness & Preview Quality`로 이동해 혜린을 우선으로 browser preview pitch 변조를 줄이고 neural TTS/reference preview 경계를 강화합니다. 실패가 남으면 새 기능 전에 해당 CI 실패를 먼저 안정화합니다.

## 2026-08-18 KST · 0.11.27 Field Device & MY VOICE Runtime Certification
1. **작업 일시(KST)**: 2026-08-18.
2. **대상/기준 버전**: `0.11.27 · Field Device & MY VOICE Runtime Certification` / `0.11.26 R1 · Web Lint Stabilization` FULL ZIP. R1 lint 안정화 변경을 누락하지 않도록 이번 PATCH 기준은 반드시 0.11.26 R1입니다.
3. **변경 내용**: 카카오톡 Android/iOS에서 실제 preset preview 시도/onstart/실패 원인, 외부 브라우저 요청, exit dialog open, `계속 만들기` close를 `field-device-certification/1` local evidence로 누적합니다. Quality Lab에 field certification 카드를 추가하고 실제 수행자 확인(`operatorConfirmed`) 뒤 JSON을 저장할 수 있습니다. `verify-field-device-certification.mjs`는 direct preview 또는 blocked/watchdog 등 + 외부 브라우저 fallback, exit open/stay close를 검증합니다. `verify-field-runtime-certification.mjs`는 Android/iOS READY와 선택적 desktop/mobile 9+9 Chromium manifest, 실제 MY VOICE completed evidence를 결합하며 `--require-all`에서만 전체 certified를 요구합니다. 추가로 Actions run `32117983645`에서 R1 lint 통과 후 critical regression 65개 중 exit confirmation test 1건이 실패한 원인을 확인했고, 실제 브라우저 Back이 guard entry에서 base entry로 이동한 뒤 `popstate`를 발생시키는 순서를 테스트 helper가 재현하도록 교정했습니다. production `useExitConfirmation.ts` 동작은 이 교정에서 변경하지 않습니다.
4. **변경 이유**: 0.11.25 R1에서 모바일 WebView 복구 코드를 넣었지만 실제 카카오 기기에서 무엇이 일어났는지 저장할 구조가 없었고, 0.11.26의 Chromium fixture와 실제 MY VOICE runtime을 하나의 release certification 흐름에서 구분해 검토할 필요가 있었습니다.
5. **영향 범위**: HomePage 카카오 direct preview 관찰, InAppBrowser 외부 열기 관찰, exit confirmation 관찰, Quality Lab field certification UI, critical regression test 목록, field/runtime CLI verifier, preflight/제품 버전/문서입니다. Voice pace, Timeline recovery scope/Undo, API/Worker 합성 알고리즘, 프로젝트 저장 schema는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/quality/fieldDeviceCertification.ts` 및 test, `src/components/evaluation/FieldDeviceCertificationCard.tsx`, `src/pages/{HomePage,QualityPage}.tsx`, `src/hooks/useExitConfirmation.ts` 및 `useExitConfirmation.test.tsx`, `src/components/layout/InAppBrowserEngineNotice.tsx`, `scripts/{verify-field-device-certification,verify-field-runtime-certification,check-field-runtime-certification,check-web-test-contracts}.mjs`, `package.json`, `scripts/run-preflight.mjs`, `docs/FIELD_DEVICE_RUNTIME_CERTIFICATION.md`와 릴리스/전달 문서입니다.
7. **검증 결과**: 제품 version sync **0.11.27 PASS**, Repository preflight **51/51 PASS**, API pytest **220/220 PASS**(기존 FastAPI deprecation warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 전체 TS/TSX dependency-free transpile **249/249 PASS**, field direct/fallback 및 aggregate `--require-all` verifier fixture **PASS**입니다. GitHub Actions run `32117983645`는 R1 lint를 통과하고 critical regression **64/65 PASS**까지 진행했으며 유일한 실패는 `useExitConfirmation.test.tsx`의 history-state 시뮬레이션 오류였습니다. test harness를 실제 guard→base 이동 후 `popstate` 순서로 교정했으며 다음 Actions 재실행이 최종 확인입니다. 실제 카카오 Android/iOS와 실제 동의된 MY VOICE Worker/model evidence는 현재 환경에 없어 수집하지 않았고 성공으로 표시하지 않습니다.
8. **알려진 제한과 주의사항**: `operatorConfirmed`는 자동으로 true가 되지 않습니다. WebView에서 Speech Synthesis가 실패해도 외부 브라우저 요청까지 실제 관찰되면 fallback path를 field READY로 인정하지만, 외부 브라우저에서 음성 생성 성능 자체를 증명하는 것은 아닙니다. 실제 MY VOICE certification은 `my-voice-recovery-runtime/1` completed evidence가 없으면 pending입니다. 전체 UA, 기기 이름, 프로젝트 원문, 음성/샘플 데이터는 증거에 넣지 않습니다.
9. **생성 산출물**: `SoriON-AI-0.11.27-field-device-my-voice-runtime-certification-full.zip`, `SoriON-AI-0.11.26-r1-to-0.11.27-field-device-my-voice-runtime-certification-patch.zip`, `SoriON-AI-0.11.27-field-device-my-voice-runtime-certification-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.28 · Certification Intake & Release Readiness`. 실제 Android/iOS field JSON, Chromium 18-scene artifact, MY VOICE runtime JSON을 Quality Lab/API에서 intake하고 release readiness를 한 화면에서 판정하되 미수집 항목은 pending으로 유지합니다.

## 2026-08-18 KST - 0.11.26 R1 Web Lint Stabilization
1. **Work date (KST)**: 2026-08-18.
2. **Target/base version**: `0.11.26 R1 - Web Lint Stabilization` / `0.11.26 - Chromium Multi-Scene Evidence & Real MY VOICE Recovery`. Product semver remains `0.11.26`.
3. **Changes**: Fixed all seven lint annotations from GitHub Actions run `32109791257`, job `95626676052`: one unused type error plus six React Hooks/Fast Refresh warnings. Timeline selection now destructures `replaceSelection`; recovery dependencies reference actual unavailable Voice IDs/counts; HomePage drops an unnecessary dependency; VoiceClonePage tracks the latest job through a ref so progress updates do not restart the watcher; LongformComposer no longer re-exports a non-component utility and its test imports that utility from `workspace/scriptPreparation`.
4. **Reason**: The 0.11.26 push passed lock, preflight, API, and Worker jobs but Web quality stopped at ESLint before Vitest/typecheck/build/Chromium could run. CI stabilization must precede 0.11.27 feature work.
5. **Impact scope**: Web lint and React hook lifecycle semantics only. Voice preset pace, mobile Kakao playback/exit guard, stale MY VOICE recovery behavior, Chromium evidence contracts, project schema, API/Worker synthesis, and runtime evidence classification are unchanged.
6. **Major changed/added files**: `src/components/workspace/TimelineEditor.tsx`, `src/hooks/useTimelineEditorBatch.ts`, `src/pages/{HomePage,VoiceClonePage}.tsx`, `src/components/workspace/{LongformComposer.tsx,LongformComposer.test.tsx}`, `docs/WEB_LINT_STABILIZATION_0.11.26_R1.md`, release/handover documents, and patch delivery metadata.
7. **Verification**: GitHub failure root cause confirmed from Actions logs as ESLint 1 error + 6 warnings; Repository preflight **50/50 PASS**; API pytest **220/220 PASS**; Worker pytest **14/14 PASS**; Python compileall **PASS**; targeted TypeScript transpile parse **6/6 PASS**. Local `npm ci` timed out, so ESLint/Vitest/semantic typecheck/Vite build/Chromium are not claimed locally and must be confirmed by the next GitHub Actions run.
8. **Known limits/cautions**: Do not mark R1 CI-green until GitHub Actions passes. In particular, Voice Clone watcher dependencies must not be changed to the entire mutable `job` object because progress updates would repeatedly abort/restart the watcher.
9. **Generated artifacts**: `SoriON-AI-0.11.26-r1-web-lint-stabilization-full.zip`, `SoriON-AI-0.11.26-to-0.11.26-r1-web-lint-stabilization-patch.zip`, `SoriON-AI-0.11.26-r1-web-lint-stabilization-SHA256SUMS.txt`.
10. **Next expected update**: `0.11.27 - Field Device & MY VOICE Runtime Certification`, only after R1 Web quality is green.

## 2026-08-18 KST · 0.11.26 Chromium Multi-Scene Evidence & Real MY VOICE Recovery
1. **작업 일시(KST)**: 2026-08-18.
2. **대상/기준 버전**: `0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery` / `0.11.25 R1 · Mobile WebView Playback & Exit Guard`.
3. **변경 내용**: desktop 1024/1280/1440과 mobile 360/390/430에서 workspace, Voice Drawer/Picker, recovery-impact를 별도 scene으로 캡처하는 `run-chromium-multi-scene-evidence.mjs`를 추가했습니다. 각 PNG SHA-256, layout assertion, Voice preview 선택 변화, stale MY VOICE 2/3 복구 범위를 manifest에 기록합니다. recovery fixture는 IndexedDB 프로젝트를 실제 React UI로 열어 선택 3개 중 unavailable 2개만 대상으로 하는 dialog를 확인합니다. 별도로 `my-voice-recovery-runtime/1` observed runtime evidence verifier를 추가해 실제 Worker/model/동의 프로필 성공을 synthetic UI fixture와 분리합니다.
4. **변경 이유**: 기존 Chromium runner는 workspace 한 scene만 캡처해 0.11.23의 `재생=선택` Voice surface와 0.11.24의 recovery impact dialog를 브라우저 상호작용 수준에서 증명하지 못했습니다. 또한 실제 MY VOICE 성공 증거와 fixture/static 검증을 명확히 분리할 필요가 있었습니다.
5. **영향 범위**: GitHub Actions Web quality evidence, Chromium desktop/mobile browser regression, Voice Drawer/Picker interaction 검증, Timeline stale recovery visual evidence, MY VOICE runtime evidence privacy/provenance 계약, 제품 버전/문서입니다. 실제 Voice 생성 알고리즘, preset pace, Timeline recovery 동작 자체, 프로젝트 저장 schema는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `scripts/run-chromium-multi-scene-evidence.mjs`, `scripts/check-chromium-multi-scene-evidence.mjs`, `scripts/verify-my-voice-recovery-runtime-evidence.mjs`, `.github/workflows/ci.yml`, `package.json`, `docs/MY_VOICE_RECOVERY_RUNTIME_EVIDENCE.md`, `docs/{CHANGELOG,NEXT_UPDATE,HANDOVER}.md` 및 버전/전달 문서입니다.
7. **검증 결과**: 제품 version sync **0.11.26 PASS**, Repository preflight **50/50 PASS**, API pytest **220/220 PASS** (기존 FastAPI deprecated status alias warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 신규 Node `.mjs` syntax 및 MY VOICE runtime evidence verifier 유효 fixture **PASS**입니다. 로컬 `npm ci`는 제한 시간 안에 완료되지 않아 `vite`/`vitest`가 설치되지 않았으므로 실제 Chromium 18-scene 실행과 Web Vitest/lint/typecheck/build는 GitHub Actions 최종 gate로 남깁니다. 실제 동의된 MY VOICE 프로필/Worker/model이 없어 observed runtime evidence는 수집하지 않았으며 성공으로 표시하지 않습니다.
8. **알려진 제한과 주의사항**: multi-scene recovery project는 UI 범위 검증용 fixture이며 실제 MY VOICE Worker 성공이 아닙니다. manifest는 `realWorkerClaimed=false`를 명시합니다. 실 runtime 성공은 `observed-runtime`, consent verified, Worker/model ready, SHA-256 profile fingerprint, completed first-audio/playback evidence가 있을 때만 인정합니다. raw profile ID/샘플 경로/원본 오디오는 evidence JSON에 넣지 않습니다.
9. **생성 산출물**: `SoriON-AI-0.11.26-chromium-multi-scene-my-voice-recovery-evidence-full.zip`, `SoriON-AI-0.11.25-r1-to-0.11.26-chromium-multi-scene-my-voice-recovery-evidence-patch.zip`, `SoriON-AI-0.11.26-chromium-multi-scene-my-voice-recovery-evidence-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.27 · Field Device & MY VOICE Runtime Certification`. 0.11.26 Actions artifact를 실제 검토하고 카카오 Android/iOS 및 실제 동의 MY VOICE Worker 환경에서 field/runtime evidence를 닫습니다.

## 2026-08-18 KST · 0.11.25 R1 Mobile WebView Playback & Exit Guard
1. **작업 일시(KST)**: 2026-08-18.
2. **대상/기준 버전**: `0.11.25 R1 · Mobile WebView Playback & Exit Guard` / `0.11.25 · Web Quality CI Stabilization & Critical Recovery Gate`. 앱·API·Worker 제품 semver는 `0.11.25`를 유지하고 전달 리비전만 R1로 구분합니다.
3. **변경 내용**: 카카오톡 모바일 인앱브라우저에서 preset 미리듣기가 버튼 탭 뒤 React effect/`setTimeout(0)`을 거쳐 시작되던 경로를 보완했습니다. Browser Speech가 선택된 카카오 환경에서는 원래 탭 call stack 안에서 `speechSynthesis.speak()`를 호출하는 direct preview 경로를 사용하고, 일반 플레이어 경로에는 1.8초 start watchdog을 추가해 `onstart`/`onerror`가 오지 않는 WebView에서도 일시정지 아이콘으로 영구 고정되지 않게 했습니다. 카카오 전용 외부 브라우저 안내를 AppShell에 실제 연결하고 외부 브라우저 custom-scheme 이동은 clipboard `await`보다 먼저 같은 사용자 제스처 안에서 실행합니다. 종료 확인은 첫 Back에서 dialog만 열고 `계속 만들기` 때 guard를 다시 쌓으며 `종료`는 base entry에서 `history.back()` 한 번만 수행하도록 단순화했습니다.
4. **변경 이유**: 데스크톱에서는 허용되던 지연된 Web Speech 시작이 모바일 WebView의 user-activation 정책에서 무음/멈춤으로 나타날 수 있었고, 기존 종료 guard의 `popstate` 안 즉시 `pushState` + `history.go(-2)` 방식도 인앱브라우저 back stack에서 불안정할 수 있었기 때문입니다.
5. **영향 범위**: 카카오톡 Android/iOS 인앱브라우저의 built-in preset 미리듣기, Browser Speech player 실패 복구, 인앱브라우저 외부 열기 안내, 앱 종료 확인 back-stack, 관련 critical Web test/preflight 계약입니다. Voice preset 속도, Voice 선택=재생 계약, API/Worker 생성, Timeline recovery, MY VOICE clone runtime은 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/pages/HomePage.tsx`, `src/components/navigation/LinkedPlayerDock.tsx` 및 test, `src/hooks/useExitConfirmation.ts` 및 test, `src/components/layout/{AppShell,InAppBrowserEngineNotice}.tsx`, `package.json`, `scripts/{check-mobile-studio-flow,check-always-on-preset-pc-layout,check-project-rules,check-reproducible-web-quality}.mjs`, `docs/MOBILE_WEBVIEW_PLAYBACK_EXIT_GUARD.md`와 릴리스/전달 문서입니다.
7. **검증 결과**: 제품 version sync **0.11.25 PASS**, Repository preflight **49/49 PASS**, API pytest **220/220 PASS**(기존 FastAPI deprecation warning 1건), Worker pytest **14/14 PASS**, Python compileall **PASS**, 변경된 Node `.mjs` syntax **PASS**입니다. 로컬 전달 환경에 완전한 `node_modules`가 없어 Vitest/ESLint/semantic typecheck/Vite build/실제 Kakao WebView·Chromium은 실행하지 못했으며 GitHub Actions와 실기기 카카오 재확인이 최종 gate입니다.
8. **알려진 제한과 주의사항**: 일부 WKWebView/WebView는 API 객체가 노출되어도 Speech Synthesis 실제 시작을 제한할 수 있습니다. direct user-gesture 경로에서도 1.8초 안에 시작 이벤트가 없으면 실패로 해제하고 외부 브라우저 사용을 안내합니다. 이를 실제 카카오 Android/iOS 음성 성공으로 과장하지 않습니다.
9. **생성 산출물**: `SoriON-AI-0.11.25-r1-mobile-webview-playback-exit-guard-full.zip`, `SoriON-AI-0.11.25-to-0.11.25-r1-mobile-webview-playback-exit-guard-patch.zip`, `SoriON-AI-0.11.25-r1-mobile-webview-playback-exit-guard-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery`. 먼저 R1을 GitHub Actions와 실제 카카오 Android/iOS에서 재검증하고, 녹색이면 workspace / voice-picker / recovery-impact multi-scene 증거와 실제 동의된 MY VOICE runtime 검증으로 진행합니다.

## 2026-08-18 KST - 0.11.25 Web Quality CI Stabilization & Critical Recovery Gate
1. **Work date (KST)**: 2026-08-18.
2. **Target/base version**: `0.11.25 - Web Quality CI Stabilization & Critical Recovery Gate` / `0.11.24 R1 - Voice Pace Calibration`.
3. **Changes**: Fixed the stale Browser Speech pace assertion exposed by GitHub Actions run `32096206966`: with Hyerin `rateMultiplier=1.00`, a requested speed of `1.10` must produce playback rate `1.10`, not a value below it. Added dependency-free protection against the obsolete assertion, an early `critical-regression` Web quality phase for Browser Speech, Voice Drawer preview-selection linkage, Timeline stale MY VOICE subset recovery, and generation-history recovery, plus a first-failure summary artifact.
4. **Reason**: CI must be green before new feature work. The R1 implementation was correct but one old test still encoded the pre-calibration always-slower behavior, so the failure needed a focused stabilization patch and a narrower early failure domain.
5. **Impact scope**: Browser Speech test contract, Web quality phase plan, API Web-quality evidence intake phase contract, repository preflight, failure evidence, product version, and release documentation. Voice pace multipliers, Timeline recovery behavior, engine routing, project schema, and MY VOICE runtime behavior are unchanged.
6. **Major changed/added files**: `src/tts/browserSpeech.test.ts`, `package.json`, `scripts/{web-quality-plan,run-web-quality,check-reproducible-web-quality,check-voice-preset-contracts}.mjs`, `services/api/app/services/web_quality_report.py`, `services/api/tests/test_evidence.py`, `docs/{WEB_QUALITY_CI_STABILIZATION,REPRODUCIBLE_WEB_QUALITY,CHANGELOG,NEXT_UPDATE,HANDOVER}.md`, version-sync files, and patch delivery documents.
7. **Verification**: Product version sync **0.11.25 PASS**; Repository preflight **49/49 PASS**; API pytest **220/220 PASS** with one existing FastAPI deprecation warning; Worker pytest **14/14 PASS**; Python compileall **PASS**; changed Node `.mjs` syntax checks **PASS**. Dependency-based critical/full Vitest, ESLint, semantic typecheck, Vite build, and Chromium were not run locally because the delivery container does not have a complete Web toolchain; GitHub Actions rerun is the final gate.
8. **Known limits/cautions**: Do not describe 0.11.25 as CI-green until the new commit passes GitHub Actions. Real MY VOICE clone success and first-audio latency require a real Worker/model and a consented profile. Multi-stale recovery still changes only unavailable MY VOICE clips, and Undo restores semantic Voice assignment without resurrecting discarded historical audio/job/track state.
9. **Generated artifacts**: `SoriON-AI-0.11.25-web-quality-ci-stabilization-critical-recovery-gate-full.zip`, `SoriON-AI-0.11.24-r1-to-0.11.25-web-quality-ci-stabilization-critical-recovery-gate-patch.zip`, `SoriON-AI-0.11.25-web-quality-ci-stabilization-critical-recovery-gate-SHA256SUMS.txt`.
10. **Next expected update**: `0.11.26 - Chromium Multi-Scene Evidence & Real MY VOICE Recovery`. After 0.11.25 passes GitHub Web quality, capture separate desktop/mobile workspace, Voice Picker/Drawer, and recovery-impact evidence; add real clone recovery runtime evidence only when the real Worker/model and a consented profile are available.

## 2026-08-18 KST · 0.11.24 R1 Voice Pace Calibration
1. **작업 일시(KST)**: 2026-08-18.
2. **대상/기준 버전**: `0.11.24 R1 · Voice Pace Calibration` / `0.11.24 · Recovery Batch & Editor Responsibility Split` FULL ZIP. 앱·API·Worker의 제품 semver는 기존 3자리 규칙에 따라 `0.11.24`를 유지하고 전달 리비전만 R1으로 구분합니다.
3. **변경 내용**: 기본 Voice pace multiplier를 혜린 `1.00`, 도윤 `1.04`, 소리 `0.98`, 준호 `0.98`, 민준 `1.08`로 재보정했습니다. 소리/준호의 `naturalSpeedRange` 상한을 각각 1.15/1.12로 높이고 다른 프리셋 범위도 현재 pace 정책에 맞춰 정리했습니다. Frontend/API의 pace 표를 회귀 테스트와 `check-voice-preset-contracts.mjs`에서 동시에 고정했습니다.
4. **변경 이유**: 기존 UI `1.00×`에서도 혜린 0.96, 소리 0.90, 준호 0.92 multiplier가 다시 곱해져 한국어 일상 발화보다 지나치게 느리게 들릴 수 있었고, 특히 Voice 변경 시 natural range clamp가 사용자가 올린 속도까지 다시 낮출 수 있었기 때문입니다. `1.00× = 자연스러운 한국어 기본 발화`라는 사용자 UX 기준을 명확히 고정합니다.
5. **영향 범위**: Browser Speech/System TTS/MeloTTS의 built-in preset effective speed, Voice 변경 시 natural speed clamp, preset 문서/테스트/static contract입니다. Voice ID, pitch, engine routing, Timeline recovery, 저장 schema, MY VOICE clone runtime은 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/tts/voicePresets.ts`, `src/tts/voicePresets.test.ts`, `src/tts/voiceRecommendation.test.ts`, `services/api/app/services/voice_presets.py`, `services/api/tests/{test_voice_presets,test_melo_tts}.py`, `scripts/check-voice-preset-contracts.mjs`, `docs/VOICE_PRESETS.md`, `docs/VOICE_PACE_CALIBRATION.md`, 릴리스/패치 문서입니다.
7. **검증 결과**: 제품 버전 sync **0.11.24 PASS**, Repository preflight **49/49 PASS**, 관련 API pace regression **8/8 PASS**, API pytest **220/220 PASS**, Worker pytest **14/14 PASS**, Python compileall **PASS**, TS/TSX syntax parse **245/245 PASS**, 0.11.24 기준 PATCH overlay **1020/1020 files · missing 0 / extra 0 / changed 0**입니다. Web Vitest는 로컬 `node_modules`가 불완전해 `vitest` binary가 없어 실행하지 못했습니다. 전역 `tsc`는 시작됐지만 Vite/Vitest/React type definition이 없어 semantic typecheck를 완료하지 못했습니다. ESLint/Vite build/Chromium은 GitHub Actions 최종 gate로 남깁니다.
8. **알려진 제한과 주의사항**: 이 값은 실제 한국인 청취자 benchmark가 아니라 제품 pace calibration입니다. 실제 청취 evidence가 생기기 전에는 더 공격적인 속도 보정을 보증하지 않습니다. MY VOICE는 built-in preset multiplier를 쓰지 않으므로 clone 결과가 느리면 sample cadence/Worker/model을 별도로 확인해야 합니다.
9. **생성 산출물**: `SoriON-AI-0.11.24-r1-voice-pace-calibration-full.zip`, `SoriON-AI-0.11.24-to-0.11.24-r1-voice-pace-calibration-patch.zip`, `SoriON-AI-0.11.24-r1-voice-pace-calibration-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.25 · Web Quality CI Stabilization & Critical Recovery Gate`. R1을 실제 GitHub 기준선에 반영해 Vitest/typecheck/lint/build와 desktop/mobile Chromium을 우선 통과시키고, 실제 Worker/동의 프로필이 있을 때만 MY VOICE stale recovery runtime evidence를 추가합니다.

## 2026-08-18 KST · 0.11.24 Recovery Batch & Editor Responsibility Split
1. **작업 일시(KST)**: 2026-08-18.
2. **대상/기준 버전**: `0.11.24 · Recovery Batch & Editor Responsibility Split` / 사용자가 전달한 `0.11.23 · Focused Voice Surface & Picker Polish` FULL ZIP.
3. **변경 내용**: 다중 선택에서 stale/unavailable MY VOICE만 추려 복구하는 흐름을 추가했습니다. 사용 불가 개수, 원래 Voice 구성, ready/generating 상태와 프로필 유실 수를 보여주고 별도 `복구 영향 확인` dialog에서 실제 대상과 기존 완성 음원 폐기 영향을 확인한 뒤 `교체만 적용` 또는 `교체 후 재생성`을 실행합니다. 동시에 Timeline selection 상태를 `useTimelineEditorSelection.ts`, batch/retry/history/recovery 상태를 `useTimelineEditorBatch.ts`로 분리했습니다. `updateVoiceMany`는 recovery 전용 history label을 받아 Undo/Redo 의미를 명확히 합니다.
4. **변경 이유**: 0.11.22의 단일 stale 복구가 다중 선택에서는 정상 Voice까지 일괄 변경할 위험을 명확히 설명하지 못했고, `TimelineEditor`가 선택·batch·recovery 상태를 함께 소유해 후속 회귀 범위가 컸기 때문입니다. ready stale audio를 자동 파기하지 않는 기존 결정을 유지하면서 실제 영향 범위만 명시적으로 실행하도록 만들고, 편집기 책임을 단계적으로 나눴습니다.
5. **영향 범위**: Timeline 다중 선택/복구 UI, batch command/retry history controller, selection controller, `updateVoiceMany` history label, HomePage batch Voice 연결, 관련 CSS/회귀 테스트/static preflight, 제품 버전/문서입니다. Voice engine/API/Worker 생성 계약, 저장 schema, 최대 2-way bounded parallel, 0.11.23 Voice Picker/Drawer 재생=선택 계약은 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/hooks/{useTimelineEditorSelection,useTimelineEditorBatch}.ts`, `src/components/workspace/TimelineEditor.tsx` 및 tests, `src/hooks/useTimelineGeneration.ts` 및 test, `src/pages/HomePage.tsx`, `src/styles/timeline-voice-recovery.css`, `scripts/check-recovery-batch-editor-split.mjs`, 기존 관련 contract scripts, `docs/RECOVERY_BATCH_EDITOR_RESPONSIBILITY_SPLIT.md`와 버전/패치 문서입니다.
7. **검증 결과**: 제품 버전 sync **0.11.24 PASS**, Repository preflight **49/49 PASS**, API pytest **220/220 PASS**, Worker pytest **14/14 PASS**, Python compileall **PASS**, TS/TSX syntax parse **244/244 PASS**, CSS brace balance **28/28 PASS**, 0.11.23 기준 PATCH overlay **1015/1015 files · missing 0 / extra 0 / changed 0**입니다. Python 3.10 Ruff는 `uv`가 런타임을 받는 단계에서 DNS/network 제한으로 실행하지 못했습니다. 전체 Web Vitest/ESLint/semantic typecheck/Vite build와 실제 desktop/mobile Chromium evidence도 이 전달 환경에 완전한 `node_modules`와 연결된 GitHub 저장소 컨텍스트가 없어 로컬에서 실행하지 않았고 GitHub Actions를 최종 gate로 남깁니다.
8. **알려진 제한과 주의사항**: 다중 복구는 선택 전체가 아니라 unavailable MY VOICE subset만 바꿉니다. 실행 전 ready stale audio는 유지되지만 교체를 실행하면 기존 audio/job/track은 제거되고 queued가 됩니다. Undo는 Voice 배정을 되돌리되 과거 audio 파일을 부활시키지 않습니다. 실제 MY VOICE Worker 성공/first-audio evidence는 모델·동의된 프로필·Worker가 준비된 환경에서만 확인할 수 있습니다.
9. **생성 산출물**: `SoriON-AI-0.11.24-recovery-batch-editor-responsibility-split-full.zip`, `SoriON-AI-0.11.23-to-0.11.24-recovery-batch-editor-responsibility-split-patch.zip`, `SoriON-AI-0.11.24-recovery-batch-editor-responsibility-split-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.25 · Web Quality CI Stabilization & Critical Recovery Gate`. 실제 GitHub Actions Web quality와 desktop/mobile Chromium evidence를 먼저 녹색으로 고정하고, 실제 Worker 환경이 있을 때만 stale MY VOICE 재생성 성공/지연 증거를 추가합니다.

## 2026-08-18 KST · 0.11.23 Focused Voice Surface & Picker Polish
1. **작업 일시(KST)**: 2026-08-18.
2. **대상/기준 버전**: `0.11.23 · Focused Voice Surface & Picker Polish` / GitHub `main` commit `235cfd2b5030efe7c5c7837c5ad9b5c8ed4ab7fd`의 `0.11.22` 코드 상태.
3. **변경 내용**: PC 메인 상단 전체를 지우지 않고 사용자가 지정한 오른쪽 보조 Live Voice 카드만 교체 디자인했습니다. 브랜드/버전/제작자/제품 제목/소개 문구는 유지합니다. Voice Drawer와 Voice Picker의 ▶는 다른 성우일 때 `onVoiceChange`를 먼저 호출한 뒤 preview를 실행해 재생과 선택을 일치시킵니다. Voice Picker는 외곽 sheet의 overflow를 숨기고 내부 `soa-voice-picker-scroll`만 스크롤하도록 분리했습니다. 완료 Export UI에서는 `최종 WAV + 자막` 노출을 제거하고 MP3+자막 완료 동선만 유지합니다.
4. **변경 이유**: 상단 전체 삭제가 아니라 지정 영역만 정리해 디자인을 대체해야 한다는 사용자 결정을 보존하면서, Voice 라이브러리에서 ▶ 재생과 실제 선택 성우가 어긋나는 UX, modal scrollbar가 라운드 밖으로 보이는 문제, 제거 대상으로 지정된 WAV 완료 버튼 잔존을 함께 해결하기 위해서입니다.
5. **영향 범위**: `BrandMasthead`의 오른쪽 보조 카드, Desktop Voice Drawer, Voice Picker Sheet, Final Export 노출 UI, 관련 CSS와 회귀 테스트, 제품 버전/문서입니다. 메인 브랜드 구조, Timeline 생성 계약, Voice engine routing, WAV backend/API 포맷 지원, 저장 schema는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/components/layout/BrandMasthead.tsx`, `src/components/workspace/{DesktopVoiceDrawer,VoicePickerSheet,FinalExportControls}.tsx`, 관련 tests, `src/styles/voice-surface-refresh.css`, `src/styles/index.css`, `docs/VOICE_SURFACE_PICKER_POLISH.md`, 버전/패치 문서입니다.
7. **검증 결과**: Repository preflight **48/48 PASS**, 제품 버전 sync **0.11.23 PASS**, API pytest **220/220 PASS**, Worker pytest **14/14 PASS**, Python compileall **PASS**, TS/TSX syntax parse **242/242 PASS**, CSS brace balance **28/28 PASS**, `최종 WAV + 자막` 비테스트 UI source 잔존 **0건**을 확인했습니다. 현재 전달 환경은 `node_modules`가 없어 dependency 기반 Vitest/ESLint/semantic typecheck/Vite build는 로컬에서 실행할 수 없으며 GitHub Actions Web quality가 최종 gate입니다.
8. **알려진 제한과 주의사항**: 이번 상단 변경은 사용자 지정 보조 카드에만 한정합니다. `최종 WAV + 자막`은 UI에서 제거했지만 서버/내부 WAV 기능을 삭제한 것이 아닙니다. 새 modal 레이아웃의 실제 Chromium pixel evidence는 GitHub Actions/브라우저 실행 환경에서 최종 확인이 필요합니다.
9. **생성 산출물**: `SoriON-AI-0.11.23-focused-voice-surface-picker-polish-full.zip`, `SoriON-AI-0.11.22-to-0.11.23-focused-voice-surface-picker-polish-patch.zip`, `SoriON-AI-0.11.23-focused-voice-surface-picker-polish-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.24 · Recovery Batch & Editor Responsibility Split`. 0.11.22에서 이월한 stale MY VOICE 다중 복구 영향 확인, TimelineEditor batch/selection 책임 분리, 0.11.23 Web quality/Chromium evidence를 진행합니다.

## 2026-08-15 KST · 0.11.22 Timeline Voice Recovery & Quick Navigation
1. **작업 일시(KST)**: 2026-08-15.
2. **대상/기준 버전**: `0.11.22 · Timeline Voice Recovery & Quick Navigation` / `0.11.21 · Selection Continuity & Convenience`.
3. **변경 내용**: 과거 Timeline clip이 삭제·유실되었거나 현재 생성 불가능한 MY VOICE를 참조하면 카드와 빠른 편집기에 `사용 불가 목소리` 상태를 표시합니다. 이미 완성된 audio/track은 자동 폐기하지 않고 계속 미리들을 수 있으며, 사용자가 대체 Voice를 고른 뒤 `교체만 적용` 또는 `교체 후 재생성`을 눌러야 기존 updateVoiceMany 경로가 실행됩니다. 빠른 편집에는 쉼을 건너뛰는 이전/다음 대사와 `Alt+↑/↓` 이동을 추가했고, 이동 전에 0.11.21의 draft autosave를 그대로 실행합니다. 다중 선택은 혼합 voice 수·목소리별 개수·현재 작업 Voice를 함께 표시합니다.
4. **변경 이유**: 0.11.20~0.11.21에서 Voice/Timeline/Player 연계와 draft 보존은 고정했지만, Timeline 자체에 stale MY VOICE가 남아 있으면 사용자는 기존 음원이 왜 재생되면서 새 생성은 실패하는지 알기 어려웠습니다. 또한 긴 대본에서 대사 이동을 위해 클립을 반복 클릭해야 했고, 혼합 voice 다중 선택의 일괄 대상도 현재 Voice와 혼동될 수 있었습니다.
5. **영향 범위**: Timeline 단일/다중 선택 UX, MY VOICE stale 상태 표시, 빠른 편집 navigation, Studio playback static contract, CSS 책임 분리, 관련 Vitest/순수 selection test, 제품 버전과 릴리스 문서입니다. API/Worker 생성 계약, 프로젝트 저장 schema, bounded parallel 최대 2개는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/components/workspace/TimelineEditor.tsx`, `TimelineQuickEditor.tsx`, `TimelineVoiceBlockCard.tsx`, `src/timeline/timelineSelection.ts`, 관련 tests, `src/styles/timeline-voice-recovery.css`, `scripts/check-timeline-voice-recovery-navigation.mjs`, `docs/TIMELINE_VOICE_RECOVERY_QUICK_NAVIGATION.md`입니다.
7. **검증 결과**: API pytest **220/220**, Worker pytest **14/14**, Python compileall, 제품 버전 sync **0.11.22**, dependency-free TS/TSX transpile **240/240**, CSS brace balance **27/27**을 통과했습니다. Repository preflight **48/48 PASS**입니다. npm dependency 설치가 완전하지 않아 로컬 Vitest/ESLint/semantic typecheck/Vite build는 실행하지 못했으며 GitHub Actions Web quality가 최종 gate입니다.
8. **알려진 제한과 주의사항**: stale MY VOICE 복구 화면은 자동 대체를 하지 않습니다. `교체만 적용`을 누르면 기존 `updateVoiceMany` 계약대로 기존 ready audio가 제거되고 queued 상태가 되므로 UI에서 그 영향을 먼저 경고합니다. 실제 MY VOICE Worker를 연결한 생성 성공/지연 증거는 별도 환경이 필요합니다. TimelineEditor는 빠른 편집을 분리했지만 여전히 1,000줄대이므로 batch/selection 책임 추가 분리가 필요합니다.
9. **생성 산출물**: `SoriON-AI-0.11.22-timeline-voice-recovery-quick-navigation-full.zip`, `SoriON-AI-0.11.21-to-0.11.22-timeline-voice-recovery-quick-navigation-patch.zip`, `SoriON-AI-0.11.22-timeline-voice-recovery-quick-navigation-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.23 · Recovery Batch & Editor Responsibility Split`. stale MY VOICE 다중 복구 영향 확인, TimelineEditor batch/selection 책임 추가 분리, 실제 Web quality/Chromium evidence를 우선합니다.

## 2026-08-15 KST · 0.11.21 Selection Continuity & Convenience
1. **작업 일시(KST)**: 2026-08-15.
2. **대상/기준 버전**: `0.11.21 · Selection Continuity & Convenience` / `0.11.20 · Linkage & Convenience`.
3. **변경 내용**: Timeline 빠른 편집 draft가 있는 상태에서 다른 클립을 직접 클릭·범위 선택·토글 선택해도 기존 대사를 먼저 저장한 뒤 선택을 전환합니다. Player/Dock 이동 때만 저장되던 0.11.20 보호를 모든 Timeline 선택 전환으로 확장했습니다. 또한 Timeline 선택에 따른 전역 Voice 동기화가 Multi-Speaker Assist의 이미 확인된 화자 배정을 다시 미확인 상태로 되돌리지 않도록, 화자 추천 seed 갱신을 사용자가 기본 목소리를 명시적으로 바꾼 경우와 분리했습니다.
4. **변경 이유**: 0.11.20에서 Player 연계 저장은 해결됐지만 사용자가 타임라인 클립을 직접 눌렀을 때 미저장 draft가 다음 클립 내용으로 덮일 수 있었고, Timeline 성우 탐색으로 바뀐 전역 `voiceId`가 다중 화자 확인 effect까지 연쇄 실행해 생성 가능 상태를 풀 수 있었습니다.
5. **영향 범위**: `TimelineEditor`의 선택 전환·빠른 편집, `HomePage`의 Voice/Timeline/Multi-Speaker 상태 연계, 관련 Web 회귀 테스트, 제품 버전·릴리스 문서입니다. 생성 엔진, API/Worker 계약, 최대 2-way bounded parallel, 프로젝트 데이터 schema는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/components/workspace/TimelineEditor.tsx`, `src/components/workspace/TimelineEditor.test.tsx`, `src/pages/HomePage.tsx`, `src/pages/HomePage.test.tsx`, `docs/SELECTION_CONTINUITY_CONVENIENCE.md`, 버전/인수인계/패치 문서입니다.
7. **검증 결과**: Repository preflight **47/47**, API pytest **220/220**, Worker pytest **14/14**, 제품 버전 sync **0.11.21**, 변경 TS/TSX dependency-free transpile **4/4**를 통과했습니다. 이 전달 환경에서는 `npm ci`가 시간 제한 안에 완료되지 않아 전체 Web dependency 기반 lint/Vitest/semantic typecheck/Vite build는 GitHub Actions Web quality를 최종 gate로 사용합니다.
8. **알려진 제한과 주의사항**: 빈 문자열은 Timeline 대사로 저장하지 않고 기존 문장으로 되돌리는 기존 안전 규칙을 유지합니다. 삭제된 MY VOICE가 과거 Timeline clip 자체에 남아 있는 경우 기존 완성 음원을 자동 파기·재배정하지 않으며, 해당 stale clip 복구 UX는 다음 패치 후보입니다.
9. **생성 산출물**: `SoriON-AI-0.11.21-selection-continuity-convenience-full.zip`, `SoriON-AI-0.11.20-to-0.11.21-selection-continuity-convenience-patch.zip`, `SoriON-AI-0.11.21-selection-continuity-convenience-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: `0.11.22 · Timeline Voice Recovery & Quick Navigation`. stale MY VOICE clip의 비파괴 복구 안내, 이전/다음 대사 빠른 이동, TimelineEditor 책임 분리와 실제 Web quality/Chromium evidence를 우선합니다.

## 2026-08-15 KST · 0.11.20 Linkage & Convenience
1. Timeline 선택 성우는 현재 Voice 컨트롤과 양방향으로 동기화합니다. 혼합 성우 다중 선택은 기존 현재 Voice를 유지하고 적용 범위에 `여러 목소리`로 표시합니다.
2. Player가 Timeline 선택을 따라 바꿀 때 빠른 편집 draft가 수정 중이면 먼저 저장해 재생 탐색으로 편집 내용이 사라지지 않게 합니다.
3. 모바일 Voice controls와 PC Voice Drawer는 선택된 Timeline 적용 대상을 항상 보여주어 목소리 변경 범위를 예측 가능하게 합니다.
4. MY VOICE 프로필 삭제/유실 뒤 세션의 stale voiceId는 프로필 로딩 완료 후 기본 SoriON Voice로 복구합니다.

## 2026-08-15 KST · 0.11.19 Voice Engine Fast Path + MY VOICE Runtime
1. `MY VOICE`는 장식용 라이브러리가 아니라 `myvoice:<profileId>` ID로 일반 Voice Picker / Drawer / Timeline과 같은 선택 모델을 사용합니다.
2. MY VOICE 생성은 Voice Clone API로 직접 라우팅하며 일반 `/tts` 프리셋 요청으로 보내지 않습니다.
3. Clone 진행은 SSE 우선 + adaptive polling fallback이며, 완료 job 복구·중복 capability probe·프리뷰 취소를 fast path로 최적화합니다.
4. 저장된 engine-ready 프로필은 내 목소리 페이지에서 다시 선택해 샘플 업로드 없이 테스트할 수 있습니다.
5. 프리셋 TTS progressive audio와 browser fallback은 유지하고, MY VOICE에는 TTS 전용 signed-final rehydration을 붙이지 않습니다.
6. 전달 규칙은 전체 프로젝트 FULL + 저장소 루트에 바로 덮어쓰는 PATCH입니다.

## 2026-08-14 KST · 0.11.18 SoriON Voice Deck Visual Identity
1. 랜딩 Live Voice 영역은 기능을 추가하지 않고 프로그램의 첫인상을 담당하는 `Voice Deck`으로 전면 재디자인합니다.
2. 현재 Voice, MY VOICE/SoriON VOICE, Engine, readiness, TTS 진입 계약과 접근성 이름은 유지합니다.
3. 시각 구조는 큰 Voice identity, full-bleed signal waveform, 작은 engine rail, 고대비 CTA의 4단 구성으로 단순화합니다.
4. 전달 규칙은 FULL 전체 프로젝트 + 프로젝트 루트에 바로 덮어쓰는 PATCH를 유지합니다.

## 2026-08-14 KST · 0.11.17 R2 Web Quality Test Collection Hotfix
1. Vitest는 제품 테스트인 `src/**/*.test.{ts,tsx}` / `src/**/*.spec.{ts,tsx}`만 수집합니다. 과거 전달용 `payload/`는 테스트 입력이 아닙니다.
2. Dock 페이지 이동은 다음 animation frame에서 `scrollTo({ top: 0, behavior: 'auto' })`를 실행하는 현재 성능 계약을 유지하며 테스트도 같은 비동기 계약을 검증합니다.
3. 직접 덮어쓰기 PATCH만 적용해 예전 `payload/`가 디스크에 남아 있어도 Web quality가 이를 다시 테스트로 수집하지 않도록 방어합니다.

## 2026-08-14 KST · 0.11.17 Generation Runtime Split & Real Mobile Evidence
1. **대상 버전과 기준**: 0.11.17 / 0.11.16 Timeline Editor Split & Mobile Quick Creation.
2. **핵심 변경**: generation SSE/polling, progressive segment, signed refresh, recovery/fallback, final handoff를 `src/timeline/generationRuntime.ts`로 분리해 hook을 약 679줄로 낮췄습니다.
3. **모바일 증거**: Chromium 360×800, 390×844, 430×932를 Web quality의 별도 mobile visual 단계로 실행하며 touch selection, Dock, overflow, 44px navigation target, batch containment를 검사합니다.
4. **모바일 성능/안전**: Dock navigation memoization, navigation 후 immediate top scroll, safe-area bottom clearance를 적용했습니다.
5. **사용자 명칭 고정**: Dock/페이지 명칭은 `내 목소리`, 메인 workspace navigator는 `텍스트를 음성으로`를 사용합니다.
6. **고정 전달 규칙**: FULL은 전체 프로젝트, PATCH는 저장소 상대 경로 그대로의 직접 덮어쓰기 파일입니다.
7. **다음 목표**: 0.11.18 Timeline Command Split & Longform Soak Evidence.

## 2026-08-14 KST · 0.11.16 Timeline Editor Split & Mobile Quick Creation
1. **대상 버전과 기준**: 0.11.16 / 0.11.15 Mobile Voice Linkage & Source Integration.
2. **핵심 변경**: Timeline voice clip 렌더링을 별도 컴포넌트로 분리하고, 모바일 `＋ / ✓` 다중 선택, Voice Picker 적용 대상 수 안내, 실제 voice clip만 대상에 포함하는 성우 적용, sticky voice/generate control을 추가했습니다.
3. **영향 범위**: `TimelineEditor`, `TimelineVoiceBlockCard`, `DubbingVoiceControls`, `VoicePickerSheet`, `HomePage`, 모바일/타임라인 CSS, 관련 테스트와 버전/문서입니다.
4. **고정 전달 규칙**: FULL은 저장소 전체 프로젝트이며 PATCH는 저장소 경로를 그대로 담아 압축 해제 후 루트에 즉시 덮어쓸 수 있어야 합니다.
5. **다음 목표**: 0.11.17 Generation Orchestrator Split & Mobile Evidence.

## 2026-08-13 KST · 0.11.14 All Workflows Reliability Hardening
1. **작업 일시(KST)**: 2026-08-13 10:28 KST 이후.
2. **대상 버전과 기준 버전**: 0.11.14 / 0.11.13 Focused Creation Surface.
3. **변경 내용**: GitHub Actions 주요 action major를 현재 세대로 갱신하고, manual concurrency를 ref 단위로 격리했습니다. npm cache key를 lock hash 기반으로 안정화했으며 API·Worker uv lock도 일반 Push/PR에서 committed lock을 필수로 만들었습니다. Dependabot에는 API/Worker uv와 GitHub Actions 추적을 추가했습니다.
4. **변경 이유**: 이전 Action major 고정, run-id별 npm cache 누적, 서로 다른 ref의 manual run 충돌 가능성, uv lock 누락을 CI 자동 생성이 가릴 수 있는 재현성 문제, Worker/Actions dependency 업데이트 누락을 제거하기 위해서입니다.
5. **영향 범위**: `.github/workflows/ci.yml`, `.github/dependabot.yml`, CI/project rule 검사, lock/bootstrap/release 문서, 제품 버전·인수인계·릴리스 산출물입니다. 제품 TTS/편집/재생 런타임 동작은 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `scripts/check-ci-failure-domains.mjs`, `scripts/check-project-rules.mjs`, `docs/WORKFLOW_HARDENING_0_11_14.md`, `docs/LOCKFILE_BOOTSTRAP.md`, `docs/RELEASE.md`, `docs/CHANGELOG.md`, `docs/NEXT_UPDATE.md`, `FOUNDATION_REPORT.md`.
7. **검증 결과**: Repository preflight 47/47, CI architecture, project rules, version sync v0.11.14, workflow/dependabot YAML parse, npm/API/Worker lock structure를 통과했습니다. 로컬 Python 3.13.5에서 compileall, API pytest 219/219, Worker pytest 14/14를 통과했습니다. 이 sandbox에는 CI 최소 버전 Python 3.10이 없고 Node도 22.16.0/npm 10.9.2라, Web dependency install은 npm 자체 `Exit handler never called!` 오류로 실패했습니다. GitHub-hosted Node 22.18.0/Python 3.10 run이 최종 판정입니다.
8. **알려진 제한과 주의사항**: Action major를 최신으로 올려도 GitHub-hosted runner/service 자체 장애는 로컬에서 재현할 수 없습니다. runtime soak의 실제 5/30/60분 실행과 Pages environment 보호 규칙은 GitHub 저장소 설정에 의존합니다.
9. **생성한 전체 ZIP과 패치 ZIP 이름**: `SoriON-AI-0.11.14-all-workflows-hardening-full.zip`, `SoriON-AI-0.11.13-to-0.11.14-all-workflows-hardening-patch.zip`.
10. **다음 예상 업데이트**: 0.11.15 Adaptive Longform Soak & Editor Responsibility Split. 장문 2-way soak evidence와 TimelineEditor/useTimelineGeneration 책임 분리를 진행합니다.

## 0.11.13 Focused Creation Surface · 인수인계 보강
- 0.11.12 기준의 첫 제작 화면을 `목소리 → 텍스트 → 생성 및 재생` 중심으로 단순화했습니다.
- 타임라인·다중 화자·Undo/Redo·엔진 라우팅·2-way bounded parallel은 유지했고, Fish Audio는 정보 구조만 참고했습니다.
- 상세 설계는 `docs/FOCUSED_CREATION_SURFACE.md`, 당시 검증 내용은 이전 `FOUNDATION_REPORT.md` 기록을 따릅니다.

## 2026-08-12 KST · 0.11.12 Web quality duplicate-query hotfix
1. **작업 일시(KST)**: 2026-08-12 17:45 KST.
2. **대상 버전과 기준 버전**: 제품 버전 0.11.12 유지 / GitHub commit `3fffe1e8531d79b984809d23859629f7212ceecc` (Undo/Redo test hotfix 적용본) 기준.
3. **변경 내용**: `TimelineEditor.test.tsx`의 중복 `title` 단일 조회를 clip article의 접근성 이름 조회로 교체하고, `DubbingVoiceControls.test.tsx`의 `/도윤/` 전역 단일 텍스트 조회를 `role=status` 추천 요약 영역으로 범위 제한했습니다.
4. **변경 이유**: 0.11.10~0.11.11 UI 개선으로 동일 대사 title이 article/preview에 함께 존재하고, 추천 목소리 이름도 요약/status와 radio card에 동시에 보이는 것이 정상인데 테스트가 단일 요소만 존재한다고 가정해 GitHub Actions Web quality #101에서 Vitest 2건이 실패했습니다. 제품 UI 중복 정보는 의도된 접근성/비교 정보이므로 UI를 제거하지 않고 테스트 selector를 의미 기반으로 고쳤습니다.
5. **영향 범위**: 테스트 2파일과 검증/인수인계 문서만 변경합니다. Timeline, voice picker, playback, engine, persistence 런타임 코드는 변경하지 않습니다.
6. **주요 파일**: `src/components/workspace/TimelineEditor.test.tsx`, `src/components/workspace/DubbingVoiceControls.test.tsx`, `FOUNDATION_REPORT.md`, `docs/{HANDOVER,CHANGELOG,NEXT_UPDATE}.md`, `docs/patches/0.11.12-web-quality-query-hotfix/*`.
7. **검증 결과**: Repository preflight 47/47, API pytest 219/219, Worker pytest 14/14, dependency-free TS/TSX transpile 221/221 통과. 전체 semantic `tsc`/Vitest는 깨끗한 전달본에서 Web 의존성을 설치하지 못해 재실행하지 못했으며 GitHub Actions가 최종 Web gate입니다.
8. **알려진 제한과 주의사항**: 이번 hotfix는 CI 테스트 selector 안정화만 수행합니다. 실제 제품 UI 동작을 바꾸지 않습니다. FastAPI HTTP 422 deprecation warning 1건과 승인 voice WAV/evidence pending 경고는 기존 제한으로 유지됩니다.
9. **산출물**: `SoriON-AI-0.11.12-3fffe1e-web-quality-query-hotfix-patch.zip`, `SoriON-AI-0.11.12-web-quality-query-hotfix-full.zip`, `SoriON-AI-0.11.12-web-quality-query-hotfix-SHA256SUMS.txt`.
10. **다음 예상 업데이트**: 이 hotfix의 새 GitHub Actions run이 녹색인 것을 확인한 뒤 `0.11.13 · Adaptive Longform Soak & Mobile Editing Polish`로 진행합니다.
## 0.11.12 Editing History, Speaker Memory & Engine Routing Trace

- Timeline 편집 history는 20개 bounded past/future stack이며 새 편집 시 redo를 비웁니다.
- 순서-only Undo/Redo는 기존 ready track을 유지하고, text/voice/삭제 복원처럼 음성 의미가 바뀌는 상태는 queued로 안전 복원합니다.
- 새 workspace/session/project restore는 이전 history를 reset합니다.
- Multi-Speaker 최근 배정은 speaker raw text를 저장하지 않고 hash key+voiceId만 최대 24건 저장하며 사용자 confirm gate를 유지합니다.
- 장문 완료 메시지는 engine routing trace(engine usage/switch/fallback/attempted engine count)를 포함합니다.
- 동시성은 최대 2를 유지하며 실제 soak evidence 전 자동 상향하지 않습니다.
- 전용 계약: `scripts/check-edit-history-speaker-routing.mjs`.
- 상세 설계: `docs/EDITING_HISTORY_SPEAKER_MEMORY_ENGINE_TRACE.md`.

## 0.11.11 Mobile Studio Flow & Natural Voice Playback
1. **작업 일시/기준**: 2026-08-12 14:13 KST 이후 · 0.11.10 Horizontal Timeline Workspace 기준.
3. **핵심 변경**: 모바일 홈 Player+Dock 일관화, 현재 voice 1개+Sheet 비교, preset 상황/장점/주의점, preview-only, 대본 추천/운율 범위 보정, composer 상단 정렬, 모바일 horizontal timeline full-width, 생성 음성 play 상태 즉시 연결.
4. **음성 안전 원칙**: 추천은 자동 적용하지 않으며 natural range도 실제 음질 보장이 아닙니다. 승인 WAV·동의·사람 검수 전에는 preset 자연스러움을 완료로 판정하지 않습니다.
5. **재생 계약**: store-driven play request는 UI playing state를 즉시 반영하고 native media play가 실패하면 원복·오류 표시합니다.
6. **검증**: preflight 46/46, API 219/219, Worker 14/14, TS/TSX transpile 215/215, Python compileall 통과. 최종 overlay 수치는 FOUNDATION_REPORT를 따릅니다.
7. **다음**: 0.11.12 Editing History & Engine Soak Polish.
## 0.11.10 Horizontal Timeline Workspace
- PC ruler·clip·playhead를 동일 time-to-pixel X축으로 통일하고 duration 비례 가로 clip strip, track/ruler scrub, clip selection/reorder 분리를 도입했습니다.
- 검증은 preflight 45/45, API 219/219, Worker 14/14, TS/TSX 213/213, overlay 933/933이며 자세한 내용은 `docs/HORIZONTAL_TIMELINE_WORKSPACE.md`와 당시 `FOUNDATION_REPORT.md` 기록을 따릅니다.

## 0.11.8 Fast One-Flow & Safe Parallel Generation

1. **작업 일시(KST)**: 2026-08-11 11:05 이후.
2. **대상 버전과 기준 버전**: 0.11.8 / GitHub Web quality 통과한 0.11.7 One-Flow Dubbing UX + Web quality hotfix.
3. **변경 내용**: 첫 대사를 우선 생성·자동 재생하고 나머지는 최대 2개 bounded parallel로 생성합니다. 완료 순서와 무관하게 player queue를 원문 timeline 순서로 복원하고, 생성 진행률·대기 수·중지, 현재 대본 첫 문장 미리듣기, SRT/VTT clipboard 자동 정리와 `말하기 좋게 정리`를 One-Flow에 추가했습니다. 전체 비우기도 batch run token을 무효화하고 active 요청을 abort합니다. 버전 도구는 API version fixture 8개를 자동 갱신·검사합니다.
4. **변경 이유**: 0.11.7은 첫 사용 동선을 단순화했지만 긴 대본 전체 생성이 완전 순차라 engine load awareness를 충분히 활용하지 못했고, 실제 대본 미리듣기·붙여넣기 정리·생성 중 중지/진행 가시성이 부족했습니다. 빠른 처리와 기존 순서·복구 안전성을 동시에 유지하기 위해 bounded parallel과 명시적 cancellation/order restoration을 도입했습니다.
5. **영향 범위**: One-Flow composer/HomePage, timeline generation, player queue store, script preparation, bounded batch helper, 관련 테스트·CSS, preflight/version tooling, 앱·API·Worker 버전과 릴리스 문서입니다. 기존 engine circuit breaker, recovery evidence/session safety, explicit engine 선택 계약은 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/components/workspace/LongformComposer.tsx`, `src/pages/HomePage.tsx`, `src/hooks/useTimelineGeneration.ts`, `src/store/usePlayerStore.ts`, `src/workspace/{scriptPreparation,boundedBatch}.ts`, `src/player/queueOrder.ts`, 관련 테스트, `src/styles/one-flow-dubbing.css`, `scripts/check-one-flow-dubbing-ux.mjs`, `scripts/{set-app-version,check-version-sync}.mjs`, `docs/FAST_ONE_FLOW_SAFE_PARALLEL.md`.
7. **검증 결과**: Repository preflight 43/43, API pytest 219/219, Worker pytest 14/14, Python compileall, 제품 버전 sync v0.11.8, dependency-free TS/TSX transpile 207/207, script preparation + bounded batch + queue ordering runtime smoke를 통과했습니다. 직전 0.11.7 Web quality hotfix 기준 49파일 overlay와 실제 생성 patch/full ZIP 재적용 모두 916/916 files · missing 0 · extra 0 · changed 0으로 일치했습니다. 전체 npm Web ESLint/Vitest/semantic typecheck/Vite/Chromium은 로컬 dependency install 불완전으로 미실행이며 GitHub Actions가 최종 gate입니다.
8. **알려진 제한과 주의사항**: 병렬도는 최대 2이며 장시간 soak에서 실패율·P95·engine switching 영향을 추가 검증해야 합니다. `말하기 좋게 정리`는 의미를 AI로 재작성하지 않습니다. 명시적 `화자: 대사`는 현재 수만 감지하고 자동 voice 배정은 하지 않습니다. 승인 Chromium baseline이 없으므로 baseline-required CI는 아직 강제하지 않습니다.
9. **생성한 전체 ZIP과 패치 ZIP 이름**: `SoriON-AI-0.11.8-fast-one-flow-safe-parallel-full.zip`, `SoriON-AI-0.11.7-to-0.11.8-fast-one-flow-safe-parallel-patch.zip`.
10. **다음 예상 업데이트**: 0.11.9 Multi-Speaker Assist & Approved Visual Baseline. 명시적 화자 라벨 기반 승인형 voice mapping, clip-level voice 저장/복원, 0.11.8 bounded-parallel soak evidence, 승인된 1024/1280/1440 Chromium baseline gate와 생성 중지 후 남은 대사 원클릭 재개를 검토합니다.

## 0.11.7 One-Flow Dubbing UX

1. **작업 일시(KST)**: 2026-08-10 17:12 이후.
2. **대상·기준 버전**: 0.11.7 / 0.11.6 Recovery Evidence Classification & Session Safety.
3. **사용자 목표**: 클로바더빙처럼 처음 써도 바로 생성할 만큼 단순하면서 기존 상용 도구 이상의 대량 편집·복구·엔진 자동화 능력을 숨기지 않는 편의성 대폭 강화.
4. **기본 흐름**: 새 프로젝트는 좌우 프로 패널과 빈 타임라인을 접고 중앙에서 빠른 목소리 → 대본 → 바로 더빙 → 첫 결과 자동 재생으로 완료합니다. `Ctrl/Cmd+Enter`도 같은 생성 경로입니다.
5. **고급 기능 보존**: 헤더 `프로 패널`로 좌우 패널을 동시에 펼치며 개별 접기·리사이즈, 전체 Voice Picker, 속도·높낮이·말투, 기존 batch/keyboard/recovery 기능은 유지합니다.
6. **대본 Intake**: TXT·MD·SRT·VTT를 선택 또는 drag-and-drop으로 읽고 SRT/VTT cue 번호·타임코드·단순 태그를 제거합니다. 원본 파일은 session snapshot에 저장하지 않습니다.
7. **상태 단순화**: 제작 기록은 접힌 details로 축소하고 빈 프로젝트 타임라인은 숨깁니다. `빈 대사부터 직접 편집`은 기존 타임라인 편집기로 즉시 진입합니다.
8. **레이아웃 계약**: `sorion.desktop-studio-layout.v3`, 새 기본은 양쪽 collapsed이며 1024/1280/1440 center 예상 폭은 900/1156/1316입니다.
9. **검증**: 최종 검증 수치는 `FOUNDATION_REPORT.md`를 따른다. 승인 Chromium pixel baseline 강제는 여전히 별도 0.11.8 범위다.
10. **다음 업데이트**: 0.11.8 Approved Visual Baseline & Engine Soak Provenance.

## 0.11.6 Recovery Evidence Classification & Session Safety

1. **작업 일시(KST)**: 2026-08-10 16:27 이후.
2. **대상·기준 버전**: 0.11.6 / 0.11.5 Editor Command UX & Adaptive Engine Load Awareness + Web quality visual-runner hotfix.
3. **변경 내용**: recovery evidence를 observed-device/synthetic-injection/not-applicable로 분리하고 synthetic injection이 실기기 certification을 만족하지 못하도록 API에서 강제합니다. workspace session v3에는 개인정보 최소 batch retry 집계 snapshot을 추가합니다.
4. **세션 안전성**: 최근 6건·retry count 최대 3회, 완료시각과 성공/실패/건너뜀·실패 분류만 저장합니다. clip ID·원문·음원·상세 오류 문자열은 저장하지 않습니다. v1/v2 session은 빈 retry snapshot으로 호환 복원합니다.
5. **증거 호환**: 신규 evidence bundle은 schema v3이며 기존 v2 bundle verifier는 유지합니다. Recovery Path Injection export에는 synthetic provenance를 명시합니다.
6. **검증**: recovery/evidence 집중 API 30/30, 전체 API 219/219, Worker 14/14, Python compileall, dependency-free TS/TSX 201/201과 계약 검사를 통과했습니다. Repository preflight 42/42와 0.11.5 visual-runner hotfix 기준본 + 48파일 overlay 897/897 files · missing 0 / extra 0 / changed 0을 통과했습니다.
7. **제한**: 승인 Chromium baseline PNG는 아직 없으므로 baseline-required CI는 강제하지 않습니다. active-request engine routing 장시간 soak와 구조 변경 snapshot Undo는 미완료입니다.
8. **다음 업데이트**: 0.11.7 Approved Visual Baseline Enforcement & Engine Soak Provenance.

## 0.11.3 Failure-Guided Editing & Adaptive Performance Routing

1. **작업 일시(KST)**: 2026-08-07 18:12 이후.
2. **대상 버전과 기준 버전**: 0.11.3 / 0.11.2 Batch Recovery UX & Adaptive Engine Routing.
3. **변경 내용**: 일괄 재생성 실패를 엔진·프리셋·연결·취소·기타로 분류해 결과 UI에서 원인 그룹별 재시도를 제공하고 빠른 실패 재시도는 3회 상한을 둡니다. 엔진 auto 라우팅은 최소 4개 최근 표본의 EWMA 안정도·지연을 120초 관찰창에서 평가해 느리거나 불안정한 엔진을 임시 감점합니다.
4. **변경 이유**: 실패 클립만 자동 선택하는 것만으로는 같은 원인의 실패를 반복하기 쉬웠고, circuit이 열리지 않은 상태에서도 장시간 느린 엔진이 설정 순서만으로 계속 우선될 수 있어 실사용 체감 지연을 줄일 보조 신호가 필요했습니다.
5. **영향 범위**: TimelineEditor/useTimelineGeneration batch 계약·UI, EngineOrchestrator/config/main, Engine Doctor·Quality Diagnostics 표시, batch/adaptive routing preflight, 버전·문서입니다. 명시적 엔진 선택과 circuit cooldown/half-open 복구 계약은 유지합니다.
6. **변경·추가된 주요 파일**: `src/hooks/useTimelineGeneration.ts`, `src/components/workspace/TimelineEditor.tsx`, `src/styles/dubbing-overlays.css`, `services/api/app/services/engine_orchestrator.py`, `services/api/app/core/config.py`, `src/components/evaluation/{EngineDoctorCard,QualityDiagnosticsCard}.tsx`, `scripts/check-batch-recovery-adaptive-routing.mjs`, `docs/FAILURE_GUIDED_EDITING_PERFORMANCE_ROUTING.md`.
7. **검증 결과**: API pytest 214/214, Worker pytest 14/14, Engine orchestrator 22/22를 통과했습니다. Repository preflight 40/40, dependency-free TS/TSX transpile 201/201, Python compileall을 통과했습니다. 공식 0.11.2 기준본 대비 변경 범위는 추가 3 + 수정 37 = 총 40파일, 삭제 0입니다. 0.11.2 기준본에 패치 ZIP을 실제 적용한 결과 882/882 files · missing 0 / extra 0 / changed 0으로 완성본과 일치했습니다. 프로젝트 `node_modules`가 없어 동일 GitHub Actions Web ESLint·semantic typecheck·Vitest·Vite build는 Actions가 최종 판정합니다.
8. **알려진 제한**: EWMA 성능 감점은 현재 API 프로세스 메모리의 auto 선택 보조 신호이고 음질 benchmark가 아닙니다. 실제 CosyVoice 전용 WAV/권리 자료 부재 제한은 유지됩니다.
9. **산출물**: `SoriON-AI-0.11.3-failure-guided-editing-adaptive-performance-routing-full.zip`, `SoriON-AI-0.11.2-to-0.11.3-failure-guided-editing-adaptive-performance-routing-patch.zip` 예정.
10. **다음 예상 업데이트**: 0.11.4 Visual Baseline Approval & Recovery Provenance. pixel baseline 승인, soak provenance, 실제 OS 복귀 증거 분리를 우선합니다.

## 0.11.2 Batch Recovery UX & Adaptive Engine Routing

1. **작업 일시(KST)**: 2026-08-07 17:07 이후.
2. **대상 버전과 기준 버전**: 0.11.2 / 0.11.1 Visual Regression & Safe Batch Voice Editing.
3. **변경 내용**: 다중 일괄 재생성 결과를 성공·실패·건너뜀으로 반환하고 UI에 유지하며, 실패가 있으면 실패 클립만 자동 선택해 즉시 재시도할 수 있게 했습니다. 타임라인에 대사 전체/실패만 빠른 선택을 추가했습니다. 엔진 auto 라우팅은 circuit open 전 최근 실패 뒤 짧은 soft-degrade 감점을 적용합니다.
4. **변경 이유**: 기존 실패만 재시도는 사용자가 실패 클립을 다시 확인해야 했고 결과가 선택 전환과 함께 사라질 수 있었습니다. 엔진은 circuit 임계치에 도달하기 전 같은 실패 엔진을 다음 auto 요청이 바로 다시 선택할 수 있어 연속 체감 실패를 줄일 1차 완충이 필요했습니다.
5. **영향 범위**: TimelineEditor/useTimelineGeneration/HomePage batch 계약, 엔진 orchestrator·schema·config·diagnostics, Engine Doctor/Quality Lab, repository preflight, 버전·문서입니다. 명시적 엔진 선택과 0.11.0 half-open 복구 계약은 유지합니다.
6. **주요 파일**: `src/components/workspace/TimelineEditor.tsx`, `src/hooks/useTimelineGeneration.ts`, `services/api/app/services/engine_orchestrator.py`, `services/api/app/schemas/engine.py`, `services/api/app/services/engine_diagnostics.py`, `src/components/evaluation/EngineDoctorCard.tsx`, `scripts/check-batch-recovery-adaptive-routing.mjs`, `docs/BATCH_RECOVERY_ADAPTIVE_ENGINE_ROUTING.md`.
7. **검증 결과**: API pytest 213/213, Worker pytest 14/14, Repository preflight 40/40, dependency-free TS/TSX transpile 201/201, Python compileall, 제품 버전 sync를 통과했습니다. `npm ci --ignore-scripts`는 내부 registry의 `zustand@5.0.8` 404로 중단되어 실제 ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions가 최종 판정합니다. 0.11.1 기준본에 54개 변경 파일을 직접 overlay한 결과 879/879 files · missing 0 / extra 0 / changed 0으로 일치했습니다.
8. **알려진 제한**: soft-degrade 런타임 상태는 API 프로세스 메모리이며 재시작 시 초기화됩니다. 감점은 음질 평가가 아니라 최근 실패를 이용한 auto 선택 안정화 신호입니다. 실제 CosyVoice 전용 WAV/권리 자료 부재 제한도 유지됩니다.
9. **산출물**: `SoriON-AI-0.11.2-batch-recovery-ux-adaptive-engine-routing-full.zip`, `SoriON-AI-0.11.1-to-0.11.2-batch-recovery-ux-adaptive-engine-routing-patch.zip` 예정.
10. **다음 예상 업데이트**: 0.11.3 Visual Baseline Approval & Recovery Provenance. pixel baseline 승인, soak provenance, 실제 OS 복귀 증거 분리, batch 실패 원인 그룹화를 우선합니다.

## 0.11.1 Visual Regression & Safe Batch Voice Editing

1. **작업 일시(KST)**: 2026-08-07 16:42 이후.
2. **대상 버전과 기준 버전**: 0.11.1 / 0.11.0 Adaptive Engine Resilience & Recovery.
3. **변경 내용**: 다중 선택 voice 변경 preview, 목소리 적용/적용 후 재생성, 실패만 재시도, Browser voice inventory 프리셋 배정 diff, Chromium 1024·1280·1440px production layout evidence 단계를 추가했습니다.
4. **변경 이유**: 다중 선택이 이동·삭제에만 머물러 실제 편집 효율이 낮았고, 음성 목록 변경 뒤 어떤 프리셋 배정이 달라졌는지와 Compact Dock/3분할이 실제 브라우저 폭에서 유지되는지 자동 증거가 필요했습니다.
5. **영향 범위**: TimelineEditor, useTimelineGeneration, HomePage 연결, Engine Doctor, browserVoiceInventory v2, Web CI visual layout runner, preflight 계약, 버전·문서입니다. 0.11.0 엔진 회복력 정책은 변경하지 않습니다.
6. **주요 파일**: `src/components/workspace/TimelineEditor.tsx`, `src/hooks/useTimelineGeneration.ts`, `src/tts/browserVoiceInventory.ts`, `src/components/evaluation/EngineDoctorCard.tsx`, `scripts/run-visual-layout-regression.mjs`, `scripts/check-visual-layout-regression.mjs`, `.github/workflows/ci.yml`, `docs/SAFE_BATCH_VOICE_EDITING_VISUAL_REGRESSION.md`.
7. **검증 결과**: API pytest 211/211, Worker 14/14, Repository preflight 39/39, Python compileall, dependency-free TS/TSX transpile 201/201을 통과했습니다. npm 설치는 내부 registry의 `zustand@5.0.8` 404로 중단됐습니다. 관리형 Chromium 144는 이 환경에서 loopback URL을 정책 차단해 실제 앱 screenshot 실행은 불가했고 GitHub Actions가 production visual layout의 최종 판정입니다.
8. **알려진 제한**: 0.11.1 Chromium 검사는 DOM 실측 + PNG/SHA evidence이며 pixel baseline diff는 아직 강제하지 않습니다. 실제 CosyVoice WAV/권리 자료 부재 제한도 유지됩니다.
9. **산출물**: 0.11.1 전체 ZIP과 0.11.0→0.11.1 덮어쓰기 패치를 생성합니다.
10. **다음 예상 업데이트**: 0.11.2에서 승인된 pixel baseline 비교, batch 결과 요약/재시도 횟수, soak provenance와 실제 OS 복귀 evidence 분리를 진행합니다.

## 0.11.0 Adaptive Engine Resilience & Recovery

1. **작업 일시(KST)**: 2026-08-07 15:55 이후.
2. **대상 버전과 기준 버전**: 0.11.0 / 0.10.8 CI Test Contract Stability Hotfix. 사용자 요청으로 기존 0.10.9 UI 계획보다 엔진 안정화를 우선했습니다.
3. **변경 내용**: 엔진 circuit breaker를 cooldown 뒤 단일 half-open probe 방식으로 강화하고 반복 복구 실패의 bounded exponential backoff, 명시적 엔진 선택의 circuit 준수, 취소 시 probe 해제, preset incompatibility 비장애 처리와 런타임 성공률·지연·격리 이력을 추가했습니다. 수동 runtime reset은 System 음성/eSpeak 재탐지, Melo 모델 unload, CosyVoice Worker probe를 먼저 수행합니다.
4. **변경 이유**: 기존 회로차단기는 cooldown 종료 직후 여러 요청이 장애 엔진으로 동시에 재진입할 수 있었고, 특정 엔진 고정 요청은 circuit을 우회할 수 있었습니다. 또한 엔진 설치·Worker 상태가 바뀐 뒤 API 재시작 없이 안전하게 재탐지하고 복구 상태를 운영 화면에서 판단할 수 있는 경로가 필요했습니다.
5. **영향 범위**: API engine orchestration·schema·config·reset route, System/Melo/CosyVoice TTS runtime refresh, Quality diagnostics, Web engine catalog 선택/재조회, Quality Lab·Engine Doctor 운영 UI, 엔진 회복력 preflight·회귀 테스트, 제품 버전·릴리스 문서입니다. Browser Speech fallback, SOA-4022, 프리셋 성별 안전 규칙은 유지합니다.
6. **변경·추가된 주요 파일**: `services/api/app/services/engine_orchestrator.py`, `services/api/app/api/routes/engines.py`, `services/api/app/schemas/engine.py`, `services/api/app/services/engine_diagnostics.py`, `services/api/app/engines/tts/system_tts.py`, `melo_tts.py`, `cosyvoice_worker_tts.py`, `src/tts/voiceApi.ts`, `src/hooks/useEngineCatalog.ts`, `src/components/evaluation/QualityDiagnosticsCard.tsx`, `EngineDoctorCard.tsx`, `scripts/check-engine-resilience.mjs`, `docs/ENGINE_RESILIENCE_AND_RECOVERY.md`.
7. **검증 결과**: API pytest 211/211, Worker pytest 14/14, Repository preflight 38/38, 제품 버전 sync v0.11.0, Python compileall, dependency-free TS/TSX transpile 201/201, 0.10.8 기준본 overlay 적용 후 완성본 870/870파일 SHA 일치(missing 0 / extra 0 / changed 0)를 통과했습니다. 현재 환경에는 Web node_modules와 Python 3.10용 Ruff 0.15.22 CLI가 없어 GitHub Actions 동일 ESLint·semantic typecheck·Vitest·Vite build·Ruff 명령은 로컬에서 직접 실행하지 못했으며 Actions가 최종 판정합니다.
8. **알려진 제한과 주의사항**: circuit runtime 지표는 현재 API 프로세스 메모리에 있으므로 재시작 시 초기화됩니다. 실제 CosyVoice 5종 WAV·동의/권리·검수 자료·모델 가중치가 없으면 전용 프리셋을 가장하지 않습니다. 수동 reset은 실제 환경 수정 후 재탐지 도구이며 장애를 숨기기 위한 반복 강제 reset 용도가 아닙니다.
9. **생성한 전체 ZIP과 패치 ZIP 이름**: `SoriON-AI-0.11.0-adaptive-engine-resilience-recovery-full.zip`, `SoriON-AI-0.10.8-to-0.11.0-adaptive-engine-resilience-recovery-patch.zip`.
10. **다음 예상 업데이트**: 0.11.1 Visual Regression & Safe Batch Voice Editing. Chromium 1024·1280·1440px 시각 회귀, 다중 클립 일괄 voice 변경/재생성 영향 preview, inventory 프리셋 배정 diff, 실기기 복귀 증거와 synthetic recovery 분리를 이어갑니다.

## 0.10.8 CI Test Contract Stability Hotfix

1. **작업 일시(KST)**: 2026-08-07 15:33 이후.
2. **대상 버전과 기준 버전**: 0.10.8 / 0.10.7 Recovery Evidence & Voice Inventory Diagnostics.
3. **변경 내용**: `browserPlaybackEvidence.test.ts`의 `afterEach()` 안에 잘못 중복된 장애 주입 `it()` 블록을 제거하고, HomePage 장문 통합 테스트를 단일 빠른 편집기 + 카드 텍스트 구조에 맞게 갱신했습니다. 동일 회귀를 dependency-free project rules에서 사전 차단하도록 계약도 추가했습니다.
4. **변경 이유**: GitHub Actions Web quality에서 Vitest가 테스트 종료 훅 내부의 중첩 테스트 정의를 금지해 4개 테스트가 연쇄 실패했고, HomePage 테스트는 0.10.5에서 카드별 textarea를 제거한 뒤에도 두 문장을 모두 display value로 찾는 이전 UX 계약을 유지해 실패했습니다.
5. **영향 범위**: Web 테스트 구조, HomePage 통합 테스트, dependency-free project rules, 제품 버전·릴리스 문서입니다. 실제 재생·음성 합성·타임라인 편집 런타임 코드는 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `src/quality/browserPlaybackEvidence.test.ts`, `src/pages/HomePage.test.tsx`, `scripts/check-project-rules.mjs`, 제품 버전 파일과 API 버전 fixture, `docs/CHANGELOG.md`, `docs/NEXT_UPDATE.md`, `docs/HANDOVER.md`.
7. **검증 결과**: API pytest 199/199, Worker pytest 14/14, Repository preflight 37/37, 제품 버전 sync v0.10.8, Python compileall, dependency-free TS/TSX transpile 201/201을 통과했습니다. Web 의존성 설치는 내부 npm registry가 `zustand@5.0.8`을 404로 반환해 중단되어 GitHub Actions와 동일한 Vitest/ESLint/semantic typecheck/Vite build는 로컬에서 직접 실행하지 못했으며 Actions 재실행이 최종 판정입니다.
8. **알려진 제한과 주의사항**: 이번 버전은 CI 안정화 전용 hotfix이며 0.10.8에 예정했던 Chromium 시각 회귀·안전한 다중 음성 편집 기능은 0.10.9로 이동합니다. 카드별 textarea를 다시 추가하지 않습니다.
9. **생성한 전체 ZIP과 패치 ZIP 이름**: `SoriON-AI-0.10.8-ci-test-contract-stability-hotfix-full.zip`, `SoriON-AI-0.10.7-to-0.10.8-ci-test-contract-stability-hotfix-patch.zip`.
10. **다음 예상 업데이트**: 0.10.9 Visual Regression & Safe Batch Voice Editing. 실제 Chromium 1024·1280·1440px 시각 회귀, 다중 선택 일괄 재생성·voice 변경 전 영향 preview, 실제 OS 절전·Wi-Fi 증거 분리를 이어갑니다.

## 0.10.7 Recovery Evidence & Voice Inventory Diagnostics

1. **작업 일시(KST)**: 2026-08-07 14:19 이후.
2. **대상 버전과 기준 버전**: 0.10.7 / 0.10.6 Baseline Recovery & Multi-Clip Editing.
3. **변경 내용**: Worker telemetry aggregate의 `group_key`를 API schema·payload·Web `groupKey`까지 연결하고, `voice_preset_approval.py` import 구조를 단순화해 공유된 CI 차단 원인을 수정했습니다. Quality Lab에는 `runtime-soak/2` 이전/현재 JSON 비교와 앱 복구 경로 이벤트 주입을 추가했고, Engine Doctor에는 브라우저 음성 inventory fingerprint 변화 감지와 `voiceschanged` 기반 엔진 카탈로그 재평가를 추가했습니다.
4. **변경 이유**: 기준선이 없는 Worker 그룹에서 Web 타입과 API 응답 계약이 어긋나 History 조회가 안전하지 않았고, Python import 정렬 CI가 반복 실패했습니다. 또한 장시간 soak 결과의 전후 비교, 복귀 이벤트 처리 확인, OS/브라우저 음성 목록 변경 후 프리셋 재평가를 운영 화면에서 확인할 수 있는 진단 경로가 필요했습니다.
5. **영향 범위**: API verification schema/route, Worker telemetry Web 모델과 Benchmark Dashboard, Quality Lab 진단 카드, Engine Doctor, browser voice inventory 저장·감지, engine catalog cache 갱신, repository quality contract, 버전·릴리스 문서입니다. 실제 TTS 합성 정책·프리셋 성별 안전 규칙·운영자 기준선 append-only 복원 정책은 변경하지 않습니다.
6. **변경·추가된 주요 파일**: `services/api/app/schemas/verification.py`, `services/api/app/api/routes/verification.py`, `services/api/app/services/voice_preset_approval.py`, `src/quality/qualityTypes.ts`, `src/quality/qualityApi.ts`, `src/quality/runtimeSoakReport.ts`, `src/components/evaluation/RuntimeSoakComparisonCard.tsx`, `src/quality/recoveryInjection.ts`, `src/components/evaluation/RecoveryInjectionCard.tsx`, `src/tts/browserVoiceInventory.ts`, `src/components/evaluation/EngineDoctorCard.tsx`, `src/hooks/useEngineCatalog.ts`, `scripts/check-recovery-evidence-voice-inventory.mjs`, `docs/RECOVERY_EVIDENCE_AND_VOICE_INVENTORY.md`.
7. **검증 결과**: API pytest 199/199, Worker pytest 14/14, Python compileall, `.d.ts`를 제외한 TS/TSX dependency-free transpile 201/201, Repository preflight 37/37, version sync를 통과했습니다. 현재 전달 환경에는 Web `node_modules`와 Ruff 0.15.22 실행 환경이 없어 실제 ESLint·semantic typecheck·Vitest·Vite build 및 동일 Ruff 명령은 실행하지 못했으며 GitHub Actions가 최종 판정합니다.
8. **알려진 제한과 주의사항**: Recovery Path Injection은 앱의 online/pageshow/focus/network-change 처리 경로만 자극하며 실제 Wi-Fi 단절이나 OS 절전·복귀 증거를 대체하지 않습니다. Browser voice fingerprint는 정렬된 음성 메타데이터에서 만든 변화 감지용 식별자이며 보안 checksum이 아닙니다. 실제 1024·1280·1440px Chromium screenshot 회귀도 아직 자동화하지 않았습니다.
9. **생성한 전체 ZIP과 패치 ZIP 이름**: `SoriON-AI-0.10.7-recovery-evidence-voice-inventory-diagnostics-full.zip`, `SoriON-AI-0.10.6-to-0.10.7-recovery-evidence-voice-inventory-diagnostics-patch.zip`.
10. **다음 예상 업데이트**: 0.10.8 Visual Regression & Safe Batch Voice Editing. 실제 Chromium 1024·1280·1440px 시각 회귀, 다중 선택 일괄 재생성·voice 변경 전 영향 preview, 실제 OS 절전·Wi-Fi 증거와 synthetic recovery 결과 분리, soak 비교 결과의 provenance 내보내기, 음성 inventory 변경 전후 프리셋 배정 diff를 우선합니다.

## 0.10.6 Baseline Recovery & Multi-Clip Editing

1. **작업 일시(KST)**: 2026-08-07 11:43 이후.
2. **대상·기준 버전**: 0.10.6 / 0.10.5 Compact Dock & Practical Clip Editor.
3. **변경 내용**: 운영자 benchmark baseline의 append-only JSONL history 조회, 현재/과거 기준선 비교 preview, `restored` 이벤트 기반 복원을 추가했습니다. 타임라인은 `Ctrl/Cmd` 다중 선택과 `Shift` 범위 선택을 지원하고 2개 이상 선택 시 일괄 이동·삭제 패널을 제공합니다.
4. **복원 안전성**: 복원은 과거 파일을 덮어쓰거나 이벤트를 삭제하지 않습니다. 대상 baseline을 active로 만드는 새 restore 이벤트를 추가하므로 잘못 복원해도 history를 이용해 다시 되돌릴 수 있습니다.
5. **편집 안전성**: 단일 선택은 0.10.5 빠른 편집기를 그대로 사용합니다. 다중 선택 중 재생 위치가 바뀌어도 자동 선택이 선택 집합을 해제하지 않으며, 선택 블록이 삭제되면 유효 ID만 남기도록 정리합니다.
6. **CI hotfix**: jsdom에 없는 `scrollIntoView` 호출을 함수 존재 여부로 가드하고, Desktop Voice Drawer 미리듣기 접근성 이름을 메인 컨트롤과 구분했습니다. Compact Dock Browser Speech 라벨 테스트와 Quality report 버전 fixture를 현재 계약에 동기화하고 Ruff I001 import 정렬 3건을 수정했습니다.
7. **검증 결과**: Repository preflight 36/36, Studio UX·playback flow·version sync·compatibility 계약, API pytest 199/199, Worker 14/14, TS/TSX dependency-free transpile 191/191을 통과했습니다. API에는 FastAPI 422 상수 deprecation 경고 1건만 남습니다. 현재 전달 환경에는 node_modules가 없어 전체 Web ESLint·Vitest·semantic typecheck·Vite build는 GitHub Actions가 최종 판정합니다.
8. **알려진 제한**: 실제 1024·1280·1440px 브라우저 screenshot 비교와 네트워크/절전 E2E 장애 주입은 다음 업데이트로 넘깁니다. 실제 CosyVoice 5종 WAV·동의/권리 자료·모델 가중치는 포함하지 않습니다.
9. **산출물**: `SoriON-AI-0.10.6-baseline-recovery-multi-clip-editing-full.zip`, `SoriON-AI-0.10.5-to-0.10.6-baseline-recovery-multi-clip-editing-patch.zip`.
10. **다음 업데이트**: 0.10.7 Recovery Evidence & Voice Inventory Diagnostics. 이전 soak 비교 UI, 실기기 화면 회귀, 네트워크·절전 복귀 장애 주입, 음성 inventory 변화 감지를 우선합니다.

## 0.10.5 Compact Dock & Practical Clip Editor

1. **작업 일시(KST)**: 2026-08-07 10:44 이후.
2. **대상·기준 버전**: 0.10.5 / 0.10.4 Voice Preset Engine Reliability Hotfix.
3. **변경 내용**: 일반 Dock과 만들기 전용 Dock에서 재생/일시정지 버튼을 맨 앞에 두고 진행바를 바로 옆에 배치해 PC transport를 한 줄로 압축했습니다. 타임라인 카드 내부 textarea 대신 선택 클립 빠른 편집기를 추가해 수정·저장·미리듣기·재생성·분할·삭제를 한곳에 모았습니다.
4. **변경 이유**: 재생 도구가 파형·제목·보조 버튼 때문에 위아래로 커지고, 카드마다 작은 편집창을 두는 방식이 긴 대본에서 실제 수정 동선을 느리게 만들었기 때문입니다.
5. **영향 범위**: Linked Player Dock, 만들기 전용 player dock, TimelineEditor, 두 Dock CSS, Studio playback/timeline UX 계약·회귀 테스트, 버전·릴리스 문서입니다. 음성 엔진 합성 정책은 변경하지 않습니다.
6. **주요 파일**: `src/components/navigation/LinkedPlayerDock.tsx`, `src/components/workspace/TimelineEditor.tsx`, `src/styles/player-dock.css`, `src/styles/dubbing-overlays.css`, 관련 테스트, `scripts/check-studio-playback-timeline-ux.mjs`, `docs/STUDIO_PLAYBACK_TIMELINE_UX.md`.
7. **검증 결과**: `check-version-sync` v0.10.5, playback control flow, Studio playback/timeline UX 계약, Repository preflight 36/36, TS/TSX 191개 dependency-free transpile, API 198/198, Worker 14/14, API·Worker `compileall`을 통과했습니다. npm 의존성 설치는 현재 전달 환경의 내부 registry에서 `zustand@5.0.8`을 찾지 못해 404로 중단되어 Web ESLint·Vitest·semantic typecheck·Vite build는 미실행이며 GitHub Actions Web quality가 최종 판정합니다.
8. **알려진 제한**: 브라우저 렌더링 스크린샷 기반 1024·1280·1440px 시각 비교는 이번 환경에서 실행하지 못했습니다. 모바일 일반 Dock은 좁은 폭에서 보조 제어가 별도 행을 사용할 수 있으나 만들기 Dock은 보조 제어를 숨겨 핵심 transport 한 줄을 유지합니다.
9. **산출물**: `SoriON-AI-0.10.5-compact-dock-practical-editor-full.zip`, `SoriON-AI-0.10.4-to-0.10.5-compact-dock-practical-editor-patch.zip`.
10. **다음 업데이트**: 0.10.6 Baseline History & Recovery Dashboard. 원래 0.10.5에 예정했던 운영 대시보드 작업은 사용자 편집 UX 우선순위에 따라 한 차수 이동합니다.

## 0.10.4 Voice Preset Engine Reliability Hotfix

1. **작업 일시(KST)**: 2026-08-07 10:07 이후.
2. **대상·기준 버전**: 0.10.4 / 0.10.3 Compact Playback Dock & Direct Timeline Editing.
3. **변경 내용**: 서버 엔진의 프리셋 호환 부족을 `SOA-4022`로 분리하고 Web `auto` 생성이 호환 Browser Speech까지 이어서 시도합니다. System TTS는 Windows/macOS 기본 백엔드와 설치된 eSpeak 한국어 백엔드를 함께 유지해 프리셋 거부·실행 실패 때 보조 로컬 백엔드로 재시도합니다. Melo의 `YoungHo` 남성 화자 판정 누락도 보완했습니다.
4. **변경 이유**: 엔진 자체는 준비됐지만 일부 성별/variant 프리셋만 표현하지 못할 때 422에서 생성 흐름이 끝나거나, 같은 PC에 eSpeak가 있어도 이미 선택된 OS 백엔드 때문에 사용하지 못하는 경로가 있었기 때문입니다.
5. **영향 범위**: TTS API 오류 계약, Web auto fallback, System TTS 백엔드 탐지·합성·진단, Melo 화자 판정, 프리셋 회귀 테스트와 문서입니다.
6. **주요 파일**: `src/tts/voiceApi.ts`, `services/api/app/api/routes/tts.py`, `services/api/app/engines/tts/system_tts.py`, `services/api/app/engines/tts/melo_tts.py`, 관련 테스트와 `scripts/check-voice-preset-contracts.mjs`.
7. **검증 결과**: `check-version-sync` v0.10.4, voice preset 계약, repository preflight 36/36, API 198/198, Worker 14/14, API·Worker `compileall`을 통과했습니다. 현재 전달 환경에는 `node_modules`가 없어 Web ESLint·Vitest·semantic typecheck·Vite build는 미실행이며 GitHub Actions Web quality가 최종 판정합니다. API 테스트에는 FastAPI 422 상수 deprecation 경고 1건만 남습니다.
8. **알려진 제한**: 전달 ZIP에는 실제 5개 CosyVoice WAV·동의 자료·모델 가중치가 없습니다. eSpeak 또는 성별 호환 OS/Browser 한국어 음성이 기기에 없으면 근사 폴백도 사용할 수 없습니다. 성별 미확정 단일 Melo 화자를 남성/여성으로 강제 배정하지 않습니다.
9. **산출물**: `SoriON-AI-0.10.4-voice-preset-engine-reliability-full.zip`, `SoriON-AI-0.10.3-to-0.10.4-voice-preset-engine-reliability-patch.zip`.
10. **다음 업데이트**: 0.10.5 Baseline History & Recovery Dashboard.

## 0.10.3 Compact Playback Dock & Direct Timeline Editing

1. **작업 일시(KST)**: 2026-08-06 22:54 이후.
2. **대상·기준 버전**: 0.10.3 / 0.10.2 Recovery Soak & Managed Lock Interface.
3. **PC Dock**: 일반 Dock과 만들기 전용 Dock을 PC에서 얕은 구조로 재배치해 세로 점유를 줄입니다. 모바일 터치 구조는 유지합니다.
4. **준호·민준**: 같은 성별 한국어 음성이 제한된 Browser·Windows·macOS·Melo 환경에서 순환 사용하되 반대 성별은 차단합니다. 전용 CosyVoice WAV 증거 계약은 변경하지 않습니다.
5. **프리셋 버튼**: 준비 취소·일시정지·계속 재생을 현재 단일 플레이어 상태와 동기화합니다.
6. **타임라인**: player snapshot, 클릭 seek, 플레이헤드 시간, zoom, 자동 스크롤, Space·Enter·Delete·Alt+방향키와 직접 편집·분할·삭제 도구를 추가합니다.
7. **검증 결과**: preflight 36/36, API 194개, Worker 14개, TS/TSX 192개 구문과 Python compileall을 통과했습니다. 전체 Web build는 GitHub Actions가 최종 판정합니다.
8. **변경 범위**: 추가 6개·수정 52개, 총 58개이며 삭제는 없습니다.
9. **산출물**: `SoriON-AI-0.10.3-compact-playback-timeline-full.zip`, `SoriON-AI-0.10.2-to-0.10.3-compact-playback-timeline-patch.zip`.
10. **다음 업데이트**: 0.10.4 Baseline History & Recovery Dashboard.

## 0.10.2 Recovery Soak & Managed Lock Interface

1. **작업 일시(KST)**: 2026-08-06 18:39 이후.
2. **대상·기준 버전**: 0.10.2 / 0.10.1 Approval Modularization & Operator Baselines.
3. **변경 내용**: 장시간 API·Worker 결과를 이전 실행과 비교하고, 검사 중 Worker를 실제 재시작해 45초 이내 복구를 검증합니다. 승인 writer lease는 공통 Protocol과 backend factory 뒤로 분리했습니다.
4. **계획 장애 처리**: 의도적 Worker 재시작 중의 실패 표본은 일반 성공률·중단 실패로 중복 계산하지 않고 recovery event 기준으로 판정합니다.
5. **PC 레이아웃**: 1024·1280·1440px 기본 3분할 폭을 계산 함수와 회귀 테스트로 고정했습니다.
6. **검증 결과**: preflight 35/35, API 194개, Worker 14개, TS/TSX 190개 구문, Python compileall과 격리된 최소 FastAPI Worker 재시작 실행기 smoke에서 2.02초 복구를 통과했습니다.
7. **제한**: 실제 30·60분 soak와 전체 Web build는 GitHub Actions가 최종 판정합니다. 관리형 DB backend는 인터페이스만 준비됐고 현재 허용 backend는 sqlite입니다.
8. **산출물**: `SoriON-AI-0.10.2-recovery-soak-managed-lock-full.zip`, `SoriON-AI-0.10.1-to-0.10.2-recovery-soak-managed-lock-patch.zip`.
9. **다음 업데이트**: 0.10.3 Baseline History & Recovery Dashboard.

## 0.10.1 Approval Modularization & Operator Baselines

1. **작업 일시(KST)**: 2026-08-06 18:27 KST.
2. **대상·기준 버전**: 0.10.1 / 0.10.0 Always-on Preset Runtime & PC Three-Pane.
3. **변경 내용**: 923줄 승인 서비스를 orchestration, canonical hash·diff, 원자 저장·history, 갱신 대기열로 분리하고 운영자 확정 성능 기준선의 생성·교체·폐기와 별도 회귀 판정을 추가했습니다.
4. **변경 이유**: 승인·서명·파일 저장·갱신 책임이 한 파일에 집중되어 변경 위험이 커졌고, 자동 최초5/최근5 기준선만으로는 운영자가 검증한 장기 기준을 고정할 수 없었기 때문입니다.
5. **영향 범위**: 음성 프리셋 승인·재서명·롤백, 증거 갱신 대기열, Worker telemetry 집계, Quality Lab benchmark UI, API schema·route·설정·테스트와 repository preflight입니다.
6. **주요 파일**: `voice_preset_approval.py`, `voice_preset_approval_primitives.py`, `voice_preset_approval_storage.py`, `voice_preset_renewal.py`, `operator_baseline_store.py`, `worker_benchmark_baseline.py`, `verification.py`, `BenchmarkDashboardCard.tsx`, `qualityApi.ts`, `qualityTypes.ts`.
7. **검증 결과**: Repository preflight 34/34, API pytest 189개, Worker pytest 14개, TS/TSX 구문 검사 190개, 변경 Web semantic 계약 검사와 Python compileall을 통과했습니다. 0.10.0 기준 패치 적용본과 전체본의 829개 파일 SHA-256이 완전히 일치했고, 양쪽 preflight 34/34와 두 ZIP 무결성 검사도 통과했습니다.
8. **제한·주의사항**: 운영자 기준선은 동일 조건 최근 5건의 통계 snapshot이며 실제 청취 승인이나 실기기 인증을 대체하지 않습니다. Ruff와 전체 Web ESLint·Vitest·Vite build는 전달 환경의 설치 의존성 제약 때문에 GitHub Actions가 최종 판정합니다.
9. **산출물**: `SoriON-AI-0.10.1-approval-modularization-operator-baselines-full.zip`, `SoriON-AI-0.10.0-to-0.10.1-approval-modularization-operator-baselines-patch.zip`.
10. **다음 업데이트**: 0.10.2 Recovery Soak & Managed Lock Interface.

## 0.10.0 Always-on Preset Runtime & PC Three-Pane

1. **대상·기준 버전**: 0.10.0 / 0.9.9 CI Quality Hotfix.
2. **프리셋 자동 연동**: 미리듣기 요청은 엔진 준비 전에도 내부 대기열에 유지하고 연결 복구 뒤 자동 재실행합니다.
3. **지속 연결**: 12초/45초 heartbeat, 60초 전체 점검, focus·pageshow·online·network change 재검사를 사용합니다.
4. **상태 비노출**: 일반 작업 화면은 API·Worker·GPU·주소·연결 여부와 인앱 엔진 안내를 표시하지 않습니다.
5. **PC 3분할**: 1024px부터 프로젝트/중앙 작업/프리셋 음성의 세 영역을 기본 펼침으로 표시합니다.
6. **레이아웃 저장**: `sorion.desktop-studio-layout.v3`를 사용해 새 프로젝트는 양쪽 패널 접힘 집중 모드로 시작하고 사용자가 펼친 상태와 폭을 보존합니다.
7. **다음 업데이트**: 0.10.1 Approval Service Modularization & Operator Baselines.

## 0.9.9 CI Quality Hotfix

1. **대상·기준 버전**: 0.9.9 / 0.9.8 Quality Gate Compatibility.
2. **Python 수정**: `voice_preset_approval.py`의 first-party import를 Ruff isort 순서로 정렬합니다.
3. **Web 테스트 수정**: LinkedPlayerDock 렌더가 source 초기화를 위해 호출한 `pause()`를 mock 기준점에서 지운 뒤 사용자 일시정지 1회만 검증합니다.
4. **제품 동작**: 실제 플레이어의 초기 source 동기화와 사용자 일시정지 동작은 변경하지 않습니다.
5. **회귀 방지**: compatibility·playback preflight에서 import 순서와 `pause.mockClear()` 계약을 확인합니다.
6. **검증**: Repository preflight 32/32, API pytest 188개, Worker pytest 14개와 Python compileall을 통과했습니다. Web 전체 검사는 GitHub Actions가 최종 판정합니다.
7. **다음 업데이트**: 0.10.0 Approval Service Modularization & Operator Baselines.

## 0.9.8 Quality Gate Compatibility

1. **대상·기준 버전**: 0.9.8 / 0.9.7 Natural Playback Controls.
2. **변경 내용**: GitHub Actions의 Ruff UP035·UP037·B904·I001과 Web TypeScript 2건을 수정했습니다.
3. **Python 계약**: collection protocol type은 `collections.abc`, lock timeout은 원래 예외를 원인으로 연결합니다.
4. **Web 계약**: 모바일 음성 설정에 `engineCatalog.selected`를 전달하고 Engine Doctor 부분 fixture는 `unknown` 경유 변환을 사용합니다.
5. **회귀 방지**: `check-quality-gate-compatibility.mjs`를 repository preflight에 추가했습니다.
6. **다음 업데이트**: 0.9.9 Approval Service Modularization & Operator Baselines.

## 0.9.7 Natural Playback Controls

1. **작업 일시(KST)**: 2026-08-06 16:14
2. **대상·기준 버전**: 0.9.7 / 0.9.6 Long-Run Reliability & Writer Safety.
3. **변경 내용**: 재생 클릭 즉시 일시정지 버튼으로 전환하고, 다시 누르면 준비 중 또는 재생 중 요청을 멈춘 뒤 재생 버튼으로 복원합니다. 파일 음원과 Browser Speech에 같은 흐름을 적용했습니다.
4. **변경 이유**: 실제 `play`·`onstart` 이벤트가 늦을 때 버튼이 재생 상태로 남아 중복 클릭과 체감 지연을 만들었기 때문입니다.
5. **영향 범위**: 만들기 고정 재생바, 작업공간 Dock, Browser Speech callback 경합, 재생 접근성 상태, Web 회귀 테스트와 preflight입니다.
6. **주요 파일**: `LinkedPlayerDock.tsx`, `LinkedPlayerDock.test.tsx`, `player-dock.css`, `dubbing-overlays.css`, `check-playback-control-flow.mjs`, `PLAYBACK_CONTROL_FLOW.md`.
7. **검증 결과**: dependency-free playback flow 검사와 repository preflight를 통과했습니다. 전체 Web Vitest·ESLint·Vite build는 설치 의존성이 없어 GitHub Actions가 최종 판정합니다.
8. **제한·주의사항**: 브라우저 autoplay 정책, 실제 오디오 decode, 네트워크와 운영체제 음성 시작 시간은 제거할 수 없습니다. 이번 변경은 버튼 반응과 중복 요청 경합을 제거합니다.
9. **산출물**: `SoriON-AI-0.9.7-natural-playback-controls-full.zip`, `SoriON-AI-0.9.6-to-0.9.7-natural-playback-controls-patch.zip`.
10. **다음 업데이트**: 0.9.8 Approval Service Modularization & Operator Baselines.

## 0.9.6 Long-Run Reliability & Writer Safety

1. **대상·기준 버전**: 0.9.6 / 0.9.5 Benchmark Baseline & Privacy-Safe Audit Bundle.
2. **writer 안전성**: 승인·재서명·롤백은 thread lock, SQLite writer lease/fencing token, OS file lock, 적용 직전 파일 재검증과 원자 쓰기를 순서대로 통과합니다.
3. **stale writer 차단**: lease 만료나 더 높은 fencing token 발급 뒤에는 이전 요청이 실제 manifest를 쓸 수 없습니다.
4. **장시간 안정성**: 기존 단일 `ci.yml`의 수동 5·30·60분과 주간 30분 job이 API·Worker 성공률, 지연, 중단·복구, 메모리, 열린 descriptor 증가를 기록합니다.
5. **감사 자료**: Quality Lab은 검증된 redacted JSON, 파일별 SHA-256 manifest, README를 포함한 ZIP을 내려받습니다. 실제 WAV·비밀키·서명 원문·사람 식별자는 제외합니다.
6. **검증**: Repository preflight 30/30, API pytest 188개, Worker pytest 14개, TS/TSX 구문 191개, Python compileall과 실제 짧은 API·Worker soak를 통과했습니다.
7. **한계**: SQLite lease는 안전하게 공유되는 동일 DB 파일 범위입니다. 일반 NFS나 독립 서버를 진정한 분산 lock으로 표현하지 않습니다.
8. **다음 업데이트**: 0.9.7 Approval Service Modularization & Operator Baselines.

## 0.9.5 Benchmark Baseline & Privacy-Safe Audit Bundle

1. **작업 일시(KST)**: 2026-08-06 15:32
2. **대상·기준 버전**: 0.9.5 / 0.9.4 Visible Version Sync
3. **변경 내용**: Worker telemetry에 최초 5건·최근 5건 비중첩 기준선과 회귀 판정을 추가하고 개인정보 제외 감사 bundle export·verify를 추가했습니다.
4. **변경 이유**: 단순 P50/P95 집계만으로는 실제 악화를 알 수 없었고 승인·신뢰 키 상태를 외부 공유 가능한 형태로 감사할 수 없었습니다.
5. **영향 범위**: Quality Lab benchmark UI, API verification·evidence route, Web download, API schema·tests, repository preflight와 문서입니다.
6. **주요 파일**: `verification.py`, `privacy_audit_bundle.py`, `privacy_audit.py`, `BenchmarkDashboardCard.tsx`, `VerificationEvidenceCard.tsx`, `qualityApi.ts`, `qualityTypes.ts`.
7. **검증 결과**: Repository preflight 29/29, API pytest 183개, Worker pytest 14개, TS/TSX 구문 검사 190개와 Python compileall을 통과했습니다. 0.9.4 기준본에 패치를 덮어쓴 결과가 완성본 796개 파일과 일치했고, 패치 적용본·전체 ZIP 독립 압축 해제본도 preflight 29/29와 ZIP 무결성 검사를 통과했습니다.
8. **제한**: 자동 기준선은 실제 장치 인증을 대체하지 않으며 10건 미만은 판정하지 않습니다. checksum은 전자서명이 아닙니다. 다중 노드는 여전히 외부 직렬화가 필요합니다.
9. **산출물**: `SoriON-AI-0.9.5-benchmark-privacy-audit-full.zip`, `SoriON-AI-0.9.4-to-0.9.5-benchmark-privacy-audit-patch.zip`.
10. **다음 업데이트**: 0.9.6 Distributed Writer Safety & Long-Run Reliability.

## 0.9.4 Visible Version Sync

1. **사용자 결정**: 외부 제품 버전은 `0.9.4 → 0.9.5`처럼 단순 순번으로 표시합니다.
2. **단일 기준**: 루트 `VERSION`, `package.json`, lock, API·Worker 메타데이터를 동기화합니다.
3. **화면 표시**: 첫 화면은 `v0.9.4`만 보이며 Heartbeat·revision은 고급 빌드 정보에서만 확인합니다.
4. **배포 갱신**: `version.json`과 Service Worker를 no-store로 확인하고 새 build ID를 포함한 URL로 다시 진입합니다.
5. **다음 버전**: `npm run version:set -- 0.9.5` 후 `npm run quality:version-sync`를 실행합니다.
6. **검증**: preflight, API·Worker pytest, Python compileall, TS/TSX 구문 검사, 패치 재현성과 ZIP 무결성을 확인합니다.

## Engine Heartbeat 6.8.4 Trust Key Rotation & Evidence Renewal Queue

1. **작업 일시(KST)**: 2026-08-06 13:04
2. **대상·기준 버전**: 6.8.3.3 Seamless Engine Runtime → 6.8.4 Trust Key Rotation & Evidence Renewal Queue.
3. **주요 적용**: active·previous trust ring, current-key 재서명 preview/apply, 동의·권리·WAV 결박 갱신 대기열, 프로세스 간 승인 파일 잠금.
4. **안전 경계**: unknown key ID·잘못된 HMAC은 자동 재서명하지 않으며 동의·권리 만료일도 자동 연장하지 않습니다. 실제 secret·WAV·증거 원문은 ZIP과 진단 응답에 포함하지 않습니다.
5. **운영 순서**: 새 key를 active로 설정하고 기존 active를 `SORION_VOICE_REVIEW_TRUSTED_KEYS_JSON`에 previous key로 둔 뒤, Quality Lab에서 diff 확인→재서명→완료율 확인→grace 종료 후 previous key 제거 순으로 진행합니다.
6. **동시성**: approval apply·re-sign·rollback은 thread lock과 로컬 file lock을 같은 경계에서 획득합니다. 같은 로컬 파일시스템이 아닌 다중 노드는 단일 writer 또는 분산 lock이 필요합니다.
7. **검증 기준**: Repository preflight, API pytest, Worker pytest, Python compileall, TS/TSX 계약, 패치 덮어쓰기 재현성, ZIP 무결성을 모두 확인합니다.
8. **제한**: HMAC은 secret 보유와 payload 무결성을 확인할 뿐 화자 신원·법적 권리를 증명하지 않습니다. checksum도 실제 청취 행위를 증명하지 않습니다.
9. **산출물**: 전체 프로젝트 ZIP과 6.8.3.3→6.8.4 덮어쓰기 패치 ZIP 두 개를 제공합니다.
10. **다음 예상 업데이트**: 6.8.4.1 Benchmark Baseline & Privacy-Safe Audit Bundle. 충분한 실기기 표본 기반 회귀 기준선과 비밀·실제 WAV를 제외한 감사 묶음을 추가합니다.

## Engine Heartbeat 6.8.3.3 Seamless Engine Runtime

1. **작업 일시(KST)**: 2026-08-06 12:28
2. **대상·기준 버전**: 6.8.3.2 Runtime Update Guard & Performance Maintenance → 6.8.3.3 Seamless Engine Runtime
3. **변경 내용**: 일반 화면 기술 상태 비노출, API 후보 병렬 탐색, 가시성별 heartbeat, 자동 failover, 엔진 목록 cache, API↔Worker keep-alive pool, 병렬 health/readiness와 주기 supervisor를 적용했습니다.
4. **사용자 결정**: 사용자는 주소·API·Worker·GPU·엔진 연결 상태를 보지 않습니다. 시스템이 스스로 연결하고 고급 진단은 명시적으로 열 때만 표시합니다.
5. **성능 경계**: 네트워크·모델 적재·GPU context의 실제 cold start는 0초를 보장하지 않습니다. 브라우저 음성은 즉시 대체하고 서버·Worker는 백그라운드에서 계속 준비합니다.
6. **주요 파일**: `src/hooks/useBackendBootstrap.ts`, `src/api/httpClient.ts`, `src/settings/connectivityApi.ts`, `src/tts/voiceApi.ts`, `services/api/app/engines/voiceclone/cosyvoice_worker.py`, `services/api/app/main.py`, 일반 작업 UI와 `docs/SEAMLESS_ENGINE_RUNTIME.md`.
7. **다음 예상 업데이트**: 6.8.4 Trust Key Rotation & Evidence Renewal Queue는 6.8.3.3 GitHub Actions 녹색 확인 후 별도 보안 패치로 진행합니다.

## Engine Heartbeat 6.8.3.1 Web Quality Test Compatibility Hotfix

1. **작업 일시(KST)**: 2026-08-06 11:07
2. **대상·기준 버전**: 6.8.3 CI Quality Unblock & Approval Operator Gate → 6.8.3.1 Web Quality Test Compatibility Hotfix
3. **변경 내용**:
   - Evidence Intake JSON 파일 읽기가 `File.text()`가 없는 jsdom·구형 브라우저 환경에서는 `FileReader`로 자동 전환하도록 수정했습니다.
   - 배열 JSON과 5MiB 초과 파일 검증을 파일 읽기 방식과 분리해 원래 사용자 오류 메시지가 유지되도록 했습니다.
   - LinkedPlayerDock 브라우저 음성 테스트 fixture를 프리셋 정합성 계약에 맞는 여성 한국어 음성으로 변경해 실제 `speechSynthesis.speak()`와 시작 지연 telemetry를 검증하도록 했습니다.
   - 최신 원본에 누락돼 있던 TypeScript 5.9 `Uint8Array<ArrayBuffer>` 로컬 ZIP 타입 수정도 다시 합쳤습니다.
4. **변경 이유**: jsdom의 `File` 구현 차이로 `file.text is not a function`이 발생했고, 브라우저 음성 테스트가 6.7.1 이후 도입된 성별 미확인 음성 차단 정책과 충돌해 재생 호출이 0회로 끝났기 때문입니다.
5. **영향 범위**: Quality Lab Evidence Intake 파일 읽기, LinkedPlayerDock 브라우저 음성 단위 테스트, 로컬 Export ZIP의 TypeScript 5.9 호환 타입.
6. **주요 파일**: `src/quality/evidenceIntake.ts`, `src/components/navigation/LinkedPlayerDock.test.tsx`, `src/export/localExportBundle.ts`.
7. **검증 결과**: Repository preflight 24/24 통과, TS/TSX parse 183개 통과, Evidence Intake native/fallback runtime smoke 통과, 브라우저 프리셋 음성 선택 runtime smoke 통과, 로컬 ZIP 생성·manifest·PK 헤더·`unzip -t` 무결성 통과. 전체 Vitest·ESLint·Vite build는 내부 npm registry가 `zustand@5.0.8`과 `@eslint/js@9.22.0`을 제공하지 않아 로컬 실행하지 못했으며 GitHub Actions 재실행이 최종 판정입니다.
8. **제한·주의사항**: 제품의 성별 미확인 음성 차단 정책은 완화하지 않았습니다. 테스트 fixture만 실제 정책에 맞췄으며, 실제 기기에 호환 한국어 음성이 없으면 기존처럼 명시적 미지원 오류가 표시됩니다.
9. **산출물**: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.3.1-web-quality-test-compatibility-full.zip`, `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.3-to-6.8.3.1-web-quality-test-compatibility-patch.zip`, `SHA256SUMS-6.8.3.1.txt`.
10. **다음 예상 업데이트**: Heartbeat 6.8.4 Trust Key Rotation & Evidence Renewal Queue. 이번 핫픽스의 CI 녹색 확인 후 복수 신뢰 키, 증거 갱신 대기열, 프로세스 간 승인 잠금과 benchmark 회귀 경고를 진행합니다.

## Engine Heartbeat 6.8.3 CI Quality Unblock & Approval Operator Gate

1. **작업 일시(KST)**: 2026-08-05 18:42
2. **대상·기준 버전**: 6.8.2 Signed Review Approval & Benchmark Dashboard → 6.8.3 CI Quality Unblock & Approval Operator Gate
3. **변경 내용**:
   - GitHub Actions가 보고한 Ruff import 정렬 3건과 Web 품질 오류·경고 4건을 수정했습니다.
   - 검수 승인 preview·apply·history·rollback 전체에 운영자 접근 게이트를 추가했습니다. 로컬 loopback은 설정에 따라 토큰 없이 사용할 수 있고, LAN·외부는 32자 이상의 `SORION_VOICE_REVIEW_OPERATOR_TOKEN`이 필수입니다.
   - `X-SoriON-User-ID`와 `X-SoriON-Client-ID`는 인증 수단으로 사용하지 않고 감사용 선언 값으로만 보존합니다. 토큰은 constant-time 비교하고 Web에서는 sessionStorage에만 보관합니다.
   - 승인 apply와 rollback의 최종 파일 재검증·쓰기·이력 추가를 동일한 프로세스 잠금 안에서 수행해 동시 요청의 lost update를 막았습니다.
   - manifest 원자적 쓰기와 승인 JSONL append에 flush·fsync를 추가하고, 롤백 직전 WAV checksum도 다시 확인합니다.
   - 6.8.3 접근 제어·경합·CI 회귀를 강제하는 dependency-free preflight 검사를 추가했습니다.
4. **변경 이유**: CI 실패로 배포가 차단된 문제를 먼저 해소하고, API가 LAN이나 외부에 노출됐을 때 임의 승인·이력 열람·롤백이 가능한 운영 보안 문제와 동시 승인 경합을 막기 위함입니다.
5. **영향 범위**: API 설정, approval routes/service, 운영자 인증 서비스, Quality Lab 토큰 입력, GitHub Actions 품질 대상 파일, preflight와 문서.
6. **주요 파일**: `services/api/app/services/voice_review_operator.py`, `services/api/app/api/routes/voice_preset_approvals.py`, `services/api/app/services/voice_preset_approval.py`, `src/quality/voicePresetApprovalApi.ts`, `src/components/evaluation/VoicePresetApprovalCard.tsx`, `scripts/check-voice-review-operator-gate.mjs`.
7. **검증 결과**: Repository preflight 26/26, API pytest 171, Worker pytest 14, TS/TSX transpile 192와 Python compileall 통과. 로컬 환경에는 Ruff와 Web node_modules가 없어 실제 Ruff·ESLint·semantic typecheck·Vitest·Vite build의 최종 판정은 GitHub Actions 재실행이 필요합니다.
8. **제한·주의사항**: 운영자 토큰과 서명 secret은 ZIP에 포함하지 않습니다. loopback 무토큰 허용은 기본 로컬 사용성을 위한 설정이며 운영 환경에서는 `SORION_VOICE_REVIEW_ALLOW_LOOPBACK_WITHOUT_TOKEN=false`로 강제할 수 있습니다. 6.8.4부터 같은 로컬 파일시스템의 다중 API 프로세스는 파일 잠금으로 직렬화합니다. 다중 노드 배포는 여전히 외부 분산 잠금 또는 단일 writer 구성이 필요합니다.
9. **산출물**: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.3-ci-quality-approval-gate-full.zip`, `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.2-to-6.8.3-ci-quality-approval-gate-patch.zip`, `SHA256SUMS-6.8.3.txt`.
10. **다음 예상 업데이트**: Heartbeat 6.8.4 Trust Key Rotation & Evidence Renewal Queue. 복수 신뢰 키, 증거 갱신 대기열, 프로세스 간 승인 잠금과 benchmark 기준선·회귀 경고를 우선합니다.

## Engine Heartbeat 6.8.2 Signed Review Approval & Benchmark Dashboard

1. **작업 일시(KST)**: 2026-08-05 18:15
2. **대상·기준 버전**: 6.8.1 Review Export Sync & Voice Selection Telemetry → 6.8.2 Signed Review Approval & Benchmark Dashboard
3. **변경 내용**:
   - 현재 WAV·manifest·검수 묶음 checksum을 다시 계산한 승인 diff 미리보기, 명시적 적용 확인과 stale preview 거부를 추가했습니다.
   - manifest schema v3에 approval ID, 승인 payload digest, 선택적 HMAC-SHA256 서명과 key ID를 추가했습니다.
   - 승인 전후 manifest snapshot을 로컬 JSONL 감사 기록에 저장하고 승인 이후 manifest가 달라진 경우 위험한 롤백을 거부합니다.
   - Engine Doctor와 실제 CosyVoice 합성에서 승인 payload·서명 상태를 확인합니다. 신뢰 키가 없으면 signed manifest는 READY가 아닙니다.
   - CosyVoice Worker 성공·실패마다 모델 ID·버전·manifest digest, 장치·GPU, first audio, RTF와 handoff 오차를 별도 JSONL에 기록합니다.
   - Quality Lab에 Worker 자동 telemetry와 실기기 soak를 분리한 모델·GPU·프리셋 benchmark 대시보드를 추가했습니다.
4. **변경 이유**: 검수 JSON이나 과거 checksum만으로 실제 프리셋이 승인되는 것을 막고, 승인 파일 변경과 운영자 롤백을 추적하며, 짧은 자동 합성 수치를 장시간 실기기 증거로 오인하지 않기 위함입니다.
5. **영향 범위**: Quality Lab, Engine Doctor, voice preset approval API/service/schema, CosyVoice Worker TTS, manifest v3 검증, Worker model diagnostics, verification summary API, 설정 환경변수와 preflight.
6. **주요 파일**: `src/components/evaluation/VoicePresetApprovalCard.tsx`, `src/components/evaluation/BenchmarkDashboardCard.tsx`, `src/quality/voicePresetApprovalApi.ts`, `services/api/app/services/voice_preset_approval.py`, `services/api/app/services/voice_preset_evidence.py`, `services/api/app/engines/tts/cosyvoice_worker_tts.py`, `services/api/app/api/routes/verification.py`, `services/worker/app/model_manifest.py`, `scripts/check-signed-review-benchmark.mjs`.
7. **검증 결과**: Repository preflight 23/23, API pytest 164, Worker pytest 14, TS/TSX transpile 182와 Python compileall 통과. 설치된 Web 의존성이 없어 ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions가 최종 판정합니다.
8. **제한·주의사항**: 실제 5명 WAV·동의·권리 원본·운영자 신뢰 키·CosyVoice 모델·실기기 장시간 수치는 포함하지 않았습니다. 기본 서명 secret은 비어 있으므로 릴리스 manifest는 자동 signed 상태가 아닙니다. HMAC은 키 보유 확인일 뿐 화자 신원·법적 권리를 증명하지 않습니다.
9. **산출물**: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.2-signed-review-benchmark-dashboard-full.zip`, `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.1-to-6.8.2-signed-review-benchmark-dashboard-patch.zip`, `SHA256SUMS-6.8.2.txt`.
10. **다음 예상 업데이트**: Heartbeat 6.8.3 Trust Key Rotation & Evidence Renewal Queue. 복수 신뢰 키의 순차 교체, 만료 증거 갱신 대기열, 개인정보 최소 감사 묶음과 benchmark 기준선·회귀 경고를 우선합니다.

## Engine Heartbeat 6.8.1 Review Export Sync & Voice Selection Telemetry

1. **작업 일시(KST)**: 2026-08-05 17:37
2. **대상·기준 버전**: 6.8.0 Preset Evidence Review → 6.8.1 Review Export Sync & Voice Selection Telemetry
3. **변경 내용**:
   - manifest schema v2에 승인 당시 WAV SHA-256과 검수 묶음 checksum 참조를 추가했습니다.
   - 현재 WAV가 승인 당시 checksum과 다르면 사람 검수를 `stale`로 자동 무효화하고 CosyVoice 사용을 차단합니다.
   - 동의·권리 만료 30일 전 경고와 만료 후 차단 상태를 Engine Doctor에 제공합니다.
   - Quality Lab에 승인 후보·재검토·거부 결정, SHA-256 검수 묶음 내보내기·가져오기를 추가했습니다.
   - 가져오기는 로컬 평가만 병합하며 manifest 승인·검수자·검수 시각·WAV checksum을 자동 수정하지 않습니다.
   - Windows System.Speech와 MeloTTS의 실제 선택 화자 이름·ID·성별 판정·선택 근거를 프리셋별 진단에 추가했습니다.
   - benchmark를 모델 ID·버전·digest·가속 장치·GPU·프리셋별로 분리하고 final handoff P95를 집계합니다.
4. **변경 이유**: 로컬 A/B 판정이 실제 승인 증거로 오인되거나 WAV 교체 뒤 과거 승인이 재사용되는 문제를 방지하고, 기기·모델이 실제 선택한 음성을 운영자가 확인할 수 있게 하기 위함입니다.
5. **영향 범위**: Quality Lab, Engine Doctor, Setup API, System/Melo TTS 어댑터, CosyVoice 프리셋 증거 검사, 실기기 benchmark API·UI, manifest 템플릿과 preflight.
6. **주요 파일**: `src/quality/voicePresetReviewBundle.ts`, `src/pages/QualityPage.tsx`, `src/components/evaluation/EngineDoctorCard.tsx`, `services/api/app/services/voice_preset_evidence.py`, `services/api/app/engines/tts/system_tts.py`, `services/api/app/engines/tts/melo_tts.py`, `services/api/app/api/routes/verification.py`, `scripts/check-voice-review-sync.mjs`, `voice-presets/*.manifest.json`.
7. **검증 결과**: Repository preflight 22/22, API pytest 161, Worker pytest 14, TS/TSX transpile 179, 검수 묶음 runtime smoke, Python compileall 통과. npm ci는 내부 registry의 `zustand@5.0.8` 404로 실패해 전체 ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions가 최종 판정합니다.
8. **제한·주의사항**: 실제 5명 WAV, 동의·권리 원본, 운영자 서명, CosyVoice 모델과 실기기 benchmark 값은 포함하지 않았습니다. 검수 묶음 SHA-256은 변조 감지이며 전자서명·권리 증명이 아닙니다. Windows/Melo 화자 metadata는 인물 일치 보증이 아닙니다.
9. **산출물**: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.1-review-export-voice-telemetry-full.zip`, `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.8.0-to-6.8.1-review-export-voice-telemetry-patch.zip`, `SHA256SUMS-6.8.1.txt`.
10. **다음 예상 업데이트**: Heartbeat 6.8.2 Signed Review Approval & Benchmark Dashboard. 사람이 diff와 증거를 확인하는 명시적 manifest 승인 도구, 선택적 서명 검증, 모델·GPU·프리셋 benchmark 대시보드와 실제 Worker telemetry 연결을 우선합니다.

## Engine Heartbeat 6.8.0 Preset Evidence Review

- 제품 버전은 `0.9.3-beta.3`으로 유지하고 내부 patch identifier를 Heartbeat 6.8.0으로 올렸습니다.
- 5개 전용 WAV마다 동일 ID manifest가 필수이며 동의, `tts-inference` 권리, 사람 승인, 실제 SHA-256 일치가 모두 필요합니다.
- 같은 WAV SHA-256을 여러 인물 프리셋에 등록하면 Engine Doctor와 실제 CosyVoice 합성에서 모두 차단합니다.
- Engine Doctor는 WAV 품질, manifest 인증, 최종 사용 가능을 분리하고 실제·선언 checksum과 중복 ID를 표시합니다.
- Browser Speech의 현재 기기별 실제 배정 음성명·URI·성별 판정 근거와 후보 부족 사유를 표시합니다.
- Quality Lab은 5개 프리셋별 동일 문장 A/B와 로컬 승인·거부 기록, CSV 프리셋 메타데이터를 지원합니다.
- 전달본에는 실제 화자 WAV·동의 증거·모델이 없으며 manifest는 의도적으로 pending입니다. 이를 READY로 표현하지 않습니다.
- 다음 목표는 Heartbeat 6.8.1 Review Export Sync & Voice Selection Telemetry입니다.

## Engine Heartbeat 6.7.1 Voice Preset Fidelity Hotfix

- 제품 버전은 `0.9.3-beta.3`으로 유지하고 내부 patch identifier만 Heartbeat 6.7.1로 올렸습니다.
- 혜린 여성, 도윤·준호·민준 남성, 소리 중성 메타데이터를 Browser/System/Melo 실제 후보 선택에 반영합니다.
- 알 수 없는 ID를 혜린으로 바꾸거나 남성 프리셋을 여성 음성으로 재생하는 묵시적 폴백을 차단합니다.
- 같은 성별 후보가 부족하면 도윤·준호·민준에 같은 음성을 순환 배정하지 않습니다.
- CosyVoice의 알려진 5개 프리셋은 같은 ID의 전용 WAV가 필수이며 기본 기준 WAV로 대체하지 않습니다.
- 프리셋별 후보 부족은 엔진 고장이 아니므로 오케스트레이터 failure count와 circuit breaker를 증가시키지 않습니다.
- 실제 5개 화자 WAV·모델은 전달본에 없습니다. Browser/System/eSpeak는 인물 전용 음색이 아닌 안전한 근사 음성입니다.
- 다음 목표는 Heartbeat 6.8 Preset Evidence Review, Consent Manifest & CosyVoice Benchmarks입니다.

## Engine Heartbeat 6.7 Field Evidence Intake & Local Export Bundle

- 제품 버전은 `0.9.3-beta.3`으로 유지하고 내부 patch identifier만 Heartbeat 6.7로 올렸습니다.
- Evidence Intake는 field evidence v2와 Web quality run report v1을 구분해 서버에서 checksum을 재계산합니다.
- 동일 bundle/report 또는 동일 record/evidence digest는 등록하지 않습니다.
- 가져온 JSON은 `.sorion/quality/imported-evidence`에 checksum 파일명으로 보존하고 index는 JSONL append 방식입니다.
- Local Export Bundle은 서버 업로드 없이 20개/250MiB 이하의 음원·자막·JSON을 stored ZIP으로 만들고 SHA-256 manifest, 진행률과 취소를 제공합니다.
- preflight는 npm lock과 6.7 계약을 포함해 20개입니다. 패치는 저장소의 기존 package-lock을 덮어쓰지 않습니다.
- 다음 목표는 Heartbeat 6.8 Evidence Review, Retention & CosyVoice Benchmarks입니다.

## Engine Heartbeat 6.6 Field Evidence & Reproducible Web Quality

- 제품 버전은 `0.9.3-beta.3`으로 유지하고 내부 patch identifier만 Heartbeat 6.6으로 올렸습니다.
- 일반 Push·PR은 커밋된 package-lock을 verify-only로 사용합니다. CI가 lock 또는 소스를 자동 커밋하지 않습니다.
- Web quality는 lock structure, toolchain, dependency tree, ESLint, TypeScript, Vitest, Vite build의 고정 7단계입니다.
- `.sorion/web-quality`에는 입력 SHA-256, 단계별 로그 SHA-256, dist 파일 manifest와 전체 report hash가 남습니다. verifier는 실제 파일도 다시 비교합니다.
- evidence bundle v2는 개인정보 최소 레코드별 digest와 전체 bundle digest를 포함하며 Web 다운로드 전에 서버에서 재검증합니다.
- checksum은 변조 감지이며 전자서명·측정값 진실성 보증이 아닙니다. 실제 Android/iOS/CosyVoice 결과를 임의 생성하지 않습니다.
- 검증은 preflight 18/18, API 143, Worker 14, Python compileall, TS/TSX 171, plan/report 변조 역검증을 통과했습니다. 전체 npm quality와 Ruff는 설치 의존성 제약으로 GitHub Actions 최종 판정이 필요합니다.

## Engine Heartbeat 6.5.2 Stream Handoff CI Hotfix

- 제품 버전은 `0.9.3-beta.3`으로 고정하고 내부 패치 식별자만 Heartbeat 6.5.2로 올렸습니다.
- 부분 구간 fetch의 `ReadableStream.tee()` probe 분기는 cancel promise를 먼저 만들되 playback 분기를 Blob으로 모두 소비한 뒤 await합니다.
- `await probe.cancel()`을 playback 분기 소비 전에 수행하면 Undici·브라우저 표준 구현에서 상호 대기할 수 있으므로 preflight가 해당 패턴을 차단합니다.
- 최종 WAV 교체 테스트는 Player Store 교체를 `act()`로 감싸고 실제 audio `src` 변경을 기다린 뒤 `loadedmetadata`를 발생시킵니다.
- 검증은 preflight 17/17, API 139, Worker 14, Python compileall, TS/TSX 171, tee/cancel runtime smoke를 통과했습니다. 전체 Vitest는 sandbox npm registry 404로 CI 재실행이 필요합니다.

## Engine Heartbeat 6.5.1 CI Regression Hotfix

- GitHub Actions에서 보고된 API Ruff UP012와 Web 테스트 8건, Hooks 경고 1건을 우선 안정화했습니다.
- 플레이어는 마운트 전에 존재하던 `playRequestId`를 새 자동재생 요청으로 오인하지 않습니다.
- 부분 음원에서 최종 WAV로 교체할 때 DOM source 교체가 `currentTime`을 먼저 초기화해도 React에 저장된 최신 위치를 함께 사용합니다.
- `play`/`playing`/`pause` 이벤트가 재생 상태 ref를 즉시 갱신해 교체 직전 상태를 잃지 않습니다.
- visibility 시간 측정은 주입 가능한 시계를 사용하고, SSE·부분 WAV 테스트는 CI의 jsdom/Undici 모듈·Blob 차이를 명시적으로 처리합니다.
- 전체 Web quality 최종 판정은 이 Hotfix를 Push한 뒤 GitHub Actions 재실행으로 확인해야 합니다.

## 1. 다음 세션 시작 절차
1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 끝까지 읽는다.
2. `package.json` 버전과 현재 로컬 버전을 확인한다.
3. 패치는 기준 버전이 정확히 일치할 때만 적용한다.
4. `.git`은 삭제하거나 ZIP으로 덮어쓰지 않는다.
5. `docs/NEXT_UPDATE.md`, `docs/CHANGELOG.md`, 관련 설계 문서를 읽는다.
6. GitHub Actions가 실패하면 새 기능보다 안정화 패치를 먼저 만든다.
7. Web, FastAPI, Worker의 실제 연결 상태를 확인한다.
8. 실제 모델이 없으면 AI 생성·복제 성공을 가장하지 않는다.
9. 완료 시 전체 ZIP, 패치 ZIP, SHA-256, HANDOVER, CHANGELOG,
   NEXT_UPDATE를 함께 갱신한다.
## 1. 최신 인수인계 · 0.11.16 Timeline Editor Split & Mobile Quick Creation

- 현재 제품 버전: **0.11.16**.
- `TimelineEditor.tsx`의 대사 clip rendering을 `TimelineVoiceBlockCard.tsx`로 분리해 hard limit 여유를 확보했습니다.
- 모바일/터치에서는 `＋ / ✓`로 임의 다중 선택하며, 선택된 실제 대사 수를 Voice Picker에 표시합니다.
- 선택된 Timeline 대사가 있으면 성우 탭이 해당 대사에 즉시 적용되고, pause는 적용 개수에서 제외합니다.
- 모바일 voice control과 생성 CTA는 긴 대본에서도 접근하기 쉽도록 sticky 동작합니다.
- 전달 규칙: FULL은 전체 프로젝트, PATCH는 저장소 경로 그대로 즉시 덮어쓰기 가능한 파일 세트입니다.
- 다음 목표: **0.11.17 · Generation Orchestrator Split & Mobile Evidence**.

## 2. 프로젝트의 궁극적 목표
SoriON AI는 단순한 웹 음성 변환기가 아니라 **한국인을 위한 차세대 AI Voice Platform**이다.
모바일에서 약 10초 안에 자연스러운 한국어 TTS, 적법한 목소리 복제, 음성 변환,
STT 편집을 시작하고 더빙·성우 마켓·팟캐스트·실시간 변환으로 확장한다.
제품 방향:
- Voicebox보다 쉬운 사용성.
- 외부 음성 서비스보다 한국어 발음·숫자·날짜·존댓말에 친화적.
- 초보자는 긴 내용과 제작 버튼에 집중하고 전문가는 타임라인에서 정밀 편집.
- 특정 모델이나 외부 API에 종속되지 않는 Engine Adapter.
- 모바일이 주 제품이며 PC는 편집·비교·운영 확장 화면.
- 핵심 작업은 세 번 이내의 터치로 시작.
- 슬로건: **목소리의 가능성을 켜다.**
## 3. 비목표와 금지 사항
- 단순한 브라우저 TTS 데모로 제품을 축소하지 않는다.
- 모델이 없는데 실제 AI 음성이라고 표시하지 않는다.
- API 실패를 조용히 Mock 결과로 숨기지 않는다.
- 초보자 첫 화면에 감정·피치·엔진 ID 같은 고급 설정을 노출하지 않는다.
- 타인 음성의 무단 복제, 사칭, 사기, 금융·공공기관 악용을 허용하지 않는다.
- 명시적 동의 없이 음성 원본을 외부에 업로드하지 않는다.
- Secret, 모델 가중치, 사용자 음성을 Git 저장소와 릴리스 ZIP에 포함하지 않는다.
- `.git`, `node_modules`, `dist`, 가상환경, 캐시를 릴리스 ZIP에 포함하지 않는다.
- 기능 테스트 없이 완료라고 보고하지 않는다.
## 4. 사용자가 확정한 UX·디자인
### 절대 제품 원칙
- 모바일 우선, 한국어 우선, PC 확장.
- 실제 기능 시작은 세 번 이내 터치.
- Advanced는 기본 흐름을 방해하지 않는다.
- Apple의 정돈된 밀도, Notion의 정보 구조, ChatGPT의 친근함을 결합한다.
- 편집 화면 내부는 CapCut처럼 문장과 쉼을 블록으로 다룬다.
- 실제 AI, System Voice, Mock, Browser Demo를 UI와 데이터에서 구분한다.
- 엔진은 교체 가능한 Adapter 뒤에 둔다.
- 연결 실패는 사용자가 작업 중인 화면에서 바로 해결한다.
- 진행 중 결과는 문장별로 먼저 공개하고 전체 완료를 기다리게 하지 않는다.
## 5. 0.8.6에서 확정된 제작 UX
### 핵심 개념
**장문 내용이 중심, 문장 타임라인이 편집 엔진**이다.
기본 흐름:
```text
긴 내용 붙여넣기
→ 목소리·읽기 옵션 선택
→ 문장·쉼 블록 자동 분할
→ 앞 블록부터 순차 생성
→ Dock에서 즉시 재생
```
### 초기 화면과 브랜드
- 첫 화면은 제품 설명과 `장문 음성 스튜디오 시작` 동선에 집중한다.
- 공식 SoriON 아이콘을 favicon, PWA, 첫 화면과 작업공간 상단에 통일한다.
- 첫 화면에는 Dock과 플레이어를 렌더링하지 않는다.
- 어느 작업 화면에서든 상단 아이콘·제품명을 누르면 첫 페이지로 이동한다.
- 첫 브라우저 뒤로가기는 커스텀 종료 확인창을 띄우고 두 번째 뒤로가기는 즉시 이탈한다.
### 장문 제작 화면
- 채팅형 composer와 대화 버블을 기본 제작 UI로 사용하지 않는다.
- 최대 20,000자 내용 편집기, 일반 Enter 줄바꿈, Ctrl/⌘+Enter 제작을 제공한다.
- 문자·문단·음성 블록 수와 예상 길이를 표시한다.
- 생성 뒤에도 내용을 유지하고 타임라인만 새 제작본으로 교체한다.
- 광고 톤, 밝은 톤, 느린 읽기와 숫자 발음 보정을 단순 옵션으로 제공한다.
- 서버가 늦게 연결되면 사용자가 이미 누른 제작 요청을 보존해 연결 복구 뒤 자동 재개한다.
### 목소리와 타임라인
- 목소리는 세로 라이브러리로 제공하고 프리뷰는 실제 API 준비 상태에서 생성한다.
- 문장 사이에 기본 0.5초 쉼 블록을 넣는다.
- 첫 ready 블록부터 Dock에 연결한다.
- 순서 변경, 쉼 추가, 문장 분할·수정과 실패 블록 재시도를 제공한다.
- 수정·분할 시 기존 음원은 무효화하고 block revision이 과거 결과 적용을 차단한다.
### 엔진 연결 UX
- API 주소 입력과 엔진 수동 선택 화면을 만들지 않는다.
- 공개 배포는 `SORION_PUBLIC_API_BASE_URLS` 복수 후보를 런타임 JSON과 build에 주입한다.
- `*.github.io`는 정적 호스트이므로 same-origin `/api/v1`과 `:8443`을 탐색하지 않는다.
- API·TTS·Worker·GPU 상태를 분리하고 `/connectivity`와 `/engines`는 같은 추천 엔진을 사용한다.
- 연결 실패 주소는 제외하고 다음 HTTPS API를 승계하며 online·복귀·backoff에서 재탐색한다.
### Dock
- 순서: `만들기 → 복제 → 품질 → 프로젝트`.
- 음성이 없으면 메뉴만, 첫 ready 음성이 생기면 플레이어를 메뉴 위에 표시한다.
- 큐, 이전·다음, 반복, 속도, 탐색과 다운로드를 유지한다.
- 설정은 Dock에 넣지 않는다.
## 5-1. 0.8.1 모바일 엔진·API 신뢰성 기준
- API 주소에 스킴이 없어도 LAN IP는 HTTP, 공개 도메인은 현재 페이지에 맞춰 정규화한다.
- 배포 주소, 마지막 성공 주소와 최근 자동 발견 주소를 분리 보관한다.
- 모바일 자동 탐색은 같은 Origin·배포 주소·성공 이력·현재 호스트 후보만 사용하며 전체 LAN을 스캔하지 않는다.
- HTTPS 페이지에서 HTTP LAN API가 차단되는 경우 생성 요청 전에 원인을 명확히 보여 준다.
- 휴대폰에서 localhost는 휴대폰 자신이므로 PC LAN IP 또는 공개 HTTPS 주소를 안내한다.
- API, 실제 TTS, Worker 프로세스, GPU·모델을 네 계층으로 분리해 표시한다.
- 온라인 복귀, Wi-Fi·셀룰러 전환, PWA 포그라운드 복귀 시 단일 실행으로 재점검한다.
- 재연결 간격은 5초, 12초, 30초, 60초로 늘리며 중복 점검을 만들지 않는다.
- GET은 일시적 timeout·429·502·503·504에 한해 재시도한다. POST 생성은 중복 음성을
  막기 위해 자동 재전송하지 않고 job ID로 결과를 복구한다.
- `/tts/jobs/{job_id}/result`는 모바일 응답 단절 후 완료 음원을 다시 가져오는 계약이다.
- 모든 Web 요청에 익명 client ID와 request ID를 보내고 API 응답 request ID를 진단에 표시한다.
- 개발 LAN 연결은 허용 Origin과 Private Network preflight가 모두 맞아야 한다.
- 모바일 입력은 16px 이상, 주요 터치 영역은 44px 이상, safe-area를 항상 반영한다.
## 6. 현재 아키텍처와 배포 현실
```text
GitHub Pages / Mobile PWA
React 19 + Vite 8 + TypeScript + Zustand
Longform Editor + Timeline + Linked Player
        │ HTTPS API
FastAPI Gateway · Python 3.10
CORS · TTS · Korean preprocessing · clone proxy
        │ private HMAC request
CosyVoice Worker · Python 3.10
health · readiness · GPU diagnostics · jobs · SSE · WAV
```
- GitHub Pages는 정적 웹만 실행하며 Python API와 GPU Worker를 포함하지 않는다.
- 공개 서비스는 별도 HTTPS FastAPI와 사설 GPU Worker가 필요하다.
- 모바일에서 `localhost`는 PC가 아니라 휴대폰 자신이다.
- 공개 HTTPS에서 로컬 HTTP API 호출은 브라우저 정책으로 차단될 수 있다.
- Repository: `junl-im/AI-`.
- Pages: `https://junl-im.github.io/AI-/`.
## 7. 현재 구현 상태
### Web/PWA
- 초기 랜딩과 편집 작업공간 분리.
- 최대 20,000자 장문 내용 편집기, 문단·문장 통계와 제작 전 분할 예상.
- 브라우저 지원 시 한국어 Web Speech 입력.
- 목소리 세로 라이브러리와 API 프리뷰.
- 문장별 Progressive TTS 생성.
- CapCut형 타임라인, 순서 변경, 자르기, 수정, 쉼, 재시도.
- 사용자 입력 없는 자동 API 탐색과 수동 조작 없는 계층 상태 표시.
- API·실제 TTS·Demo 상태를 구분하고 Worker·GPU 3단계 상태를 표시.
- 초기 랜딩에서는 숨고 작업공간 진입 뒤 나타나는 Linked Player Dock과 최대 20개 큐.
- 목소리 복제, 품질 연구소와 클릭 시 편집 상태를 복원하는 프로젝트 저장소.
- PC 1024px 이상 좌우 패널의 너비 조절·접기와 `sorion.desktop-studio-layout.v3` 로컬 저장. 새 프로젝트는 양쪽 접힘 집중 모드로 시작.
- Engine Doctor의 공개 HTTPS Bridge, 프리셋 WAV 세부 진단과 첫 음성 파일 준비 지표 표시.
### FastAPI Gateway
- Health, Setup, Connectivity, Engine Registry.
- Connectivity 응답에 `api_ready`, `public_https_ready`, `public_api_origin`, `tts_ready`,
  `voice_clone_ready`, `worker_configured` 포함.
- 숫자·날짜·시각·금액·퍼센트·단위·약어 정규화.
- PCM WAV 생성·병합, UUID 작업, timeout·cancel·동시 제한.
- 첫 사용 가능 서버 음성 파일 준비 시간 `first_audio_ms`와 전체 처리 시간을 분리.
- CosyVoice 프리셋 WAV의 포맷·길이·샘플레이트·채널·무음·클리핑 사전 검증.
- 복제 동의·샘플 검증과 Worker proxy.
- 공개 rate limit과 JSONL 감사 로그.
### CosyVoice Worker
- `/health`와 `/ready` 분리.
- 모델 경로·CUDA·GPU·VRAM·디스크 진단.
- 문장별 job, SSE revision, cancel, 실패 구간 retry.
- 서비스 토큰 + HMAC-SHA256 서명, rate limit, 감사 로그.
## 8. 엔진 전략과 실제 상태
기본 무료 전용순위:
1. CosyVoice 3 기준 음색: 준비된 로컬 Worker가 있을 때 주력 AI TTS.
2. MeloTTS: 설치된 경우 로컬 무료 AI 대체.
3. System Voice·Browser Speech: 운영체제·공개 Web 재생 안전망.
4. 외부 과금형 음성 공급자는 과거 선택 정책를 서버 운영자가 명시한 경우에만 후보가 된다.
5. GPT-SoVITS·Fish Audio는 라이선스·운영 검증 전 평가 후보이며 Kokoro는 주력에서 제외한다.
현재 진실:
- CosyVoice 일반 TTS와 Cloud Adapter 경계가 구현됐지만 기본 free-only에서는 과금형을 등록하지 않는다.
- 자격 증명·Worker·동의된 기준 음성이 준비된 엔진만 자동 후보가 된다.
- 릴리스 ZIP에는 모델 가중치, PyTorch, CUDA, CosyVoice 저장소가 없다.
- Worker는 매니페스트·라이선스 동의·SHA-256·하드웨어 검증 전 모델 adapter를 로딩하지 않는다.
- 모델 미설치 시 `/health`는 정상이어도 `/ready`는 not-ready다.
- 실제 한국어 자연스러움, 화자 유사도, 지연, VRAM 벤치마크는 미완료다.
- 현재 기본 제작 흐름은 사용자가 작성한 장문 내용을 정확히 음성화하는 데 집중한다.
- 자동 대본 작성 LLM은 핵심 제작 경로에 포함하지 않으며, 별도 검증 전까지 성공 상태로 노출하지 않는다.
## 9. 주요 API 계약
API prefix `/api/v1`:
```text
GET  /health
GET  /setup
GET  /connectivity
GET  /engines
GET  /engines/strategy
POST /tts/synthesize
GET  /tts/jobs/{job_id}
GET  /tts/jobs/{job_id}/events
GET  /tts/jobs/{job_id}/result
DELETE /tts/jobs/{job_id}
GET  /audio/{filename}
GET  /quality/diagnostics
POST /quality/preview
POST /quality/compare
GET  /voice-clones/capabilities
POST /voice-clones/profiles
DELETE /voice-clones/profiles/{profile_id}
POST /voice-clones/profiles/{profile_id}/jobs
GET  /voice-clones/jobs/{job_id}
GET  /voice-clones/jobs/{job_id}/events
POST /voice-clones/jobs/{job_id}/cancel
POST /voice-clones/jobs/{job_id}/retry
GET  /voice-clones/jobs/{job_id}/audio
```
Worker:
```text
GET  /health
GET  /ready
GET  /v1/diagnostics
POST /v1/jobs
GET  /v1/jobs/{job_id}
GET  /v1/jobs/{job_id}/events
POST /v1/jobs/{job_id}/cancel
POST /v1/jobs/{job_id}/retry
GET  /v1/jobs/{job_id}/audio
GET  /v1/jobs/{job_id}/segments/{index}/audio
```
## 10. API 주소와 자동 탐색
Web 내부 키:
- `sorion-api-last-good-url`: 마지막 성공 주소.
- `sorion-api-url-history`: 최근 정상 주소 최대 5개.
- `sorion-client-id`: 익명 연결·rate-limit 식별자.
우선순위는 빌드 주입 HTTPS API, 성공 이력, 비정적 same-origin, 안전한 개발 후보다.
GitHub Pages는 same-origin과 8443 후보에서 제외한다. 전체 LAN은 스캔하지 않는다.
사용자 주소 입력 UI는 없으며 공개 운영자는 Repository Variable
`SORION_PUBLIC_API_BASE_URL`을 한 번 설정한다.
## 11. 저장·개인정보·동의
IndexedDB `sorion-ai`, schema v4:
- `projects`: 프로젝트 메타데이터.
- `qualityReviews`: 품질 평가·메모.
- `voiceProfiles`: 샘플 Blob·분석·동의 기록.
정책:
- 샘플은 기본 브라우저 로컬 저장.
- Firebase 자동 업로드 금지.
- 서버 샘플 TTL 7일, 생성 음원 30분, Worker 종료 job 60분.
- 사용자 파일명을 서버 저장 경로로 사용하지 않는다.
- 동의 철회 시 로컬 프로필·서버 샘플·향후 prompt cache를 함께 폐기한다.
- 원문과 음성 본문은 감사 로그에 기록하지 않는다.
## 12. 보안 경계
공유 Secret:
```env
SORION_WORKER_SERVICE_TOKEN=
SORION_WORKER_SIGNATURE_SECRET=
```
헤더:
```text
X-SoriON-Service-Token
X-SoriON-Timestamp
X-SoriON-Signature
```
- 서명은 method + path + timestamp + body SHA-256의 HMAC-SHA256.
- `/health`만 무인증, `/ready`와 `/v1/*`는 인증.
- Worker는 인터넷에 직접 공개하지 않는다.
- 공개 FastAPI는 TLS reverse proxy 뒤에 두고 Worker와 같은 포트를 직접 노출하지 않는다.
- `X-Forwarded-*`는 Heartbeat 5에서 공개 Origin 진단 전용이며 인증·권한 판정에 사용하지 않는다.
- reverse proxy는 외부 forwarded header를 제거한 뒤 자신의 값만 전달한다.
- Secret은 저장소와 ZIP에 넣지 않는다.
- production에서 Secret이 없으면 ready가 되지 않아야 한다.
## 13. 환경 변수
전체 기본값과 설명의 원본은 루트 `.env.example`이다. 릴리스 ZIP에 실제 `.env`를 넣지 않는다.
Web·배포:
```text
VITE_API_BASE_URL, VITE_API_BASE_URLS, SORION_PUBLIC_API_BASE_URL, SORION_PUBLIC_API_BASE_URLS
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
```
API core·job:
```text
SORION_ENVIRONMENT, SORION_CORS_ORIGINS, 삭제된 비용 정책 변수, SORION_DEFAULT_TTS_ENGINE, SORION_TTS_ENGINE_ORDER
SORION_ENGINE_FAILURE_THRESHOLD, SORION_ENGINE_COOLDOWN_SECONDS, SORION_GENERATION_TIMEOUT_SECONDS
SORION_MAX_CONCURRENT_GENERATIONS, SORION_JOB_STORE_PATH, SORION_JOB_CLAIM_TTL_SECONDS
SORION_JOB_RESULT_TTL_MINUTES, SORION_JOB_HISTORY_TTL_HOURS, SORION_JOB_POLL_INTERVAL_SECONDS
SORION_AUDIO_TTL_MINUTES, SORION_AUDIO_DIRECTORY, SORION_MAX_SEGMENT_CHARS
```
엔진·Worker proxy:
```text
SORION_ENABLE_MELO_TTS, SORION_MELO_DEVICE, SORION_ENABLE_SYSTEM_TTS, SORION_SYSTEM_TTS_VOICE
SORION_COSYVOICE_WORKER_URL, SORION_COSYVOICE_WORKER_TIMEOUT_SECONDS
SORION_COSYVOICE_WORKER_JOB_TIMEOUT_SECONDS, SORION_COSYVOICE_TTS_REFERENCE_PATH
SORION_COSYVOICE_TTS_PROFILE_ID, SORION_COSYVOICE_PRESET_DIRECTORY
SORION_WORKER_SERVICE_TOKEN, SORION_WORKER_SIGNATURE_SECRET
```
보안·저장·Worker:
```text
SORION_PUBLIC_RATE_LIMIT_PER_MINUTE, SORION_ALLOW_PRIVATE_NETWORK, SORION_AUDIT_LOG_PATH
SORION_VOICE_CLONE_DIRECTORY, SORION_VOICE_CLONE_TTL_DAYS, SORION_VOICE_CLONE_MAX_FILE_BYTES
SORION_WORKER_ENVIRONMENT, SORION_WORKER_OUTPUT_PATH, SORION_WORKER_MODEL_PATH
SORION_WORKER_MODEL_MANIFEST_PATH, SORION_WORKER_REQUIRE_MODEL_MANIFEST
SORION_WORKER_MODEL_LICENSE_ACCEPTED, SORION_WORKER_REQUIRED_MODEL_FILES
SORION_WORKER_ADAPTER_MODULE, SORION_WORKER_DEVICE, SORION_WORKER_ALLOW_CPU
SORION_WORKER_MIN_VRAM_MB, SORION_WORKER_MIN_DISK_FREE_MB, SORION_WORKER_MAX_CONCURRENT_JOBS
SORION_WORKER_MAX_SAMPLE_BYTES, SORION_WORKER_AUTH_TTL_SECONDS, SORION_WORKER_RATE_LIMIT_PER_MINUTE
SORION_WORKER_JOB_TTL_MINUTES, SORION_WORKER_CORS_ORIGINS, SORION_WORKER_AUDIT_PATH
SORION_FASTER_WHISPER_MODEL, SORION_FASTER_WHISPER_DEVICE, SORION_FASTER_WHISPER_COMPUTE_TYPE
SORION_STT_DIRECTORY, SORION_DEVICE_BENCHMARK_PATH
```
## 14. 코딩 규칙
- 소스 파일은 800줄부터 분리를 권고하고 1,200줄 안전 상한만 차단.
- 큰 함수 분리, 중복 제거, 하드코딩 최소화.
- 공식 브랜드 원본은 사용자 제공 `public/sorion-logo.png`이며 근사 SVG를 다시 만들지 않는다.
- 폐기 라이브러리 사용 금지.
- Python 최소 지원 버전 3.10.
- Python은 Ruff 표시 폭 100칸 이하.
- React Hook dependency 경고 0건.
- 직접 npm 의존성 exact pin과 Web peer compatibility gate를 유지한다.
- 테스트 간 DOM을 명시적으로 cleanup.
- 새 기능에는 Web 또는 API·Worker 테스트를 추가한다.
- 실제 기능 미연결 상태를 Demo 성공으로 숨기지 않는다.
## 15. 브랜치와 배포 규칙
- 브랜치: `main`, `develop`, `feature/*`, `fix/*`.
- main 직접 개발 금지.
- 활성 Workflow는 `.github/workflows/ci.yml` 하나.
- main push, pull request 범위를 분리해 중복 실행을 막는다.
- GitHub Pages Source는 GitHub Actions.
- Web, API Python 3.10, Worker Python 3.10이 모두 통과해야 배포한다.
## 16. 현재 산출물과 패치 기준
- 전체 후보본: `SoriON-AI-0.11.24-recovery-batch-editor-responsibility-split-full.zip`.
- 덮어쓰기 패치: `SoriON-AI-0.11.23-to-0.11.24-recovery-batch-editor-responsibility-split-patch.zip`.
- 정확한 패치 기준: 사용자가 전달한 `0.11.23 · Focused Voice Surface & Picker Polish` 전체본.
- 이번 릴리스 추적 파일 삭제: 없음.
- `.git`, `.sorion`, `node_modules`, `dist`, Python cache, 실행 DB, 사용자 음성·Secret·모델 가중치는 산출물에서 제외한다.
## 17. 절대 변경 금지 결정
- 초기 브랜드 랜딩을 제거하지 않는다.
- 편집 진입 후 대형 헤더를 다시 노출하지 않는다.
- API 연결을 사용자 주소 입력이나 엔진 수동 선택에 의존시키지 않는다.
- 초기 랜딩에 Dock이나 플레이어를 노출하지 않는다.
- 플레이어를 Dock 메뉴 아래로 내리지 않는다.
- 고급 감정·피치 설정을 초보자 첫 흐름에 다시 넣지 않는다.
- 채팅형 한 문장 composer를 장문 기본 제작 화면으로 되돌리지 않는다.
- HANDOVER를 단순 변경 목록으로 축소하지 않는다.
## 18. 알려진 제한과 위험
- GitHub Pages만으로 서버 AI 합성은 불가능하며 별도 HTTPS FastAPI가 필요하다.
- 공개 API가 없으면 Browser Speech만 재생되며 AI·WAV 다운로드·복제는 준비되지 않는다.
- CosyVoice는 모델·GPU·동의된 기준 음성이 별도 필요하고 free-only는 과금형 API를 호출하지 않는다.
- Web Speech 받아쓰기는 브라우저 지원과 권한에 따라 동작하지 않을 수 있다.
- 장문 TTS는 첫 구간 파일 준비 시간을 측정하지만 해당 구간을 Web에 즉시 전달·재생하는 partial-ready 경로는 아직 없다.
- `first_audio_ms`는 서버 파일 준비 시간이며 브라우저 decode·`playing`·실제 스피커 출력 시작을 포함하지 않는다.
- Browser Speech의 실제 `onstart` 지표는 아직 수집하지 않으며 `null`을 유지한다.
- 공개 Bridge 진단은 프록시 forwarded header를 사용하므로 신뢰 프록시 allowlist 강화가 필요하다.
- 자동 탐색은 보안상 전체 LAN을 스캔하지 않는다.
- 정식 npm·uv lock 생성은 패키지 저장소 가용성에 영향을 받지만 component별 실패 범위로 격리한다.
- Heartbeat 6.6부터 CI는 lock을 자동 커밋하지 않는다. `generate_lockfiles=true` 결과는 artifact로 검토한 뒤 사람이 커밋한다.
- 모든 API 프로세스는 같은 SQLite job 파일을 공유해야 한다.
- memory fallback은 앱 종료 뒤 영구 복원되지 않는다.
## 19. 절대 전달 규칙
최종 응답 순서:
1. 결과.
2. 전체 통파일 ZIP, 덮어쓰기 가능한 패치 ZIP, SHA-256.
3. 다음 예상 업데이트 내역.
모든 릴리스에서 갱신:
- `docs/HANDOVER.md`.
- `docs/CHANGELOG.md`.
- `docs/NEXT_UPDATE.md`.
- `FOUNDATION_REPORT.md`.
- `docs/patches/{version}`.
## 20. 검증 기준
필수:
```text
npm run quality:rules
npm run lint
npm run typecheck
npm run test
cd services/api && uv run --python 3.10 ruff check app tests
cd services/api && uv run --python 3.10 pytest tests -q
cd services/worker && uv run --python 3.10 ruff check app tests
cd services/worker && uv run --python 3.10 pytest tests -q
npm run build
```
네트워크 제한 시 실행하지 못한 항목과 이유를 결과 보고서에 정확히 기록한다.
CI Hotfix 4 테스트 규칙:
- 브라우저 이벤트로 React 상태를 바꾸는 테스트는 `act()` 또는 Testing Library `fireEvent`로 감싼다.
- placeholder 같은 변경 가능한 카피보다 maxlength, 접근성 이름, callback 같은 제품 계약을 검증한다.
- `scripts/check-web-test-contracts.mjs`가 두 규칙의 핵심 회귀를 CI 앞단에서 차단한다.
## 21. 다음 목표
다음 목표 버전: **0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery**.
우선순위:
1. 0.11.25 R1을 GitHub Actions에서 critical/full Vitest, semantic typecheck, lint, Vite build까지 녹색으로 고정하고 실제 카카오톡 Android/iOS에서 preset 미리듣기와 종료 확인 `계속 만들기`를 재검증한다.
2. desktop 1024/1280/1440과 mobile 360/390/430 Chromium evidence에서 workspace, Voice Picker/Drawer, multi stale recovery dialog를 scene별로 분리 확인한다.
3. 실제 MY VOICE Worker와 동의된 프로필이 있을 때만 stale profile 교체 후 재생성 성공과 first-audio latency를 측정한다.
4. Web quality와 모바일 WebView 검증이 녹색인 상태에서만 TimelineEditor의 남은 rendering/keyboard orchestration 책임 추가 분리를 판단한다.
5. 승인되지 않은 pixel baseline이나 실제 모델·실기기 증거가 없는 결과를 완료 증거로 승격하지 않는다.
금지: CI/모바일 failure 확인 상태에서 새 기능 진행, 측정 전 병렬도 자동 상향, 대규모 rewrite와 기능 추가 동시 진행, 동의·권리 없는 음성 포함, 모델 없는 성공 표시.
## 22. 변경 이력 보존 위치
- 0.7.3 이전 MASTER HANDOVER:
  `docs/archive/HANDOVER_MASTER_0.7.3.md`.
- 0.5.8~0.7.2 상세 기록:
  `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`.
- 전체 버전 요약:
  `docs/CHANGELOG.md`.
- 0.8.0~0.9.3 Heartbeat 6.8.0 상세 이력:
  `docs/archive/HANDOVER_HISTORY_0.8.0_TO_0.9.3_HEARTBEAT_6.8.0.md`.
## 23. 과거 상세 이력 archive

0.8.0~0.9.3 Heartbeat 6.8.0의 상세 릴리스 이력은 `docs/archive/HANDOVER_HISTORY_0.8.0_TO_0.9.3_HEARTBEAT_6.8.0.md`로 이동했습니다. 현재 목표·규칙·아키텍처·제한과 0.11.x 최신 이력은 이 본문을 기준으로 합니다.

0.11.4~0.11.9 상세 릴리스 이력은 `docs/archive/HANDOVER_HISTORY_0.11.4_TO_0.11.9.md`로 이동했습니다. 현재 목표·규칙·아키텍처·제한과 최근 릴리스 이력은 이 본문을 기준으로 합니다.
