# SoriON AI MASTER HANDOVER
상태: **절대 필독 · 임시채팅 영구 메모리 원본**
현재 기준 버전: **0.11.11 · Mobile Studio Flow & Natural Voice Playback**
기준 버전: **0.7.3 Handover Memory Baseline**
최종 갱신: **2026-08-12 12:47 KST**
제품 소유·디자인: **곰같은여우**
서비스명: **SoriON AI / 소리온 AI** · 내부 코드명: **SOA**
> 이 프로젝트는 임시채팅에서 개발 중이다. 대화 메모리를 신뢰하지 않는다.
> 다음 AI 또는 개발자는 작업 전에 이 파일과 루트 `DELIVERY_RULES.md`를 끝까지 읽는다.
> 이 파일은 목표, 사용자 결정, 구현 상태, 연결 현실, 금지 규칙과 다음 작업을 보존하는
> 단일 프로젝트 메모리 원본이다.

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
- 전체 후보본: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-5-full.zip`.
- 덮어쓰기 패치: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-4-to-0.9.3-beta.3-engine-heartbeat-5-patch.zip`.
- 정확한 패치 기준: `0.9.3-beta.3 · Engine Heartbeat 4` 전체본.
- 추적 파일 삭제: 없음.
- 누적 영구 삭제 대상: `public/sorion-icon.svg`; APPLY_PATCH 스크립트로 실제 삭제한다.
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
다음 목표 버전: **0.9.3-beta.3 · Engine Heartbeat 6.3 · Seam Metrics & Device Soak**.
우선순위:
1. 두 번째 이후 준비 구간을 순서대로 이어 재생하고 decode gap을 기록.
2. 페이지 복원·네트워크 전환 뒤 만료 URL 재발급과 queue 복구를 검증.
3. 실제 CosyVoice 모델·프리셋 5종·모바일에서 첫 구간 지연과 RTF 증거 기록.
4. Android Chrome·iOS Safari·PWA의 autoplay, SSE, CORS 실기기 검증.
5. 검증된 npm lock으로 ESLint·Vitest·semantic typecheck·production build 확정.
금지: 파일 단위 부분 전달을 PCM 스트리밍으로 표시, forwarded header를 인증에 사용,
측정하지 않은 실기기 성능 보증, 동의·권리 없는 프리셋 WAV 포함, 모델 없는 성공 표시.
## 22. 변경 이력 보존 위치
- 0.7.3 이전 MASTER HANDOVER:
  `docs/archive/HANDOVER_MASTER_0.7.3.md`.
- 0.5.8~0.7.2 상세 기록:
  `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`.
- 전체 버전 요약:
  `docs/CHANGELOG.md`.
## 23. 0.8.0~0.8.5 요약
- 장문 제작 이전의 채팅·타임라인 기반, 모바일 API 복구, SQLite JobStore, 자동 bootstrap과
  엔진 fallback 기반을 만들었다. 상세 기록은 CHANGELOG와 archive HANDOVER에 보존한다.
## 24. 0.8.6~0.8.8 요약
- 장문 편집, 세션 복원, 공식 로고, 더빙 UI, 공통 상단 배너와 Browser Speech 안전망을 확정했다.
- 0.8.7 Web quality 접근성·메뉴·테스트 타이밍 핫픽스는 CHANGELOG에 보존한다.
## 25. 2026-08-01 22:20 KST · v0.8.9
- 공통 PageScaffold, Premium Korean Engine Mesh와 복수 API 자동 장애 전환을 추가했다.
- API 98개·Worker 9개와 프로젝트 규칙·Python 3.10·TS 구문 검사를 통과했다.
- 실제 Premium 합성은 서버 자격 증명, CosyVoice는 모델·GPU·기준 음성이 필요하다.
## 26. 2026-08-01 23:49 KST · v0.9.0 릴리스 기록
1. 작업 일시: 2026-08-01 23:49 KST.
2. 대상·기준: `0.8.9 → 0.9.0`.
3. 변경 내용: 기본 `free-only` 정책, 비용 등급·자동 후보 메타데이터, TTS job SSE와
   Web polling fallback, Progressive Queue 현재 트랙 보존을 추가했다.
4. 변경 이유: 무료 사용자의 기본 실행에서 유료 API가 후보가 되는 위험을 제거하고 장문 생성
   진행 상태를 더 빠르게 보여 주기 위해서다.
5. 영향 범위: API 설정·engine registry·orchestrator·strategy·diagnostics, TTS route,
   Web 진행 훅·Player store·Settings, 테스트와 문서.
6. 주요 파일: `engine_orchestrator.py`, `engine_strategy.py`, `tts.py`,
   `jobProgressStream.ts`, `useTimelineGeneration.ts`, `usePlayerStore.ts`.
7. 검증 결과: API 103개·Worker 9개, 프로젝트 규칙, compileall, Python 3.10 AST,
   TS/TSX 구문·상대 import, JSON·YAML 검사를 통과했다.
8. 제한: npm mirror 404로 공식 ESLint·typecheck·Vitest·Vite build를 실행하지 못했고,
   Ruff도 미설치다. CosyVoice 모델·GPU는 별도 준비 대상이다.
9. 산출물: `SoriON-AI-0.9.0-full.zip`, `SoriON-AI-0.8.9-to-0.9.0-patch.zip`.
10. 다음 예상 업데이트: `0.9.1 Free Local Model Onboarding & Korean Benchmark`.
## 27. 2026-08-02 · v0.9.1 무료 전용 런타임
1. 결제 계정이 필요한 일반 TTS Adapter와 Secret 설정을 현재 제품 소스에서 제거했다.
2. 일반 TTS 허용 목록은 CosyVoice·MeloTTS·System Voice이며 Mock은 테스트 전용이다.
3. Firebase Hosting Spark와 GitHub Pages는 정적 Web만 제공한다.
4. 데스크톱 정적 Web은 localhost API를 자동 탐색하고 모바일은 Browser Speech를 사용한다.
5. `npm run quality:free-only`가 허용 목록과 Firebase 정적 경계를 검사한다.
6. 다음 목표는 0.9.2 무료 로컬 모델 온보딩과 한국어 품질 벤치마크다.
## 28. 2026-08-02 · v0.9.2 한국어 음성 오케스트레이터
1. 엔진을 많이 노출하는 제품이 아니라 목적에 따라 자동 조합하는 오케스트레이터로 확정했다.
2. `/engines/catalog`가 채택·선택·벤치마크·외부 플러그인·연구·제외 결정을 제공한다.
3. CosyVoice 3·MeloTTS·Faster Whisper·DeepFilterNet3·Rule Director를 코어 채택했다.
4. F5-TTS 공식 pretrained checkpoint는 비상업 조건 때문에 자동 경로에서 제외한다.
5. Kokoro는 공식 한국어 기본 음성이 확인되기 전까지 한국어 경로에서 제외한다.
6. OpenVoice V2는 선택 Adapter, Seed-VC는 GPL 독립 프로세스 플러그인으로만 허용한다.
7. Rule Director는 외부 LLM 없이 내용 용도·발음·호흡·속도·감정과 엔진 요구를 계산한다.
8. 다음 목표는 실제 무료 Adapter 온보딩과 STT 기반 한국어 자동 검수다.
## 29. 2026-08-02 01:35 KST · v0.9.2 CI Hotfix 2
1. 작업 일시: 2026-08-02 01:35 KST.
2. 대상·기준: `0.9.2 CI Hotfix → 0.9.2 CI Hotfix 2`.
3. 변경 내용: 누적 덮어쓰기 저장소에 남은 `public/sorion-icon.svg`를 삭제 목록에
   다시 명시하고 Windows·macOS·Linux 적용 스크립트와 npm 정리 명령을 추가했다.
