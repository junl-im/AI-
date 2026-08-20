## 0.11.32 R1 · CI Static Contract Stabilization

- GitHub `main` head `f0a2a0d6e081a3e02be6abc80bb31eec297a488b`의 0.11.32 annotations에서 두 concrete root cause를 확인했습니다.
- API Ruff UP012: `hashlib.sha256(text.encode("utf-8"))`의 불필요한 UTF-8 인자를 제거해 `text.encode()`로 교정합니다. Python 기본 encoding 동작은 동일합니다.
- Web Vitest: 0.11.31에서 준호 preset pitch를 `-1.2 semitone`으로 조정해 실제 Web Speech pitch가 `0.9330329915...`가 되었지만 테스트가 이전 `> 0.94` 하한을 유지했습니다. 새 안전 clamp `0.92~1.08`과 캐릭터 계약에 맞춰 `0.92 < deep pitch < 0.95`로 갱신합니다.
- production neural runtime/cache, preset pace/cadence, Kakao direct speech/fallback, MY VOICE, Timeline은 변경하지 않습니다. 제품 semver는 `0.11.32`를 유지합니다.

### 검증

- Repository preflight: **55/55 PASS**
- Targeted neural preview API tests: **4/4 PASS**
- API full pytest: **232/232 PASS** (기존 FastAPI deprecated status alias warning 1건)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Ruff UP012 source contract: **PASS · explicit UTF-8 encode argument 제거 확인**
- Deep pitch numeric contract: **PASS · 0.9330329915368074**
- Local Ruff/Vitest binaries: **미설치 · 실제 Ruff/Vitest는 다음 GitHub Actions final gate**

## 0.11.32 · Neural Voice Runtime Certification & Shared Preview Cache

- preset v4가 READY여도 미리듣기 요청 시 서버가 현재 reference/model provenance를 다시 검사하고 Worker `model_digest`가 승인 `model_fingerprint`와 같아야 neural runtime을 허용합니다.
- `POST /api/v1/tts/neural-preview`와 content-addressed shared cache를 추가했습니다. cache identity는 `previewCacheKey + normalized text SHA + style SHA`이고 PC/모바일의 같은 요청은 같은 WAV cache ID를 사용합니다.
- cache WAV는 metadata `audio_sha256`을 다시 계산해 변조된 파일을 hit로 인정하지 않으며 explicit `cosyvoice3` 단일 경로만 저장합니다.
- Home preset preview는 neural READY에서 새 전용 endpoint를 사용하고 cache/runtime 검증이 실패하면 기존 Browser Speech 기기 음성 fallback으로 복구합니다.
- 실제 audio element의 `playing`/`ended`를 관찰해 `neural-voice-runtime-certification/1` evidence를 기록합니다. API 성공만으로 playback complete를 만들지 않습니다.
- Quality Lab에 PC/mobile runtime evidence를 병합하는 카드를 추가하고 cache/audio/model/reference identity가 모두 같은 경우에만 성우별 `SHARED READY`를 표시합니다.
- `verify-neural-voice-runtime-certification.mjs --require-shared`는 5명 모두 desktop/mobile playback completed + 동일 source SHA를 요구합니다. raw 대본/URL/User-Agent/기기명/reference 경로는 evidence에서 제외합니다.
- 실제 rights-cleared reference/model은 저장소에 없으므로 실제 neural 5/5 SHARED READY와 음질 성공은 아직 **미수집/PENDING**입니다.

### 검증

- Product version sync: **0.11.32 PASS**
- Neural runtime/shared cache static contract: **PASS**
- Neural runtime verifier 5/5 shared valid-format fixture: **PASS · verifier logic validation only**
- Targeted cache/setup/CosyVoice API tests: **19/19 PASS**
- Neural runtime route unit tests: **2/2 PASS**
- API full pytest: **232/232 PASS** (기존 FastAPI deprecated status alias warning 1건)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- All TS/TSX dependency-free syntax: **261/261 PASS**
- Repository preflight: **55/55 PASS**
- Actual rights-cleared neural runtime / PC-mobile shared playback: **미수집 · 성공으로 표시하지 않음**
- Dependency-based ESLint/Vitest/typecheck/build/Chromium: **GitHub Actions final gate**

## 0.11.31 · Studio Entry & Voice Character Overhaul

