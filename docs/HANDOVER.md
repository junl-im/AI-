# SoriON AI MASTER HANDOVER
상태: **절대 필독 · 임시채팅 영구 메모리 원본**
현재 기준 버전: **0.9.3-beta.3 · Firebase Public Config + PWA Asset Budget + CI Hardening 6**
기준 버전: **0.7.3 Handover Memory Baseline**
최종 갱신: **2026-08-02 16:58 KST**
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
- 외부 음성 서비스보다 한국어 발음·숫자·날짜·존댓말에 친화적.
- 초보자는 긴 원고와 제작 버튼에 집중하고 전문가는 타임라인에서 정밀 편집.
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
## 5. 0.8.6에서 확정된 제작 UX
### 핵심 개념
**장문 원고가 중심, 문장 타임라인이 편집 엔진**이다.
기본 흐름:
```text
긴 원고 붙여넣기
→ 목소리·읽기 옵션 선택
→ 문장·쉼 블록 자동 분할
→ 앞 블록부터 순차 생성
→ Dock에서 즉시 재생
```
### 초기 화면과 브랜드
- 첫 화면은 제품 설명과 `장문 음성 스튜디오 시작` 동선에 집중한다.
- 공식 SoriON 아이콘을 favicon, PWA, 첫 화면과 작업공간 상단에 통일한다.
- 첫 화면에는 Dock과 플레이어를 렌더링하지 않는다.
- 어느 작업 화면에서든 상단 아이콘·제품명을 누르면 첫 페이지로 이동한다.
- 첫 브라우저 뒤로가기는 커스텀 종료 확인창을 띄우고 두 번째 뒤로가기는 즉시 이탈한다.
### 장문 제작 화면
- 채팅형 composer와 대화 버블을 기본 제작 UI로 사용하지 않는다.
- 최대 20,000자 원고 편집기, 일반 Enter 줄바꿈, Ctrl/⌘+Enter 제작을 제공한다.
- 문자·문단·음성 블록 수와 예상 길이를 표시한다.
- 생성 뒤에도 원고를 유지하고 타임라인만 새 제작본으로 교체한다.
- 광고 톤, 밝은 톤, 느린 읽기와 숫자 발음 보정을 단순 옵션으로 제공한다.
- 서버가 늦게 연결되면 사용자가 이미 누른 제작 요청을 보존해 연결 복구 뒤 자동 재개한다.
### 목소리와 타임라인
- 목소리는 세로 라이브러리로 제공하고 프리뷰는 실제 API 준비 상태에서 생성한다.
- 문장 사이에 기본 0.5초 쉼 블록을 넣는다.
- 첫 ready 블록부터 Dock에 연결한다.
- 순서 변경, 쉼 추가, 문장 분할·수정과 실패 블록 재시도를 제공한다.
- 수정·분할 시 기존 음원은 무효화하고 block revision이 과거 결과 적용을 차단한다.
### 엔진 연결 UX
- API 주소 입력과 엔진 수동 선택 화면을 만들지 않는다.
- 공개 배포는 `SORION_PUBLIC_API_BASE_URLS` 복수 후보를 런타임 JSON과 build에 주입한다.
- `*.github.io`는 정적 호스트이므로 same-origin `/api/v1`과 `:8443`을 탐색하지 않는다.
- API·TTS·Worker·GPU 상태를 분리하고 `/connectivity`와 `/engines`는 같은 추천 엔진을 사용한다.
- 연결 실패 주소는 제외하고 다음 HTTPS API를 승계하며 online·복귀·backoff에서 재탐색한다.
### Dock
- 순서: `만들기 → 복제 → 품질 → 프로젝트`.
- 음성이 없으면 메뉴만, 첫 ready 음성이 생기면 플레이어를 메뉴 위에 표시한다.
- 큐, 이전·다음, 반복, 속도, 탐색과 다운로드를 유지한다.
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
Longform Editor + Timeline + Linked Player
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
- 최대 20,000자 장문 원고 편집기, 문단·문장 통계와 제작 전 분할 예상.
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
기본 무료 전용순위:
1. CosyVoice 3 기준 음색: 준비된 로컬 Worker가 있을 때 주력 AI TTS.
2. MeloTTS: 설치된 경우 로컬 무료 AI 대체.
3. System Voice·Browser Speech: 운영체제·공개 Web 재생 안전망.
4. 외부 과금형 음성 공급자는 과거 선택 정책를 서버 운영자가 명시한 경우에만 후보가 된다.
5. GPT-SoVITS·Fish Audio는 라이선스·운영 검증 전 평가 후보이며 Kokoro는 주력에서 제외한다.
현재 진실:
- CosyVoice 일반 TTS와 Cloud Adapter 경계가 구현됐지만 기본 free-only에서는 과금형을 등록하지 않는다.
- 자격 증명·Worker·동의된 기준 음성이 준비된 엔진만 자동 후보가 된다.
- 릴리스 ZIP에는 모델 가중치, PyTorch, CUDA, CosyVoice 저장소가 없다.
- Worker는 매니페스트·라이선스 동의·SHA-256·하드웨어 검증 전 모델 adapter를 로딩하지 않는다.
- 모델 미설치 시 `/health`는 정상이어도 `/ready`는 not-ready다.
- 실제 한국어 자연스러움, 화자 유사도, 지연, VRAM 벤치마크는 미완료다.
- 현재 기본 제작 흐름은 사용자가 작성한 장문 원고를 정확히 음성화하는 데 집중한다.
- 자동 대본 작성 LLM은 핵심 제작 경로에 포함하지 않으며, 별도 검증 전까지 성공 상태로 노출하지 않는다.
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
GET  /tts/jobs/{job_id}/events
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
Web 내부 키:
- `sorion-api-last-good-url`: 마지막 성공 주소.
- `sorion-api-url-history`: 최근 정상 주소 최대 5개.
- `sorion-client-id`: 익명 연결·rate-limit 식별자.
우선순위는 빌드 주입 HTTPS API, 성공 이력, 비정적 same-origin, 안전한 개발 후보다.
GitHub Pages는 same-origin과 8443 후보에서 제외한다. 전체 LAN은 스캔하지 않는다.
사용자 주소 입력 UI는 없으며 공개 운영자는 Repository Variable
`SORION_PUBLIC_API_BASE_URL`을 한 번 설정한다.
## 11. 저장·개인정보·동의
IndexedDB `sorion-ai`, schema v4:
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
전체 기본값과 설명의 원본은 루트 `.env.example`이다. 릴리스 ZIP에 실제 `.env`를 넣지 않는다.
Web·배포:
```text
VITE_API_BASE_URL, VITE_API_BASE_URLS, SORION_PUBLIC_API_BASE_URL, SORION_PUBLIC_API_BASE_URLS
VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
```
API core·job:
```text
SORION_ENVIRONMENT, SORION_CORS_ORIGINS, 삭제된 비용 정책 변수, SORION_DEFAULT_TTS_ENGINE, SORION_TTS_ENGINE_ORDER
SORION_ENGINE_FAILURE_THRESHOLD, SORION_ENGINE_COOLDOWN_SECONDS, SORION_GENERATION_TIMEOUT_SECONDS
SORION_MAX_CONCURRENT_GENERATIONS, SORION_JOB_STORE_PATH, SORION_JOB_CLAIM_TTL_SECONDS
SORION_JOB_RESULT_TTL_MINUTES, SORION_JOB_HISTORY_TTL_HOURS, SORION_JOB_POLL_INTERVAL_SECONDS
SORION_AUDIO_TTL_MINUTES, SORION_AUDIO_DIRECTORY, SORION_MAX_SEGMENT_CHARS
```
엔진·Worker proxy:
```text
SORION_ENABLE_MELO_TTS, SORION_MELO_DEVICE, SORION_ENABLE_SYSTEM_TTS, SORION_SYSTEM_TTS_VOICE
SORION_COSYVOICE_WORKER_URL, SORION_COSYVOICE_WORKER_TIMEOUT_SECONDS
SORION_COSYVOICE_WORKER_JOB_TIMEOUT_SECONDS, SORION_COSYVOICE_TTS_REFERENCE_PATH
SORION_COSYVOICE_TTS_PROFILE_ID, SORION_WORKER_SERVICE_TOKEN, SORION_WORKER_SIGNATURE_SECRET
```
보안·저장·Worker:
```text
SORION_PUBLIC_RATE_LIMIT_PER_MINUTE, SORION_ALLOW_PRIVATE_NETWORK, SORION_AUDIT_LOG_PATH
SORION_VOICE_CLONE_DIRECTORY, SORION_VOICE_CLONE_TTL_DAYS, SORION_VOICE_CLONE_MAX_FILE_BYTES
SORION_WORKER_ENVIRONMENT, SORION_WORKER_OUTPUT_PATH, SORION_WORKER_MODEL_PATH
SORION_WORKER_MODEL_MANIFEST_PATH, SORION_WORKER_REQUIRE_MODEL_MANIFEST
SORION_WORKER_MODEL_LICENSE_ACCEPTED, SORION_WORKER_REQUIRED_MODEL_FILES
SORION_WORKER_ADAPTER_MODULE, SORION_WORKER_DEVICE, SORION_WORKER_ALLOW_CPU
SORION_WORKER_MIN_VRAM_MB, SORION_WORKER_MIN_DISK_FREE_MB, SORION_WORKER_MAX_CONCURRENT_JOBS
SORION_WORKER_MAX_SAMPLE_BYTES, SORION_WORKER_AUTH_TTL_SECONDS, SORION_WORKER_RATE_LIMIT_PER_MINUTE
SORION_WORKER_JOB_TTL_MINUTES, SORION_WORKER_CORS_ORIGINS, SORION_WORKER_AUDIT_PATH
SORION_FASTER_WHISPER_MODEL, SORION_FASTER_WHISPER_DEVICE, SORION_FASTER_WHISPER_COMPUTE_TYPE
SORION_STT_DIRECTORY, SORION_DEVICE_BENCHMARK_PATH
```
## 14. 코딩 규칙
- 소스 파일 500줄 이하.
- 큰 함수 분리, 중복 제거, 하드코딩 최소화.
- 공식 브랜드 원본은 사용자 제공 `public/sorion-logo.png`이며 근사 SVG를 다시 만들지 않는다.
- 폐기 라이브러리 사용 금지.
- Python 최소 지원 버전 3.10.
- Python은 Ruff 표시 폭 100칸 이하.
- React Hook dependency 경고 0건.
- 직접 npm 의존성 exact pin과 Web peer compatibility gate를 유지한다.
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
- 전체 후보본: `SoriON-AI-0.9.3-beta.1-full.zip`.
- 누적 패치: `SoriON-AI-0.9.3-alpha.2-to-0.9.3-beta.1-patch.zip`.
- 기준본: 사용자 CI 로그의 `0.9.3-alpha.2`.
- 삭제 대상: `public/sorion-icon.svg`; APPLY_PATCH 스크립트로 실제 삭제한다.
## 17. 절대 변경 금지 결정
- 초기 브랜드 랜딩을 제거하지 않는다.
- 편집 진입 후 대형 헤더를 다시 노출하지 않는다.
- API 연결을 사용자 주소 입력이나 엔진 수동 선택에 의존시키지 않는다.
- 초기 랜딩에 Dock이나 플레이어를 노출하지 않는다.
- 플레이어를 Dock 메뉴 아래로 내리지 않는다.
- 고급 감정·피치 설정을 초보자 첫 흐름에 다시 넣지 않는다.
- 채팅형 한 문장 composer를 장문 기본 제작 화면으로 되돌리지 않는다.
- HANDOVER를 단순 변경 목록으로 축소하지 않는다.
## 18. 알려진 제한과 위험
- GitHub Pages만으로 서버 AI 합성은 불가능하며 별도 HTTPS FastAPI가 필요하다.
- 공개 API가 없으면 Browser Speech만 재생되며 AI·WAV 다운로드·복제는 준비되지 않는다.
- CosyVoice는 모델·GPU·동의된 기준 음성이 별도 필요하고 free-only는 과금형 API를 호출하지 않는다.
- Web Speech 받아쓰기는 브라우저 지원과 권한에 따라 동작하지 않을 수 있다.
- 장문은 현재 블록 순차 생성이며 최종 WAV 재병합 Export는 미완료다.
- 자동 탐색은 보안상 전체 LAN을 스캔하지 않는다.
- 정식 npm·uv lock 생성은 패키지 저장소 가용성에 영향을 받지만 component별 실패 범위로 격리한다.
- 검증된 lock만 SHA-256 증명 후 main 전용 최소 권한 job이 자동 커밋하며 강제 갱신은 `generate_lockfiles=true`를 사용한다.
- 모든 API 프로세스는 같은 SQLite job 파일을 공유해야 한다.
- memory fallback은 앱 종료 뒤 영구 복원되지 않는다.
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
CI Hotfix 4 테스트 규칙:
- 브라우저 이벤트로 React 상태를 바꾸는 테스트는 `act()` 또는 Testing Library `fireEvent`로 감싼다.
- placeholder 같은 변경 가능한 카피보다 maxlength, 접근성 이름, callback 같은 제품 계약을 검증한다.
- `scripts/check-web-test-contracts.mjs`가 두 규칙의 핵심 회귀를 CI 앞단에서 차단한다.
## 21. 다음 목표
다음 목표 버전: **0.9.3-beta.2 Real Device Evidence & Selective STT Regeneration**.
우선순위:
1. Windows CUDA·Apple MPS·CPU와 Android·iOS 실제 측정표 완성.
2. 10분·30분·60분 원고의 지연·RTF·RAM·VRAM·실패율 기록.
3. Faster Whisper 결과에서 실패 문장만 제한 재생성.
4. 대형 장문 WAV·MP3·SRT·VTT 싱크와 메모리 실측.
5. CosyVoice 모델은 병행 설치·동일 평가·canary·rollback으로 전환.
금지: 측정하지 않은 실기기 성능 보증, 유료 API 기본 호출, 모델 없는 성공 표시.
## 22. 변경 이력 보존 위치
- 0.7.3 이전 MASTER HANDOVER:
  `docs/archive/HANDOVER_MASTER_0.7.3.md`.