4. 변경 이유: ZIP 덮어쓰기는 기존 파일을 삭제하지 않으므로 0.8.8에서 폐기한 SVG가
   저장소에 잔존해 `quality:rules`가 실패했다.
5. 영향 범위: 프로젝트 규칙, 패치 적용 절차, 브랜드 정적 파일 정리와 릴리스 문서.
6. 주요 파일: `scripts/remove-stale-brand-assets.mjs`, `package.json`,
   `scripts/check-project-rules.mjs`, `docs/patches/0.9.2-ci-hotfix-2/*`.
7. 검증 결과: 잔존 SVG가 있는 누적 저장소에서 실패를 재현하고 정리 스크립트 실행 뒤
   `npm run quality:rules` 통과와 전체본·패치 적용본 해시 일치를 확인했다.
8. 제한·주의: 패치 ZIP을 덮어쓰기만 하면 기존 SVG는 삭제되지 않는다. 반드시
   `APPLY_HOTFIX.cmd` 또는 `.sh`를 실행하고 GitHub Desktop에서 삭제 변경을 커밋한다.
9. 산출물: `SoriON-AI-0.9.2-ci-hotfix-2-full.zip`,
   `SoriON-AI-0.9.2-ci-hotfix-to-0.9.2-ci-hotfix-2-patch.zip`.
10. 다음 예상 업데이트: Web·API·Worker CI가 모두 녹색인 것을 확인한 뒤
    `0.9.3 Free Local Pipeline Adapters & Korean Verification`을 진행한다.
## 30. 2026-08-02 10:20 KST · v0.9.3-alpha.1
1. 작업 일시: 2026-08-02 10:20 KST.
2. 대상·기준: `0.9.2 CI Hotfix 2 → 0.9.3-alpha.1`.
3. 변경 내용: Worker 모델 매니페스트 schema, 라이선스 동의, 파일 크기·SHA-256,
   CUDA·MPS·CPU·VRAM·디스크 readiness와 생성·검증 CLI를 추가했다.
4. 변경 이유: 모델 경로만 존재하거나 출처·무결성이 확인되지 않은 가중치를 ready로 표시하지
   않고, adapter가 대형 모델을 로딩하기 전에 안전하게 차단하기 위해서다.
5. 영향 범위: Worker 설정·runtime·diagnostics·schema, API connectivity, 환경 변수, 테스트와 문서.
6. 주요 파일: `model_manifest.py`, `runtime.py`, `scripts/model_manifest.py`,
   `test_model_manifest.py`, `connectivity.py`, `.env.example`, `COSYVOICE_WORKER.md`.
7. 검증 결과: 정적 품질 4종, API 100개, Worker 14개 테스트 통과.
8. 제한·주의: 실제 모델·공식 체크섬·라이선스 값은 제공하지 않는다. Web npm 설치와 Python
   3.10 uv·Ruff는 현재 네트워크 제약으로 실행하지 못했다.
9. 산출물: `SoriON-AI-0.9.3-alpha.1-full.zip`,
   `SoriON-AI-0.9.2-ci-hotfix-2-to-0.9.3-alpha.1-patch.zip`.
10. 다음 예상 업데이트: Faster Whisper 한국어 검수와 전체 WAV·MP3·자막 Export.
## 31. 2026-08-02 10:22 KST · v0.9.3-alpha.3 lock 전환
1. 대상·기준: `0.9.3-alpha.2 → 0.9.3-alpha.3`.
2. Node 22.18.0, npm 10.9.3을 nvm·node-version·packageManager·Volta와 CI에 고정했다.
3. 설치된 vite-plugin-pwa의 Vite 8 peer와 전체 npm ls 트리를 검사한다.
4. Actions 수동 입력이 npm·API uv·Worker uv lock, 경고 로그를 artifact로 생성한다.
5. 같은 실행의 Web·API·Worker는 artifact를 받아 npm ci와 uv sync --locked로 재검증한다.
6. 일반 push·PR은 세 lock이 없거나 manifest와 다르면 품질 작업 전에 실패한다.
7. 현재 실행 환경의 registry·DNS 제한 때문에 lock을 임의 생성하지 않았다.
8. 산출물은 lock bootstrap 후보본과 alpha.2 기준 덮어쓰기 패치다.
9. 다음 목표는 실기기 검증, STT 실측, 최종 Export 세 축만 완료하는 것이다.
## 32. 2026-08-02 10:40 KST · v0.9.3-beta.1
1. 대상·기준: 사용자 저장소 `0.9.3-alpha.2`에 alpha.3 lock 변경을 누적했다.
2. 폐기 SVG를 ignore, Git 인덱스 정리, pre-push, CI, 패치 삭제 실행기로 차단했다.
3. 실기기 지연·RTF·메모리·VRAM·재시도·실패 기록 API를 추가했다.
4. Faster Whisper 선택 Adapter와 CER·WER·핵심 토큰 오류 측정을 추가했다.
5. 완료 WAV와 쉼을 병합하고 frame 기반 SRT·VTT, 선택적 MP3를 생성한다.
6. 미완료 구간과 Browser Speech·Demo 음원은 기본 최종 Export에서 차단한다.
7. 주요 파일: stale-file scripts와 hook, verification·exports route, STT·export service, FinalExportControls, `REAL_DEVICE_STT_EXPORT.md`.
8. 검증: API 109개, Worker 14개, compileall, stale-file·프로젝트 규칙 검사 통과.
9. 제한: 로컬 FFmpeg MP3·자막 생성은 검증했지만, 실제 CUDA·MPS·모바일과 Faster Whisper 모델 실측은 아직 필요하다.
10. 산출물: beta.1 전체 ZIP, alpha.2 누적 패치 ZIP, SHA-256.
11. 다음: beta.2에서 실제 장치 증거와 실패 문장 제한 재생성을 완성한다.
## 33. 2026-08-02 12:18 KST · v0.9.3-beta.1 CI Hotfix 1
1. 누락 lock은 생성·감사하고 기존 lock은 strict verify하는 CI 분기로 bootstrap deadlock을 해소했다.
2. 범위는 Actions lock 작업, 판별 스크립트, 프로젝트 규칙과 lock 운영 문서다.
3. missing·partial·present fixture와 YAML·정적 게이트를 검증했고 실제 registry 실행은 Actions가 판정한다.
4. 생성 artifact를 커밋하기 전까지 generate 모드이며 잘못된 기존 lock은 자동 치유하지 않는다.
5. 다음 단계는 세 lock 커밋 후 beta.2 실기기 증거와 선택 STT 재생성이었다.
## 34. 2026-08-02 12:31 KST · v0.9.3-beta.1 CI Hotfix 2
1. Ruff I001, Web fetch mock 타입, Hook 의존성과 Node 20 Artifact Action 경고를 수정했다.
2. Artifact 전달은 Node 24 네이티브 upload v6·download v7을 사용한다.
3. 정적 게이트, API 109개, Worker 14개와 compileall을 통과했다.
4. npm 의존성 실행은 GitHub Actions가 최종 판정한다.
5. 산출물은 CI Hotfix 2 전체본과 Hotfix 1 기준 패치다.
## 35. 2026-08-02 13:27 KST · v0.9.3-beta.2 CI hardening
1. npm·API uv·Worker uv lock을 독립 job으로 분리하고 cache-only 우선·제한 재시도·hard timeout을 적용했다.
2. lock·manifest SHA-256 증명, stable artifact overwrite, main 전용 최소 권한 자동 커밋을 추가했다.
3. npm 장애는 Web lock에만 한정되고 preflight·API·Worker 결과는 독립적으로 확인된다.
4. API 112개, Worker 14개, YAML·정적 게이트·lock proof 손상 fixture를 통과했다.
5. 기능 목표는 실기기 측정, STT 개선율, 30·60분 Export soak를 그대로 유지한다.
## 36. 0.9.3-beta.3 검증 증거와 장문 Export
- 65,536-frame 원자적 Export, 10·30·60분 soak, STT 전후 증거와 개인정보 제거 bundle을 구현했으며 합성 soak는 실제 음질 증거가 아니다.
## 37. 0.9.3-beta.3 CI Hardening 2
- preflight 전체 보고서, npm 공식 endpoint fallback·lock 복구, 구성요소별 lock 부분 커밋으로 npm 장애가 Python 결과와 성공 lock 보존을 막지 않는다.
## 38. 0.9.3-beta.3 CI Hardening 5
- verification은 STT 모듈을 한 번만 import해 Ruff I001 재발을 제거했다.
- 누락 npm lock은 검증된 CI bootstrap으로 복구하고 Firebase SDK는 browser ESM 런타임 로드로 npm 그래프에서 제거했다.
## 39. 0.9.3-beta.3 Engine Heartbeat 2
- 녹색 CI 기준을 유지하며 카카오 WebView 로컬 엔진 제한, 재생 버튼 자동 적용·재생, Browser/System/Melo 프리셋 운율과 CosyVoice 프리셋 WAV 라우팅을 연결했다.

