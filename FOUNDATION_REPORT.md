# SoriON AI 0.11.5 Verification Report

결과 버전: **0.11.5 · Editor Command UX & Adaptive Engine Load Awareness**  
기준 버전: **0.11.4 · Visual Baseline Approval & Recovery Provenance**

## 적용 범위

- Timeline 다중 선택 keyboard command bar와 입력 요소 보호
- 준비된 음원 재생성·삭제의 안전 실행 preview
- 일괄 이동 직전 1회 Undo
- auto engine routing의 현재 실행 요청 수 기반 임시 부하 감점
- performance observation session 상태/표본/남은 창/EWMA 진단 노출
- 관찰창 만료 뒤 새 표본을 새 성능 관찰 세션으로 시작
- editor command/engine observation dependency-free preflight 계약

## 현재 검증 결과

- API pytest: 통과 · **217/217**
- Worker pytest: 통과 · **14/14**
- Engine orchestrator 집중 회귀: 통과 · **25/25**
- Engine orchestrator + Quality 집중 회귀: 통과 · **30/30**
- Repository preflight: 통과 · **41/41**
- Python compileall: 통과
- 제품 버전 sync: 통과 · **v0.11.5**
- editor command/engine observation dependency-free 계약: 통과
- dependency-free TS/TSX transpile syntax: 통과 · **201/201**
- 0.11.4 기준본 + 패치 overlay 재현: 통과 · **892/892 files · missing 0 / extra 0 / changed 0**

## 검증 환경 제한

- `npm ci --ignore-scripts --no-audit --no-fund`는 내부 registry가 `zustand@5.0.8`을 404로 반환해 완료하지 못했습니다.
- 따라서 동일 GitHub Actions 조건의 Web ESLint·Vitest·Vite production build는 이 환경에서 직접 실행하지 못했습니다.
- global `tsc -b`도 Vite/Vitest/Node 타입 패키지 미설치만 보고해 semantic typecheck를 완료하지 못했습니다.
- API 테스트에는 기존 FastAPI 422 상수 deprecation warning 1건이 남습니다.

## 기능 제한

- `active_request_count` 감점은 프로세스 메모리의 순간 부하 분산 힌트이며 실제 엔진 용량·처리량 benchmark가 아닙니다.
- 일괄 이동 Undo는 직전 한 번의 같은 선택 이동만 되돌리는 경량 기능이며 전체 편집 history 시스템이 아닙니다.
- 실제 OS/Wi-Fi/visibility 복구 증거와 synthetic recovery injection의 schema-level 분리는 다음 버전으로 이월했습니다.
- 승인 Chromium baseline CI 강제와 프로젝트 세션 retry snapshot도 다음 버전으로 이월했습니다.
- 실제 CosyVoice 5개 preset WAV·화자 동의/권리·사람 검수 자료·모델 가중치는 포함하지 않습니다.
