# SoriON AI MASTER HANDOVER
상태: **절대 필독 · 임시채팅 영구 메모리 원본**
현재 기준 버전: **0.8.5 Unified Workspace UX & Engine Orchestration**
기준 버전: **0.7.3 Handover Memory Baseline**
최종 갱신: **2026-08-01 16:00 KST**
제품 소유·디자인: **곰같은여우**
서비스명: **SoriON AI / 소리온 AI** · 내부 코드명: **SOA**
> 이 프로젝트는 임시채팅에서 개발 중이다. 대화 메모리를 신뢰하지 않는다.
> 다음 AI 또는 개발자는 작업 전에 이 파일과 루트 `DELIVERY_RULES.md`를 끝까지 읽는다.
> 이 파일은 목표, 사용자 결정, 구현 상태, 연결 현실, 금지 규칙과 다음 작업을 보존하는
> 단일 프로젝트 메모리 원본이다.
## 1. 다음 세션 시작 절차
1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 끝까지 읽는다.
2. `package.json` 버전과 현재 로컬 버전을 확인한다.
3. 패치는 기준 버전이 정확히 일치할 때만 적용한다.
4. `.git`은 삭제하거나 ZIP으로 덮어쓰지 않는다.
5. `docs/NEXT_UPDATE.md`, `docs/CHANGELOG.md`, 관련 설계 문서를 읽는다.
6. GitHub Actions가 실패하면 새 기능보다 안정화 패치를 먼저 만든다.
7. Web, FastAPI, Worker의 실제 연결 상태를 확인한다.
8. 실제 모델이 없으면 AI 생성·복제 성공을 가장하지 않는다.
9. 완료 시 전체 ZIP, 패치 ZIP, SHA-256, HANDOVER, CHANGELOG,
   NEXT_UPDATE를 함께 갱신한다.