## 40. 0.9.3-beta.3 Engine Heartbeat 3
- 500줄 하드 제한을 폐기하고 800줄 분리 권고·1,200줄 안전 상한으로 완화했다.
- 설정에 Engine Doctor를 추가해 API·실제 TTS·Worker·GPU·설치 단계와 프리셋 3종 준비 상태를 진단한다.
- 음성 시스템 주소 저장, 즉시 재진단, 자동 연결 복구와 민감 정보 제외 진단 복사를 제공한다.
- `START_ENGINE.cmd`가 프로젝트 `voice-presets` 폴더를 API 환경변수에 자동 연결한다.
- Setup API는 프리셋 준비 개수와 누락 파일을 반환하며 실제 음원은 저장소에 포함하지 않는다.
- 검증: preflight 11개, API 123개, Worker 14개, 신규 Web strict semantic 검사, 800/1,200줄 정책 fixture를 통과했다.
- 제한: 전체 npm 설치는 샌드박스 registry 404·외부 registry timeout으로 실행하지 못해 GitHub Actions가 ESLint·Vitest·Vite 최종 판정이다.

## 41. 0.9.3-beta.3 Engine Heartbeat 4
- 첫 화면 4단계를 한 화면 안의 2×2 또는 1×4 그리드로 정리했다.
- PC 1024px 이상은 왼쪽 프로젝트 목록, 중앙 Chat Workspace, 오른쪽 Voice Drawer의 3단 편집 구조다.
- 중앙 하단 Timeline Editor는 시간 눈금·플레이헤드·가로 클립·가위·삭제 도구를 표시한다.
- 상단 엔진 상태는 API·Worker·GPU 3점으로 유지하고 실패 계층은 작업 메시지로 즉시 기록한다.
- 검증: preflight 11개, API 123개, Worker 14개, compileall, 변경 TS/TSX transpile 및 전체 parser 154개 통과.
- 제한: npm 의존성 부재로 ESLint·Vitest·Vite production build는 GitHub Actions에서 최종 확인한다.

## 42. 2026-08-02 19:51 KST · 0.9.3-beta.3 Engine Heartbeat 5
1. 작업 일시: 2026-08-02 19:51 KST.
2. 대상/기준: `0.9.3-beta.3 · Engine Heartbeat 5`, 기준은 `Engine Heartbeat 4` 전체본.
3. 변경 내용: 공개 HTTPS Bridge 진단, 프리셋 WAV 사전검증, 서버 첫 음성 파일 준비 지표,
   PC 좌우 패널 조절·접기·로컬 저장을 추가했다.
4. 변경 이유: 모바일 정적 Web과 실제 Voice API의 연결 현실을 준비됨/미준비로 구분하고,
   손상·무음·클리핑 기준 음성을 Worker에 보내기 전에 차단하며, 장문 첫 결과 대기 시간을
   전체 병합 시간과 분리하기 위해서다.
5. 영향 범위: Web Engine Doctor·결과 카드·타임라인·PC 스튜디오, FastAPI connectivity·setup·TTS
   pipeline, CosyVoice TTS readiness, API/Web 계약과 운영 문서.
6. 주요 파일: `services/api/app/services/voice_preset_validation.py`, connectivity/setup/TTS schema와
   pipeline, `src/hooks/useDesktopStudioLayout.ts`, Engine Doctor·타임라인·결과 카드,
   `docs/SECURE_MOBILE_BRIDGE.md`, `docs/FIRST_AUDIO_LATENCY.md`.
7. 검증 결과: Repository preflight 11/11, API pytest 127개, Worker pytest 14개, Python compileall,
   프로젝트 규칙, TypeScript·TSX 156개 transpile 구문 검사를 통과했다.
8. 제한/주의: 전달본에 npm lock과 설치 의존성이 없어 ESLint·Vitest·semantic typecheck·Vite build는
   실행하지 못했다. 테스트 Python 3.13.5는 지원 상한 3.12 밖이다. `first_audio_ms`는 서버 파일
   준비 시간이며 실제 재생 시작이 아니다. forwarded header는 진단 전용이고 partial-ready 재생은 미구현이다.
