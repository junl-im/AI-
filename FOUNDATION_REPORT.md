## 0.11.68 · Verified Direct Download

기기 성우 녹음 전에 파일 생성 엔진을 바로 선택할 수 있게 하고 Chrome에서 실제 전체 WAV·MP3 다운로드를 확인했습니다. 이 경로는 기존 기기 성우와 다른 음색이며 모델 첫 다운로드·기기 메모리에 의존합니다. 재현 결과는 `docs/FILE_DOWNLOAD_SMOKE_0.11.68.md`에 있습니다. 원본 음색과 다른 PC QA는 0.11.69 과제입니다.

## 0.11.67 · Direct File Recovery

기본 성우 녹음이 무음인 PC에는 기존 Supertonic 로컬 모델로 음성을 다시 만들어 실제 WAV 다운로드를 시작하는 복구 경로를 추가했습니다. 로컬 모델 음색은 기본 Web Speech 음색과 다르고 첫 실행에 약 380MB 모델 다운로드가 필요합니다. 원본 음색의 파일 엔진과 다른 PC 실기기 QA는 0.11.68 과제입니다.

## 0.11.66 · Audio Capture Fallbacks

기본 성우의 화면 공유가 무음이면 소리 입력 장치 녹음 또는 소리가 담긴 WebM 파일을 선택해 WAV·MP3로 변환할 수 있습니다. Windows 스테레오 믹스/가상 루프백과 Web Speech 출력의 연결은 기기별로 다르며, 무음 WebM 변환은 음성을 복구하지 않습니다. 원본 음색을 보장하는 파일 출력 엔진과 다른 PC QA는 0.11.67 과제입니다.

## 0.11.62 · Timeline Context Editing

쉼 길이 편집 및 클립별 우클릭 메뉴, 대본 입력 우클릭 편집 메뉴, 버튼·트랙 시각 정리, 저장 화면 불필요 동선 제거를 적용했습니다. 실제 기본 성우 음색의 무음 캡처를 해결하는 파일 출력 엔진은 승인 성우 자산·권리 확보 전까지 별도 과제로 유지합니다.

## 0.11.61 · Verified Voice Gender

성별 미확인 한국어 시스템 음성을 남성·여성 프리셋에 자동 배정하지 않습니다. 같은 성별로 확인된 음성이 없으면 생성 전에 사유를 표시합니다. 기존 클립을 선택하지 않은 성우 변경은 새 대사에만 적용된다는 안내를 추가했습니다. 실제 PC의 성별 미노출 음성은 사용할 수 없을 수 있으며, 승인된 원본 성우 파일 출력은 별도 과제입니다.

## 0.11.60 · Clip MP3 Download

기기 내 모델 WAV를 대사별 MP3로 변환해 즉시 다운로드하고 재다운로드 링크를 남깁니다. 대사·음원이 바뀌면 이전 변환 결과를 폐기하며, 좁은 화면에서 파일 버튼을 줄바꿈합니다. 기본 성우 원본 음색의 무음 녹음 문제와 다른 PC 실기기 검증은 승인된 파일 출력 엔진·음성 자산이 확보될 때까지 미완료입니다.

## 0.11.59 · Download First Workflow

로컬 모델 전체 WAV·MP3와 작업 백업은 버튼 한 번으로 파일 생성 후 다운로드를 시작합니다. 자동 다운로드를 허용하지 않는 브라우저를 위해 재다운로드 링크와 상태 안내를 유지합니다. 로컬 WAV 생성 완료 안내의 링크 위치를 수정했습니다. 기본 Web Speech 원본 음색의 무음 녹음 문제는 파일 출력 엔진 확보가 필요합니다.

## 0.11.53 · Visible Download & Browser Recording

PC 상단에 저장·다운로드 버튼을 명시하고, 서버 음원 MP3 또는 기기 내장 음성의 탭 오디오 WebM 녹음 경로로 연결했습니다. 브라우저 녹음은 현재 탭 오디오 공유가 필요하며 실제 PC별 음질은 미리 듣기로 확인해야 합니다. 브라우저 음성 시작 대기 시간을 5초로 늘려 느린 PC의 조기 중단을 줄였습니다.

