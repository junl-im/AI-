# SoriON AI 0.10.6 Verification Report

결과 버전: **0.10.6 · Baseline Recovery & Multi-Clip Editing**
기준 버전: **0.10.5 · Compact Dock & Practical Clip Editor**

## 적용 범위

- 운영자 benchmark baseline append-only history 조회
- 현재 기준선과 과거 기준선의 restore preview 및 `restored` 이벤트 기반 복원
- `Ctrl/Cmd` 다중 선택과 `Shift` 범위 선택, 선택 클립 일괄 이동·삭제
- 단일 선택 빠른 편집 유지 및 재생 중 다중 선택 보존
- jsdom-safe `scrollIntoView` 가드와 음성 미리듣기 접근성 이름 분리
- Compact Dock Browser Speech 라벨·Quality report 버전 fixture 동기화
- Ruff I001 import 정렬 hotfix 3건
- 0.10.5 Compact Dock 및 0.10.4 프리셋 엔진 reliability 정책 유지

## 검증 결과

- `node scripts/run-preflight.mjs`: 통과 · 36/36
- `node scripts/check-version-sync.mjs`: 통과 · v0.10.6
- `node scripts/check-playback-control-flow.mjs`: 통과
- `node scripts/check-studio-playback-timeline-ux.mjs`: 통과
- `node scripts/check-quality-gate-compatibility.mjs`: 통과
- TypeScript global compiler를 사용한 `src` TS/TSX dependency-free transpile: 통과 · 191/191 (`.d.ts` 제외)
- `python -m pytest services/api/tests -q`: 통과 · 199/199
- `python -m pytest services/worker/tests -q`: 통과 · 14/14
- API 테스트에는 FastAPI의 기존 `HTTP_422_UNPROCESSABLE_ENTITY` 상수 deprecation 경고 1건이 있으나 테스트 실패는 없습니다.
- 현재 전달 환경에는 `node_modules`가 없어 Web ESLint·Vitest·semantic typecheck·Vite build는 직접 실행하지 못했습니다. 사용자가 제공한 CI 실패 지점은 소스·테스트 양쪽에 hotfix를 적용했으며 GitHub Actions Web quality 재실행이 최종 판정입니다.
- Ruff 0.15.22는 CI에서 `uv run --locked --python 3.10`으로 실행됩니다. 현재 환경은 Python 3.10 managed interpreter와 Ruff wheel을 오프라인에서 확보하지 못해 동일 명령은 실행하지 못했으나, I001 지적 import block을 프로젝트의 기존 Ruff/isort 순서에 맞춰 수정했습니다.

## 제한

- 브라우저 렌더러가 없는 현재 환경에서는 1024·1280·1440px 실제 화면 스크린샷 비교를 수행하지 못했습니다.
- 이전 runtime soak 결과 비교 UI, 네트워크·절전 복귀 E2E 장애 주입, 실제 기기 음성 inventory 변화 감지는 0.10.7 후보로 넘깁니다.
- 실제 5개 CosyVoice WAV·동의/권리 자료·모델 가중치는 릴리스 ZIP에 포함하지 않으며 기존 프리셋 안전 정책을 변경하지 않습니다.

## 변경 수

- 추가 3개
- 수정 45개
- 삭제 0개
- 총 48개
