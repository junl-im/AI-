# NEXT UPDATE

현재 기준: `0.11.14 · All Workflows Reliability Hardening`

## 목표 버전

`0.11.15 · Adaptive Longform Soak & Editor Responsibility Split`

### 핵심 기능

1. 최대 2-way bounded parallel을 실제 장문·다중 화자 soak에서 반복해 P95 지연, 실패율, fallback, engine switch 빈도를 evidence로 남깁니다.
2. 측정 결과가 나쁘면 자동으로 병렬도를 올리지 않고 1-way/2-way 선택 기준만 정의합니다.
3. `TimelineEditor.tsx`의 selection/history/rendering 책임을 분리해 대형 컴포넌트 회귀 위험을 낮춥니다.
4. `useTimelineGeneration.ts`의 orchestration/recovery/player-sync 책임을 분리합니다.
5. 모바일 360/390/430px Chromium layout regression을 별도 evidence로 추가합니다.

### 예상 변경 영역

- `src/components/workspace/TimelineEditor.tsx` 및 신규 timeline 하위 모듈
- `src/hooks/useTimelineGeneration.ts` 및 신규 generation orchestration 모듈
- `scripts/run_runtime_soak` 관련 evidence/분석 경로
- visual layout regression 스크립트와 모바일 baseline/evidence
- 관련 테스트, 문서, HANDOVER/CHANGELOG

### 선행 조건과 위험 요소

- 0.11.14 GitHub Actions에서 Web/API/Worker/Pages chain이 실제 GitHub-hosted runner 기준으로 녹색인지 확인합니다.
- 승인되지 않은 Chromium pixel baseline을 강제 gate로 승격하지 않습니다.
- 실제 CosyVoice 모델·승인 WAV가 없는 환경의 synthetic 결과를 음질 완료 증거로 표현하지 않습니다.
- editor 분리는 기능 추가와 동시에 대규모 rewrite하지 않고 순수 상태/계산 모듈부터 단계적으로 이동합니다.

## 0.11.14에서 고정한 결정

- 일반 Push/PR은 npm/API/Worker의 committed lock을 모두 요구합니다.
- lock 생성은 `workflow_dispatch + generate_lockfiles=true`에서만 수행하고 자동 commit/push하지 않습니다.
- manual workflow concurrency는 ref/PR 단위로 격리하며 lock 생성/soak maintenance run은 같은 ref에서 취소하지 않습니다.
- npm cache는 lock hash 기반 key를 사용하며 exact hit에서 중복 save하지 않습니다.
- Dependabot은 npm, API uv, Worker uv, GitHub Actions를 모두 추적합니다.
