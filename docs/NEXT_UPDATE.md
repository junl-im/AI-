# NEXT UPDATE

현재 기준: `0.11.13 · Focused Creation Surface`

## 이번 패치에서 고정한 결정

- 기본 제작 화면은 `목소리 → 텍스트 → 생성 및 재생`을 가장 먼저 보여 줍니다.
- 고급 음성 설정, 프로젝트 rail, Voice Drawer, Timeline Editor는 삭제하지 않고 on-demand로 유지합니다.
- Fish Audio는 기능/정보 구조 단순화의 참고 대상이며 UI 복제나 외부 유료 API 의존성 추가 대상이 아닙니다.
- 장문 생성 동시성 상한은 실제 soak evidence 전까지 2를 유지합니다.

## 목표 버전

`0.11.14 · Adaptive Longform Soak & Editor Responsibility Split`

### 우선순위

1. 2-way bounded parallel을 장문/다중 화자 실측에서 반복해 P95 지연·실패율·engine switch/fallback 빈도를 evidence로 남깁니다.
2. routing trace 기반으로 1-way로 낮출 조건과 향후 동시성 상향 검토 조건을 문서화합니다.
3. `TimelineEditor.tsx`의 selection/history/clip rendering/command 책임을 분리합니다.
4. `useTimelineGeneration.ts`의 orchestration/recovery/player sync를 분리합니다.
5. 모바일 360/390/430px에서 Composer action row, voice sheet, keyboard, horizontal timeline visual regression을 강화합니다.
6. 승인 Chromium baseline PNG와 SHA manifest가 확보된 경우에만 pixel baseline을 CI 필수 gate로 승격합니다.