9. 산출물: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-5-full.zip`,
   `SoriON-AI-0.9.3-beta.3-engine-heartbeat-4-to-0.9.3-beta.3-engine-heartbeat-5-patch.zip`, SHA-256 목록.
10. 다음 예상 업데이트: Engine Heartbeat 6에서 segment-ready 실제 전달·재생, 브라우저 audible-start
    측정, 신뢰 프록시 allowlist와 실제 모델·모바일 증거를 완성한다.

## 43. 2026-08-02 20:23 KST · 0.9.3-beta.3 Engine Heartbeat 5.1 Web Quality Hotfix
1. GitHub Actions Web quality에서 `HomePage.test.tsx`의 세션 복원 테스트가 동일 이름의 `밝게` 버튼 두 개를 전역 조회해 실패했다.
2. 원인은 데스크톱 Voice Drawer와 모바일 Voice Settings Sheet가 반응형 CSS와 무관하게 JSDOM에 함께 존재하는 구조였다.
3. 실제 검증 대상인 `음성 설정` dialog를 먼저 찾고 `within(dialog)`으로 활성 말투 버튼을 조회하도록 수정했다.
4. `check-web-test-contracts.mjs`에 dialog 범위 조회 필수와 전역 중복 조회 금지 계약을 추가했다.
5. Repository preflight 11/11은 통과했다. 샌드박스 npm registry 404와 외부 DNS timeout으로 Vitest 전체 실행은 불가하며 GitHub Actions가 최종 판정한다.
6. 런타임 제품 코드는 변경하지 않았고, 영향 범위는 Web 테스트와 dependency-free 회귀 게이트뿐이다.

## 44. 2026-08-02 20:45 KST · 0.9.3-beta.3 Engine Heartbeat 5.2 UI/UX Polish
1. PC와 모바일의 음성 속도·높낮이·말투 옵션을 `src/voice/voiceControlOptions.ts` 단일 계약으로 통합했다.
2. 이전 PC 높낮이 0.5 단위가 FastAPI 정수 schema와 충돌해 422가 날 수 있어 정수 단위로 통일하고 복원·전송 전에 clamp·반올림한다.
3. `useModalDialog`를 추가해 Voice Sheet, 종료·초기화 확인창에 초기 초점, Tab trap, Escape, body scroll lock과 초점 복귀를 적용했다.
4. 미리듣기 준비 중 버튼 재실행을 막고, 가짜 필터 탭은 정보 태그로 바꾸며 목소리 radio의 방향키 이동을 추가했다.
5. 프로젝트 메뉴는 바깥 클릭·Escape로 닫고, 동작 없는 현재 프로젝트 버튼을 상태 요소로 바꾸며 접힌 패널 separator를 비활성화했다.
6. 데스크톱 보조 글자와 컨트롤 크기·대비를 높이고 reduced motion 환경에서 패널 전환을 제거했다.
7. Repository preflight 11/11, API pytest 127개, Worker pytest 14개, Python compileall, TS/TSX parser 160개와 transpile 159개 구문 검사를 통과했다.
8. npm 설치는 내부 registry의 패키지 404와 외부 registry timeout 때문에 완료하지 못했다. ESLint·Vitest·semantic typecheck·Vite build는 GitHub Actions에서 최종 판정한다.
9. 남은 수동 확인은 360/390/430px Sheet·가상 키보드, 1180/1280/1440px 3단 레이아웃, NVDA·VoiceOver, Safari range와 실제 TTS 연속 미리듣기다.

## 45. 2026-08-02 21:32 KST · 0.9.3-beta.3 Engine Heartbeat 5.2.1 Focus Return Hotfix
1. GitHub Actions Web quality에서 `DubbingStudioHeader`의 초기화 확인창을 Escape로 닫은 뒤 프로젝트 메뉴 버튼에 초점이 복귀하지 않는 테스트가 실패했다.
2. 메뉴 항목 unmount 뒤 `document.activeElement`가 연결된 `body`가 되어, 기존 훅이 명시적 `returnFocusRef`보다 `body`를 우선한 것이 원인이었다.
3. `useModalDialog`는 effect 시작 시 이전 활성 요소와 명시적 복귀 DOM 노드를 지역 변수로 캡처한다.
4. cleanup은 연결된 명시적 복귀 대상을 먼저 선택하고, 없을 때만 이전 활성 요소를 사용한다.
5. cleanup에서 mutable `returnFocusRef.current`를 직접 읽지 않아 React Hooks annotation 경고를 제거했다.
6. `check-web-test-contracts.mjs`가 캡처·우선순위 계약과 cleanup의 ref 직접 읽기 금지를 강제한다.
7. 샌드박스 npm registry의 `@eslint/js@9.22.0` 404로 전체 Web lint·Vitest·typecheck·build는 재실행하지 못했으며 GitHub Actions가 최종 판정한다.

## 46. 2026-08-03 02:20 KST · 0.9.3-beta.3 Engine Heartbeat 6 Partial Audio Delivery & Bridge Hardening
1. 장문 Pipeline은 각 구간 WAV가 준비될 때 `JobSegmentAudio`를 작업 저장소에 기록하고 SSE에서 `segment-ready`를 별도 발행한다.
2. 성공한 구간 파일은 일반 음원 TTL 동안 보존하고 실패·취소 시 생성된 부분 파일을 제거한다.
3. 구간 URL은 작업 ID·번호·파일명·만료 시각 HMAC을 검증하고 작업 스냅샷에 같은 파일이 등록됐을 때만 반환한다.
4. 운영은 `SORION_SEGMENT_URL_SIGNING_SECRET`을 모든 API 인스턴스에 동일하게 배포해야 하며 비어 있으면 재시작 때 URL이 무효가 되는 임시 Secret을 쓴다.
5. Web은 첫 구간만 조기 재생하고 최종 WAV를 같은 Player Queue 트랙 ID로 교체한다. 후속 구간 gapless queue와 재생 위치 승계는 미구현이다.
6. 지연 지표는 서버 `ready_after_ms`, 실제 첫 응답 chunk, `playing`, Browser Speech `onstart`로 분리한다.
7. 전달 헤더는 FastAPI가 직접 보는 peer가 `SORION_TRUSTED_PROXY_CIDRS` 안에 있을 때만 사용하고 proxy는 기존 외부 헤더를 반드시 덮어써야 한다.
8. 공개 rate-limit key는 회전 가능한 `X-SoriON-Client-ID`가 아니라 유효 client IP로 고정하며 client ID는 audit actor에만 보조 기록한다.
9. Repository preflight 12/12, API pytest 133개, Worker pytest 14개, Python compileall과 TS/TSX 159개 transpile 검사를 통과했다.
10. 내부 npm registry 404로 전체 Web lint·Vitest·semantic typecheck·Vite build는 실행하지 못했으므로 GitHub Actions가 최종 Web 판정이다.


## 47. 2026-08-03 08:47 KST · 0.9.3-beta.3 Engine Heartbeat 6.1 Progressive Playback Stability & Male Presets
1. 기존 도윤 남성 프리셋에 준호 저음·민준 활력을 추가해 전체 5종, 남성 3종으로 확장했다.
2. `src/tts/voicePresets.ts`는 성별 메타데이터와 필터 함수를 제공하고 모바일 Voice Picker는 전체·남성·여성·중성 실제 필터를 사용한다.
3. FastAPI `voice_presets.py`가 canonical ID 목록을 소유하고 Setup 진단과 CosyVoice preset 탐색이 같은 목록을 import한다.
4. 실제 음성 WAV는 저장소에 포함하지 않으며 `jun-deep.wav`, `min-energetic.wav`도 기존 검사·동의·권리 규칙을 따른다.
5. 첫 구간 URL이 403·410이면 작업 상태에서 새 서명을 받아 한 번 다시 fetch하고, 갱신 불가 시 만료 URL을 Player에 넣지 않는다.
6. Player는 같은 트랙의 partial URL이 final URL로 바뀌면 현재 시간과 재생 상태를 캡처해 metadata 준비 후 복원한다.
7. 검증: preflight 13/13, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 159개 transpile 구문 통과.
8. npm 의존성은 전달본에 없어 ESLint·Vitest·semantic typecheck·Vite build는 GitHub Actions가 최종 판정한다.
9. 다음 목표는 두 번째 이후 구간의 ordered queue, 실기기 decode gap 측정과 프리셋 5종 실제 모델 증거다.

## 48. 2026-08-03 10:47 KST · 0.9.3-beta.3 Engine Heartbeat 6.2 Ordered Segment Queue & Device Evidence
1. 장문 구간은 SSE·polling 도착 순서와 무관하게 `nextSegmentIndex` 기준으로 정렬하고 같은 Player Queue 트랙의 `progressive.segments`에 누적한다.
2. 앞 번호 구간이 빠지면 뒤 구간을 건너뛰지 않으며, 현재 구간 종료 뒤 다음 구간이 없으면 반복 대신 `다음 구간 대기` 상태로 멈춘다.
3. 대기 중 새 구간이 도착하면 사용자 선택·트랙 ID를 유지하고 자동 재생하며, 최종 WAV가 도착하면 누적 완료 시간과 현재 구간 위치를 합산해 handoff한다.
4. 부분 재생 중 전체 seek·다운로드는 차단하고, 중복·교체·삭제된 구간 Blob URL은 Player Store가 해제한다.
5. Quality Lab의 현재 기기 재생 점검은 Secure Context, online, EventSource, Service Worker, Media Session, PWA 표시 모드와 사용자 제스처 재생을 개인정보 최소 JSON으로 저장한다.
6. 자동 감지 결과는 gapless·백그라운드 복귀·장시간 SSE·네트워크 전환의 실기기 통과 증거가 아니며 해당 항목은 수동 측정으로 남긴다.
7. 검증: preflight 14/14, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 164개 transpile 구문 검사를 통과했다.
8. 전달본에 npm lock과 설치 의존성이 없어 ESLint·전체 Vitest·semantic typecheck·Vite build는 GitHub Actions가 최종 판정한다. `tsc -b`는 누락된 Vite·Vitest·Node 타입 패키지만 보고했다.
9. 다음 목표는 seam gap 실측, 새로고침 복구, Android Chrome·iOS Safari·PWA soak와 실제 CosyVoice 프리셋 5종 증거다.


## 49. 2026-08-03 12:17 KST · 0.9.3-beta.3 Engine Heartbeat 6.3 Seam Metrics & Device Soak
1. Player는 현재 구간 `ended` 시각과 다음 구간 `playing` 시각의 차이를 seam gap으로 기록하고 다음 구간 생성 대기 포함 여부를 별도 플래그로 남긴다.
2. seam은 트랙별 최근 20개만 보존하며 Quality Lab에서 평균·최대·최근 전환을 표시하고 사용자 문장 없이 JSON으로 내보낸다.
3. `playerSession`은 25분 이내의 원격 최종 API 음원과 Browser Speech만 localStorage에 저장한다. 부분 음원·progressive segment·Blob·revoke 대상은 제외한다.
4. 새로고침 뒤 대기열, 선택 트랙, 반복 모드, 재생 속도와 최종 음원 위치를 복원하지만 autoplay 정책과 사용자 의도를 위해 자동 재생하지 않는다.
5. Browser evidence v2는 online/offline, visibility, 숨김 누적·최장 시간, 백그라운드 복귀와 BFCache pageshow를 관찰 세션으로 누적한다.
6. 관찰 이벤트는 실제 음성 재생·SSE 유지 성공을 인증하지 않으며 Android Chrome·iOS Safari·PWA 수동 soak가 여전히 필요하다.
7. 검증: `Repository preflight 15/15, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 166개 transpile 구문 검사, 핵심 비-React 모듈 strict semantic 검사와 player session·browser evidence runtime smoke를 통과했습니다`.
8. 다음 목표는 만료된 최종 음원을 작업 ID로 재발급하고 실제 기기 10·30·60분 soak와 seam P95를 확보하는 Heartbeat 6.4다.


## 50. 2026-08-03 13:17 KST · 0.9.3-beta.3 Engine Heartbeat 6.4 Signed Audio Rehydration & Device Certification
1. 기준 버전은 Engine Heartbeat 6.3이며 목표는 만료 URL 재발급, seam P95·handoff 오차, 모바일 인증 시나리오 분리다.
2. 최종 TTS URL을 `job_id + final + filename + expires` HMAC으로 서명하고 segment 서명과 도메인을 분리했다.
3. Web API 음원은 `rehydration.kind=tts-final`과 작업 ID를 저장하며 새로고침 또는 audio error에서 완료 결과를 재조회한다.
4. 재발급은 작업 결과와 실제 음원 파일이 30분 TTL 안에 남아 있을 때만 성공하며 삭제된 파일을 복원하지 않는다.
5. Player는 부분→최종 교체 목표 위치와 실제 위치 차이를 기록하고 Quality Lab은 seam 평균·P95·최대와 handoff P95를 내보낸다.
6. 실기기 benchmark는 baseline, network-switch, background-resume, installed-pwa 시나리오와 재생 완료·SSE·fetch 복구 필드를 지원한다.
7. Quality summary는 기존 15개 장치 coverage와 Android/iOS 모바일 인증 24개 coverage를 분리한다.
8. 주요 변경 파일은 TTS signer/routes/tests, player session/persistence/dock, seam/device cards, verification schema/routes/tests와 운영 문서다.
9. 검증은 preflight 16/16, API 137개, Worker 14개, Python compileall, TS/TSX 166개 구문 검사를 통과했다. npm 설치 의존성 부재로 전체 ESLint·Vitest·semantic typecheck·Vite build는 CI 최종 판정이다.
10. 전체 ZIP은 `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.4-signed-audio-device-certification-full.zip`, 패치는 `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.3-to-0.9.3-beta.3-engine-heartbeat-6.4-signed-audio-device-certification-patch.zip`으로 전달한다.
11. Heartbeat 6.5 Device Soak Recorder & Audio Archive Policy 완료:
    - Quality Lab에서 Android/iOS 10·30·60분 측정 세션을 직접 시작·종료한다.
    - SSE reconnect, audio fetch recovery, playback interruption을 개별 밀리초로 기록한다.
    - 기기·엔진·프리셋별 first audio·복구·seam P95와 실패율을 서버가 집계한다.
    - Export 서버 파일은 30분 임시이며 사용자 다운로드만 보존으로 인정한다.
    - 로컬 보존 기록에는 파일명 메타데이터만 남고 음성 바이트·원문·전체 URL은 저장하지 않는다.
12. Heartbeat 6.6 Field Evidence & Reproducible Web Quality를 완료했으며 다음 목표는 Heartbeat 6.7 Field Evidence Intake & Local Export Bundle이다.


## 52. 2026-08-03 15:19 KST · 0.9.3-beta.3 Engine Heartbeat 6.5.2 Stream Handoff CI Hotfix
1. 기준 버전은 Heartbeat 6.5.1이며 제품 버전 `0.9.3-beta.3`은 변경하지 않았다.
2. CI의 부분 구간 3건 실패는 tee probe의 cancel promise를 playback branch 소비 전에 await한 교착 가능성이 원인이었다.
3. probe cancel은 비동기로 시작하고 playback stream을 Blob으로 소비한 뒤 완료를 기다리도록 수정했다.
4. 최종 WAV 승계 테스트는 외부 Store 갱신과 DOM source 반영을 동기화한 뒤 metadata·play를 검증한다.
5. 다음 기능 목표는 Heartbeat 6.7 Field Evidence Intake & Local Export Bundle이다.

## 53. 2026-08-03 18:27 KST · 0.9.3-beta.3 Engine Heartbeat 6.7 Field Evidence Intake & Local Export Bundle
1. 기준 버전은 Heartbeat 6.6이며 제품 버전은 변경하지 않았다.
2. evidence v2와 Web quality run report를 preview/import/list API로 가져온다.
3. SHA-256 재계산, 허용 schema·phase 계약, bundle·record 중복 차단을 등록 전에 수행한다.
4. 브라우저 로컬 ZIP은 최대 20개/250MiB, 파일별 SHA-256 manifest, 진행률과 취소를 제공한다.
5. npm lock 검사를 preflight에 포함하되 패치가 기존 검증 lock을 덮어쓰거나 임의 생성하지 않는다.
6. 다음 목표는 가져온 증거 보존·검토와 CosyVoice 5종 실제 benchmark schema다.

## 54. 2026-08-05 10:17 KST · 0.9.3-beta.3 Engine Heartbeat 6.7.1 Voice Preset Fidelity Hotfix
1. 작업 일시(KST): 2026-08-05 10:17 KST.
2. 대상/기준: `0.9.3-beta.3 · Engine Heartbeat 6.7.1`, 기준은 사용자가 전달한 `Engine Heartbeat 6.7` 전체본이다.
3. 변경 내용: 프리셋 ID·성별·후보 순번 계약을 Web과 API에 추가하고 Browser, Windows, macOS, eSpeak, MeloTTS, CosyVoice의 음성 선택과 오류 처리를 수정했다. 알려진 프리셋은 반대 성별, 알 수 없는 성별, 같은 후보 순환 또는 기본 WAV로 조용히 대체되지 않는다.
4. 변경 이유: 화면에는 남성·인물별 프리셋으로 표시되지만 실제로는 여성 음성 또는 하나의 공통 음성이 재생되던 정합성 문제를 막기 위해서다.
5. 영향 범위: Web Browser Speech 선택·재생 오류 UI, FastAPI 프리셋 계약, System/Melo/CosyVoice 어댑터, 엔진 오케스트레이터의 fallback·circuit breaker, 회귀 검사와 운영 문서다.
6. 주요 파일: `src/tts/voicePresets.ts`, `src/tts/browserSpeech.ts`, `src/components/navigation/LinkedPlayerDock.tsx`, `services/api/app/services/voice_presets.py`, `services/api/app/services/engine_orchestrator.py`, `services/api/app/engines/tts/{system_tts.py,melo_tts.py,cosyvoice_worker_tts.py}`, Windows PowerShell 스크립트, 테스트와 `docs/VOICE_PRESET_FIDELITY.md`다.
7. 검증 결과: Repository preflight 20개, API pytest 154개, Worker pytest 14개, 핵심 프리셋 회귀 29개, TS/TSX transpile 179개, Browser runtime smoke, Python compileall과 `check-voice-preset-contracts.mjs`를 통과했다. 전체 npm 의존성 설치는 내부 registry의 `zustand@5.0.8` 404로 실행하지 못했다.
8. 제한/주의: 실제 5개 화자 WAV와 CosyVoice 모델은 포함하지 않았다. Browser/System/eSpeak는 전용 인물이 아닌 기기·엔진 근사 음성이며 운영체제에 충분한 별도 후보가 없으면 일부 프리셋이 명시적으로 미지원될 수 있다. WAV만으로 성별·신원·동의를 자동 판정하지 않는다.
9. 산출물: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.7.1-voice-preset-fidelity-full.zip`, `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.7-to-6.7.1-voice-preset-fidelity-patch.zip`, `SHA256SUMS.txt`.
10. 다음 예상 업데이트: Heartbeat 6.8에서 프리셋별 동의·출처·선언 성별·WAV SHA-256 manifest, Engine Doctor 검토 상태, 5종 A/B 청취 승인과 실제 CosyVoice benchmark를 추가한다.

