# NEXT UPDATE

현재 기준: `0.11.16 · Timeline Editor Split & Mobile Quick Creation`

## 목표 버전

`0.11.17 · Generation Orchestrator Split & Mobile Evidence`

### 핵심 기능

1. `useTimelineGeneration.ts`의 progressive audio / recovery / batch orchestration 책임을 단계적으로 분리합니다.
2. 360/390/430px 실제 Chromium 모바일 회귀에서 Voice Sheet 선택 → Timeline 적용 → 생성 CTA 접근 흐름을 evidence로 고정합니다.
3. 모바일 키보드가 열린 상태에서 sticky voice/generate control이 입력 영역을 가리지 않는지 검증합니다.
4. 장문 최대 2-way bounded parallel의 P95/실패율/fallback evidence를 수집하고 자동 병렬도 증가는 측정 전까지 금지합니다.

### 선행 조건

- 0.11.16 Web quality에서 TimelineEditor/DubbingVoiceControls 회귀 테스트가 통과해야 합니다.
- 실제 음질 증거가 없는 환경의 synthetic 결과를 품질 완료 증거로 표현하지 않습니다.

## 0.11.16에서 고정한 결정

- PATCH ZIP은 저장소 경로 그대로 구성해 압축 해제 후 프로젝트 루트에 바로 덮어쓸 수 있어야 합니다.
- FULL ZIP은 `.github`, docs, public, scripts, services, src 및 루트 설정/lock 파일을 포함한 전체 프로젝트여야 합니다.
- 모바일 임의 다중 선택은 modifier key가 아닌 화면 내 `＋ / ✓` 컨트롤을 제공합니다.
- 목소리 선택 안내의 적용 개수는 pause가 아니라 실제 voice clip 개수만 계산합니다.