- 0.5.8~0.7.2 상세 기록:
  `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`.
- 전체 버전 요약:
  `docs/CHANGELOG.md`.
## 23. 0.8.0~0.8.5 요약
- 장문 제작 이전의 채팅·타임라인 기반, 모바일 API 복구, SQLite JobStore, 자동 bootstrap과
  엔진 fallback 기반을 만들었다. 상세 기록은 CHANGELOG와 archive HANDOVER에 보존한다.
## 24. 0.8.6~0.8.8 요약
- 장문 편집, 세션 복원, 공식 로고, 더빙 UI, 공통 상단 배너와 Browser Speech 안전망을 확정했다.
- 0.8.7 Web quality 접근성·메뉴·테스트 타이밍 핫픽스는 CHANGELOG에 보존한다.
## 25. 2026-08-01 22:20 KST · v0.8.9
- 공통 PageScaffold, Premium Korean Engine Mesh와 복수 API 자동 장애 전환을 추가했다.
- API 98개·Worker 9개와 프로젝트 규칙·Python 3.10·TS 구문 검사를 통과했다.
- 실제 Premium 합성은 서버 자격 증명, CosyVoice는 모델·GPU·기준 음성이 필요하다.
## 26. 2026-08-01 23:49 KST · v0.9.0 릴리스 기록
1. 작업 일시: 2026-08-01 23:49 KST.
2. 대상·기준: `0.8.9 → 0.9.0`.
3. 변경 내용: 기본 `free-only` 정책, 비용 등급·자동 후보 메타데이터, TTS job SSE와
   Web polling fallback, Progressive Queue 현재 트랙 보존을 추가했다.