- Landing → Studio 최초 진입은 `#text-to-speech-studio`를 sticky compact header 아래로 정렬해 사용자가 곧바로 `텍스트를 음성으로`부터 시작합니다.
- Masthead 오른쪽 기능형 Current Voice/Engine/CTA를 제거하고 기능 없는 SoriON Signature Visual로 교체했습니다.
- Built-in 5 voices에 persona/cadence/rhythm metadata를 추가하고 기본 pace를 혜린 1.06, 도윤 1.11, 소리 1.04, 준호 1.05, 민준 1.14로 상향했습니다.
- Browser Speech는 성우별 text cadence normalization을 적용하고 user pitch scale 0.30, Web Speech pitch clamp 0.92~1.08로 금속성 변조를 줄입니다.
- Windows System TTS rate quantization을 x16으로 높여 작은 preset pace 차이도 기본속도에서 실제 command에 반영합니다.
- Desktop Drawer/Voice Picker는 persona summary, pace label, rhythm micrograph, 장점/주의를 노출합니다.
- 0.11.30 verified neural v4 promotion/fallback, MY VOICE, Timeline recovery, Kakao watchdog/exit guard는 유지합니다.

### 검증

- Product version sync: **0.11.31 PASS**
- Studio/Voice static contract: **PASS**
- Voice preset contract: **PASS**
- Mobile studio/reproducible Web contracts: **PASS**
- Changed TS/TSX syntax: **17/17 PASS**
- Targeted API System/preset tests: **16/16 PASS**
- Repository preflight: **54/54 PASS**
- API pytest: **228/228 PASS** (기존 FastAPI deprecated status alias warning 1건)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- All TS/TSX dependency-free syntax: **257/257 PASS**
- Dependency-based Web lint/Vitest/typecheck/build/Chromium: **GitHub Actions final gate**

### 품질 경계

- OS에 compatible 한국어 음성이 하나뿐이면 Browser/System fallback의 timbre를 5개로 완전 분리할 수 없습니다.
- 실제 rights-cleared neural reference/model이 없으면 neural 음질 성공을 주장하지 않습니다.
- 실제 WAV/model/동의 문서는 Git·FULL/PATCH ZIP에 포함하지 않습니다.

## 0.11.30 R1 · Web Lint Type-Only Import Stabilization

- GitHub `main` head `a6dcc7e6c9a8008f3e629b52b78380adabb855cd`의 Web quality는 `src/workspace/homeWorkspaceHelpers.ts`에서 `synthesizeSpeech`가 `ReturnType<typeof ...>` 타입 계산에만 사용되는데 value import로 선언되어 ESLint `consistent-type-imports` 계열 규칙에 의해 실패했습니다.
- `import { synthesizeSpeech }`를 `import type { synthesizeSpeech }`로 변경합니다. emitted JavaScript/runtime behavior에는 변화가 없습니다.
- Neural Voice v4 provenance, preset preview routing, Browser Speech fallback, API/Worker, Kakao/Timeline/MY VOICE 기능은 변경하지 않습니다.

### 검증

- Product semver: **0.11.30 유지**
- Repository preflight: **53/53 PASS**
- API pytest: **223/223 PASS** (기존 FastAPI deprecated status alias warning 1건)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Changed TypeScript syntax: **1/1 PASS**
- Local `npm ci`: **120초 timeout · local eslint 실행 파일 미생성**
- 실제 ESLint/Vitest/typecheck/build/Chromium: **다음 GitHub Actions 최종 gate**

## 0.11.30 · Neural Voice Reference Intake & Preview Promotion

- Voice preset evidence manifest v4에 neural preview engine/model/reference fingerprint를 추가하면서 v1~v3 일반 생성 호환성을 유지합니다.
- `/setup`은 consent/rights/review 승인, usable WAV, v4, `cosyvoice3`, 64자리 model SHA-256, 실제 WAV와 일치하는 reference fingerprint를 모두 만족해야 `neural_preview_ready`와 deterministic `preview_cache_key`를 노출합니다.
- Quality Lab에서 5개 preset의 provenance/readiness를 확인하고 pending 상태의 안전한 v4 manifest 템플릿을 다운로드합니다.
- Home preset preview는 READY가 캐시된 경우에만 explicit `cosyvoice3`를 사용하고, 미준비/실패 시 0.11.28의 자연화된 `기기 음성` fallback을 유지합니다.
- 실제 reference WAV, 모델 파일, 동의 문서는 프로젝트/ZIP에 포함하지 않습니다.

