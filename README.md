# 곰같은여우 SoriON AI

**무료 사용을 기본값으로 설계한 한국어 장문 AI Voice Platform**

SoriON AI는 대본·오디오북·강의·광고처럼 긴 한국어 원고를 프로젝트 단위로 편집하고,
문장별 음성 블록으로 나누어 순차 제작하는 모바일 우선 음성 작업공간입니다. 엔진 연결과
선택은 시스템이 자동 처리하며, 기본 정책은 유료 API를 호출하지 않는 `free-only`입니다.

## 현재 상태

- 버전: `0.9.0 Free-First Korean Progressive Voice`
- Web: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- Worker: 선택 설치형 Fun-CosyVoice 3 Adapter
- 기본 제작: 최대 20,000자 장문 원고 → 세로형 문장 음성 블록
- 엔진 정책: CosyVoice → MeloTTS → System Voice → Browser Speech 무료 우선
- 유료 엔진: NAVER·Google·Azure·ElevenLabs는 `balanced` 운영에서만 등록
- 진행 상태: API 연결 시 SSE, 미지원 환경은 polling 자동 대체
- 세션: IndexedDB 자동 저장, localStorage·memory fallback
- 결과 복구: SQLite job ID 기반 recover-first

## 0.9.0 핵심

### 무료 우선 엔진 정책

- 기본값 `SORION_ENGINE_COST_POLICY=free-only`
- 유료 자격 증명이 환경에 있어도 free-only에서는 공급자 Adapter를 등록하거나 호출하지 않음
- 로컬 CosyVoice Worker가 준비되면 가장 먼저 사용하고, MeloTTS·System Voice가 뒤를 이음
- 공개 정적 Web에서 API가 없으면 브라우저 한국어 음성을 실제 재생 안전망으로 사용
- 유료 엔진은 운영자가 서버에서 명시적으로 `balanced`를 선택한 경우에만 자동 후보가 됨

### Progressive 상태 스트림

- `GET /api/v1/tts/jobs/{job_id}/events` SSE 진행률 추가
- Web은 SSE를 우선 사용하고 연결 실패 시 기존 polling으로 자동 전환
- 문장 생성이 뒤에서 계속돼도 플레이어의 현재 선택이 다음 완료 블록으로 튀지 않음
- 설정 화면에서 현재 운영 정책을 읽기 전용으로 확인하며 수동 엔진 선택은 제공하지 않음

## 개발 실행

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
npm run dev
```

기본 주소: Web `127.0.0.1:5173`, API `127.0.0.1:8000`, Worker `127.0.0.1:9000`.
무료 로컬 AI 품질을 사용하려면 모델 가중치·Python 의존성·GPU 또는 충분한 CPU를 별도로
준비해야 하며, 모델 파일은 릴리스 ZIP에 포함하지 않습니다.

## 공개 배포 경계

GitHub Pages는 정적 Web만 제공합니다. 공개 페이지는 브라우저 내장 한국어 음성으로 재생할 수
있지만, 고품질 로컬 AI·WAV 다운로드·복제에는 별도 FastAPI/Worker가 필요합니다. API 후보는
시스템이 자동 연결하며 사용자에게 주소나 엔진 선택 화면을 보여주지 않습니다.

```text
SORION_PUBLIC_API_BASE_URLS=https://voice-a.example.com,https://voice-b.example.com
```

## 주요 문서

- 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 무료 엔진 정책: [`docs/FREE_FIRST_ENGINE_POLICY.md`](docs/FREE_FIRST_ENGINE_POLICY.md)
- 진행률 스트림: [`docs/PROGRESSIVE_TTS_STREAMING.md`](docs/PROGRESSIVE_TTS_STREAMING.md)
- API 연결: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- 전달 규칙: [`DELIVERY_RULES.md`](DELIVERY_RULES.md)

## 개발 원칙

- 장문 원고와 문장 블록 편집이 기본 흐름이며 채팅형 입력으로 되돌리지 않습니다.
- 모바일·한국어를 먼저 완성하고 PC는 정밀 편집 확장으로 사용합니다.
- 실제 AI, Local/System, Browser Voice, Mock을 UI와 데이터에서 명확히 구분합니다.
- 무료 사용자의 기본 실행에서 과금형 API를 자동 호출하지 않습니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- API 주소·엔진 선택을 사용자에게 요구하지 않습니다.
