# SoriON AI 0.11.0 Verification Report

결과 버전: **0.11.0 · Adaptive Engine Resilience & Recovery**
기준 버전: **0.10.8 · CI Test Contract Stability Hotfix**

## 적용 범위

- circuit breaker를 cooldown 이후 단일 half-open probe 상태 기계로 강화
- 명시적 엔진 선택에도 circuit 보호 적용
- 반복 probe 실패의 bounded exponential cooldown과 성공 시 backoff reset
- preset incompatibility와 runtime failure를 분리해 `SOA-4022`는 circuit 실패로 계산하지 않음
- System TTS·MeloTTS·CosyVoice Worker의 runtime rediscovery/refresh
- 엔진 runtime reset API와 실패·probe 충돌 오류 계약
- Quality Lab·Engine Doctor의 성공률·지연·누적 격리·cooldown·probe 진단
- Web 엔진 카탈로그의 cooldown/probing 제외와 복구 시점 자동 재조회
- dependency-free engine resilience 계약과 동시 probe/backoff/reset 회귀 테스트

## 현재 검증 결과

- `python -m pytest -q services/api/tests`: 통과 · 211/211
- `python -m pytest -q services/worker/tests`: 통과 · 14/14
- `node scripts/check-version-sync.mjs`: 통과 · v0.11.0
- `node scripts/check-engine-resilience.mjs`: 통과
- `node scripts/run-preflight.mjs`: 통과 · 38/38
- dependency-free TS/TSX transpile: 통과 · 201/201 (`.d.ts` 제외)
- Python compileall: 통과
- 0.10.8 기준본에 overlay patch 적용 후 완성본 비교: 통과 · 870/870파일 · missing 0 / extra 0 / changed 0
- 변경 범위: 추가 4 + 수정 50 = 총 54파일, 신규 삭제 0
- API에는 기존 FastAPI 422 상수 deprecation 경고 1건만 남습니다.

## 검증 환경 제한

- 현재 전달 환경에는 프로젝트 Web `node_modules`가 없고 이전 설치 시 내부 npm registry가 `zustand@5.0.8`을 404로 반환했습니다.
- Ruff 0.15.22 CLI도 현재 환경에 설치되어 있지 않아 GitHub Actions와 동일한 Ruff 명령은 직접 재실행하지 못했습니다.
- 따라서 실제 ESLint·semantic TypeScript·Vitest·Vite production build와 Ruff는 GitHub Actions가 최종 판정합니다.

## 기능 제한

- circuit runtime 지표는 API 프로세스 메모리에 있으며 프로세스 재시작 뒤 초기화됩니다.
- 실제 CosyVoice 5개 preset WAV·화자 동의/권리·사람 검수 자료·모델 가중치는 포함하지 않습니다.
- 호환 한국어 System/eSpeak/Melo/CosyVoice 엔진이 기기에 없다면 존재하지 않는 음색을 다른 성별/인물로 위장하지 않습니다.
