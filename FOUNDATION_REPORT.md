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
