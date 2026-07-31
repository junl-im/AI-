# SoriON AI 0.7.1 Result Report

## 결과

`0.7.1 Production CosyVoice Adapter & API Security`는 공개 FastAPI와 사설 GPU Worker 사이의 운영 경계를 강화한다.

- API↔Worker 서비스 토큰과 HMAC-SHA256 요청 서명
- 요청 본문 SHA-256 포함 및 기본 30초 만료 검증
- 잘못된 토큰, 만료 요청, 변조 요청의 HTTP 401 차단
- API 사용자/IP 기준 요청 제한
- Worker 서비스 토큰 기준 요청 제한
- 원문과 음성을 제외한 JSONL 감사 로그
- production 환경의 Worker Secret readiness gate
- 모델 필수 파일, CUDA, VRAM, 디스크, CPU 저속 모드 정책 진단
- SSE revision id와 `Last-Event-ID` 재연결 계약
- 종료된 Worker 작업과 입력 샘플 TTL 정리

## 운영 원칙

- Worker `/health`만 공개할 수 있다.
- `/ready`와 `/v1/*`는 서명 인증을 요구한다.
- Worker는 공용 인터넷에 직접 노출하지 않고 사설 네트워크 또는 방화벽 뒤에 둔다.
- 실제 Secret과 CosyVoice 모델 가중치는 릴리스 ZIP에 포함하지 않는다.
- 감사 로그에 합성 문장, 음성 파일, 동의 원문을 기록하지 않는다.
- 모델 또는 GPU 조건이 부족하면 readiness를 차단하며 성공으로 위장하지 않는다.

## 검증 결과

- 프로젝트 절대 규칙 검사 통과
- FastAPI 테스트 56개 통과
- CosyVoice Worker 테스트 9개 통과
- Python 전체 compileall 통과
- Python 3.10 문법 모드로 84개 Python 파일 파싱 통과
- 인증된 Worker Uvicorn 실서버 기동 및 API↔Worker 서명 통신 통과
- 잘못된 Worker 서명 거부 확인
- GitHub Actions YAML 파싱 통과
- 모든 소스 파일 500줄 이하
- Python Ruff 표시 폭 100칸 제한 통과

## 로컬 환경 제한

현재 실행 환경에는 CPython 3.10과 Ruff 실행 모듈이 설치되어 있지 않아 공식 Python 3.10 pytest와 Ruff 명령은 직접 실행하지 못했다. 대신 Python 3.10 AST 문법 검사, 전체 테스트, 프로젝트 표시 폭 검사를 수행했다. 최종 Python 3.10·Ruff 판정은 GitHub Actions에서 확인해야 한다.

내부 npm 저장소가 `@tailwindcss/vite`를 제공하지 않아 npm 의존성 설치, Vitest, ESLint, Vite production build는 실행하지 못했다. 이번 버전의 Web 변경은 표시 버전 갱신뿐이지만 최종 Web quality 역시 GitHub Actions에서 확인해야 한다.

## 릴리스 파일

- 전체 프로젝트 파일: 302개
- 패치 변경·추가 파일: 54개
- 삭제 파일: 0개
