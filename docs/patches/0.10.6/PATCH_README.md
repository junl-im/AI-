# SoriON AI 0.10.6 Baseline Recovery & Multi-Clip Editing

기준 버전은 **0.10.5 · Compact Dock & Practical Clip Editor**입니다.
패치 ZIP을 기존 0.10.5 저장소 루트에 바로 압축 해제해 덮어쓴 뒤 품질 검사를 실행합니다.

## 핵심 변경

- 운영자 benchmark baseline 전체 append-only history를 조회합니다.
- 과거 기준선을 현재 기준선과 비교 미리보기한 뒤 `restored` 이벤트로 복원합니다.
- 타임라인에서 `Ctrl/Cmd` 다중 선택과 `Shift` 범위 선택을 지원합니다.
- 2개 이상 선택하면 일괄 이동·삭제를 사용하고 1개 선택은 빠른 편집기를 유지합니다.
- 재생 중 자동 선택은 다중 선택을 해제하지 않습니다.
- CI hotfix로 jsdom `scrollIntoView` 가드, 음성 미리듣기 접근성 이름 분리, Dock/버전 fixture 동기화와 Ruff import 정렬을 포함합니다.

## 적용 후 권장 검사

```bash
node scripts/check-version-sync.mjs
node scripts/check-playback-control-flow.mjs
node scripts/check-studio-playback-timeline-ux.mjs
node scripts/check-quality-gate-compatibility.mjs
node scripts/run-preflight.mjs
python -m pytest services/api/tests -q
python -m pytest services/worker/tests -q
```

## 제한

- 현재 전달 환경에는 `node_modules`가 없어 Web ESLint·Vitest·semantic typecheck·Vite build를 직접 실행하지 못했습니다. GitHub Actions Web quality 재실행이 최종 판정입니다.
- Ruff 0.15.22의 CI 명령은 Python 3.10 managed interpreter가 필요한데 현재 환경에서는 오프라인으로 확보하지 못해 동일 명령을 직접 실행하지 못했습니다.
- 실제 브라우저 1024·1280·1440px 화면 캡처 비교와 네트워크·절전 E2E 장애 주입은 다음 차수로 넘깁니다.
- 삭제되는 tracked 파일은 없습니다.