## 2. 프로젝트의 궁극적 목표
SoriON AI는 단순한 웹 음성 변환기가 아니라 **한국인을 위한 차세대 AI Voice Platform**이다.
모바일에서 약 10초 안에 자연스러운 한국어 TTS, 적법한 목소리 복제, 음성 변환,
STT 편집을 시작하고 더빙·성우 마켓·팟캐스트·실시간 변환으로 확장한다.
제품 방향:
- Voicebox보다 쉬운 사용성.
- ElevenLabs보다 한국어 발음·숫자·날짜·존댓말에 친화적.
- 초보자는 채팅만 하고 전문가는 타임라인에서 정밀 편집.
- 특정 모델이나 외부 API에 종속되지 않는 Engine Adapter.
- 모바일이 주 제품이며 PC는 편집·비교·운영 확장 화면.
- 핵심 작업은 세 번 이내의 터치로 시작.
- 슬로건: **목소리의 가능성을 켜다.**
## 3. 비목표와 금지 사항
- 단순한 브라우저 TTS 데모로 제품을 축소하지 않는다.
- 모델이 없는데 실제 AI 음성이라고 표시하지 않는다.
- API 실패를 조용히 Mock 결과로 숨기지 않는다.
- 초보자 첫 화면에 감정·피치·엔진 ID 같은 고급 설정을 노출하지 않는다.
- 타인 음성의 무단 복제, 사칭, 사기, 금융·공공기관 악용을 허용하지 않는다.
- 명시적 동의 없이 음성 원본을 외부에 업로드하지 않는다.
- Secret, 모델 가중치, 사용자 음성을 Git 저장소와 릴리스 ZIP에 포함하지 않는다.
- `.git`, `node_modules`, `dist`, 가상환경, 캐시를 릴리스 ZIP에 포함하지 않는다.
- 기능 테스트 없이 완료라고 보고하지 않는다.
## 4. 사용자가 확정한 UX·디자인
### 절대 제품 원칙
- 모바일 우선, 한국어 우선, PC 확장.
- 실제 기능 시작은 세 번 이내 터치.
- Advanced는 기본 흐름을 방해하지 않는다.
- Apple의 정돈된 밀도, Notion의 정보 구조, ChatGPT의 친근함을 결합한다.
- 편집 화면 내부는 CapCut처럼 문장과 쉼을 블록으로 다룬다.
- 실제 AI, System Voice, Mock, Browser Demo를 UI와 데이터에서 구분한다.
- 엔진은 교체 가능한 Adapter 뒤에 둔다.
- 연결 실패는 사용자가 작업 중인 화면에서 바로 해결한다.
- 진행 중 결과는 문장별로 먼저 공개하고 전체 완료를 기다리게 하지 않는다.
## 5. 0.8.0에서 확정된 UX 개편
### 핵심 개념
**ChatGPT가 겉, CapCut이 속**이다.
초보자 흐름:
```text
채팅으로 요청
→ 문장별 블록 자동 생성
→ 첫 블록부터 음성 생성
→ Dock에서 즉시 재생
```
전문가 흐름:
```text
타임라인 블록 순서 변경
→ 쉼 추가
→ 문장 자르기·수정
→ 실패 블록만 재시도
```
### 초기 화면
- 기존 상단 브랜드 간판과 설명을 유지한다.
- `곰같은여우 SoriON AI`와 프로그램 설명이 한 화면에서 보인다.
- 초기 화면은 제품 소개와 시작 동선에 집중한다.
- 하단 Dock 또는 `AI 음성 스튜디오 시작`을 누르면 편집 작업공간으로 전환한다.
- 초기 화면에서 설정 톱니를 누르면 설정 작업공간으로 진입한다.
### 작업공간 상단
- 편집 진입 후 대형 브랜드 배너를 작은 상단 바로 축소한다.
- 작은 SoriON 로고, 현재 화면명, 엔진 연결 상태, 처음 화면 버튼만 표시한다.
- 불필요한 중간 카드와 이중 테두리를 제거한다.
- PC는 어두운 편집기형 화면, 모바일은 선택 보이스 요약을 기본으로 한 한 화면 흐름이다.
- 작업공간의 외곽 카드와 불필요한 중간 테두리는 제거한다.
### 채팅 생성 화면
- 기존 500자 대형 textarea 대신 ChatGPT형 composer를 사용한다.
- placeholder: `메시지를 입력하세요…`.
- 마이크 입력, 전송 버튼, Enter 전송, Shift+Enter 줄바꿈.
- 추천 칩: `광고톤으로`, `더 천천히`, `숫자 읽기 쉽게`, `밝은 톤으로`.
- 추천 칩은 emotion, speed, normalizeText 생성 옵션으로 변환한다.
- 직접 문장은 그대로 음성 블록이 된다.
- `대본 만들어줘` 유형은 현재 LLM 미연결이므로 **로컬 초안**으로 명확히 표시한다.
- LLM이 없는 상태를 AI 대본 생성으로 가장하지 않는다.
- 한국어 정규화 사용 시 `한국어 발음 최적화 ✓` 배지를 표시한다.
### 목소리 선택
- 가로 칩 대신 세로 리스트와 원형 아바타를 사용한다.
- 모바일은 선택 보이스 한 줄만 기본 표시하고 버튼으로 세로 목록을 펼친다.
- 현재 기본 프리셋:
  - 혜린 · 차분 · 여성 · 한국어.
  - 도윤 · 명료 · 남성 · 한국어.
  - 소리 · 따뜻 · 중성 · 한국어.
- 목소리를 누르면 연결된 API로 짧은 프리뷰를 생성한다.
- API 미연결 시 선택은 유지하고 시스템이 백그라운드에서 안전 후보를 다시 탐색한다.
- `새 보이스 만들기`는 목록 하단에 고정하고 복제 화면으로 이동한다.
### CapCut형 타임라인
- 메시지의 문장을 각각 음성 블록으로 만든다.
- 문장 사이에 기본 0.5초 쉼 블록을 추가한다.
- 여러 메시지를 보내면 기존 블록 뒤에 계속 쌓는다.
- 블록 상태:
  - queued: 회색 대기.
  - generating: 보라색 진행률.
  - ready: 초록 상태와 재생 가능.
  - failed: 빨간 상태와 해당 블록 재시도.
