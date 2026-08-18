# NEXT UPDATE

현재 기준: `0.11.23 · Focused Voice Surface & Picker Polish`

## 목표 버전

`0.11.24 · Recovery Batch & Editor Responsibility Split`

### 핵심 기능

1. 여러 stale/unavailable MY VOICE 클립을 함께 선택했을 때 사용 불가 개수와 원래 voice 구성을 더 명확히 보여주고, 일괄 대체 전에 영향 범위를 별도 확인합니다.
2. `TimelineEditor.tsx`의 batch command / selection state 책임을 추가 모듈로 분리해 1,000줄대 편집기의 후속 기능 회귀 범위를 줄입니다.
3. 빠른 편집 이동과 복구 적용을 편집 history/Undo 관점에서 다시 점검해 교체·재생성·이동의 사용자 기대를 일관되게 맞춥니다.
4. 0.11.23의 Voice Drawer/Picker `재생=선택` 계약과 상단 지정 영역 교체 디자인을 GitHub Actions Vitest, semantic typecheck, lint, Vite build, desktop/mobile Chromium evidence로 최종 확인합니다.
5. 실제 MY VOICE Worker 연결 환경이 확보된 경우에만 stale profile 복구 후 생성 성공과 first-audio latency를 운영 증거로 추가합니다.

### 선행 조건

- 0.11.23 Repository preflight와 정적 계약 검사를 통과해야 합니다.
- GitHub Actions Web quality가 0.11.23 커밋에서 녹색이어야 합니다.
- stale MY VOICE의 기존 완성 음원은 사용자의 명시적 교체 전에는 자동 삭제하지 않습니다.
- 혼합 선택에서 현재 작업 Voice를 표시용 기준과 실제 적용 대상으로 혼동하지 않습니다.
- 동시 생성 상한은 실제 soak evidence 없이 2보다 높이지 않습니다.
- 실제 모델/음성 증거가 없는 synthetic 결과는 품질 완료 증거로 승격하지 않습니다.

## 0.11.23에서 고정한 결정

- PC 메인 상단은 전체를 비우지 않습니다. 사용자가 지정한 보조 Live Voice 영역만 교체 디자인하고 브랜드/제목/메타/소개 구조는 보존합니다.
- Voice Drawer와 Voice Picker에서 다른 성우의 ▶를 누르면 해당 성우를 먼저 선택하고 같은 클릭에서 미리듣습니다. 이미 선택된 성우의 재생/일시정지는 Voice를 재적용하지 않습니다.
- Voice Picker 외곽 modal은 스크롤하지 않고 내부 목록 viewport만 스크롤합니다. 라운드 모서리는 외곽 컨테이너가 clipping을 책임집니다.
- `최종 WAV + 자막`은 사용자 화면에서 제거하지만 WAV backend/API 지원 자체는 유지합니다.
- 0.11.22에서 계획했던 stale MY VOICE batch recovery와 TimelineEditor 책임 분리는 폐기하지 않고 0.11.24로 이월합니다.
- PATCH ZIP은 저장소 상대 경로 그대로 구성하며 프로젝트 루트에 직접 덮어쓸 수 있어야 합니다.
- FULL ZIP은 저장소 전체 프로젝트를 포함하고 `.git`, `node_modules`, `dist`, `.sorion`, 캐시, 비밀키는 제외합니다.