4. 변경 이유: 무료 사용자의 기본 실행에서 유료 API가 후보가 되는 위험을 제거하고 장문 생성
   진행 상태를 더 빠르게 보여 주기 위해서다.
5. 영향 범위: API 설정·engine registry·orchestrator·strategy·diagnostics, TTS route,
   Web 진행 훅·Player store·Settings, 테스트와 문서.
6. 주요 파일: `engine_orchestrator.py`, `engine_strategy.py`, `tts.py`,
   `jobProgressStream.ts`, `useTimelineGeneration.ts`, `usePlayerStore.ts`.
7. 검증 결과: API 103개·Worker 9개, 프로젝트 규칙, compileall, Python 3.10 AST,
   TS/TSX 구문·상대 import, JSON·YAML 검사를 통과했다.
8. 제한: npm mirror 404로 공식 ESLint·typecheck·Vitest·Vite build를 실행하지 못했고,
   Ruff도 미설치다. CosyVoice 모델·GPU는 별도 준비 대상이다.
9. 산출물: `SoriON-AI-0.9.0-full.zip`, `SoriON-AI-0.8.9-to-0.9.0-patch.zip`.
10. 다음 예상 업데이트: `0.9.1 Free Local Model Onboarding & Korean Benchmark`.
## 27. 2026-08-02 · v0.9.1 무료 전용 런타임
1. 결제 계정이 필요한 일반 TTS Adapter와 Secret 설정을 현재 제품 소스에서 제거했다.
2. 일반 TTS 허용 목록은 CosyVoice·MeloTTS·System Voice이며 Mock은 테스트 전용이다.
3. Firebase Hosting Spark와 GitHub Pages는 정적 Web만 제공한다.
4. 데스크톱 정적 Web은 localhost API를 자동 탐색하고 모바일은 Browser Speech를 사용한다.
5. `npm run quality:free-only`가 허용 목록과 Firebase 정적 경계를 검사한다.
6. 다음 목표는 0.9.2 무료 로컬 모델 온보딩과 한국어 품질 벤치마크다.
## 28. 2026-08-02 · v0.9.2 한국어 음성 오케스트레이터
1. 엔진을 많이 노출하는 제품이 아니라 목적에 따라 자동 조합하는 오케스트레이터로 확정했다.
2. `/engines/catalog`가 채택·선택·벤치마크·외부 플러그인·연구·제외 결정을 제공한다.
3. CosyVoice 3·MeloTTS·Faster Whisper·DeepFilterNet3·Rule Director를 코어 채택했다.
4. F5-TTS 공식 pretrained checkpoint는 비상업 조건 때문에 자동 경로에서 제외한다.
5. Kokoro는 공식 한국어 기본 음성이 확인되기 전까지 한국어 경로에서 제외한다.
6. OpenVoice V2는 선택 Adapter, Seed-VC는 GPL 독립 프로세스 플러그인으로만 허용한다.
7. Rule Director는 외부 LLM 없이 원고 용도·발음·호흡·속도·감정과 엔진 요구를 계산한다.
8. 다음 목표는 실제 무료 Adapter 온보딩과 STT 기반 한국어 자동 검수다.
## 29. 2026-08-02 01:35 KST · v0.9.2 CI Hotfix 2
1. 작업 일시: 2026-08-02 01:35 KST.
2. 대상·기준: `0.9.2 CI Hotfix → 0.9.2 CI Hotfix 2`.
3. 변경 내용: 누적 덮어쓰기 저장소에 남은 `public/sorion-icon.svg`를 삭제 목록에
   다시 명시하고 Windows·macOS·Linux 적용 스크립트와 npm 정리 명령을 추가했다.