- 첫 블록이 완성되면 전체 완료를 기다리지 않고 Dock에 연결한다.
- 각 블록은 생성 당시 보이스·감정·속도·엔진·정규화 옵션을 저장하며 재시도 때 그대로 사용한다.
- 드래그로 순서를 바꾸고 모바일에서는 좌우 이동 버튼을 제공한다.
- 가위 버튼은 문장을 중간에서 두 블록으로 나눈다.
- 더블클릭 또는 길게 누르면 텍스트를 수정한다.
- 수정·분할된 기존 음성은 무효화하고 재생성이 필요하다.
- 쉼 0.5초 추가와 전체 비우기를 제공한다.
### 엔진 연결 UX
- 사용자가 API 주소를 입력하거나 엔진을 수동 선택하는 화면을 제공하지 않는다.
- 앱이 같은 Origin, `VITE_API_BASE_URL`, 마지막 성공 주소와 안전한 로컬 후보를 자동 탐색한다.
- 준비된 실제 엔진을 자동 선택하고 API·TTS·Worker·GPU 상태는 수동 조작 없는 상태 표시로만 제공한다.
- 실패 시 온라인 복귀, 앱 포그라운드와 단계적 재시도에서 내부적으로 다시 탐색한다.
- 브라우저 보안상 전체 LAN 대역을 무단 스캔하지 않으며 배포 API는 HTTPS 환경변수로 주입한다.
### Dock
- 기존 #1A1F2E 계열 반투명 배경과 blur를 유지한다.
- 순서: `만들기 → 복제 → 품질 → 프로젝트`.
- 음성이 없으면 메뉴만 표시한다.
- 음성이 준비되면 플레이어가 메뉴 위에 나타난다.
- 타임라인의 첫 ready 블록부터 대기열에 추가한다.
- 큐, 이전·다음, 반복, 속도, 탐색, 다운로드를 유지한다.
- 설정은 Dock에 넣지 않는다.
## 5-1. 0.8.1 모바일 엔진·API 신뢰성 기준
- API 주소에 스킴이 없어도 LAN IP는 HTTP, 공개 도메인은 현재 페이지에 맞춰 정규화한다.
- 배포 주소, 마지막 성공 주소와 최근 자동 발견 주소를 분리 보관한다.
- 모바일 자동 탐색은 같은 Origin·배포 주소·성공 이력·현재 호스트 후보만 사용하며 전체 LAN을 스캔하지 않는다.
- HTTPS 페이지에서 HTTP LAN API가 차단되는 경우 생성 요청 전에 원인을 명확히 보여 준다.
- 휴대폰에서 localhost는 휴대폰 자신이므로 PC LAN IP 또는 공개 HTTPS 주소를 안내한다.
- API, 실제 TTS, Worker 프로세스, GPU·모델을 네 계층으로 분리해 표시한다.
- 온라인 복귀, Wi-Fi·셀룰러 전환, PWA 포그라운드 복귀 시 단일 실행으로 재점검한다.
- 재연결 간격은 5초, 12초, 30초, 60초로 늘리며 중복 점검을 만들지 않는다.
- GET은 일시적 timeout·429·502·503·504에 한해 재시도한다. POST 생성은 중복 음성을
  막기 위해 자동 재전송하지 않고 job ID로 결과를 복구한다.
- `/tts/jobs/{job_id}/result`는 모바일 응답 단절 후 완료 음원을 다시 가져오는 계약이다.
- 모든 Web 요청에 익명 client ID와 request ID를 보내고 API 응답 request ID를 진단에 표시한다.
- 개발 LAN 연결은 허용 Origin과 Private Network preflight가 모두 맞아야 한다.
- 모바일 입력은 16px 이상, 주요 터치 영역은 44px 이상, safe-area를 항상 반영한다.

## 6. 현재 아키텍처와 배포 현실
```text
GitHub Pages / Mobile PWA
React 19 + Vite 8 + TypeScript + Zustand
Chat UI + Timeline + Linked Player
        │ HTTPS API
FastAPI Gateway · Python 3.10
CORS · TTS · Korean preprocessing · clone proxy
        │ private HMAC request
CosyVoice Worker · Python 3.10
health · readiness · GPU diagnostics · jobs · SSE · WAV
```
- GitHub Pages는 정적 웹만 실행하며 Python API와 GPU Worker를 포함하지 않는다.
- 공개 서비스는 별도 HTTPS FastAPI와 사설 GPU Worker가 필요하다.
- 모바일에서 `localhost`는 PC가 아니라 휴대폰 자신이다.
- 공개 HTTPS에서 로컬 HTTP API 호출은 브라우저 정책으로 차단될 수 있다.
- Repository: `junl-im/AI-`.
- Pages: `https://junl-im.github.io/AI-/`.
## 7. 현재 구현 상태
### Web/PWA
- 초기 랜딩과 편집 작업공간 분리.
- ChatGPT형 입력과 추천 프롬프트 옵션.
- 브라우저 지원 시 한국어 Web Speech 입력.
- 목소리 세로 라이브러리와 API 프리뷰.
- 문장별 Progressive TTS 생성.
- CapCut형 타임라인, 순서 변경, 자르기, 수정, 쉼, 재시도.
- 사용자 입력 없는 자동 API 탐색과 수동 조작 없는 계층 상태 표시.
- API·실제 TTS·Demo 상태를 구분하고 Worker·GPU 3단계 상태를 표시.
- 초기 랜딩에서는 숨고 작업공간 진입 뒤 나타나는 Linked Player Dock과 최대 20개 큐.
- 목소리 복제, 품질 연구소와 클릭 시 편집 상태를 복원하는 프로젝트 저장소.
### FastAPI Gateway
- Health, Setup, Connectivity, Engine Registry.
- Connectivity 응답에 `api_ready`, `tts_ready`, `voice_clone_ready`,
  `worker_configured` 포함.
