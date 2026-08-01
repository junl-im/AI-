# 곰같은여우 SoriON AI

**한국인을 위한 모바일 우선 AI Voice Platform**

SoriON AI는 초보자는 채팅으로 음성을 만들고, 전문가는 CapCut형 문장 타임라인에서
순서·쉼·문장을 편집하는 한국어 중심 음성 제작 플랫폼입니다. 실제 AI, 시스템 음성,
Mock과 브라우저 Demo를 명확히 구분하며 특정 모델에 종속되지 않는 Adapter 구조를 사용합니다.

## 현재 상태

- 버전: `0.8.3 Persistent Job Store/Atomic Claim`
- 웹: React + Vite + TypeScript + Zustand + PWA
- API: FastAPI + Python 3.10
- GPU Worker: 선택 설치형 Fun-CosyVoice 3 Adapter
- 무료 로컬 대체: Windows·macOS·eSpeak 시스템 한국어 음성
- 작업공간: ChatGPT형 입력 + CapCut형 문장·쉼 타임라인
- 재생: 첫 완성 블록부터 나타나는 Linked Player Dock
- 연결 상태: API·실제 TTS·Worker·GPU/모델 네 계층
- 모바일 복구: 타임라인 job ID 보존, recover-first 재시도, 저장소 실패 fallback
- API 영속성: SQLite 결과 복구, 원자적 claim, payload 충돌 409, 결과 만료 410
- 한국어 처리: 숫자·날짜·시각·금액·퍼센트·단위·영문 약어 정규화
- 저장: IndexedDB 프로젝트·품질 평가·동의된 음성 프로필
- 배포: Web·API·Worker quality와 GitHub Pages를 하나의 Workflow로 관리

## 0.8.3 핵심

### 모바일 API 연결

휴대폰에서 `localhost`는 PC가 아니라 휴대폰 자신입니다. 로컬 개발은 PC의 LAN 주소를
입력하고, HTTPS로 배포된 웹에서는 공개 HTTPS API를 사용해야 합니다.

웹은 다음 주소를 순서대로 활용합니다.

1. 사용자가 저장한 주소
2. 마지막으로 성공한 주소
3. 최근 주소 최대 5개
4. 개발 환경 변수와 안전한 현재 호스트 후보

전체 사설 네트워크를 무단 스캔하지 않습니다.

### 네 계층 엔진 상태

```text
API       FastAPI가 응답하는가
TTS       실제 한국어 음성을 생성할 엔진이 준비됐는가
Worker    CosyVoice Worker 프로세스가 응답하는가
GPU       CUDA·모델이 실제 추론 준비 상태인가
```

Worker가 실행 중이어도 모델이나 GPU가 없으면 `준비 안 됨`으로 표시합니다.

### 서버 작업 영속화

- TTS job 상태·요청 fingerprint·완료 결과를 SQLite에 저장
- API 재시작 뒤에도 같은 job ID의 상태와 완료 결과 복구
- 여러 API 프로세스가 같은 SQLite를 사용할 때 원자적 claim으로 단일 실행
- 실행 프로세스가 사라지면 claim TTL 뒤 다른 프로세스가 작업을 재획득
- 결과 TTL과 job 이력 TTL을 분리해 완료 tombstone과 HTTP 410 계약 유지
- 다른 API 프로세스로 전달된 취소 요청도 저장소를 통해 실행 Task에 반영

### 모바일 요청 복구와 서버 멱등성

- 동일 job ID와 동일 요청은 실행 중 Task를 공유하고 완료 결과를 재사용
- 동일 job ID를 다른 요청에 재사용하면 `SOA-4009`와 HTTP 409로 차단
- HTTP 호출이 취소되어도 서버 생성 Task는 계속 실행하고 `/result`로 복구
- 타임라인 블록이 job ID를 보존해 재시도 시 새 POST보다 기존 결과를 먼저 조회
- 편집·분할 시 기존 클라이언트 생성을 중단하고 오래된 결과가 블록을 덮지 않도록 보호
- localStorage가 iOS private mode·quota로 실패하면 세션 메모리로 안전하게 대체
- `crypto.randomUUID()`가 없는 모바일 브라우저에서도 호환 ID를 생성
- GET·HEAD만 일시적 timeout, 429, 502, 503, 504에서 제한적으로 재시도
- 음성 생성 POST는 중복 생성을 막기 위해 자동 재전송하지 않음
- POST 응답이 끊겨도 동일 job ID의 상태와 `/result`를 조회해 완료 음원을 복구
- 모든 요청에 익명 client ID와 request ID를 포함해 진단 가능
- Wi-Fi·셀룰러 전환, 온라인 복귀, PWA 포그라운드 복귀 시 연결 상태 재검사