## 55. 2026-08-05 15:50 KST · 0.9.3-beta.3 Engine Heartbeat 6.8.0 Preset Evidence Review
1. 기준 버전은 Heartbeat 6.7.1이며 제품 버전 `0.9.3-beta.3`은 변경하지 않았다.
2. 5개 프리셋마다 consent, rights, integrity, human review를 기록하는 동일 ID manifest schema와 pending 템플릿을 추가했다.
3. 전용 WAV 사용 조건을 오디오 품질뿐 아니라 동의 confirmed, `tts-inference` 권리, 사람 approved, 실제 SHA-256·파일 크기 일치까지 확대했다.
4. 동일한 WAV SHA-256을 둘 이상의 인물 프리셋에 등록하면 진단과 실제 CosyVoice 합성 양쪽에서 차단한다.
5. Engine Doctor는 WAV/manifest/최종 사용 가능 수, 프리셋별 checksum과 중복 ID, 현재 브라우저 음성 실제 배정 근거를 표시한다.
6. Quality Lab의 A/B 프리셋을 5종 선택 방식으로 바꾸고 IndexedDB 키와 CSV에 voice ID·이름·선언 성별을 추가했다.
7. 개인정보 제외 진단 복사본은 로컬 경로·WAV·원문을 제외하고 프리셋 인증·checksum·중복 상태만 포함한다.
8. 검증 결과: Repository preflight 21개, API pytest 158개, Worker pytest 14개, CosyVoice 전용 8개, TS/TSX transpile 177개와 Python compileall을 통과했다. 전체 npm quality는 내부 registry의 `zustand@5.0.8` 404로 GitHub Actions 최종 판정이다.
9. 제한: 실제 5개 화자 WAV·동의/권리 원본·CosyVoice 모델은 포함하지 않았다. manifest 템플릿은 pending이며 Browser/System 음성은 전용 인물이 아닌 기기 근사값이다.
10. 다음 예상 업데이트는 Heartbeat 6.8.1의 A/B 검수 내보내기·manifest 연계, System/Melo 실제 화자 telemetry, 프리셋별 CosyVoice benchmark다.