### 검증

- Product version sync: **0.11.30 PASS**
- Neural Voice static contract: **PASS**
- Targeted API setup/approval: **13/13 PASS**
- API pytest: **223/223 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Repository preflight: **53/53 PASS**
- Changed TS/TSX dependency-free transpile syntax: **9/9 PASS**
- Global TypeScript semantic check: **node_modules 부재로 dependency type definitions를 찾지 못해 미완료**
- 실제 neural reference/model runtime 품질: **미수집**

## 0.11.29 · Certification Intake & Release Readiness

- Quality Lab에 Web quality, Kakao Android/iOS, Chromium desktop/mobile, MY VOICE runtime을 6개 독립 evidence 슬롯으로 불러오는 Release Readiness 카드를 추가했습니다.
- 각 슬롯은 READY/PENDING/BLOCKED를 독립 판정하며 여섯 슬롯이 모두 READY일 때만 Overall CERTIFIED를 허용합니다.
- Web quality report는 현재 앱 버전, 8개 phase PASS, report/evidence SHA-256 재계산을 확인하고 Chromium은 9/9 capture+SHA-256+`realWorkerClaimed=false`를 요구합니다.
- MY VOICE는 observed-runtime, 동의, Worker/model ready, replace-and-regenerate, completed playback이 모두 있어야 READY이며 raw profile/sample 데이터는 readiness summary에 저장하지 않습니다.
- 동일한 계약의 CLI `verify-release-readiness.mjs`와 `release-readiness/1` summary를 추가했습니다.

### 검증

- Product version sync: **0.11.29 PASS**
- Repository preflight: **52/52 PASS**
- Release readiness static contract: **PASS**
- Release readiness 6/6 certified fixture CLI: **PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- TS/TSX dependency-free transpile syntax: **250/250 PASS**
- Dependency-based Web lint/Vitest/typecheck/build/Chromium: **0.11.29 Push 후 GitHub Actions 최종 gate**

## 0.11.28 · Voice Naturalness & Preview Quality

- 혜린의 시스템 근사 pitch를 +1.5에서 +0.5로 낮추고 5개 preset의 기본 pitch를 보수적으로 재보정했습니다.
- Browser Speech는 사용자 pitch 40% + preset offset을 12음 평균율 ratio로 변환하고 최종 pitch를 0.90~1.12로 clamp합니다.
- Browser Speech 결과는 `기기 음성` 근사값임을 명시하고 실제 neural preset 품질과 분리합니다.
- 카카오 user-gesture 재생, 1.8초 watchdog, 외부 브라우저 fallback은 유지됩니다.

### 검증

- Voice preset contract: **PASS**
- Repository preflight: **51/51 PASS**
- Related API tests: **8/8 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Changed TS/TSX parse: **6/6 PASS**
- Full Web/Chromium: **GitHub Actions final gate after push**

## 0.11.27 R2 · Recovery Scene Selection Stabilization

- Actions run `32206091853`은 lint/Vitest/typecheck/build/report verify와 기존 desktop/mobile Chromium layout을 실제 통과했습니다.
- 남은 실패는 desktop/mobile multi-scene의 동일한 `recovery-fixture` 한 지점이며, 카드별 programmatic 선택 대신 제품의 `대사 전체` 명령을 사용하도록 runner를 안정화합니다.
- recovery fixture는 selected/unavailable 상태를 단계별로 검증하고 실패 시 privacy-safe DOM diagnostics JSON을 evidence artifact에 보존합니다.
- production Voice/Timeline/Kakao/MY VOICE/API/Worker 로직은 변경하지 않습니다.

### 검증

- Product semver: **0.11.27 유지**
- Repository preflight: **51/51 PASS**
- Chromium multi-scene static contract: **PASS**
- Changed Node `.mjs` syntax: **PASS**
- API pytest: **220/220 PASS** (기존 FastAPI deprecated status alias warning 1건)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- 실제 corrected 18-scene Chromium: **다음 GitHub Actions 최종 확인 필요**

## 0.11.27 R1 · Chromium Multi-Scene Runner Stabilization