## 0.11.52 · Generation Replay & Download Clarity

이전 한 곡 반복 설정을 새 제작에서 해제하고 전체 클립 준비 후 첫 대사를 한 번만 재생합니다. 성별 정보가 없는 한국어 시스템 음성을 근사 fallback으로 명시하며 타임라인 안전 듣기 속도와 생성 결과 다운로드 UI를 제공합니다. 서버 음원과 브라우저 재생 전용 음성의 파일 가능 여부는 `docs/HANDOVER.md`에 기록했습니다.

## 0.11.51 · Timeline Dock Target & Voice Guide Clarity

클립 선택과 Dock 현재 트랙을 동기화하고 재생 시작을 해당 클립의 0초로 맞췄습니다. 짧은 초안의 일률적인 혜린 추천을 숨기고 현재 성우와 추천을 구분했습니다. 자세한 검증·기기 간 재생 제한은 `docs/HANDOVER.md`와 `docs/NEXT_UPDATE.md`를 참조하세요.

## 0.11.50 · Other-PC Playback Clarity

다른 PC에서 기존 음원·하단 플레이어가 보이지 않는 것은 프로젝트/대기열이 해당 브라우저의 로컬 저장소에만 있고, GitHub Pages 런타임 음성 API 주소가 비어 있으며, 빈 PC 플레이어가 투명하게 처리되기 때문입니다. 첫 방문 안내·빈 플레이어·기기 음성/엔진 부재 상태를 명확히 하고 기기 음성 실패 무한 재시도를 제거했습니다. 공개 서버·기기 간 동기화는 이번 패치에 포함하지 않습니다. 상세: `docs/OTHER_PC_PLAYBACK_0.11.50.md`.

첫 CI의 데스크톱 시각 검사는 음성 없는 headless Chromium에서 재생 버튼이 없다는 이유로 실패했습니다. 재생 트랙이 있으면 버튼 순서, 없으면 빈 Dock 안내를 확인하도록 검사 조건을 교정했습니다. 실제 CI 재실행 결과는 원격 Actions에서 확인합니다.

## 0.11.49 · Durable Project Recovery

프로젝트 목록 저장 실패 시 프로젝트 메타데이터·원본 대본을 같은 브라우저에 제한된 임시 사본으로 보관해 새로고침 후 동일 ID로 재시도합니다. 실제 오디오 바이트·승인 음성 자산은 저장하지 않습니다. 최근 목록도 저장 성공 직후 갱신합니다. 상세: `docs/PROJECT_RECOVERY_0.11.49.md`.

## 0.11.48 · Project Save Recovery & Prosody QA

생성 완료 프로젝트 목록 저장 실패를 같은 ID로 재시도해 중복 항목을 방지합니다. 기본 성우 5명의 숫자·영문 혼합 장문 발화 계획을 회귀 테스트로 점검했습니다. 상세: docs/PROJECT_RECOVERY_0.11.48.md.

## 0.11.47 · Draft Recovery & Korean Phrasing

메모리 전용 작업공간의 저장 재시도, 탐색 불가 음원 안내, 붙여 쓴 한국어 문장 경계 처리를 개선했습니다. 소수점 보존과 기본 성우 5명의 브라우저 전처리를 회귀 테스트로 확인했습니다. 실제 음색/자연스러움 청취 인증은 수행하지 않았습니다. 상세: docs/DRAFT_VOICE_0.11.47.md.

## 0.11.46 · Timeline Navigation & Recovery

타임라인/연계 플레이어 위치 이동의 실제 음원 길이·지원 여부를 일치시켰고, 키보드 5초 탐색과 프로젝트 저장소 오류 시 기존 대본 복귀를 보강했습니다. 실제 음질·실기기 인증은 별도입니다. 상세: docs/TIMELINE_NAVIGATION_0.11.46.md.

## 0.11.45 R1 · Chromium Startup CI Hotfix

데스크톱 Chromium visual runner 시작 지연의 제한적 복구. 검사 기준·제품 런타임은 유지. 상세: docs/CHROMIUM_STARTUP_0.11.45_R1.md.

## 0.11.45 · Timeline Editing & Project Clarity