4. 변경 이유: ZIP 덮어쓰기는 기존 파일을 삭제하지 않으므로 0.8.8에서 폐기한 SVG가
   저장소에 잔존해 `quality:rules`가 실패했다.
5. 영향 범위: 프로젝트 규칙, 패치 적용 절차, 브랜드 정적 파일 정리와 릴리스 문서.
6. 주요 파일: `scripts/remove-stale-brand-assets.mjs`, `package.json`,
   `scripts/check-project-rules.mjs`, `docs/patches/0.9.2-ci-hotfix-2/*`.
7. 검증 결과: 잔존 SVG가 있는 누적 저장소에서 실패를 재현하고 정리 스크립트 실행 뒤
   `npm run quality:rules` 통과와 전체본·패치 적용본 해시 일치를 확인했다.
8. 제한·주의: 패치 ZIP을 덮어쓰기만 하면 기존 SVG는 삭제되지 않는다. 반드시
   `APPLY_HOTFIX.cmd` 또는 `.sh`를 실행하고 GitHub Desktop에서 삭제 변경을 커밋한다.
9. 산출물: `SoriON-AI-0.9.2-ci-hotfix-2-full.zip`,
   `SoriON-AI-0.9.2-ci-hotfix-to-0.9.2-ci-hotfix-2-patch.zip`.
