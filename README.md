# 곰같은여우 SoriON AI

**한국인을 위한 모바일 우선 장문 AI Voice Platform**

SoriON AI는 대본·오디오북·강의·광고처럼 긴 한국어 원고를 프로젝트 단위로 편집하고,
문장별 음성 블록으로 나누어 순차 제작하는 음성 작업공간입니다. 엔진 연결과 선택은 시스템이
자동 처리하며, 사용자는 원고·목소리·재생 흐름에 집중합니다.

## 현재 상태

- 버전: `0.8.9 Unified Product Shell & Korean Neural Engine Mesh`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 Fun-CosyVoice 3 Adapter
- 기본 제작: 최대 20,000자 장문 원고 → 세로형 문장 음성 블록
- 상단 IA: 모든 작업 페이지에 작은 SoriON 프로그램명·공식 로고·페이지명 유지
- 엔진 운영: 실제 API 우선 `engine_id=auto`, 실패 시 브라우저 한국어 음성 자동 대체
- 세션: IndexedDB 자동 저장, localStorage·memory fallback
- 결과 복구: SQLite job ID 기반 recover-first
- 프로젝트: 목록에서 원고·옵션·타임라인·완료 결과 복원

## 0.8.9 핵심

### 일관된 제품 셸

- 프로젝트·품질·복제·설정 화면을 공통 PageScaffold로 통일
- 동일한 제목 계층, 여백, 상태 영역, 카드 리듬과 모바일 폭 사용
- 모든 내부 페이지에 작은 SoriON 프로그램명·공식 PNG 로고·현재 페이지명 유지
- 만들기 화면은 장문 더빙 작업의 특수성을 유지하되 공통 상단 IA와 연결

### 한국어 Neural Engine Mesh

- 동의된 기준 음성을 사용하는 CosyVoice Worker 일반 TTS
- NAVER CLOVA Voice Premium, Google Chirp 3 HD, Azure Neural Voice, ElevenLabs v3 REST Adapter
- MeloTTS·System Voice·Browser Voice 안전망
- 한국어 특화도·품질 등급·요청 기능 적합성 기반 자동 선택, 장문·스트리밍 역량 진단
- 자격 증명과 readiness가 준비된 엔진만 후보가 되며, 연속 실패 엔진은 자동 격리

### API 자동 다중 연결

- `SORION_PUBLIC_API_BASE_URLS`와 런타임 JSON에서 여러 HTTPS API 후보를 읽음
- 빠른 후보부터 자동 검사하고 실패하면 다음 API로 전환
- 사용자는 API 주소나 엔진을 직접 선택하지 않음

## 개발 실행

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
npm run dev
```

기본 주소: Web `127.0.0.1:5173`, API `127.0.0.1:8000`, Worker `127.0.0.1:9000`.

## 공개 배포 경계

GitHub Pages는 정적 Web만 제공합니다. 따라서 공개 페이지는 우선 브라우저 내장 한국어 음성으로
작동하며, AI 음색·WAV 파일·복제 기능을 사용하려면 별도 HTTPS Voice API가 필요합니다.
배포 관리자는 저장소 Actions Variable 한 곳에 API Origin을 설정합니다.

```text
SORION_PUBLIC_API_BASE_URLS=https://voice-a.example.com,https://voice-b.example.com
```

사용자에게 API 주소나 엔진 선택 화면을 보여주지 않습니다.

## 주요 문서

- 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 시작 안내: [`START_HERE.md`](START_HERE.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- 더빙 UX: [`docs/DUBBING_STUDIO_UX.md`](docs/DUBBING_STUDIO_UX.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- 전달 규칙: [`DELIVERY_RULES.md`](DELIVERY_RULES.md)

## 개발 원칙

- 장문 원고와 문장 블록 편집이 기본 흐름이며 채팅형 입력으로 되돌리지 않습니다.
- 모바일·한국어를 먼저 완성하고 PC는 정밀 편집 확장으로 사용합니다.
- 실제 AI, Local/System, Browser Voice, Mock을 UI와 데이터에서 명확히 구분합니다.
- 브라우저 대체 음성을 실제 AI 또는 다운로드 가능한 음원으로 가장하지 않습니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- 사용자에게 API 주소·엔진 수동 연결을 요구하지 않습니다.