- GitHub Actions run `32120737467`에서 reproducible Web quality/report verify, desktop 1024/1280/1440 layout, mobile 360/390/430 layout은 실제 PASS했습니다.
- 최종 실패는 새 multi-scene runner 두 곳으로 제한됐습니다: desktop `voice-surface-1024`의 collapsed Voice Drawer, mobile `recovery-fixture`의 restored workspace/LandingHome 단일 가정입니다.
- runner는 이제 Voice Drawer와 project rail을 필요할 때 명시적으로 펼치고, 캡처/프로젝트 open 뒤 runner가 바꾼 compact 상태를 복원합니다. `openStudio`는 이미 workspace가 열린 session-restore 상태를 정상 입력으로 허용합니다.
- production UI/TTS/recovery/API/Worker는 변경하지 않습니다.

### 검증

- Product semver: **0.11.27 유지**
- Repository preflight: **51/51 PASS**
- Chromium multi-scene static contract: **PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- 0.11.27 기준 PATCH overlay: **1052/1052 files · missing 0 / extra 0 / changed 0**
- 실제 corrected 18-scene Chromium: **다음 GitHub Actions 최종 확인 필요**

## 0.11.27 · Field Device & MY VOICE Runtime Certification

- Kakao Android/iOS에서 preset preview 직접 시작 또는 WebView 실패+외부 브라우저 fallback, exit dialog open/stay close를 `field-device-certification/1` observed-device evidence로 기록합니다.
- Quality Lab에서 실제 수행자 확인 뒤 JSON을 저장하며 synthetic evidence와 전체 User-Agent/기기명/원문/오디오를 배제합니다.
- Android/iOS field evidence + Chromium 9+9 scene manifest + 실제 MY VOICE completed evidence를 통합 검증하고, 실제 runtime이 없으면 pending을 유지합니다.
- Actions run `32117983645`에서 lint는 통과했고 critical regression 64/65 뒤 exit confirmation test 1건이 실패했습니다. 실제 Back의 guard→base history state 이동을 테스트가 재현하지 않은 문제라 test harness만 교정했고 production exit hook은 유지합니다.

### Verification

- Product version sync: **0.11.27 PASS**
- Repository preflight: **51/51 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- TS/TSX dependency-free transpile parse: **249/249 PASS**
- Field direct/fallback + aggregate certification verifier fixtures: **PASS**
- R1 Actions: **lint PASS · critical regression 64/65 PASS; exit-history test harness corrected, rerun required**
- Real Kakao Android/iOS + consented MY VOICE Worker/model: **not collected; not claimed**
- Dependency-based Web quality/Chromium: **GitHub Actions final gate**

## 0.11.26 R1 - Web Lint Stabilization

- GitHub Actions run `32109791257` reached Web quality after lock/preflight/API/Worker success, then stopped at ESLint with 1 error and 6 warnings.
- The seven annotations are resolved without changing product semver or feature behavior.
- Voice Clone watcher lifetime stays keyed to job ID/status while the latest mutable job snapshot is held in a ref.
- 0.11.27 remains blocked until the R1 Web quality rerun is green.

### Verification

- Repository preflight: **50/50 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Targeted TypeScript transpile parse: **6/6 PASS**
- Local dependency-based Web quality: **not completed; `npm ci` timed out in the delivery environment**
- GitHub Actions rerun: **required final gate**

## 0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery

- desktop/mobile 각 3개 viewport에서 workspace, Voice surface, recovery impact를 총 18개 PNG evidence로 분리합니다.
- Voice preview click의 선택 변화와 stale MY VOICE 2/3 recovery scope를 브라우저 interaction assertion으로 기록합니다.
- UI fixture는 실제 clone 성공으로 승격하지 않고 `realWorkerClaimed=false`로 고정합니다.
- 실제 MY VOICE runtime은 동의/Worker/model/first-audio를 포함한 privacy-safe observed evidence verifier로 별도 검증합니다.

### 검증

- Product version sync: **0.11.26 PASS**
- Repository preflight: **50/50 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- 신규 Node `.mjs` syntax 및 MY VOICE runtime evidence verifier fixture: **PASS**
- 실제 Chromium 18-scene/Web dependency 검증: **로컬 `npm ci` 제한으로 미실행, GitHub Actions 최종 gate**
- 실제 동의된 MY VOICE Worker/model runtime: **환경 부재로 미수집, 성공으로 표시하지 않음**

## 0.11.25 R1 · Mobile WebView Playback & Exit Guard