## 2026-08-07 18:38 KST · v0.11.4 Visual Baseline Approval & Recovery Provenance
1. 작업 일시(KST): 2026-08-07 18:38.
2. 대상/기준: `0.11.4 · Visual Baseline Approval & Recovery Provenance`, 기준은 공식 `0.11.3` 전체본이다.
3. 변경 내용: Chromium 승인 baseline/pixel diff workflow, Timeline batch 최근 6건 재시도 이력, runtime soak 파일 provenance와 비교 증거 JSON, adaptive engine EWMA 관찰창 reset을 추가했다.
4. 변경 이유: 화면 회귀를 단순 PNG 보관이 아닌 승인 기준선과 허용 오차로 운영하고, 품질 비교 파일의 출처를 재현 가능하게 남기며, 오래된 엔진 성능 표본이 장시간 뒤 auto routing에 다시 섞이는 문제를 막기 위해서다.
5. 영향 범위: visual layout runner/CI 계약, Timeline Editor와 overlay CSS, Quality Lab runtime soak compare, Engine Orchestrator와 회귀 테스트, 운영 문서다.
6. 주요 파일: `scripts/run-visual-layout-regression.mjs`, `visual-baselines/workspace/README.md`, `src/components/workspace/TimelineEditor.tsx`, `src/quality/runtimeSoakReport.ts`, `src/components/evaluation/RuntimeSoakComparisonCard.tsx`, `services/api/app/services/engine_orchestrator.py`, `docs/VISUAL_BASELINE_RECOVERY_PROVENANCE.md`.
7. 검증 결과: API 215/215, Worker 14/14, engine orchestrator 23/23, Repository preflight 40/40, TS/TSX transpile 201/201, Python compileall을 통과했다. 공식 0.11.3에 패치 ZIP과 APPLY_PATCH를 적용한 결과 886/886 files · missing 0 / extra 0 / changed 0이다.
8. 제한/주의: 현재 실행 환경에는 Web `node_modules`가 없어 실제 Vitest/ESLint/Vite build를 동일 CI 조건으로 실행할 수 없다. 승인 PNG는 신뢰 runner에서 `quality:visual-layout:approve` 실행 후 커밋해야 하며 승인 전에는 pixel baseline 통과를 주장하지 않는다.
9. 산출물: `SoriON-AI-0.11.4-visual-baseline-recovery-provenance-full.zip`, `SoriON-AI-0.11.3-to-0.11.4-visual-baseline-recovery-provenance-patch.zip`, SHA-256 목록.
10. 다음 예상 업데이트: `0.11.5 · Recovery Evidence Classification & Editor Command UX`에서 실제/주입 복구 증거 분리, 승인 baseline CI 강제, 키보드 중심 batch 편집과 장시간 engine observation 진단을 진행한다.