10. 다음 예상 업데이트: Web·API·Worker CI가 모두 녹색인 것을 확인한 뒤
    `0.9.3 Free Local Pipeline Adapters & Korean Verification`을 진행한다.
## 30. 2026-08-02 10:20 KST · v0.9.3-alpha.1
1. 작업 일시: 2026-08-02 10:20 KST.
2. 대상·기준: `0.9.2 CI Hotfix 2 → 0.9.3-alpha.1`.
3. 변경 내용: Worker 모델 매니페스트 schema, 라이선스 동의, 파일 크기·SHA-256,
   CUDA·MPS·CPU·VRAM·디스크 readiness와 생성·검증 CLI를 추가했다.
4. 변경 이유: 모델 경로만 존재하거나 출처·무결성이 확인되지 않은 가중치를 ready로 표시하지
   않고, adapter가 대형 모델을 로딩하기 전에 안전하게 차단하기 위해서다.
5. 영향 범위: Worker 설정·runtime·diagnostics·schema, API connectivity, 환경 변수, 테스트와 문서.
6. 주요 파일: `model_manifest.py`, `runtime.py`, `scripts/model_manifest.py`,
   `test_model_manifest.py`, `connectivity.py`, `.env.example`, `COSYVOICE_WORKER.md`.
7. 검증 결과: 정적 품질 4종, API 100개, Worker 14개 테스트 통과.
8. 제한·주의: 실제 모델·공식 체크섬·라이선스 값은 제공하지 않는다. Web npm 설치와 Python
   3.10 uv·Ruff는 현재 네트워크 제약으로 실행하지 못했다.