### 모바일 UI 기준

- 주요 터치 영역 최소 44px
- 입력 글자 16px 이상으로 iOS 자동 확대 방지
- 하단 composer·Dock·바텀시트에 safe-area 반영
- 연결 바텀시트에서 API·TTS·Worker·GPU를 한 화면에서 확인

## 바로 시작하기

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
```

다른 터미널에서:

```bash
npm run dev
```

기본 주소:

- Web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- Worker: `http://127.0.0.1:9000`

휴대폰에서 같은 Wi-Fi의 PC API를 사용할 때는 `http://PC-LAN-IP:8000`을 입력합니다.
공개 HTTPS Web에서는 HTTPS API가 필요합니다.

실제 CosyVoice에는 PyTorch, CUDA, 모델 가중치와 별도 GPU 환경이 필요합니다.
모델이 없으면 Worker `/health`는 정상이어도 `/ready`는 not-ready입니다.

## 주요 문서

- 절대 필독 인수인계: [`docs/HANDOVER.md`](docs/HANDOVER.md)
- 시작 안내: [`START_HERE.md`](START_HERE.md)
- 모바일 엔진 신뢰성: [`docs/MOBILE_ENGINE_RELIABILITY.md`](docs/MOBILE_ENGINE_RELIABILITY.md)
- API 연결 진단: [`docs/API_CONNECTIVITY.md`](docs/API_CONNECTIVITY.md)
- Chat-to-Timeline: [`docs/CHAT_TIMELINE_WORKSPACE.md`](docs/CHAT_TIMELINE_WORKSPACE.md)
- 엔진 전략: [`docs/ENGINE_STRATEGY.md`](docs/ENGINE_STRATEGY.md)
- CosyVoice Worker: [`docs/COSYVOICE_WORKER.md`](docs/COSYVOICE_WORKER.md)
- 보안: [`docs/SECURITY.md`](docs/SECURITY.md)
- 전체 전달 규칙: [`DELIVERY_RULES.md`](DELIVERY_RULES.md)

## GitHub Pages 배포 현실

GitHub Pages는 정적 React Web만 실행합니다. Python API와 GPU Worker는 별도 PC 또는
서버에서 실행해야 합니다. API 실패를 Demo 성공으로 숨기지 않으며, 채팅 화면과 연결
바텀시트에서 원인을 표시합니다.

## 개발 원칙

- 모바일 화면과 실제 모바일 네트워크를 기준으로 먼저 완성합니다.
- 소스 파일은 500줄을 넘기지 않습니다.
- Mock·Demo·Local TTS·실제 AI 결과를 명확히 구분합니다.
- 실제 동작이 없는 버튼이나 성공 상태를 배포하지 않습니다.
- 음성 원본은 명시적 동의 없이 외부로 전송하지 않습니다.
- `main` 직접 커밋을 금지하고 기능 브랜치를 사용합니다.
- 기능에는 테스트, HANDOVER, CHANGELOG, NEXT_UPDATE가 함께 포함되어야 합니다.

## 브랜드

- 공식 대문: **곰같은여우 SoriON AI**
- 제품명: **SoriON AI**
- 한국어 이름: **소리온 AI**
- 내부 코드명: **SOA**
- 슬로건: **목소리의 가능성을 켜다.**

## 결과 전달 규칙

1. 결과
2. 전체 통파일 ZIP과 덮어쓰기용 패치 ZIP
3. 다음 예상 업데이트 내역
