# NEXT UPDATE

현재 기준: `0.11.22 · Timeline Voice Recovery & Quick Navigation`

## 목표 버전

`0.11.23 · Recovery Batch & Editor Responsibility Split`

### 핵심 기능

1. 여러 stale/unavailable MY VOICE 클립을 함께 선택했을 때 사용 불가 개수와 원래 voice 구성을 더 명확히 보여주고, 일괄 대체 전에 영향 범위를 별도 확인합니다.
2. `TimelineEditor.tsx`의 batch command / selection state 책임을 추가 모듈로 분리해 현재 1,000줄대 편집기에서 후속 기능 회귀 범위를 줄입니다.
3. 빠른 편집 이동과 복구 적용을 편집 history/Undo 관점에서 다시 점검해 교체·재생성·이동의 사용자 기대를 일관되게 맞춥니다.
4. GitHub Actions에서 0.11.22 신규 Vitest, semantic typecheck, lint, Vite build, desktop/mobile Chromium layout evidence를 완료합니다.
5. 실제 MY VOICE Worker 연결 환경이 확보된 경우에만 stale profile 복구 후 생성 성공과 first-audio latency를 운영 증거로 추가합니다.

### 선행 조건

- 0.11.22 Repository preflight, API/Worker 회귀가 모두 통과해야 합니다.
- stale MY VOICE의 기존 완성 음원은 사용자의 명시적 교체 전에는 자동 삭제하지 않습니다.
- 혼합 선택에서 현재 작업 Voice를 표시용 기준과 실제 적용 대상으로 혼동하지 않습니다.
- 동시 생성 상한은 실제 soak evidence 없이 2보다 높이지 않습니다.
- 실제 모델/음성 증거가 없는 synthetic 결과는 품질 완료 증거로 승격하지 않습니다.

## 0.11.22에서 고정한 결정

- `사용 불가 목소리`는 Timeline clip의 기존 audio availability와 별개 상태입니다. ready 음원은 복구 전에도 재생할 수 있습니다.
- 대체 목소리 적용은 자동 fallback이 아니라 사용자의 명시적 동작입니다.
- 빠른 이전/다음 이동은 쉼을 건너뛰며, 이동 전에 draft autosave를 수행합니다.
- 혼합 성우 다중 선택은 실제 구성과 현재 작업 목소리를 동시에 표시합니다.
- 빠른 편집 UI와 순수 selection 계산을 TimelineEditor 밖으로 분리하기 시작했습니다.
- PATCH ZIP은 저장소 상대 경로 그대로 구성하며 프로젝트 루트에 직접 덮어쓸 수 있어야 합니다.
- FULL ZIP은 저장소 전체 프로젝트를 포함하고 `.git`, `node_modules`, `dist`, `.sorion`, 캐시, 비밀키는 제외합니다.