- 숫자·날짜·시각·금액·퍼센트·단위·약어 정규화.
- PCM WAV 생성·병합, UUID 작업, timeout·cancel·동시 제한.
- 복제 동의·샘플 검증과 Worker proxy.
- 공개 rate limit과 JSONL 감사 로그.
### CosyVoice Worker
- `/health`와 `/ready` 분리.
- 모델 경로·CUDA·GPU·VRAM·디스크 진단.
- 문장별 job, SSE revision, cancel, 실패 구간 retry.
- 서비스 토큰 + HMAC-SHA256 서명, rate limit, 감사 로그.
## 8. 엔진 전략과 실제 상태
우선순위:
1. Fun-CosyVoice 3: 주력 TTS·제로샷 복제·스트리밍.
2. GPT-SoVITS: 전문가 복제·사용자별 미세조정 후보.
3. MeloTTS: GPU 없는 개발·로컬 한국어 대체.
4. System Voice: 설치 없는 최종 안전망.
5. Fish Audio S2: 라이선스 계약 전 평가 전용.
6. Kokoro: 공식 한국어 미지원으로 주력 제외.
현재 진실:
- CosyVoice Worker 인터페이스와 공식 AutoModel adapter 경계는 구현됐다.
- 릴리스 ZIP에는 모델 가중치, PyTorch, CUDA, CosyVoice 저장소가 없다.
- 모델 미설치 시 `/health`는 정상이어도 `/ready`는 not-ready다.
- 실제 한국어 자연스러움, 화자 유사도, 지연, VRAM 벤치마크는 미완료다.
- 채팅형 대본 작성용 실제 LLM API는 아직 연결되지 않았다.
- 0.8.0의 대본 요청은 `로컬 초안 · LLM 미연결`로 표시한다.
## 9. 주요 API 계약
API prefix `/api/v1`:
```text
GET  /health
GET  /setup
GET  /connectivity
GET  /engines
GET  /engines/strategy
POST /tts/synthesize
GET  /tts/jobs/{job_id}
GET  /tts/jobs/{job_id}/result
DELETE /tts/jobs/{job_id}
GET  /audio/{filename}
GET  /quality/diagnostics
POST /quality/preview
POST /quality/compare
GET  /voice-clones/capabilities
POST /voice-clones/profiles
DELETE /voice-clones/profiles/{profile_id}
POST /voice-clones/profiles/{profile_id}/jobs
GET  /voice-clones/jobs/{job_id}
GET  /voice-clones/jobs/{job_id}/events
POST /voice-clones/jobs/{job_id}/cancel
POST /voice-clones/jobs/{job_id}/retry
GET  /voice-clones/jobs/{job_id}/audio
```
Worker:
```text
GET  /health
GET  /ready
GET  /v1/diagnostics
POST /v1/jobs
GET  /v1/jobs/{job_id}
GET  /v1/jobs/{job_id}/events
POST /v1/jobs/{job_id}/cancel
POST /v1/jobs/{job_id}/retry
GET  /v1/jobs/{job_id}/audio
GET  /v1/jobs/{job_id}/segments/{index}/audio
```
## 10. API 주소와 자동 탐색
Web 저장 키:
- `sorion-api-base-url`: 사용자가 선택한 주소.
- `sorion-api-last-good-url`: 마지막 성공 주소.
- `sorion-api-url-history`: 최근 주소 최대 5개.
- `sorion-client-id`: 익명 연결·rate-limit 식별자.
우선순위는 저장 주소, 마지막 성공 주소, 최근 주소, `VITE_API_BASE_URL`, 안전한 현재
호스트 후보다. localhost 후보는 Web도 localhost일 때만 자동 추가한다. HTTP LAN Web은 현재
호스트 8000을, HTTPS Web은 같은 Origin `/api/v1`과 8443 후보만 추가한다. 전체 LAN은
스캔하지 않는다. 스킴 없는 LAN IP는 HTTP, 공개 도메인은 현재 페이지 프로토콜로 정규화한다.
## 11. 저장·개인정보·동의
IndexedDB `sorion-ai`, schema v3:
- `projects`: 프로젝트 메타데이터.
- `qualityReviews`: 품질 평가·메모.
- `voiceProfiles`: 샘플 Blob·분석·동의 기록.
정책:
- 샘플은 기본 브라우저 로컬 저장.
- Firebase 자동 업로드 금지.
- 서버 샘플 TTL 7일, 생성 음원 30분, Worker 종료 job 60분.
- 사용자 파일명을 서버 저장 경로로 사용하지 않는다.
- 동의 철회 시 로컬 프로필·서버 샘플·향후 prompt cache를 함께 폐기한다.
- 원문과 음성 본문은 감사 로그에 기록하지 않는다.
## 12. 보안 경계
공유 Secret:
```env
SORION_WORKER_SERVICE_TOKEN=
SORION_WORKER_SIGNATURE_SECRET=
```
헤더:
```text
X-SoriON-Service-Token
X-SoriON-Timestamp
X-SoriON-Signature
```
- 서명은 method + path + timestamp + body SHA-256의 HMAC-SHA256.
- `/health`만 무인증, `/ready`와 `/v1/*`는 인증.
- Worker는 인터넷에 직접 공개하지 않는다.
- Secret은 저장소와 ZIP에 넣지 않는다.
- production에서 Secret이 없으면 ready가 되지 않아야 한다.
## 13. 환경 변수
Web:
```text
VITE_API_BASE_URL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
```
API:
```text
SORION_ENVIRONMENT
SORION_CORS_ORIGINS
SORION_DEFAULT_TTS_ENGINE
SORION_ALLOW_MOCK_ENGINE
SORION_ENABLE_MELO_TTS
SORION_MELO_DEVICE
SORION_ENABLE_SYSTEM_TTS
SORION_SYSTEM_TTS_VOICE
SORION_JOB_STORE_PATH
SORION_JOB_CLAIM_TTL_SECONDS
SORION_JOB_RESULT_TTL_MINUTES
SORION_JOB_HISTORY_TTL_HOURS
SORION_JOB_POLL_INTERVAL_SECONDS
SORION_COSYVOICE_WORKER_URL
SORION_COSYVOICE_WORKER_TIMEOUT_SECONDS
SORION_WORKER_SERVICE_TOKEN
SORION_WORKER_SIGNATURE_SECRET
SORION_PUBLIC_RATE_LIMIT_PER_MINUTE
SORION_ALLOW_PRIVATE_NETWORK
SORION_AUDIT_LOG_PATH
```
Worker:
```text
SORION_WORKER_ENVIRONMENT
SORION_WORKER_MODEL_PATH
SORION_WORKER_REQUIRED_MODEL_FILES
SORION_WORKER_ADAPTER_MODULE
SORION_WORKER_DEVICE
SORION_WORKER_ALLOW_CPU
SORION_WORKER_MIN_VRAM_MB
SORION_WORKER_SERVICE_TOKEN
SORION_WORKER_SIGNATURE_SECRET
SORION_WORKER_AUTH_TTL_SECONDS
SORION_WORKER_RATE_LIMIT_PER_MINUTE
SORION_WORKER_JOB_TTL_MINUTES
```
## 14. 코딩 규칙
- 소스 파일 500줄 이하.
- 큰 함수 분리, 중복 제거, 하드코딩 최소화.
- SVG 신규 사용 금지.
- 폐기 라이브러리 사용 금지.
- Python 최소 지원 버전 3.10.
- Python은 Ruff 표시 폭 100칸 이하.
- React Hook dependency 경고 0건.
- 테스트 간 DOM을 명시적으로 cleanup.
- 새 기능에는 Web 또는 API·Worker 테스트를 추가한다.
- 실제 기능 미연결 상태를 Demo 성공으로 숨기지 않는다.
## 15. 브랜치와 배포 규칙
- 브랜치: `main`, `develop`, `feature/*`, `fix/*`.
- main 직접 개발 금지.
- 활성 Workflow는 `.github/workflows/ci.yml` 하나.
- main push, pull request 범위를 분리해 중복 실행을 막는다.
- GitHub Pages Source는 GitHub Actions.
- Web, API Python 3.10, Worker Python 3.10이 모두 통과해야 배포한다.
## 16. 현재 산출물과 패치 기준
- 전체본: `SoriON-AI-0.8.4-full.zip`.
- 패치: `SoriON-AI-0.8.3-to-0.8.4-patch.zip`.
- 체크섬: `SoriON-AI-0.8.4-artifacts.sha256`.
- 패치 기준은 package version `0.8.3`이다.
- 삭제: `ApiSetupWizard.tsx`, `ConnectionBottomSheet.tsx`, `EngineStatusCard.tsx`, `connection-sheet.css`.
## 17. 절대 변경 금지 결정
- 초기 브랜드 랜딩을 제거하지 않는다.
- 편집 진입 후 대형 헤더를 다시 노출하지 않는다.
- API 연결을 사용자 주소 입력이나 엔진 수동 선택에 의존시키지 않는다.
- 초기 랜딩에 Dock이나 플레이어를 노출하지 않는다.
- 플레이어를 Dock 메뉴 아래로 내리지 않는다.
- 고급 감정·피치 설정을 초보자 첫 흐름에 다시 넣지 않는다.
- 실제 LLM이 없는데 AI 대본 생성이라고 표시하지 않는다.
- HANDOVER를 단순 변경 목록으로 축소하지 않는다.
## 18. 알려진 제한과 위험
- 실제 CosyVoice 모델과 GPU는 릴리스에 포함되지 않는다.
- GitHub Pages만으로는 TTS와 복제 기능이 작동하지 않는다.
- HTTPS Pages에서 HTTP LAN API 호출은 브라우저가 차단할 수 있다.
- Web Speech 입력은 브라우저 지원과 권한에 따라 동작하지 않을 수 있다.
- 자동 API 탐색은 개인정보·보안 때문에 전체 LAN 스캔을 하지 않는다.
- 문장별 Progressive 생성은 현재 순차 TTS 요청이다.
- 문장별 음원을 하나의 내보내기 파일로 재병합하는 편집 Export는 미완료다.
- 타임라인 상태는 아직 새로고침 후 영구 복원되지 않는다.
- 실제 LLM 대본 생성은 미연결이며 로컬 초안만 제공한다.
- 정식 npm 테스트와 build는 패키지 저장소 가용성에 영향을 받는다.
- TTS job DB는 모든 API 프로세스가 같은 로컬 SQLite 파일을 공유해야 한다.
- localStorage 실패 시 세션 메모리 fallback은 동작하지만 앱 종료 뒤 영구 복원되지는 않는다.
## 19. 절대 전달 규칙
최종 응답 순서:
1. 결과.
2. 전체 통파일 ZIP, 덮어쓰기 가능한 패치 ZIP, SHA-256.
3. 다음 예상 업데이트 내역.
모든 릴리스에서 갱신:
- `docs/HANDOVER.md`.
- `docs/CHANGELOG.md`.
- `docs/NEXT_UPDATE.md`.
- `FOUNDATION_REPORT.md`.
- `docs/patches/{version}`.
## 20. 검증 기준
필수:
```text
npm run quality:rules
npm run lint
npm run typecheck
npm run test
cd services/api && uv run --python 3.10 ruff check app tests
cd services/api && uv run --python 3.10 pytest tests -q
cd services/worker && uv run --python 3.10 ruff check app tests
cd services/worker && uv run --python 3.10 pytest tests -q
npm run build
```
네트워크 제한 시 실행하지 못한 항목과 이유를 결과 보고서에 정확히 기록한다.
## 21. 다음 목표
다음 목표 버전: **0.8.6 Mobile Workspace Session Persistence**.
우선순위:
1. 열린 채팅·타임라인·생성 옵션·job ID를 IndexedDB에 자동 저장.
2. 새로고침·PWA 종료 뒤 서버 상태와 `/result`를 먼저 조회해 마지막 작업공간 복원.
3. Object URL 소실, quota 초과, private mode와 iOS 데이터 정리 fallback.
4. Android Chrome·iOS Safari·설치형 PWA 단절 복구 실기기 매트릭스.
5. 이후 공용 엔진 health 저장, 공개 API 인증, WAV Export, 실제 LLM Adapter 순으로 진행.
금지: 수동 API·엔진 UI를 만들거나 메뉴 이동으로 초안을 지우고, 복원 실패 때 같은 POST를 무조건 재전송하지 않는다.
## 22. 변경 이력 보존 위치
- 0.7.3 이전 MASTER HANDOVER:
  `docs/archive/HANDOVER_MASTER_0.7.3.md`.
