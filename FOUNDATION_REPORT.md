# SoriON AI 0.8.6 Result Report

작업 일시: 2026-08-01 KST

결과 버전: **0.8.6 Longform Voice Studio & Session Persistence**

## 결과

- 채팅형 음성 제작을 최대 20,000자 장문 원고 편집기 중심으로 교체했다.
- 문단·문장 분할, 예상 블록 수·길이와 순차 생성 상태를 한 화면에서 확인한다.
- 서버가 늦게 연결되면 사용자가 이미 요청한 원고 제작을 자동으로 이어서 실행한다.
- 공식 SoriON 아이콘을 favicon, PWA, 첫 화면과 작업공간 상단에 통일했다.
- 모든 상단 브랜드 클릭은 첫 페이지로 이동한다.
- 첫 뒤로가기는 커스텀 종료 확인, 두 번째 뒤로가기는 즉시 이탈한다.
- GitHub Pages same-origin과 `:8443` API 오탐을 차단했다.
- 공개 Voice API는 Actions 변수에서 빌드에 주입하고 사용자 수동 연결 UI는 만들지 않았다.
- `/connectivity`와 `/engines`의 추천·health 상태를 같은 Orchestrator 기준으로 통일했다.
- IndexedDB 작업공간 저장, revision 보호와 recover-first 결과 복구를 유지했다.

## 검증

- API 90 passed
- Worker 9 passed
- 프로젝트 규칙 통과
- TypeScript·TSX 구문 변환 통과
- 상대경로 import 연결 검사 통과
- Python compileall 및 Python 3.10 AST 호환성 검사 대상
- 패치 적용 동등성·ZIP 무결성 최종 패키징 단계에서 확인

## 현재 엔진 상태

로컬 진단에서는 API와 `system` 한국어 TTS가 준비되고 Mock도 계약 검증용으로 등록됐다.
MeloTTS, CosyVoice Worker, GPU·모델은 설치되지 않아 실제 AI 엔진 준비 상태가 아니다.
GitHub Pages 공개 화면은 `SORION_PUBLIC_API_BASE_URL`과 실제 HTTPS API 배포가 없으면 음성을
생성할 수 없다. 코드가 Pages 주소를 잘못 호출하는 문제는 제거했지만 인프라 배포는 별도다.

## 다음 목표

`0.8.7 Korean Voice Quality Streaming`
