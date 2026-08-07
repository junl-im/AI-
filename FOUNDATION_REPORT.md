# SoriON AI 0.10.8 Verification Report

결과 버전: **0.10.8 · CI Test Contract Stability Hotfix**
기준 버전: **0.10.7 · Recovery Evidence & Voice Inventory Diagnostics**

## 적용 범위

- browser playback evidence 테스트의 `afterEach()` 내부 중첩 `it()` 제거
- HomePage 장문 통합 테스트를 단일 빠른 편집기 + 타임라인 카드 텍스트 계약과 동기화
- 동일 회귀를 dependency-free project rules에서 사전 차단
- 앱·API·Worker 및 현재 버전 API fixture를 0.10.8로 동기화

## 검증 결과

- `python -m pytest -q services/api/tests`: 통과 · 199/199
- `python -m pytest -q services/worker/tests`: 통과 · 14/14
- `node scripts/run-preflight.mjs`: 통과 · 37/37
- `node scripts/check-version-sync.mjs`: 통과 · v0.10.8
- TypeScript global compiler 기반 dependency-free TS/TSX transpile: 통과 · 201/201 (`.d.ts` 제외)
- Python compileall: 통과
- API에는 기존 FastAPI 422 상수 deprecation 경고 1건만 남습니다.
- Web 의존성 설치는 현재 내부 npm registry가 `zustand@5.0.8`을 404로 반환해 실패했습니다. 따라서 실제 ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions 재실행이 최종 판정입니다.

## 제한

- 이번 버전은 CI 안정화 전용 hotfix입니다. 실제 런타임 재생·합성·편집 기능은 변경하지 않습니다.
- 원래 0.10.8에 예정했던 Chromium 시각 회귀와 안전한 다중 음성 편집은 0.10.9로 이동합니다.
