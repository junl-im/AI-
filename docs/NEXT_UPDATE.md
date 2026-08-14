# NEXT UPDATE

현재 기준: `0.11.18 · SoriON Voice Deck Visual Identity`

## 목표 버전

`0.11.19 · Timeline Command Split & Longform Soak Evidence`

### 핵심 기능

1. `TimelineEditor.tsx`의 selection/history command bar와 quick editor를 별도 모듈로 분리해 800줄 권고선에 더 가깝게 낮춥니다.
2. `dubbing-overlays.css`의 Timeline/batch/export 영역을 별도 CSS 레이어로 분리해 1,200줄 hard limit 접근을 해소합니다.
3. 실제 장문 2-way bounded parallel soak에서 P50/P95, 실패율, fallback, engine switch, cancel/resume 지표를 evidence로 저장합니다.
4. 모바일 Chromium evidence를 Voice Sheet → Timeline 적용 → 생성 CTA → Dock 재생까지 한 단계 더 확장합니다.

### 선행 조건

- 0.11.18 Web quality에서 Voice Deck visual 회귀와 desktop/mobile layout이 모두 통과해야 합니다.
- 동시 생성 상한은 soak 증거 없이 2보다 높이지 않습니다.
- 실제 음질 증거가 없는 synthetic/mock 결과는 품질 완료 증거로 취급하지 않습니다.

## 0.11.18에서 고정한 결정

- generation runtime의 progressive/recovery 실행 책임은 hook이 아니라 `src/timeline/generationRuntime.ts`가 소유합니다.
- partial audio / ordered segment / revision safety static gate는 실제 책임 파일을 직접 검사합니다.
- 모바일 layout gate의 기본 viewport는 360×800, 390×844, 430×932입니다.
- PATCH ZIP은 저장소 상대 경로 그대로 구성하며 프로젝트 루트에 직접 덮어쓸 수 있어야 합니다.
- FULL ZIP은 저장소 전체 프로젝트를 포함합니다.