9. 산출물: `SoriON-AI-0.9.3-alpha.1-full.zip`,
   `SoriON-AI-0.9.2-ci-hotfix-2-to-0.9.3-alpha.1-patch.zip`.
10. 다음 예상 업데이트: Faster Whisper 한국어 검수와 전체 WAV·MP3·자막 Export.
## 31. 2026-08-02 10:22 KST · v0.9.3-alpha.3 lock 전환
1. 대상·기준: `0.9.3-alpha.2 → 0.9.3-alpha.3`.
2. Node 22.18.0, npm 10.9.3을 nvm·node-version·packageManager·Volta와 CI에 고정했다.
3. 설치된 vite-plugin-pwa의 Vite 8 peer와 전체 npm ls 트리를 검사한다.
4. Actions 수동 입력이 npm·API uv·Worker uv lock, 경고 로그를 artifact로 생성한다.
5. 같은 실행의 Web·API·Worker는 artifact를 받아 npm ci와 uv sync --locked로 재검증한다.
6. 일반 push·PR은 세 lock이 없거나 manifest와 다르면 품질 작업 전에 실패한다.
7. 현재 실행 환경의 registry·DNS 제한 때문에 lock을 임의 생성하지 않았다.
8. 산출물은 lock bootstrap 후보본과 alpha.2 기준 덮어쓰기 패치다.
9. 다음 목표는 실기기 검증, STT 실측, 최종 Export 세 축만 완료하는 것이다.
## 32. 2026-08-02 10:40 KST · v0.9.3-beta.1
1. 대상·기준: 사용자 저장소 `0.9.3-alpha.2`에 alpha.3 lock 변경을 누적했다.
2. 폐기 SVG를 ignore, Git 인덱스 정리, pre-push, CI, 패치 삭제 실행기로 차단했다.
3. 실기기 지연·RTF·메모리·VRAM·재시도·실패 기록 API를 추가했다.
4. Faster Whisper 선택 Adapter와 CER·WER·핵심 토큰 오류 측정을 추가했다.
5. 완료 WAV와 쉼을 병합하고 frame 기반 SRT·VTT, 선택적 MP3를 생성한다.
6. 미완료 구간과 Browser Speech·Demo 음원은 기본 최종 Export에서 차단한다.
7. 주요 파일: stale-file scripts와 hook, verification·exports route, STT·export service, FinalExportControls, `REAL_DEVICE_STT_EXPORT.md`.
8. 검증: API 109개, Worker 14개, compileall, stale-file·프로젝트 규칙 검사 통과.
9. 제한: 로컬 FFmpeg MP3·자막 생성은 검증했지만, 실제 CUDA·MPS·모바일과 Faster Whisper 모델 실측은 아직 필요하다.
10. 산출물: beta.1 전체 ZIP, alpha.2 누적 패치 ZIP, SHA-256.
11. 다음: beta.2에서 실제 장치 증거와 실패 문장 제한 재생성을 완성한다.
## 33. 2026-08-02 12:18 KST · v0.9.3-beta.1 CI Hotfix 1
1. 누락 lock은 생성·감사하고 기존 lock은 strict verify하는 CI 분기로 bootstrap deadlock을 해소했다.
2. 범위는 Actions lock 작업, 판별 스크립트, 프로젝트 규칙과 lock 운영 문서다.
3. missing·partial·present fixture와 YAML·정적 게이트를 검증했고 실제 registry 실행은 Actions가 판정한다.
4. 생성 artifact를 커밋하기 전까지 generate 모드이며 잘못된 기존 lock은 자동 치유하지 않는다.
5. 다음 단계는 세 lock 커밋 후 beta.2 실기기 증거와 선택 STT 재생성이었다.
## 34. 2026-08-02 12:31 KST · v0.9.3-beta.1 CI Hotfix 2
1. Ruff I001, Web fetch mock 타입, Hook 의존성과 Node 20 Artifact Action 경고를 수정했다.
2. Artifact 전달은 Node 24 네이티브 upload v6·download v7을 사용한다.
3. 정적 게이트, API 109개, Worker 14개와 compileall을 통과했다.
4. npm 의존성 실행은 GitHub Actions가 최종 판정한다.
5. 산출물은 CI Hotfix 2 전체본과 Hotfix 1 기준 패치다.
## 35. 2026-08-02 13:27 KST · v0.9.3-beta.2 CI hardening
1. npm·API uv·Worker uv lock을 독립 job으로 분리하고 cache-only 우선·제한 재시도·hard timeout을 적용했다.
2. lock·manifest SHA-256 증명, stable artifact overwrite, main 전용 최소 권한 자동 커밋을 추가했다.
3. npm 장애는 Web lock에만 한정되고 preflight·API·Worker 결과는 독립적으로 확인된다.
4. API 112개, Worker 14개, YAML·정적 게이트·lock proof 손상 fixture를 통과했다.
5. 기능 목표는 실기기 측정, STT 개선율, 30·60분 Export soak를 그대로 유지한다.
## 36. 0.9.3-beta.3 검증 증거와 장문 Export
- 65,536-frame 원자적 Export, 10·30·60분 soak, STT 전후 증거와 개인정보 제거 bundle을 구현했으며 합성 soak는 실제 음질 증거가 아니다.
## 37. 0.9.3-beta.3 CI Hardening 2
- preflight 전체 보고서, npm 공식 endpoint fallback·lock 복구, 구성요소별 lock 부분 커밋으로 npm 장애가 Python 결과와 성공 lock 보존을 막지 않는다.
## 38. 0.9.3-beta.3 CI Hardening 5
- verification은 STT 모듈을 한 번만 import해 Ruff I001 재발을 제거했다.
- 누락 npm lock은 검증된 CI bootstrap으로 복구하고 Firebase SDK는 browser ESM 런타임 로드로 npm 그래프에서 제거했다.
## 39. 0.9.3-beta.3 CI Hardening 6
- Firebase 공개 Web 설정과 프로젝트 alias를 연결하고 Firestore·Storage를 기본 차단했으며, PWA 로고를 약 1.01MB로 최적화해 1.5MiB 예산 검사로 재발을 막았다.
