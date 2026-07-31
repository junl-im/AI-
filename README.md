# 곰같은여우 SoriON AI

**한국인을 위한 모바일 우선 AI Voice Platform**

SoriON AI는 텍스트 음성 생성, 음성 인식, 음성 변환, 목소리 복제를 하나의 모바일 중심 경험으로 제공하기 위한 신규 프로젝트입니다. 기존 프로젝트의 기능 코드는 사용하지 않고 완전히 새 코드베이스로 진행합니다.

## 현재 상태

- 버전: `0.5.3 CI Test Compatibility Patch`
- 웹: React + Vite + TypeScript + Tailwind CSS + Motion + PWA
- API: FastAPI + Python
- AI 엔진: 선택 설치형 MeloTTS 한국어 어댑터
- 무료 로컬 대체 엔진: Windows·macOS·eSpeak 시스템 한국어 음성
- 한국어 처리: 숫자·날짜·금액·퍼센트·영문 약어 정규화
- 긴 문장: 자동 분할 후 PCM WAV 병합
- 운영 연결: Voice API 주소 설정, 설치 상태 진단, 실제 생성 진행률
- 품질 연구소: A/B 재생, IndexedDB 평가 저장, JSON·CSV 보고서
- 저장: 브라우저 IndexedDB 우선, Firebase는 선택적 동기화 계층
- CI·배포: Web·API·Pages를 단일 GitHub Actions 실행으로 관리

## 0.5.3에서 가능한 작업

1. 문장을 입력해 AI 또는 로컬 한국어 음성을 생성합니다.
2. 엔진이 지원하는 감정·속도·피치 설정만 활성화합니다.
3. 숫자, 날짜, 금액, 퍼센트, 영문 약어를 한국어 읽기 형태로 전처리합니다.
4. 긴 문장을 여러 구간으로 나누어 생성한 뒤 WAV 하나로 연결합니다.
5. 생성 시간, 음원 길이, 실시간 배율, 파일 크기, 구간 수를 확인합니다.
6. 품질 탭에서 MeloTTS 설치와 시스템 음성 상태를 진단합니다.
7. 같은 문장을 최대 두 엔진으로 생성해 A/B 청취 평가를 진행합니다.
8. 설정 화면에서 로컬·원격 Voice API를 3단계로 연결합니다.
9. 긴 문장 생성의 퍼센트와 현재 구간을 확인합니다.
10. 별점과 메모를 저장하고 JSON·CSV 보고서를 내려받습니다.

MeloTTS, Local TTS, Demo WAV는 화면과 프로젝트 데이터에서 서로 다른 모드로 표시됩니다.

상단 브랜드 영역은 모바일·PC 모두 높이를 줄인 배너형 구조이며, `곰같은여우 SoriON AI`와 핵심 문장이 순차적으로 페이드됩니다. 로고의 `AI` 중 `I`와 PC Voice Core에는 SVG 없이 CSS로 만든 마이크를 사용합니다. 0.5.3에서는 JSDOM Blob·접근성 쿼리 테스트를 보정하고, Python 3.10 Ruff 정책과 Node.js 24 기반 GitHub Actions를 고정했습니다.

## 바로 시작하기

```bash
cp .env.example .env
npm install
cd services/api
uv sync --dev
uv run uvicorn app.main:app --reload
```

다른 터미널의 프로젝트 루트에서:

```bash
npm run dev
```

- 엔진 설치: [`docs/ENGINE_PILOT.md`](docs/ENGINE_PILOT.md)
- 품질 연구소: [`docs/QUALITY_LAB.md`](docs/QUALITY_LAB.md)
- 운영 연결: [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md)
- 전체 개발 규칙: [`DELIVERY_RULES.md`](DELIVERY_RULES.md)

## GitHub Pages 배포

GitHub Pages는 정적 웹만 실행합니다. Python API와 TTS 모델은 별도 PC 또는 서버에서 실행해야 합니다. API가 연결되지 않으면 생성 화면은 명확히 표시된 Demo WAV로 전환되고, 품질 연구소는 API 필요 상태를 표시합니다.

## 개발 원칙

- 모바일 화면을 기준으로 먼저 완성합니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- 실제 동작이 없는 UI를 배포하지 않습니다.
- Mock, Demo, Local TTS, 실제 AI 결과를 사용자에게 명확히 구분합니다.
- 음성 원본은 명시적 동의 없이 클라우드로 전송하지 않습니다.
- `main` 직접 커밋을 금지하고 기능 브랜치를 사용합니다.
- 기능에는 테스트, 인수인계, 다음 계획이 함께 포함되어야 합니다.

## 브랜드

- 공식 대문 표기: **곰같은여우 SoriON AI**
- 제품명: **SoriON AI**
- 한국어 이름: **소리온 AI**
- 제작 브랜드: **곰같은여우**
- 내부 코드명: **SOA**
- 슬로건: **목소리의 가능성을 켜다.**

## 결과 전달 규칙

모든 업데이트 결과는 아래 순서를 고정합니다.

1. 결과
2. 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP
3. 다음 예상 업데이트 내역

각 업데이트마다 `docs/HANDOVER.md`, `docs/CHANGELOG.md`, `docs/NEXT_UPDATE.md`를 함께 갱신합니다.
