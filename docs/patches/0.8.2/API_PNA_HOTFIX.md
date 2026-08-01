# 0.8.2 API PNA CI Hotfix

## 적용 기준

첫 번째 0.8.2 CI 핫픽스가 적용된 저장소 루트에 덮어쓴다. 버전은 계속 `0.8.2`다.

## 원인

Python 3.10 CI에서 Starlette CORS 계층이 Private Network Access 확장 preflight를
애플리케이션 응답 미들웨어보다 먼저 400으로 종료했다.

## 수정

- 전용 `PrivateNetworkCORSMiddleware` 추가
- PNA 확장 헤더만 표준 CORS 검증 입력에서 분리
- 허용 Origin·Method·요청 헤더 검증 성공 시에만 allow-private-network 응답 추가
- 잘못된 Origin과 설정 비활성화 400 회귀 테스트 추가
- 프로젝트 규칙과 인수인계 문서 갱신

## 검증

- API: 68 passed
- Worker: 9 passed
- 프로젝트 규칙: 통과
- Python compileall: 통과
- Python 3.10 AST: 통과
- Python 3.10 실환경: GitHub Actions 재실행 필요
