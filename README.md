# SoriON AI

**한국인을 위한 모바일 우선 AI Voice Platform**

SoriON AI는 텍스트 음성 생성, 음성 인식, 음성 변환, 목소리 복제를 하나의 모바일 중심 경험으로 제공하기 위한 신규 프로젝트입니다. 기존 프로젝트의 코드는 사용하지 않고 2026년 7월 31일에 완전히 새로 시작했습니다.

## 현재 상태

- 버전: `0.1.0 Foundation`
- 웹: React + Vite + TypeScript + Tailwind CSS + Motion + PWA
- API: FastAPI + Python
- AI 엔진: 교체 가능한 어댑터 구조와 개발용 Mock 엔진
- 저장: 브라우저 IndexedDB 우선, Firebase는 선택적 동기화 계층
- 언어: 사용자 화면과 오류 메시지 모두 한국어 우선

## 바로 시작하기

1. `.env.example`을 `.env`로 복사합니다.
2. 루트에서 `npm install`을 실행합니다.
3. API 환경을 준비합니다: `cd services/api && uv sync --dev`.
4. 터미널 1에서 `npm run dev`을 실행합니다.
5. 터미널 2에서 `cd services/api && uv run uvicorn app.main:app --reload`를 실행합니다.
6. 브라우저에서 `http://localhost:5173`을 엽니다.

자세한 순서는 [`START_HERE.md`](START_HERE.md)를 참고하세요.

## 개발 원칙

- 모바일 화면을 기준으로 먼저 완성합니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- 실제 동작이 없는 UI를 배포하지 않습니다.
- 음성 원본은 명시적 동의 없이 클라우드로 전송하지 않습니다.
- `main` 직접 커밋을 금지하고 `develop`과 기능 브랜치를 사용합니다.
- 기능에는 테스트와 문서 변경이 함께 포함되어야 합니다.

## 디렉터리

```text
./        모바일 PWA
services/api/    FastAPI와 AI 엔진 어댑터
docs/            제품·기술·운영 문서
scripts/         프로젝트 규칙 자동 검사
.github/         CI와 협업 템플릿
```

## 브랜드

- 공식 서비스명: **SoriON AI**
- 한국어 이름: **소리온 AI**
- 제작 브랜드: **곰같은여우**
- 내부 코드명: **SOA**
- 슬로건: **목소리의 가능성을 켜다.**
