# SoriON AI 0.11.12 Verification Report

결과 버전: **0.11.12 · Editing History, Speaker Memory & Engine Routing Trace**
기준 버전: **0.11.11 · Mobile Studio Flow & Natural Voice Playback**

## 핵심 변경

- Timeline 최근 20단계 bounded Undo/Redo: 이동·재정렬·대사 수정·분할·쉼·삭제·다중 삭제·일괄 목소리 변경
- Undo/Redo 시 의미가 바뀐 clip은 stale audio/job/track을 되살리지 않고 queued로 안전 복원
- 새 workspace/session/project restore 시 edit history 초기화
- 승인한 화자-목소리 조합을 raw 화자명 없이 hash key+voiceId만 최대 24건 기억하고 다음 Multi-Speaker Assist에서 우선 제안
- 장문 batch 완료 시 실제 engine usage/switch/fallback/attempted engine count routing trace 표시
- 동시성 상한 2, circuit breaker, active-load 분산, EWMA 성능 감점, explicit engine 선택 계약은 유지

## 검증

- Repository preflight: **47/47 PASS**
- API pytest: **219/219 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- TS/TSX dependency-free transpile: **221/221 PASS**
- core history/speaker/routing + `useTimelineGeneration` targeted TypeScript semantic check: **PASS**
- 제품 버전 sync: **v0.11.12 PASS**

전체 npm semantic typecheck/Vitest/Vite/Chromium은 이 전달 환경에서 `npm ci`가 제한 시간 내 완료되지 않아 최종 실행하지 못했습니다. GitHub Actions Web quality를 최종 Web gate로 사용합니다.

## 0.11.12 Web quality duplicate-query hotfix

GitHub Actions run `31579425472` / commit `3fffe1e`에서 타입 검사는 통과한 뒤 Vitest가 2건 실패했습니다. 두 실패 모두 의도적으로 중복 표시되는 UI 정보를 전역 단일 query로 찾은 테스트 문제였습니다.

- Timeline: clip `<article>`과 script preview `<p>`가 같은 `title`을 가지는 구조는 유지하고, 테스트는 clip article의 접근성 이름으로 조회합니다.
- Voice picker: 추천 요약과 추천 radio card에 같은 voice name이 보이는 구조는 유지하고, 테스트는 추천 `role=status` 영역에서 이름을 확인합니다.
- 런타임 제품 코드는 변경하지 않습니다.

Hotfix 재검증: Repository preflight **47/47 PASS**, API pytest **219/219 PASS**, Worker pytest **14/14 PASS**, dependency-free TS/TSX transpile **221/221 PASS**. 전체 semantic `tsc`/Vitest는 clean artifact에 Web dependencies가 설치되지 않은 상태라 로컬에서 최종 재실행하지 못했고 GitHub Actions Web quality가 최종 gate입니다.