## 2026-08-10 10:15 KST · v0.11.5 Editor Command UX & Adaptive Engine Load Awareness
1. 작업 일시(KST): 2026-08-10 10:15.
2. 대상/기준: `0.11.5 · Editor Command UX & Adaptive Engine Load Awareness`, 기준은 사용자가 전달한 공식 `0.11.4 · Visual Baseline Approval & Recovery Provenance` 전체본이다.
3. 변경 내용: Timeline 다중 선택에 `Ctrl/Cmd+A`, `R`, `Shift+R`, `Alt+←/→`, `Delete`, `Esc`, `?` command bar를 추가하고, 준비된 음원을 덮어쓰는 재생성·삭제에는 안전 미리보기, 이동에는 직전 1회 Undo를 추가했다. Engine auto routing은 현재 실행 중 요청 수를 임시 감점해 병렬 생성이 한 엔진에 몰리는 것을 줄이고, performance observation session의 상태·표본·남은 창·EWMA를 API와 Engine Doctor/Quality Diagnostics에 노출한다.
4. 변경 이유: 긴 대본의 반복 클릭을 줄이고 일괄 작업의 파괴적 실행을 더 명확하게 확인하며, 동시에 들어온 auto 생성 요청이 설정상 첫 엔진에 집중되는 병목을 완화하고 장시간 성능 관찰 신호의 생명주기를 운영자가 구분할 수 있게 하기 위해서다.
5. 영향 범위: `TimelineEditor`와 관련 CSS/회귀 테스트, EngineOrchestrator·engine/quality schema·diagnostics, Web engine/quality API mapping과 진단 UI, repository preflight, 버전·문서다. circuit breaker, half-open probe, 명시적 엔진 선택, `SOA-4022` 계약은 유지한다.
6. 변경·추가된 주요 파일: `src/components/workspace/TimelineEditor.tsx`, `src/styles/timeline-command-bar.css`, `src/components/evaluation/{EngineDoctorCard,QualityDiagnosticsCard}.tsx`, `src/{tts/voiceApi,settings/connectivityApi,quality/qualityApi}.ts`, `services/api/app/services/engine_orchestrator.py`, `services/api/app/schemas/{engine,quality}.py`, `services/api/app/services/engine_diagnostics.py`, `scripts/check-editor-command-engine-observation.mjs`, `docs/EDITOR_COMMAND_ENGINE_LOAD_AWARENESS.md`.
7. 검증 결과: API pytest 217/217, Worker pytest 14/14, Engine orchestrator 25/25, Engine orchestrator+Quality 집중 회귀 30/30, Repository preflight 41/41, Python compileall, dependency-free TS/TSX transpile 201/201, 제품 버전 sync v0.11.5를 통과했다. 공식 0.11.4 기준본에 48개 patch 파일을 overlay하고 APPLY_PATCH를 실행한 결과 892/892 files · missing 0 / extra 0 / changed 0으로 완성본과 일치했다.
8. 알려진 제한과 주의사항: 내부 npm registry가 `zustand@5.0.8`을 404로 반환해 Web 의존성을 설치하지 못했고 동일 CI 조건의 ESLint·Vitest·Vite build·semantic typecheck는 로컬에서 완료하지 못했다. global `tsc -b`는 Vite/Vitest/Node 타입 패키지 누락만 보고했다. active-request 감점은 순간 부하 힌트이지 성능 benchmark가 아니며 이동 Undo는 전체 편집 history가 아니다. 실제/주입 복구 증거 class 분리, 승인 visual baseline CI 강제, 프로젝트 세션 retry snapshot은 아직 완료하지 않았다.
9. 생성한 전체 ZIP과 패치 ZIP 이름: `SoriON-AI-0.11.5-editor-command-adaptive-engine-load-full.zip`, `SoriON-AI-0.11.4-to-0.11.5-editor-command-adaptive-engine-load-patch.zip`, `SHA256SUMS.txt`.
10. 다음 예상 업데이트: `0.11.6 · Recovery Evidence Classification & Session Safety`. 실제 OS/Wi-Fi/visibility와 synthetic injection 증거 class 분리, 승인 Chromium baseline CI 강제, 민감정보 없는 batch retry session snapshot, active-request 분산 장시간 soak 검증을 우선한다.



## 2026-08-10 17:50 KST · v0.11.7 CI Chain Integrity Hotfix
1. 작업 일시(KST): 2026-08-10 17:50.
2. 대상/기준: 제품 버전은 `0.11.7 · One-Flow Dubbing UX`를 유지하며, 기준은 GitHub 커밋 `b5cd5cb`다. 해당 커밋의 부모 `05552c4`는 0.11.5 계열이어서 0.11.6 누적 적용 없이 0.11.7 패치만 올라간 상태였다.
3. 변경 내용: 0.11.6 recovery evidence/session safety에서 추가·변경된 파일 중 현재 GitHub에 빠진 21개를 0.11.7 완성본과 동기화하고, preflight 검사 스크립트 누락 시 raw Node MODULE_NOT_FOUND 대신 누락 경로와 패치 기준 불일치를 직접 안내하도록 runner를 보강했다.
4. 변경 이유: `run-preflight.mjs`가 존재하지 않는 `scripts/check-recovery-evidence-session-safety.mjs`를 호출해 preflight가 실패했고, API tests는 schema v3 테스트와 schema v2 구현이 섞여 evidence 3건이 실패했기 때문이다.
5. 영향 범위: recovery evidence provenance, evidence bundle v3/v2 verifier, verification API schema/route, workspace session v3 및 retry snapshot privacy, Timeline recovery snapshot wiring, recovery injection UI/API, repository preflight runner와 릴리스 문서다. One-Flow UX 자체 동작과 제품 버전은 변경하지 않는다.
6. 주요 파일: `scripts/check-recovery-evidence-session-safety.mjs`, `scripts/run-preflight.mjs`, `services/api/app/services/evidence_bundle.py`, `services/api/app/{api/routes/verification.py,schemas/verification.py}`, `services/api/tests/test_verification.py`, `src/workspace/{sessionTypes,sessionCodec}.ts`, `src/quality/{qualityTypes,recoveryInjection,qualityApi}.ts`, `src/components/{evaluation,workspace}` 관련 파일.
7. 검증 결과: GitHub 상태 재구성에서 preflight 1건 MODULE_NOT_FOUND와 API 3건 실패를 재현했다. hotfix 적용 후 Repository preflight 43/43, API 219/219, Worker 14/14, Python compileall, TS/TSX dependency-free transpile 201/201, Python 3.10 문법 parse 143/143을 통과했다. 0.11.5 visual-runner 기준본 + 실제 0.11.7 패치 + 34파일 hotfix overlay + APPLY_PATCH 결과는 906/906 files · missing 0 / extra 0 / changed 0으로 hotfix 완성본과 일치했다.
8. 알려진 제한과 주의사항: 이 환경에는 Python 3.10 interpreter가 없어 API 테스트는 설치된 Python에서 실행하며, 실제 Python 3.10 최종 판정은 GitHub Actions가 담당한다. Web npm 전체 quality는 내부 registry 제약이 있으면 GitHub Actions를 최종 gate로 사용한다.
9. 생성 산출물: `SoriON-AI-0.11.7-ci-chain-hotfix-full.zip`, `SoriON-AI-0.11.7-b5cd5cb-ci-chain-hotfix-patch.zip`, SHA-256 목록.
10. 다음 예상 업데이트: `0.11.8 · Approved Visual Baseline & Engine Soak Provenance`. 이후 패치는 기준 버전뿐 아니라 실제 GitHub 기준선과 누적 파일 일치 여부를 먼저 검증하고, 필요 시 self-contained 누적 패치로 제공한다.