- 앱 semver `0.11.25`를 유지하는 모바일 hotfix revision입니다.
- 카카오톡 인앱브라우저의 Browser Speech preset 미리듣기를 원래 탭 call stack 안에서 직접 시작하고 1.8초 start watchdog으로 무음 멈춤을 해제합니다.
- AppShell에 카카오 전용 외부 브라우저 안내를 연결하고 custom-scheme 이동은 clipboard promise보다 먼저 실행합니다.
- 종료 확인 guard는 첫 Back에서 dialog만 열고 `계속 만들기`에서 guard를 재설치하며 종료는 `history.back()` 한 번만 수행합니다.

### 검증

- Product version sync: **0.11.25 PASS**
- Repository preflight: **49/49 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Web dependency 기반 Vitest/ESLint/typecheck/build 및 실제 Kakao WebView: **GitHub Actions/실기기 최종 확인 필요**

## 0.11.25 · Web Quality CI Stabilization & Critical Recovery Gate

- GitHub Actions run 32096206966에서 Browser Speech pace test의 R1 이전 expectation(`1.10 < 1.10`)이 남아 있음을 확인하고 현재 1.00 baseline 계약으로 수정했습니다.
- Web quality에 critical voice/recovery regression phase와 실패 summary artifact를 추가했습니다.
- Web quality report schema/heartbeat는 유지하고 API evidence intake phase contract를 8단계로 동기화했습니다.
- 실제 Web dependency/Chromium 재검증은 GitHub Actions 재실행을 최종 gate로 둡니다.

## 0.11.24 R1 · Voice Pace Calibration

- 앱 semver `0.11.24`를 유지하는 R1 hotfix입니다.
- 기본 프리셋 pace를 혜린 1.00 / 도윤 1.04 / 소리 0.98 / 준호 0.98 / 민준 1.08로 재보정했습니다.
- 소리/준호의 natural speed range 상한을 각각 1.15 / 1.12까지 열어 Voice 전환 시 사용자 속도값을 과도하게 낮추지 않습니다.
- 프론트/API pace 표는 회귀 테스트와 repository contract에서 동기화합니다.

### 검증

- Product version sync: **0.11.24 PASS**
- Repository preflight: **49/49 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- TS/TSX syntax parse: **245/245 PASS**
- 0.11.24 기준 PATCH overlay: **1020/1020 files · missing 0 / extra 0 / changed 0**
- Web dependency 기반 Vitest/semantic typecheck/ESLint/Vite build 및 Chromium: **GitHub Actions 최종 확인 필요**

## 0.11.24 · Recovery Batch & Editor Responsibility Split

- 다중 선택에서 unavailable MY VOICE subset만 복구 대상으로 계산하고 원래 Voice 구성/ready audio 영향을 실행 전에 확인하는 recovery impact flow를 추가했습니다.
- selection controller는 `useTimelineEditorSelection`, batch/recovery controller는 `useTimelineEditorBatch`로 분리했습니다.
- recovery 변경은 별도 semantic history label을 사용하며 Undo/Redo는 기존 안전 정책대로 historical audio를 부활시키지 않습니다.
- 상세 설계는 `docs/RECOVERY_BATCH_EDITOR_RESPONSIBILITY_SPLIT.md`를 따릅니다.

### 검증

- Product version sync: **0.11.24 PASS**
- Repository preflight: **49/49 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- TS/TSX syntax parse: **244/244 PASS**
- CSS brace balance: **28/28 PASS**
- Python 3.10 Ruff: **환경 DNS/network 제한으로 미실행**
- Web dependency 기반 Vitest/ESLint/semantic typecheck/Vite build 및 실제 Chromium 실행: **GitHub Actions 최종 확인 필요**

## 0.11.23 · Focused Voice Surface & Picker Polish

- PC 메인 상단 전체를 비우지 않고 지정된 오른쪽 Live Voice 보조 카드만 현재 Voice 중심 카드로 교체했습니다.
- Voice Drawer/Picker의 ▶를 선택과 연결해 실제 적용 Voice와 미리듣기 Voice를 일치시켰습니다.
- Voice Picker를 외곽 clipping + 내부 scroll 구조로 변경해 scrollbar/rounding 문제를 정리했습니다.
- `최종 WAV + 자막` 완료 버튼을 UI에서 제거하고 MP3+자막 완료 동선만 유지합니다. WAV backend/API 지원은 유지합니다.
- 상세 UX 계약은 `docs/VOICE_SURFACE_PICKER_POLISH.md`를 따릅니다.

### 검증