- 0.5.8~0.7.2 상세 기록:
  `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`.
- 전체 버전 요약:
  `docs/CHANGELOG.md`.
## 23. 2026-08-01 11:06 KST · v0.8.0 릴리스 기록
1. 작업 일시: 2026-08-01 11:06 KST.
2. 대상·기준: `0.7.3 → 0.8.0`.
3. 변경 내용: 초기 랜딩 유지, 편집 진입 후 ChatGPT형 채팅과 CapCut형 타임라인으로
   전체 생성 UX를 개편했다. API 연결 시스템 메시지와 바텀시트를 추가했다.
4. 변경 이유: 기존 입력→음성→감정→고급설정 구조가 초보자에게 복잡했고,
   API 미설정 오류가 기능 이탈의 가장 큰 원인이었다.
5. 영향 범위: AppShell, HomePage, Dock 진입, API 자동 탐색, 엔진 상태,
   문장별 TTS 생성, 플레이어 큐, CSS, 테스트, 문서.
6. 주요 파일: `HomePage.tsx`, `LandingHome.tsx`, `useTimelineGeneration.ts`,
   `components/workspace/*`, `ConnectionBottomSheet.tsx`, `workspace-*.css`,
   `timeline-editor.css`, `httpClient.ts`, `connectivity.py`.