## 0.11.9 Multi-Speaker Assist & Resume Generation

- `src/workspace/multiSpeaker.ts`는 모든 비어 있지 않은 줄이 명확한 `화자: 대사` 형식인지 보수적으로 검사합니다. 2명 이상이며 unmatched line이 0개일 때만 Assist 대상입니다.
- 화자별 목소리는 preset suggestion일 뿐입니다. `SpeakerVoiceAssignmentPanel`의 명시적 확인 전에는 HomePage가 생성 submit을 차단합니다.
- speaker preview는 `preserveSelection=true`로 실행해 전역 선택 voice를 바꾸지 않습니다.
- `useTimelineGeneration.stageSegments()`는 clip별 generation option을 유지하며 기존 bounded generation을 그대로 사용합니다.
- `VoiceProject.timelineClips`는 clip text/voiceId/voiceName을 저장합니다. `jobIds`는 동일 순서입니다. 구버전 프로젝트는 `timelineClips`가 없으므로 기존 단일 voice restore 경로를 사용합니다.
- batch 취소 뒤 `getQueuedVoiceBlockIds()`로 남은 작업만 resume합니다. resume 완료 후 저장은 `allBlockIds` 전체 snapshot을 사용해 이전 ready clip의 job/voice를 잃지 않습니다.
- 신규 dependency-free gate는 `scripts/check-multi-speaker-resume.mjs`이며 repository preflight에 포함됩니다.
- 승인 visual baseline PNG는 아직 별도 승인 증거가 없으므로 baseline-required CI를 강제하지 않습니다.

## 2026-08-11 KST · v0.11.9 Multi-Speaker Assist & Resume Generation
1. 작업 일시(KST): 2026-08-11.
2. 대상/기준: `0.11.9 · Multi-Speaker Assist & Resume Generation`, 기준은 GitHub Web quality를 통과한 `0.11.8 · Fast One-Flow & Safe Parallel Generation` 전체본이다.
3. 변경 내용: 모든 비어 있지 않은 줄이 명확한 `화자: 대사` 형식이고 화자가 2명 이상일 때만 Multi-Speaker Assist를 활성화한다. 화자별 voice는 suggestion만 만들고 사용자가 `이 화자 배정으로 만들기`를 명시적으로 눌러야 생성에 적용한다. clip별 voice option을 유지하는 timeline staging, 저장 프로젝트의 clip-level voice/job ordering, 생성 중지 뒤 원래 batch의 queued clip만 다시 만드는 `남은 대사 이어서 만들기`를 추가했다.
4. 변경 이유: 긴 대본을 단일 화자로만 처리하거나 중지 후 전체를 다시 생성해야 하는 반복 비용을 줄이되, 화자·성별·캐릭터를 이름에서 추측해 자동 음성을 배정하는 위험은 피하기 위해서다. 완료된 음성을 보존하면서 남은 작업만 이어가는 것이 One-Flow의 빠른 제작 경험과 엔진 비용·안정성에 모두 유리하다.
5. 영향 범위: `HomePage`의 생성 orchestration, `LongformComposer`의 speaker approval/resume UI, `useTimelineGeneration`의 per-segment staging·queued lookup·project restore, `VoiceProject` schema의 optional `timelineClips`, multi-speaker parser/assignment helper, One-Flow CSS, repository preflight와 버전/릴리스 문서다. 기존 bounded parallel 최대 2개, 첫 음성 우선, 순서 복원, recovery/session/engine 안전 계약은 유지한다.
6. 주요 파일: `src/workspace/multiSpeaker.ts`, `src/components/workspace/SpeakerVoiceAssignment.tsx`, `src/components/workspace/LongformComposer.tsx`, `src/pages/HomePage.tsx`, `src/hooks/useTimelineGeneration.ts`, `src/workspace/timelineBlocks.ts`, `src/projects/projectTypes.ts`, `src/styles/one-flow-dubbing.css`, `scripts/check-multi-speaker-resume.mjs`, 관련 Vitest 파일과 `docs/MULTI_SPEAKER_RESUME_GENERATION.md`다.
7. 검증 결과: Repository preflight 44/44, API pytest 219/219, Worker pytest 14/14, Python compileall, 제품 버전 sync v0.11.9, dependency-free TS/TSX transpile 211/211, Multi-Speaker parser/assignment/timeline runtime smoke를 통과했다. 실제 0.11.8 전체본에 최종 patch ZIP과 `APPLY_PATCH.sh`를 적용한 결과 **925/925 files · missing 0 · extra 0 · changed 0**으로 0.11.9 완성본과 파일 SHA가 일치했다.
8. 알려진 제한과 주의사항: 이 실행 환경의 `npm ci`는 registry DNS `EAI_AGAIN`으로 완료되지 않아 전체 ESLint·semantic TypeScript·Vitest·Vite build·Chromium visual regression은 GitHub Actions `Web quality`가 최종 gate다. 화자 Assist는 모든 줄이 명확한 `화자: 대사` 형식일 때만 동작하며 이름이나 텍스트만으로 성별·인물을 추측하지 않는다. 승인 Chromium baseline PNG도 아직 신뢰된 승인 절차가 없으므로 baseline-required CI는 강제하지 않는다.
9. 생성 산출물: `SoriON-AI-0.11.9-multi-speaker-resume-full.zip`, `SoriON-AI-0.11.8-to-0.11.9-multi-speaker-resume-patch.zip`, `SoriON-AI-0.11.9-multi-speaker-resume-SHA256SUMS.txt`.
10. 다음 예상 업데이트: `0.11.10 · Editing History & Speaker Workflow Polish`. 자주 쓰는 화자 mapping 재사용, 제한된 안전 편집 history/Undo, multi-speaker 장시간 soak와 취소·재개 provenance, 명시적 screenplay import 옵션을 진행한다. 승인된 1024/1280/1440 Chromium baseline이 실제로 확보된 경우에만 pixel baseline을 필수 CI gate로 승격한다.
