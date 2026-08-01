# SoriON AI 0.8.7 CI Hotfix 3 Result Report

작업 일시: 2026-08-01 20:32 KST

결과 버전: **0.8.7 Dubbing Studio Workspace · CI Hotfix 3**

## 결과

- `DubbingStudioHeader`의 네이티브 `details/summary` 메뉴가 JSDOM에서 열림 상태를 안정적으로 전환하지 않아 `현재 작업 비우기` 버튼 조회가 실패하던 문제를 수정했다.
- 프로젝트 메뉴를 명시적 button, React 상태, `aria-expanded`와 조건부 렌더링으로 교체했다.
- 같은 잠재 문제가 남아 있던 대사 블록 메뉴도 동일한 구조로 선제 교체했다.
- 대사 메뉴는 대사 번호를 접근성 이름에 포함하고, 메뉴 동작 선택 뒤 즉시 닫힌다.
- 프로젝트 규칙에서 제작 화면의 `details/summary` 재도입을 차단한다.

## 검증

- 프로젝트 규칙과 작업공간 세션 규칙 통과
- TypeScript·TSX 125개 파일 구문 검사 통과
- 상대경로 import 267개 연결 통과
- FastAPI 90개·Worker 9개 테스트 통과
- Python compileall과 Python 3.10 AST 호환성 검사 통과
- 기준본 패치 적용 동등성과 ZIP 무결성 검사 통과

## 알려진 현실

현재 내부 npm 저장소가 `@tailwindcss/vite`와 Testing Library 패키지를 제공하지 않아 공식 ESLint, TypeScript project typecheck, Vitest와 Vite build를 로컬에서 실행하지 못했다. GitHub Actions Web quality가 최종 실행 관문이다. 공개 Voice API와 음성 엔진 동작은 이 UI 테스트 안정화 핫픽스에서 변경하지 않는다.

## 다음 목표

`0.8.8 Korean Voice Quality Streaming`
