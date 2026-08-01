# SoriON AI 0.9.0 Result Report

작업 일시: 2026-08-01 23:49 KST

결과 버전: **0.9.0 Free-First Korean Progressive Voice**

## 결과

- 서버 기본 엔진 정책을 `free-only`로 고정해 무료 사용 흐름에서 과금형 API를 등록·호출하지 않는다.
- CosyVoice Worker, MeloTTS, System Voice를 무료 서버 후보로 우선하고 Browser Speech를 Web 안전망으로 유지한다.
- NAVER·Google·Azure·ElevenLabs는 운영자가 `balanced`를 명시한 경우에만 서버 후보가 된다.
- 엔진 목록과 전략 응답에 비용 등급과 자동 후보 여부를 공개한다.
- TTS job 진행 상태를 SSE로 전달하고 Web은 실패 시 polling으로 자동 대체한다.
- 장문 생성 중 뒤 블록이 완료돼도 현재 플레이어 선택이 임의로 바뀌지 않도록 Queue를 안정화했다.
- 설정 화면은 `무료 우선 자동` 정책을 읽기 전용으로 표시하며 수동 엔진 선택을 제공하지 않는다.

## 검증 범위

- API **103개**, Worker **9개** 회귀 테스트
- Python compileall과 Python 3.10 AST 호환성
- 프로젝트·세션·Web 테스트 계약 규칙
- TypeScript·TSX 구문과 상대경로 import
- JSON·YAML·줄 끝 공백·500줄 제한
- 0.8.9 기준 패치 적용 동등성, ZIP 무결성, SHA-256

## 실행 환경 제한

현재 패키지 미러가 `@tailwindcss/vite`를 404로 반환해 공식 ESLint·프로젝트 typecheck·Vitest·
Vite build를 실행하지 못했다. Ruff도 설치돼 있지 않아 공식 Ruff는 GitHub Actions에서 최종 확인한다.
로컬 고품질 AI 음성을 위한 CosyVoice 모델·PyTorch·CUDA·GPU는 릴리스 ZIP에 포함하지 않는다.

## 다음 목표

`0.9.1 Free Local Model Onboarding & Korean Benchmark`
