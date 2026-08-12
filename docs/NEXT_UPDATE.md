# NEXT UPDATE

현재 기준: `0.11.12 · Editing History, Speaker Memory & Engine Routing Trace`

## 현재 안정화 선행 조건

- GitHub Actions #101에서 확인된 중복 요소 단일 조회 2건은 `0.11.12 Web quality duplicate-query hotfix`로 수정했습니다.
- 새 Actions run에서 Web quality가 녹색이 되기 전에는 0.11.13 기능 변경을 Push하지 않습니다.
- hotfix는 제품 UI를 축소하지 않고 접근성 role/영역 기반 테스트 selector만 교정합니다.

## 목표 버전

`0.11.13 · Adaptive Longform Soak & Mobile Editing Polish`

### 우선순위

1. 2-way bounded parallel을 실제 장문/다중 화자 soak에서 반복해 P95 지연·실패율·engine switch/fallback 빈도를 evidence로 남깁니다.
2. routing trace를 기반으로 동시성 상향이 안전한 조건과 오히려 1-way로 낮춰야 하는 조건을 정의하되 실제 측정 전 자동 상향은 하지 않습니다.
3. 모바일 360/390/430px에서 Undo/Redo, voice sheet, composer keyboard, horizontal timeline의 실제 Chromium 레이아웃을 별도 회귀로 추가합니다.
4. speaker memory 관리 UI(최근 배정 보기/삭제)를 개인정보 최소 원칙으로 검토합니다.
5. TimelineEditor와 useTimelineGeneration의 비대화된 책임을 history/orchestration 단위로 추가 분리합니다.
6. 승인 Chromium baseline PNG와 SHA manifest가 확보된 경우에만 pixel baseline을 CI 필수 gate로 승격합니다.

## 0.11.12에서 고정한 결정

- Undo/Redo history 상한은 20개입니다.
- 폐기된 음원 URL/job은 Undo로 복원하지 않습니다.
- 화자 배정 기억에는 대본·화자 원문·오디오·job/error를 저장하지 않습니다.
- 최근 화자 배정은 제안이며 사용자 확인 없이 생성에 자동 적용하지 않습니다.
- 엔진 routing trace는 관측 자료이며 음질 benchmark가 아닙니다.
- 장문 동시성 상한은 실제 soak evidence 전까지 2를 유지합니다.
