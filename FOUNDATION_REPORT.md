# SoriON AI 0.6.2 Result Report

## 목표

정적 GitHub Pages와 Python 엔진 서버를 혼동하던 연결 구조를 바로잡고, 실제 API·TTS·복제 Worker 상태를 사용자가 직접 확인할 수 있게 한다.

## 원인 진단

- GitHub Pages는 Python FastAPI를 실행하지 않는데 웹이 같은 Origin의 `/api/v1`을 암묵적으로 호출했다.
- 연결 실패가 브라우저 Demo WAV로 전환되어 실제 API 실패가 눈에 잘 띄지 않았다.
- FastAPI 기본 CORS에 GitHub Pages Origin이 없으면 `.env` 없이 실행한 서버가 공개 웹 요청을 차단했다.
- Setup은 Python 3.10을 지원하면서도 3.11 이상만 준비 완료로 판정했다.
- CosyVoice Worker는 URL 설정 여부만 알 수 있었고 실제 health를 확인하지 않았다.
- API의 snake_case health 응답과 상대 음원 URL을 웹에서 명시적으로 변환하지 않았다.

## 구현

- 정적 배포의 API 미설정 상태와 개발 프록시를 분리했다.
- 설정에 5경로 통합 연결 검사와 응답 시간 표시를 추가했다.
- `/api/v1/connectivity` 진단 API를 추가했다.
- 실제 TTS, 음원 저장소, CORS, CosyVoice Worker health를 점검한다.
- 기본 CORS에 localhost, 127.0.0.1, GitHub Pages Origin을 포함했다.
- Python 지원 판정을 3.10 이상으로 통일했다.
- API 음원 URL을 현재 설정된 API Origin에 맞게 해석한다.
- `npm run dev:api`로 FastAPI를 시작할 수 있게 했다.

## 검증

- FastAPI 테스트 49개 통과
- 실제 Uvicorn 서버에서 health·connectivity·CORS preflight 통과
- Linux 시스템 한국어 TTS로 4.3초 WAV 생성·다운로드·RIFF 검사 통과
- Python compileall 통과
- TypeScript·TSX 구문 검사 통과
- 프로젝트 절대 규칙 검사 통과
- npm registry에 `@tailwindcss/vite`가 없어 정식 npm install·Vitest·Vite build는 GitHub Actions에서 최종 확인