- Product version sync: **0.11.23 PASS**
- Repository preflight: **48/48 PASS**
- API pytest: **220/220 PASS** (FastAPI deprecated status alias 경고 1건)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- TS/TSX syntax parse: **242/242 PASS**
- CSS brace balance: **28/28 PASS**
- Visible UI `최종 WAV + 자막` source scan: **0건 PASS**
- 전체 Web lint/Vitest/semantic typecheck/Vite build: **로컬 미실행** — 현재 전달 환경에 `node_modules`가 없으며 GitHub Actions Web quality가 최종 gate입니다.

## 0.11.22 · Timeline Voice Recovery & Quick Navigation

- 삭제·유실된 MY VOICE를 참조하는 Timeline clip에 `사용 불가 목소리` 복구 상태를 추가했습니다.
- 기존 ready audio는 사용자가 대체 목소리 적용을 명시적으로 실행하기 전까지 자동 제거하지 않습니다.
- 빠른 편집에 쉼을 건너뛰는 이전/다음 대사 이동과 `Alt+↑/↓`를 추가했으며, 이동 전 draft autosave를 유지합니다.
- 혼합 voice 다중 선택에서 실제 voice 구성과 현재 작업 Voice를 분리 표시합니다.
- `TimelineQuickEditor.tsx`, `timelineSelection.ts`, `timeline-voice-recovery.css`로 책임을 분리하고 전용 preflight 계약을 추가했습니다.
- 상세 설계는 `docs/TIMELINE_VOICE_RECOVERY_QUICK_NAVIGATION.md`를 따릅니다.

### 검증

- Repository preflight: **48/48 PASS**
- API pytest: **220/220 PASS** (FastAPI deprecated status alias 경고 1건)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Product version sync: **0.11.22 PASS**
- dependency-free TS/TSX transpile: **240/240 PASS**
- CSS brace balance: **27/27 PASS**
- 전체 Web lint/Vitest/semantic typecheck/Vite build: **미실행** — npm 설치가 완전하지 않아 `node_modules/.bin/vitest`가 생성되지 않았으며 GitHub Actions Web quality가 최종 gate입니다.

## 0.11.21 · Selection Continuity & Convenience

- Timeline quick editor의 미저장 draft 보호를 Player 이동에서 모든 직접 선택 전환까지 확장했습니다.
- Timeline → 현재 Voice 동기화가 확인 완료된 Multi-Speaker 배정 상태를 풀지 않도록 추천 seed 갱신 경로를 분리했습니다.
- 0.11.20에서 뒤처져 있던 HANDOVER/NEXT_UPDATE 현재 버전 기준을 0.11.21로 동기화했습니다.
- 상세 설계와 회귀 범위는 `docs/SELECTION_CONTINUITY_CONVENIENCE.md`를 따릅니다.

### 검증

- Repository preflight: **47/47 PASS**
- API pytest: **220/220 PASS** (FastAPI deprecated status alias 경고 1건)
- Worker pytest: **14/14 PASS**
- Product version sync: **0.11.21 PASS**
- 변경 TS/TSX dependency-free transpile: **4/4 PASS**
- 전체 Web lint/Vitest/semantic typecheck/Vite build: **미실행** — 이 환경의 `npm ci`가 제한 시간 안에 완료되지 않아 GitHub Actions Web quality가 최종 gate입니다.

## 0.11.20 · Linkage & Convenience

- Timeline에서 단일/동일 성우 클립을 선택하면 상단 현재 목소리와 Voice Drawer 선택이 같은 성우로 자동 동기화됩니다.
- 하단 Player/Dock이 다른 Timeline 클립으로 이동할 때 빠른 편집 중인 미저장 문장을 먼저 저장한 뒤 선택을 따라가 데이터 손실을 막습니다.
- 모바일 현재 목소리 영역과 PC Voice Drawer에 "타임라인 선택" 적용 대상을 상시 표시해 성우 선택이 어디에 반영되는지 열기 전부터 알 수 있습니다.
- 삭제된 MY VOICE 프로필이 세션에 남아 있으면 프로필 로딩 완료 뒤 기본 SoriON Voice로 안전 전환합니다.

# 0.11.19 R1 · Voice Picker Accessibility Hotfix