개별 타임라인 삭제 확인·취소, 빈/생성 중 대사 분할 방지, 모바일 빠른 편집 16px·도크 겹침 개선, 빈 프로젝트 목록에서 기존 대본 복귀. 검증과 제한: docs/TIMELINE_EDITING_0.11.45.md.

## 0.11.44 · Mobile Editing & Session Clarity

모바일 편집 focus 중 고정 도구 충돌 완화, 저장 상태 정확성 및 세션 복원 hook 분리. 검증/제한: docs/MOBILE_SESSION_0.11.44.md.

## 0.11.43 · Recovery & Preview Lifecycle

업데이트 실패 시 현재 작업 유지·재시도와 직접 미리듣기 수명주기 분리. 검증·제한: docs/RECOVERY_PREVIEW_0.11.43.md.

## 0.11.42 · Lean Entry & Responsive Waveform

초기 편집기 실행 분리·대본 복원과 실패 복구·큰 WAV 취소 응답 개선. 상세 검증과 제한: docs/LEAN_ENTRY_0.11.42.md.

## 0.11.41 · Native Scrollbar Theme

공통 native 스크롤바 디자인과 가로 스크롤 발견성 개선. 검증 범위와 제한: docs/SCROLLBAR_THEME_0.11.41.md.

## 0.11.40 · Workspace Polish & Project Deletion

사이드바 조작 겹침 및 저장 프로젝트 삭제 누락 개선. 검증·제한: docs/WORKSPACE_POLISH_0.11.40.md.

## 0.11.33 · Voice Engine Major Hardening

- MY VOICE upload를 서버가 실제 디코딩해 길이·RMS·무음·clipping을 재검증하고, 승인 reference를 16 kHz mono PCM WAV로 정규화합니다.
- 녹음은 20~30초를 목표로 하고 29.5초 hard stop, zero-byte 차단, reset/stop race guard를 적용합니다.
- profile ID를 서버와 공유해 재시도 중복을 줄이고, Worker 복구 시 저장 profile readiness를 다시 동기화합니다.
- CosyVoice Worker reference 계약을 16 kHz mono·5~30초로 고정하고 `stream=True` keyword 호출로 교정합니다.
- 5개 성우 preset은 RMS·무음·clipping + 16 kHz mono + evidence/rights/review/SHA를 모두 검사합니다. 실제 approved WAV가 없으면 fail-closed입니다.
- 사용자용 Final Export UI/API와 stale 0.11.15 apply payload를 제거하고 재유입 검증기를 최신 구조로 교체합니다.

상세: `docs/VOICE_ENGINE_MAJOR_HARDENING_0_11_33.md`

### 검증

- API pytest: **235/235 PASS** (20개 파일 108/108 + 20개 파일 127/127, 기존 FastAPI deprecated alias warning 1건)
- Worker pytest: **16/16 PASS**
- Python compileall / git diff check: **PASS**
- Live Voice / MY VOICE hardening verifier: **51/51 PASS**
- TypeScript dependency-free syntax: **254/254 PASS**
- Voice preset / evidence / device soak / release readiness / internal verification contracts: **PASS**
- Dependency 기반 Web lint/Vitest/typecheck/build: **로컬 npm registry DNS `EAI_AGAIN`으로 미실행 · GitHub Actions final gate**

## 0.11.32 R2 · CI Static Contract Completion

- GitHub R1 이후 API Ruff UP012가 neural preview cache의 남은 명시적 UTF-8 encode를 검출해 `style_digest`/`cache_id`까지 기본 `str.encode()`로 통일했습니다.
- Web full Vitest의 `dam-calm` clamp 기대값을 production natural speed upper bound `1.16`에 맞춰 `1.15 → 1.16`으로 동기화했습니다.
- preflight가 같은 두 종류의 stale/static contract 재유입을 직접 차단합니다.
- production neural cache identity, voice persona/pace/cadence/pitch, Kakao/MY VOICE/Timeline runtime은 변경하지 않습니다.

### 검증

- Repository preflight: **55/55 PASS**
- API pytest: **232/232 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- TS/TSX syntax: **261/261 PASS**
- `dam-calm` clamp runtime smoke: **1.16 PASS**
- actual Ruff/Vitest: **GitHub Actions final gate**

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

