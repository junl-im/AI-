# 곰같은여우 SoriON AI

**무료 로컬 실행을 기준으로 설계한 한국어 장문 Voice Studio**

SoriON AI는 대본·오디오북·강의·광고 원고를 문장별 음성 블록으로 편집하고 순차 제작하는
모바일 우선 작업공간입니다. 엔진과 API는 시스템이 자동 연결하며 결제 계정이 필요한 음성
Adapter는 프로젝트에 포함하지 않습니다.

## 현재 상태

- 버전: `0.9.1 Free-Only Local Runtime & Firebase Spark`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 CosyVoice Adapter
- 장문 제작: 최대 20,000자 원고와 문장별 재생성
- 자동 순서: CosyVoice → MeloTTS → System Voice → Browser Speech
- 진행 상태: SSE 우선, polling 자동 대체
- 세션: IndexedDB 자동 저장과 SQLite 결과 복구
- 배포: GitHub Pages 또는 Firebase Hosting Spark 정적 Web

## 무료 실행

```bash
cp .env.example .env
npm install
npm run dev:free
```

Windows에서는 `start-sorion-free.cmd`를 사용할 수 있습니다. CosyVoice 모델을 준비한 경우
`npm run dev:free -- --worker`로 Worker까지 실행합니다. 모델 가중치와 GPU 런타임은 저장소와
릴리스 ZIP에 포함하지 않습니다.

## 정적 배포 동작

Firebase Hosting Spark와 GitHub Pages는 Web/PWA만 제공합니다. 데스크톱 정적 Web은 사용자 PC의
`127.0.0.1:8000` 무료 API를 자동 탐색하고, 모바일은 기기 내장 Browser Speech를 자동 사용합니다.
사용자에게 API 주소나 엔진 선택 화면을 보여주지 않습니다.

## 주요 문서

- 시작: [`START_HERE.md`](START_HERE.md)
- 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 무료 전용 엔진: [`docs/FREE_ONLY_ENGINE_POLICY.md`](docs/FREE_ONLY_ENGINE_POLICY.md)
- Firebase Spark: [`docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md`](docs/FIREBASE_SPARK_FREE_DEPLOYMENT.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)

## 개발 원칙

- 장문 원고와 문장 블록 편집을 기본 흐름으로 유지합니다.
- 모바일·한국어를 먼저 완성합니다.
- 실제 AI, Local/System, Browser Voice, Mock을 명확히 구분합니다.
- 결제 수단과 외부 음성 공급자 Secret을 요구하지 않습니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- 엔진과 API 선택은 사용자 설정이 아니라 자동 운영 계층에서 처리합니다.
