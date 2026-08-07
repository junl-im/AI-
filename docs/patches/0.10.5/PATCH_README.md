# SoriON AI 0.10.5 Compact Dock & Practical Clip Editor

기준 버전은 **0.10.4 · Voice Preset Engine Reliability Hotfix**입니다.
패치 ZIP을 기존 0.10.4 저장소 루트에 바로 압축 해제해 덮어쓴 뒤 품질 검사를 실행합니다.

## 핵심 변경

- 일반 Dock은 재생/일시정지 버튼을 맨 앞에 두고 진행바를 바로 옆에 배치합니다.
- 만들기 전용 Dock도 같은 핵심 순서를 사용해 PC에서 한 줄로 낮춥니다.
- 타임라인 카드의 반복 textarea를 제거하고 선택 클립 빠른 편집기로 수정 동선을 모읍니다.
- 빠른 편집기에서 저장, 미리듣기/재생, 재생성, 분할, 삭제를 처리합니다.
- Enter는 빠른 편집기에 포커스를 이동하고 `Ctrl/Cmd+Enter`는 저장 후 재생성을 실행합니다.
- 0.10.4의 음성 프리셋 호환·fallback·성별 안전 정책은 그대로 유지합니다.

## 적용 후 권장 검사

```bash
node scripts/check-version-sync.mjs
node scripts/check-playback-control-flow.mjs
node scripts/check-studio-playback-timeline-ux.mjs
node scripts/run-preflight.mjs
PYTHONPATH=services/api python -m pytest -q services/api/tests
PYTHONPATH=services/worker python -m pytest -q services/worker/tests
```

## 제한

- 현재 전달 환경에서는 npm 내부 registry의 `zustand@5.0.8` 404 때문에 Web ESLint·Vitest·semantic typecheck·Vite build를 실행하지 못했습니다. GitHub Actions Web quality에서 최종 확인합니다.
- 실제 브라우저 1024·1280·1440px 화면 캡처 비교는 수행하지 못했습니다.
- 삭제되는 tracked 파일은 없습니다.
