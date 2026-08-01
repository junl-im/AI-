# SoriON AI 0.8.7 CI Hotfix 2 Result Report

작업 일시: 2026-08-01 20:05 KST

결과 버전: **0.8.7 Dubbing Studio Workspace · CI Hotfix 2**

## 결과

- DubbingVoiceControls의 현재 화자 선택 버튼과 미리듣기 버튼이 모두 `혜린`을 포함해 Testing Library 단일 조회가 실패하던 문제를 수정했다.
- 현재 화자 버튼은 `현재 목소리 혜린 선택`, 미리듣기는 `혜린 목소리 미리듣기`로 역할과 동작을 분리했다.
- 화자 선택·음성 설정 버튼에 dialog popup과 펼침 상태를 추가해 스크린리더 상태 전달을 강화했다.
- DubbingVoiceControls와 HomePage 테스트가 정규식 부분 일치 대신 정확한 접근성 이름을 사용한다.
- 앞선 TimelineEditor 버튼 고유 이름 수정과 0.8.7 더빙 스튜디오 기능은 그대로 유지한다.

## 검증

- 프로젝트 규칙과 작업공간 세션 규칙 통과
- TypeScript·TSX 125개 구문 검사와 상대경로 import 267개 연결 통과
- DubbingVoiceControls 고유 역할·이름 정적 회귀 검사 통과
- API 90개·Worker 9개 회귀 통과
- Python 3.10 AST 93개 파일 통과
- 기준본 패치 적용 동등성과 ZIP 무결성 통과

## 알려진 현실

현재 환경에서는 npm 의존성을 설치하지 못해 공식 ESLint, TypeScript project typecheck,
Vitest와 Vite build를 실행하지 못했다. GitHub Actions Web quality가 최종 실행 관문이다.
공개 Voice API와 AI 모델 준비 상태는 이 접근성 핫픽스에서 변경하지 않는다.

## 다음 목표

`0.8.8 Korean Voice Quality Streaming`
