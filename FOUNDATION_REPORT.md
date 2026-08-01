# SoriON AI 0.8.7 CI Hotfix 4 Result Report

작업 일시: 2026-08-01 20:47 KST

결과 버전: **0.8.7 Dubbing Studio Workspace · CI Hotfix 4**

## 결과

- `useExitConfirmation` 테스트가 React 상태 갱신을 `act()` 밖에서 발생시켜 종료 확인창을 조회하기 전에 assertion이 실행되던 문제를 수정했다.
- popstate 발생을 공통 helper에서 `act()`로 감싸 첫 뒤로가기, 두 번째 뒤로가기, 종료 버튼 흐름을 같은 방식으로 검증한다.
- HomePage 테스트가 변경 가능한 placeholder 문구 `긴 원고`에 결합돼 새 `장문 원고` 안내와 충돌하던 문제를 제거했다.
- placeholder 카피 대신 제품의 안정 계약인 최대 20,000자 입력 제한을 검증한다.
- 별도 Web 테스트 계약 검사 스크립트를 추가해 popstate의 `act()` 누락과 placeholder 문구 결합이 다시 들어오면 CI 앞단에서 차단한다.

## 검증

- 프로젝트 규칙·Web 테스트 계약·작업공간 세션 규칙 통과
- TypeScript·TSX 125개 파일 구문 검사 통과
- 상대경로 import 267개 연결 통과
- FastAPI 90개·Worker 9개 테스트 통과
- Python compileall과 Python 3.10 AST 93개 파일 통과
- 기준본 패치 적용 동등성과 ZIP 무결성 검사 통과

## 알려진 현실

현재 내부 npm 저장소가 `@tailwindcss/vite`와 Testing Library 패키지를 제공하지 않아 공식 ESLint, TypeScript project typecheck, Vitest와 Vite build를 로컬에서 실행하지 못했다. 이번 수정은 GitHub Actions가 보고한 실패 위치와 React Testing Library의 상태 갱신 계약을 직접 반영했으며, GitHub Actions Web quality가 최종 실행 관문이다.

## 다음 목표

`0.8.8 Korean Voice Quality Streaming`