7. 검증 결과: API 56개, Worker 9개 테스트 통과. Python compileall, Python 3.10 AST,
   TypeScript 대체 정적 검사, CSS·YAML 파싱, 실제 API·Worker·System TTS HTTP 통합 검사를 수행했다.
8. 알려진 제한: 실제 LLM, GPU 모델, 타임라인 영구 저장과 편집 Export는 미완료다.
9. 산출물: `SoriON-AI-0.8.0-full.zip`,
   `SoriON-AI-0.7.3-to-0.8.0-patch.zip`.
10. 다음 예상 업데이트: `0.8.1 Timeline Persistence & Real Script Model Bridge`.
## 24. 2026-08-01 11:44 KST · v0.8.1 릴리스 기록
1. 작업 일시: 2026-08-01 11:44 KST.
2. 대상·기준: `0.8.0 → 0.8.1`.
3. 변경 내용: 모바일 API 주소·재연결·오류 분류·요청 ID·계층 상태를 강화하고,
   TTS POST 응답이 끊겨도 job ID로 완료 결과를 복구하도록 했다.
4. API 변경: `GET /api/v1/tts/jobs/{job_id}/result`, Worker·GPU 세부 상태,
   Private Network preflight, client ID 기반 rate-limit 구분을 추가했다.
5. 모바일 변경: 16px 입력, 44px 터치 영역, safe-area, 최근 주소 선택, API·TTS·Worker·GPU
   4단계 바텀시트, 온라인·네트워크·포그라운드 자동 재검사를 추가했다.
