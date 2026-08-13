# NEXT UPDATE

현재 기준: `0.11.15 · PC Editor Clarity & Linked Timeline Player`

## 목표 버전

`0.11.16 · Adaptive Longform Soak & Editor Responsibility Split`

### 핵심 기능

1. 최대 2-way bounded parallel을 실제 장문·다중 화자 soak에서 반복해 P95 지연, 실패율, fallback, engine switch 빈도를 evidence로 남깁니다.
2. 측정 결과가 나쁘면 자동으로 병렬도를 올리지 않고 1-way/2-way 선택 기준만 정의합니다.
3. `TimelineEditor.tsx`의 selection/history/rendering 책임을 분리해 현재 1,192줄 규모의 회귀 위험을 낮춥니다.
4. `useTimelineGeneration.ts`의 orchestration/recovery/player-sync 책임을 분리합니다.
5. 모바일 360/390/430px Chromium layout regression을 별도 evidence로 추가합니다.
6. 0.11.15에서 추가한 Timeline Linked Player와 하단 Dock의 공용 playback store 계약을 분리 작업 중에도 유지합니다.

### 예상 변경 영역

- `src/components/workspace/TimelineEditor.tsx` 및 신규 timeline 하위 모듈
- `src/components/workspace/TimelineLinkedPlayer.tsx`와 공용 player store 계약 테스트
- `src/hooks/useTimelineGeneration.ts` 및 신규 generation orchestration 모듈
- runtime soak evidence/분석 경로
- visual layout regression 스크립트와 모바일 baseline/evidence
- 관련 테스트, 문서, HANDOVER/CHANGELOG

### 선행 조건과 위험 요소

- 0.11.15 GitHub Actions에서 Web/API/Worker/Pages chain이 GitHub-hosted runner 기준으로 녹색인지 확인합니다.
- 승인되지 않은 Chromium pixel baseline을 강제 gate로 승격하지 않습니다.
- 실제 CosyVoice 모델·승인 WAV가 없는 환경의 synthetic 결과를 음질 완료 증거로 표현하지 않습니다.
- editor 분리는 기능 추가와 동시에 대규모 rewrite하지 않고 순수 상태/계산 모듈부터 단계적으로 이동합니다.
- Timeline Linked Player는 별도 audio element/독립 재생 상태를 만들지 않습니다. Dock과의 단일 source of truth를 유지합니다.

## 0.11.15에서 고정한 결정

- PC Timeline의 기본 읽기 순서는 `대사 트랙 → 연계 플레이어 → 선택 클립 편집`입니다.
- Timeline Linked Player와 하단 Dock은 같은 player store, queue, current track, playback position을 공유합니다.
- `최종 WAV + 자막`은 편집 타임라인 기능이 아니라 상단 `내보내기` 완료 액션입니다.
- PC Voice Picker는 중앙 compact modal이며 성우 선택 단계에서는 긴 장점/주의/용도 설명을 노출하지 않습니다.
- 사이드바 토글은 열림/닫힘 상태별로 재진입 위치가 항상 보이고 다른 컨트롤과 겹치지 않아야 합니다.
- 0.11.14에서 확정한 workflow/lock/cache hardening 규칙은 그대로 유지합니다.
