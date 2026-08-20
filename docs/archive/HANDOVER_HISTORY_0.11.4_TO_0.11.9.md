# SoriON AI HANDOVER HISTORY · 0.11.4 TO 0.11.9

이 파일은 `docs/HANDOVER.md`의 1200줄 안전 상한을 유지하기 위해 이동한 과거 상세 이력입니다. 기록 내용은 삭제하지 않았습니다.

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