6. 실제 점검: Worker health 정상·model not-ready, API connectivity 정상, System TTS WAV
   147,358 bytes 생성, 완료 결과 복구 API와 PNA preflight를 실제 HTTP로 확인했다.
7. 검증 결과: API 60개, Worker 9개 테스트 통과. 프로젝트 규칙, compileall, Python 3.10
   AST, 핵심 TypeScript strict 대체 검사, 104개 TS/TSX 구문, CSS 11개 파싱 통과.
8. 알려진 제한: 실제 CosyVoice 모델·CUDA GPU와 실제 LLM은 릴리스에 포함되지 않는다.
9. 산출물: `SoriON-AI-0.8.1-full.zip`, `SoriON-AI-0.8.0-to-0.8.1-patch.zip`.
10. 다음 예상 업데이트: `0.8.2 Timeline Persistence & Real Script Model Bridge`.
## 25. 2026-08-01 12:25 KST · v0.8.2 릴리스 기록
1. 작업 일시: 2026-08-01 12:25 KST.
2. 대상·기준: `0.8.1 → 0.8.2`.
3. 변경 내용: 동일 TTS job·동일 요청은 실행 Task와 완료 결과를 재사용하고, 다른 payload 재사용은 409로 차단했다.
4. 모바일 변경: 타임라인 블록에 job ID를 보존하고 실패 재시도는 기존 상태·결과를 먼저 복구하도록 변경했다.
5. 연결 안전성: HTTP 호출 취소가 서버 생성 Task를 취소하지 않도록 shield하고, 명시적 DELETE만 실제 작업을 취소한다.
6. 호환성: localStorage 실패 시 메모리 fallback, `randomUUID` 미지원 브라우저용 ID 생성기를 추가했다.
7. 편집 안전성: 생성 중 텍스트 수정·분할 시 클라이언트 요청과 polling을 중단하고 오래된 결과 덮어쓰기를 막았다.
8. 검증 결과: API 65개, Worker 9개 테스트와 Python compileall, 프로젝트 규칙, 108개 TS/TSX 구문 검사를 통과했다.
9. 제한: npm 의존성 저장소 404로 정식 Web test/lint/build, Ruff 미설치로 공식 Ruff는 실행하지 못했다. job은 아직 API 메모리 기반이다.
10. 산출물: `SoriON-AI-0.8.2-full.zip`, `SoriON-AI-0.8.1-to-0.8.2-patch.zip`.
11. 다음 예상 업데이트: `0.8.3 Mobile Session Persistence & Engine Operations`.

