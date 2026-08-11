# SoriON AI 0.11.9 Verification Report

결과 버전: **0.11.9 · Multi-Speaker Assist & Resume Generation**  
기준 버전: **0.11.8 · Fast One-Flow & Safe Parallel Generation**

## 적용 범위

- 모든 비어 있지 않은 줄이 명확한 `화자: 대사` 형식이고 화자가 2명 이상일 때만 Multi-Speaker Assist 활성화
- 화자별 목소리는 자동 적용하지 않고 preset suggestion으로만 제공하며 사용자 승인 전 생성 차단
- 화자별 미리듣기는 전역 선택 voice를 바꾸지 않아 승인 매핑을 우발적으로 변경하지 않음
- clip별 `voiceId`/`voiceName`을 유지하는 multi-speaker timeline staging
- 저장 프로젝트에 `timelineClips`를 추가해 clip text/voice mapping/job ordering을 보존하고 구버전 프로젝트는 기존 단일 voice 복원 경로 유지
- 생성 중지 후 기존 ready 결과를 유지하고 원래 batch 안의 `queued` 대사만 `남은 대사 이어서 만들기`로 재개
- resume 저장 시 현재 재개 대상만이 아니라 원래 전체 `allBlockIds` snapshot을 사용해 이전 ready clip의 voice/job 상태 보존
- Multi-Speaker/Resume 전용 dependency-free repository gate 추가
- 0.11.8 첫 음성 우선, 최대 2개 bounded parallel, 원문 순서 복원, 안전 취소, recovery/session/engine 계약 유지

## 최종 검증 결과

- API pytest: 통과 · **219/219**
- Worker pytest: 통과 · **14/14**
- Python compileall: 통과
- 제품 버전 sync: 통과 · **v0.11.9**
- dependency-free TS/TSX transpile syntax: 통과 · **211/211**
- Repository preflight: 통과 · **44/44**
- Multi-Speaker parser/assignment/timeline runtime smoke: 통과
- version fixture sync gate: 통과
- 실제 0.11.8 기준 self-contained patch/full ZIP overlay 검증: **925/925 files · missing 0 · extra 0 · changed 0**

## Web 검증 환경 제한

- 이 실행 환경의 `npm ci`는 npm registry DNS 오류 `EAI_AGAIN`으로 완료되지 않았고 생성된 불완전 `node_modules`는 전달본에서 제거했습니다.
- 따라서 ESLint·semantic TypeScript·Vitest·Vite production build·Chromium visual layout의 최종 판정은 Push 후 GitHub Actions `Web quality`를 source of truth로 둡니다.
- 소스 구문은 global TypeScript의 dependency-free transpile로 211개 TS/TSX 파일을 전수 검사했습니다.
- Multi-Speaker helper runtime smoke는 통과했으나 CommonJS 설정으로 전체 의존 그래프를 별도 `tsc`했을 때 기존 `import.meta` 관련 진단이 함께 출력됐으므로 해당 명령 전체를 semantic typecheck 통과로 주장하지 않습니다.

## 안전성·호환성 원칙

- 화자명·성별·캐릭터를 추측해 voice를 자동 적용하지 않습니다. 명시적 `화자: 대사` 구조와 사용자 승인만 실제 생성 mapping의 근거로 사용합니다.
- 일부 줄만 화자 형식인 혼합 대본은 자동 분리하지 않습니다. unmatched line이 하나라도 있으면 Assist 적용을 보류합니다.
- speaker preview는 선택 확인용이며 전역 voice 선택을 변경하지 않습니다.
- 재개는 원래 취소된 batch의 queued clip만 대상으로 하며 사용자가 그 뒤 수동 추가한 unrelated queued clip을 끌어오지 않습니다.
- 프로젝트의 `timelineClips`는 optional이라 기존 저장 프로젝트와 하위 호환됩니다.
- workspace session의 기존 clip별 voice 보존 규칙은 그대로 유지하며 session schema를 불필요하게 올리지 않습니다.
- 승인 Chromium baseline PNG는 아직 별도 승인 증거가 없으므로 `SORION_VISUAL_BASELINE_REQUIRED=1`을 임의로 강제하지 않습니다.