- GitHub Actions run `31857547345` Web quality의 실제 실패는 `DubbingVoiceControls.test.tsx` 1건이었습니다.
- 원인: Voice Picker 내부의 적용 범위 안내와 대본 맞춤 추천이 모두 `role="status"`를 사용해 Testing Library의 단일 status 조회가 충돌했습니다.
- 수정: 적용 범위 안내는 `role="note" aria-label="목소리 적용 범위"`로 의미를 분리하고, 추천만 `role="status"`를 유지합니다.
- 테스트: 추천은 status로, 적용 범위는 이름 있는 note로 각각 검증합니다.

# SoriON AI 0.11.19 Verification Report

결과 버전: **0.11.19 · Voice Engine Fast Path + MY VOICE Runtime**  
기준: **0.11.18 · SoriON Voice Deck Visual Identity**  
검증일: **2026-08-15 KST**

## 이번 패스

- 일반 프리셋과 `MY VOICE`를 하나의 VoiceChoice 모델로 통합해 Voice Picker, Desktop Drawer, Timeline, Home 생성 경로가 같은 선택 상태를 사용합니다.
- `myvoice:<profileId>`는 일반 TTS preset fallback이 아니라 Voice Clone API job으로 직접 라우팅합니다.
- Voice Clone 진행 감시는 고정 750ms polling 대신 **SSE 우선 + 360ms→900ms adaptive polling fallback**으로 변경했습니다.
- 이미 완료된 clone job은 재시작하지 않고 즉시 재사용하며, 기존 job 복구 중 일시적인 네트워크 오류가 발생해도 새 job을 중복 생성하지 않습니다.
- 새 preview를 시작하면 이전 clone preview를 abort하고 서버 cancel까지 전달해 불필요한 Worker 사용을 줄입니다.
- Voice Clone capability는 ready 상태를 짧게 캐시하고 동시 요청을 병합합니다.
- API의 CosyVoice Worker readiness probe는 **3초 cache + asyncio lock 기반 동시 probe 병합**을 사용해 Timeline 여러 문장이 동시에 시작될 때 `/health` + `/ready` 왕복을 반복하지 않습니다.
- 저장된 내 목소리 프로필을 Voice Library와 Clone page에서 다시 선택해 바로 테스트할 수 있도록 연결했습니다.
- MY VOICE는 원본 샘플 특성을 보존하기 위해 일반 preset용 speed/pitch/emotion 보정을 적용하지 않습니다.

## 검증 결과

- Repository preflight: **47/47 PASS**
- Product version sync: **0.11.19 PASS**
- Project rules / MY VOICE runtime static contracts: **PASS**
- 변경 TS/TSX dependency-free transpile: **18/18 PASS**
- CSS brace balance: **25/25 PASS**
- API pytest: **220/220 PASS** (경고 1건: FastAPI deprecated status alias)
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- CosyVoice Worker probe cache/coalescing 회귀 테스트 포함: **PASS**
- 기준점 GitHub Actions 0.11.18 run `31788209886`: **SUCCESS**

## 성능 강화 포인트

1. **MY VOICE 진행 피드백**: Worker가 내보내는 progress SSE를 우선 사용해 불필요한 고정 polling을 제거합니다.
2. **fallback 안정성**: SSE를 사용할 수 없을 때만 adaptive polling으로 전환하고, 장시간 job일수록 조회 간격을 완만하게 늘립니다.
3. **중복 생성 방지**: 기존 job 조회가 404/410으로 확실히 사라진 경우에만 replacement job을 시작합니다. 일시적인 통신 실패는 중복 POST를 만들지 않습니다.
4. **준비 상태 재사용**: 브라우저 capability cache와 API Worker readiness cache를 함께 사용해 연속 생성에서 setup 왕복을 줄입니다.
5. **취소 자원 회수**: preview 교체/취소 시 AbortSignal과 remote cancel을 연결합니다.

## 남은 실제 성능 증거

현재 전달 환경의 npm 설치가 완전하지 않아 전체 frontend Vitest / semantic TypeScript / Vite production build를 이 환경에서 다시 실행하지 못했습니다. Push 후 GitHub Web quality가 최종 판정입니다.

다음 성능 패스에서는 실제 Worker를 연결한 상태에서 `first_audio_ms`, 전체 completion latency, P50/P95, 취소 후 Worker 회수 시간, 20~50개 Timeline batch의 probe/cache hit를 soak evidence로 측정하는 것이 권장됩니다. 현재 SSE는 **진행 상태를 빠르게 전달**하지만 segment audio URL을 즉시 재생하는 progressive MY VOICE streaming은 아직 별도 단계입니다.