## 2026-10-10 · 0.11.35-r4-windows-npm

Windows npm 실행을 Node CLI 직접 실행으로 보정하고 POSIX shell 전용 lock fallback fixture를 플랫폼 독립 Node fixture로 교체했습니다. shell을 사용하지 않으며 공백과 &가 포함된 임시 경로에서도 fallback과 기존 lock 복원을 검증합니다.

Repository preflight 55/55 PASS, 실제 Windows npm CLI 실행 PASS, npm ci --ignore-scripts 성공(557 packages), typecheck PASS, lint PASS, Vitest 75 files / 283 tests PASS, Vite build PASS, lock fallback/restoration fixture PASS. API/Worker, 실제 음성 모델, Android/iOS, 배포 화면 검증은 이번 개발 도구 수정 범위에서 미실행. build에 500kB chunk 권고가 남습니다. 로컬 Node 24.16.0/npm 11.13.0이며 CI 고정 런타임 재검증은 Push 후 필요합니다.

## 0.11.36 · 비교 조사 기반 UI/UX 개선

대본 중심·점진적 옵션 공개·모바일 작업 집중을 적용했습니다. 공식 서비스 6곳/오픈소스 11개 조사와 도입 우선순위는 docs/UIUX_RESEARCH_0.11.36.md에 기록했습니다. 신규 의존성 없이 기존 엔진·권리 검증 경계를 유지합니다. 실제 음성 품질 인증은 이번 화면 개선 범위에 포함하지 않습니다.

## 2026-10-12 · 0.11.37
라벤더 스튜디오·성우별 prosody·실제 WAV 파형·키보드·타임라인 지연 로딩을 반영했습니다. 점진/최종 PCM 일치, 취소·시간 제한과 cache 무효화를 강화했습니다. 실제 모델·승인 reference 미제공으로 음질 인증은 보류합니다. 상세는 docs/INTELLIGENT_STUDIO_0.11.37.md를 참조합니다.

## 2026-10-12 · 0.11.38
128MiB/60분 WAV를 전체 디코딩 없이 순차 분석하고 진행률·취소·시간 제한·재시도를 제공합니다. 성우/설정창 지연 로딩으로 main510.81kB. 실제 승인 음성·모델 미제공으로 음질 인증은 보류합니다. 상세: docs/STREAMED_WAVEFORM_0.11.38.md.

## 2026-10-12 · 0.11.39
밝은 테마와 dark 하위 규칙의 색 충돌을 수정하고 배경/글자/강조색 쌍을 정리했습니다. Chrome17화면의 측정 대상 대비 기준 미달0건. 전체 접근성·실기기 피로도 인증은 아닙니다. 상세: docs/READABLE_COLORS_0.11.39.md.
## 0.11.54 · Local Korean WAV & Clip-Position Seek

정적 Pages 환경에서도 파일 저장이 가능하도록 MIT 코드와 OpenRAIL-M 모델의 Supertonic 3를 사용자 선택 시 내려받는 브라우저 ONNX 경로로 연결했습니다. Chrome에서 한국어 문장으로 245,484바이트, 약 2.78초 WAV 생성을 직접 확인했습니다. 클립 내 클릭 위치를 Dock 재생 헤드로 전달하고 대사별·전체 WAV 내보내기를 추가했습니다. 모델 음색은 기존 다섯 성우의 동일한 음색이 아니며 모델·파일의 다른 PC 자동 동기화는 아직 없습니다. 근거와 위험은 `docs/LOCAL_WAV_ENGINE_0.11.54.md`에 기록합니다.
## 0.11.55 · WAV/MP3 Save & Workspace UI Cleanup

브라우저 로컬 모델의 PCM16 WAV를 `@breezystack/lamejs@1.2.7`으로 지연 변환해 실제 MP3 파일 다운로드를 추가했습니다. 해당 인코더는 LGPL-3.0이며 npm 패키지를 별도 동적 번들로 유지합니다. `src/export/wavToMp3.test.ts`는 실제 PCM을 MP3로 인코딩해 프레임 동기 바이트와 파일 크기를 검사합니다. 타임라인 전용 `+`를 레이블 안의 일반 버튼으로 이동하고 중복 설정 링크·TXT 다운로드를 제거했습니다. 모델 음색/대용량 다운로드·저장 지속성 한계는 기존과 같습니다.
## 0.11.56 · Default Voice Recording to WAV/MP3

