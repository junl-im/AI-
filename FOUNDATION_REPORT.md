# SoriON AI 0.11.4 Verification Report

결과 버전: **0.11.4 · Visual Baseline Approval & Recovery Provenance**
기준 버전: **0.11.3 · Failure-Guided Editing & Adaptive Performance Routing**

## 적용 범위

- Chromium 1024/1280/1440px 승인 baseline 생성 workflow와 허용 오차 pixel diff
- baseline 미승인 상태의 후보 PNG/DOM layout 검사와 `--require-baseline` 강제 모드 분리
- Timeline 일괄 작업 최근 6건 세션 재시도 이력과 중복 결과 제목 정리
- Runtime soak 원본 파일명·실제 파일 SHA-256·수집/로드/비교 시각 provenance
- `runtime-soak-comparison/1` 비교 증거 JSON export
- adaptive engine performance observation window 만료 뒤 stale EWMA/sample count reset

## 현재 검증 결과

- API pytest: 통과 · 215/215
- Worker pytest: 통과 · 14/14
- Engine orchestrator 집중 회귀: 통과 · 23/23
- Repository preflight: 통과 · 40/40
- dependency-free TS/TSX transpile: 통과 · 201/201 (`.d.ts` 제외)
- Python compileall: 통과
- Visual baseline/pixel diff 코드 계약 및 Node syntax check: 통과
- 변경 범위: 추가 4 + 수정 37 = 총 41파일 · 삭제 0
- 0.11.3 패치 ZIP 실제 적용 재현: 통과 · 886/886 files · missing 0 / extra 0 / changed 0
- 전체/패치 ZIP 압축 무결성 검사: 통과

## 검증 환경 제한

- `npm ci`는 내부 registry의 `zustand@5.0.8` 404로 중단되어 동일 GitHub Actions Web ESLint·semantic typecheck·Vitest·Vite build는 실행하지 못했습니다.
- 이 환경에서는 production build가 없으므로 실제 앱의 승인 PNG 생성과 pixel diff 실행은 하지 않았습니다. GitHub Actions 또는 신뢰 runner에서 `quality:visual-layout:approve`가 필요합니다.
- API 테스트에는 기존 FastAPI 422 상수 deprecation warning 1건이 남습니다.

## 기능 제한

- 승인 visual baseline이 저장소에 아직 없으면 pixel baseline 통과를 주장하지 않으며 DOM layout과 후보 PNG 증거만 생성합니다.
- batch 재시도 이력은 현재 Timeline Editor 마운트 세션 최근 6건이며 프로젝트 영구 이력이 아닙니다.
- 엔진 성능 표본 reset은 auto routing의 최근 관찰 신호만 초기화하며 circuit breaker·명시적 엔진 선택·`SOA-4022` 규칙은 변경하지 않습니다.
- 실제 CosyVoice 5개 preset WAV·화자 동의/권리·사람 검수 자료·모델 가중치는 포함하지 않습니다.
