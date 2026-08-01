# 곰같은여우 SoriON AI

**한국인을 위한 모바일 우선 AI Voice Platform**

SoriON AI는 초보자는 채팅으로 음성을 만들고, 전문가는 CapCut형 문장 타임라인에서
순서·쉼·문장을 편집하는 한국어 중심 음성 제작 플랫폼입니다. 실제 AI, 시스템 음성,
Mock과 브라우저 Demo를 명확히 구분하며 특정 모델에 종속되지 않는 Adapter 구조를 사용합니다.

## 현재 상태

- 버전: `0.8.5 Unified Workspace UX & Engine Orchestration`
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
- 프로젝트 복원: 목록 클릭 시 채팅·보이스·타임라인과 저장된 job 결과 recover-first
- 배포: Web·API·Worker quality와 GitHub Pages를 하나의 Workflow로 관리

## 0.8.5 핵심

### 작업공간 공통 UX·IA

- 만들기 화면을 메뉴 이동 중에도 마운트 상태로 유지해 작성 중 채팅·타임라인을 보존
- 품질·프로젝트·설정에 동일한 작업공간 헤더와 다크 정보 계층 적용
- 상단에서 설정에 직접 접근하고, 브랜드 클릭은 작성 작업공간으로 복귀
- 프로젝트 로딩·실패·빈 상태를 구분하고 실패 시 같은 화면에서 다시 시도
- 하단 메뉴·헤더가 하나의 공통 내비게이션 정의를 사용해 명칭과 순서 불일치 방지

### 자동 엔진 오케스트레이션

사용자는 엔진을 선택하지 않습니다. Web은 모든 일반 합성을 `auto`로 요청하고 FastAPI의
`EngineOrchestrator`가 실제 준비 상태, AI·Local·Mock 모드, 운영 우선순위와 요청 기능을
기준으로 후보를 정렬합니다. 주 엔진이 실패하면 같은 요청 안에서 다음 엔진으로 전환하며,
반복 실패 엔진은 일정 시간 자동 격리한 뒤 다시 평가합니다.

- 실제 실행 시도 순서와 fallback 여부를 TTS 응답에 기록
- 성공·실패·연속 실패·cooldown을 `/engines`와 품질 연구소에 연결
- 준비되지 않은 모델을 성공으로 가장하지 않고 등록된 ready 엔진만 실행
- 명시 엔진 요청은 다른 엔진으로 조용히 바꾸지 않으며 일반 UI는 자동 모드만 사용
- 전략상 주력은 Fun-CosyVoice 3, 복제 전문 보조는 GPT-SoVITS, 로컬 대체는 MeloTTS 유지

### 작업 연속성

- 만들기에서 복제·품질·프로젝트·설정으로 이동해도 현재 초안과 타임라인 유지
- 첫 랜딩에서는 Dock을 숨기고 작업공간 진입 이후에만 공통 메뉴·Player 표시
- 프로젝트 불러오기는 저장된 job 결과를 먼저 복구하고 만료 시 블록별 재생성을 안내
- API job 상태와 완료 결과는 SQLite에 유지해 서버 재시작·다중 프로세스에서도 복구

### 현재 검증 기준

- FastAPI 테스트 89개
- CosyVoice Worker 테스트 9개
- 프로젝트 규칙, Python compileall, Python 3.10 AST 호환성
- TypeScript·TSX 구문, 상대 import와 shim 기반 의미·참조 검사
- 정식 Web lint/type/test/build와 Ruff는 의존성 설치 가능한 CI에서 최종 확인

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

휴대폰 로컬 개발에서는 현재 Web 호스트의 API 후보를 앱이 자동 확인합니다. 공개 HTTPS Web은
`VITE_API_BASE_URL`에 HTTPS API를 주입하거나 같은 Origin reverse proxy를 구성합니다.

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
서버에서 실행해야 합니다. API 실패를 Demo 성공으로 숨기지 않으며, 수동 연결 화면 없이
상태를 표시하고 안전한 후보를 자동으로 다시 탐색합니다.

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