0.11.55는 별도 모델의 WAV/MP3 저장만 제공해 사용자가 원한 기본 성우 음색 보존을 해결하지 못했습니다. 이번 패치는 Web Speech 재생 중 캡처한 WebM을 브라우저 `decodeAudioData`로 PCM화하고 단일 채널 WAV 및 MP3로 변환합니다. PCM peak/RMS가 낮으면 무음으로 실패시켜 빈 파일을 성공으로 보여주지 않습니다. Chrome에서 1초 실제 MediaRecorder WebM(15,752B)을 WAV(84,714B)와 MP3(15,882B)로 변환하고 헤더를 확인했습니다. 이는 변환 검증이며 기본 성우의 운영체제 출력이 화면 공유에 실제 포함되는지의 실기기 인증은 아닙니다. 상세 제한은 `docs/DEFAULT_VOICE_EXPORT_0.11.56.md`에 기록합니다.
## 0.11.57 · Silent Capture Recovery & Recording Persistence

기본 성우 화면 공유 녹음이 무음인 PC에서는 WAV/MP3 변환을 완료할 수 없습니다. 저장 UI는 이 제한을 설명하고 별도 로컬 음색 WAV 생성 동선으로 안내합니다. 실제로 녹음된 WAV/MP3는 IndexedDB에 저장되어 동일 대본과 성우 설정으로 재방문하면 다시 다운로드할 수 있습니다. 기본 성우의 원본 음색 파일을 안정적으로 생성하는 엔진은 별도 필요합니다.

## 0.11.57 R1 · Multi-Scene IndexedDB Fixture Repair

CI 다중 화면 fixture를 IndexedDB 스키마 5에 맞춰 Pages 배포 게이트를 복구했습니다. 제품 런타임 기능은 바뀌지 않았습니다.

## 0.11.58 · Local WAV Recovery & Transfer

로컬 모델 WAV를 IndexedDB에 저장하고 작업공간 세션에서 해당 음원 출처를 기록해 재방문 때 Dock·다운로드를 복구합니다. 대본과 로컬 WAV를 사용자 선택 JSON 백업으로 내보내고 다른 PC에서 가져옵니다. Web Speech 기본 성우 원본 음성은 API에서 파일 바이트를 제공하지 않으므로 무음 화면 공유 PC에서는 별도 파일 출력 엔진이 필요합니다.
## 0.11.63 · Timeline Menu Access

쉼·음성 클립의 우클릭/터치/키보드 메뉴를 하나로 통합하고 무음 캡처 오류 안내를 현재 저장 경로에 맞췄습니다. Web Speech 자체의 PCM 출력 부재와 기기별 화면 오디오 캡처 제한은 그대로이며, 원본 기본 성우 파일 엔진 검증에는 승인 음성 자산과 실제 다른 PC가 필요합니다.
## 0.11.64 · Context Menu Boundary & Timeline Targeting

기본 브라우저 우클릭 메뉴를 전역 차단하고 대본·클립·쉼의 전용 편집 메뉴만 남겼습니다. 타임라인 눈금은 구간 선택과 연결했고 파일 음원만 시간 탐색이 가능함을 표시합니다. Web Speech와 부분 음원의 임의 시간 탐색, 승인된 기본 성우 원본 파일 출력은 아직 미지원입니다.
## 0.11.65 · Text Menu Keyboard & Recording Watchdog

대본 편집 메뉴의 키보드 접근성을 보강하고 브라우저 음성 녹음의 시작·완료 무한 대기를 제한했습니다. 화면 공유 오디오가 실제 무음인 PC에서는 기본 성우의 원본 음색 파일 저장이 불가능한 기존 제한이 남습니다.
## 0.11.69 · Staged File Download