## 26. 2026-08-01 14:09 KST · v0.8.2 API PNA CI 핫픽스
1. GitHub Actions Python 3.10에서 PNA preflight가 400으로 실패한 로그를 기준으로 수정했다.
2. 일반 `CORSMiddleware` 뒤에서 응답 헤더를 추가하던 방식을 제거했다.
3. `PrivateNetworkCORSMiddleware`가 PNA 확장 헤더를 표준 CORS 검사에서만 분리하고,
   Origin·Method·요청 헤더가 허용된 경우에만 allow-private-network 응답을 추가한다.
4. 잘못된 Origin과 PNA 비활성화가 계속 400인지 회귀 테스트를 추가했다.
5. 검증 결과: API 68개, Worker 9개, 프로젝트 규칙, compileall, Python 3.10 AST 통과.
6. Python 3.10 실인터프리터 다운로드는 실행 환경 DNS 제한으로 불가했으며 CI 재실행이 최종 확인이다.
7. 산출물: `SoriON-AI-0.8.2-full-pna-hotfix.zip`, `SoriON-AI-0.8.2-pna-hotfix-patch.zip`.
## 27. 2026-08-01 15:00 KST · v0.8.3 릴리스 기록
1. `0.8.2 → 0.8.3`: SQLite JobStore, 재시작 결과 복구, 원자적 claim, TTL tombstone과 cross-process 취소.
2. 검증: API 77개·Worker 9개와 프로젝트 규칙·compileall·Python 3.10 AST 통과.
3. 산출물: `SoriON-AI-0.8.3-full.zip`, `SoriON-AI-0.8.2-to-0.8.3-patch.zip`.
## 28. 2026-08-01 15:30 KST · v0.8.4 릴리스 기록
1. `0.8.3 → 0.8.4`: 수동 API·엔진 연결 제거, 자동 bootstrap, 랜딩 Dock 숨김과 프로젝트 불러오기 복구.
2. 검증: API 77개·Worker 9개, TS/TSX 구문과 대체 타입 검사 통과; 정식 Web 품질은 CI 확인.
3. 산출물: `SoriON-AI-0.8.4-full.zip`, `SoriON-AI-0.8.3-to-0.8.4-patch.zip`.
## 29. 2026-08-01 16:00 KST · v0.8.5 릴리스 기록
1. `0.8.4 → 0.8.5`: 작성 세션 보존, 공통 작업공간 IA, 설정·프로젝트 상태 개선.
2. EngineOrchestrator가 ready 순위, 자동 fallback, circuit cooldown과 runtime 진단을 담당한다.
3. 검증: API 89개·Worker 9개, 규칙·compileall·Python 3.10 AST·TS 구문 110개·상대 import 82개 통과.
4. 산출물: `SoriON-AI-0.8.5-full.zip`, `SoriON-AI-0.8.4-to-0.8.5-patch.zip`; 다음은 0.8.6 세션 영속화다.