기기 성우 생성이 대기·실패 상태여도 로컬 파일 음성 엔진을 선택할 수 있게 했습니다. 예약된 자동 생성은 파일 엔진을 시작할 때 취소하며, 완료된 로컬 파일은 전체 WAV·MP3 다운로드로 이어집니다. 원본 5성우 음색과 다르고 첫 모델 다운로드 약 380MB 및 기기 자원에 의존합니다. 다른 PC 실기기 검증과 원본 음색 파일 출력은 다음 과제입니다.
## 0.11.70 · Direct MP3 Save

대기·실패 대사에서 로컬 파일 엔진을 실행할 때 WAV 또는 MP3를 처음부터 선택하도록 했습니다. Chrome에서 MP3 단일 클릭 실제 다운로드를 확인했습니다. Edge 실측은 실행 환경 문제로 미검증입니다. 0.11.69에서 Edge가 통과했다는 이전 대화 보고는 Chrome 고정 하네스로 인한 오류이며 `docs/FILE_DOWNLOAD_SMOKE_0.11.70.md`에서 바로잡았습니다.
## 0.11.71 · Silent Capture Recovery

무음 녹음은 WAV/MP3 변환으로 복구할 수 없으므로 저장 오류에서 다른 음색의 로컬 MP3 생성으로 직접 이어지게 했습니다. 원본 음색 저장 UI의 오디오 캡처 조건을 명시했습니다. 이 PC의 Windows 한국어 파일 합성 음성은 Heami 한 종류만 확인돼 다섯 기본 성우의 동일 음색 파일 출력은 아직 구현할 수 없습니다. 진단 근거는 `docs/DEFAULT_VOICE_EXPORT_DIAG_0.11.71.md`에 있습니다.
## 0.11.71 · Windows Original Voice Capture

화면 공유가 무음인 Windows PC에서 기본 성우가 실제 출력한 소리를 저장할 수 있도록 WASAPI 루프백 보조 앱과 웹 MP3 저장 버튼을 연결했습니다. 보조 앱 ZIP을 사이트에서 직접 받습니다. Chrome 로컬 개발 페이지에서 `sori-warm`이 Heami로 선택된 뒤 실제 MP3 파일을 다운로드하고 재디코딩해 무음이 아님을 확인했습니다. 배포된 Pages 버튼 직접 클릭과 다른 PC·Edge 실기기는 다음 단계입니다. 기술·보안 경계는 `docs/DEFAULT_VOICE_EXPORT_DIAG_0.11.71.md`에 기록했습니다.

## 0.11.72 · Windows Helper Connection Recovery

보조 앱 연결 토큰을 앱 시작 시 세션에 보관하고 저장 화면에서 연결 실패 원인을 표시합니다. Windows 보조 앱 바이너리는 0.11.71과 동일합니다. 배포 사이트 실제 버튼·다른 PC·Edge 실측은 남아 있습니다.

## 0.11.73 · Public Voice Download QA

이 PC의 Chrome·Edge에서 공개 Pages의 실제 원본 음색 MP3 저장 버튼을 눌러 각각 유효한 음성 파일을 다운로드했습니다. Chrome은 WAV 링크 다운로드도 확인했습니다. Windows 보조 앱과 화면 공유 녹음의 안내를 분리하고 대체 녹음 방법을 접었습니다. 다른 PC와 프리셋별 청감 검증은 남아 있습니다. `docs/PUBLIC_VOICE_DOWNLOAD_0.11.73.md` 참조.

## 0.11.74 · Windows Output Diagnostics

Windows 보조 앱의 상태에 기본 출력 장치 이름·상태·버전을 추가하고, 무음 오류에 녹음 장치·신호 피크를 포함합니다. 웹 저장 화면이 연결된 출력 장치를 표시합니다. 새 보조 앱으로 공개 Pages에서 MP3/WAV를 다시 다운로드해 유효 음성임을 확인했습니다. `docs/WINDOWS_CAPTURE_DIAG_0.11.74.md` 참조.

## 0.11.75 · Multi-Clip Capture Recovery

7개 클립·26초 기본 성우 녹음을 공개 Pages의 실제 버튼으로 MP3/WAV 저장했습니다. 보조 앱의 취소 후 재시작 상태를 확인하고, 웹 취소의 마무리 대기·연결 오류 표기를 고쳤습니다. `docs/LONG_CAPTURE_RECOVERY_0.11.75.md` 참조.
