# SoriON AI MASTER HANDOVER
상태: **절대 필독 · 임시채팅 영구 메모리 원본**
현재 기준 버전: **0.8.7 Dubbing Studio Workspace · CI Hotfix 4**
기준 버전: **0.7.3 Handover Memory Baseline**
최종 갱신: **2026-08-01 20:47 KST**
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
- 공개 배포는 Actions 변수 `SORION_PUBLIC_API_BASE_URL`을 build에 주입한다.
- `*.github.io`는 정적 호스트이므로 same-origin `/api/v1`과 `:8443`을 탐색하지 않는다.
- API·TTS·Worker·GPU 상태를 분리하고 `/connectivity`와 `/engines`는 같은 추천 엔진을 사용한다.
- 연결 실패 시 online, 포그라운드 복귀와 단계적 backoff에서 내부적으로 재탐색한다.

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
- SVG는 검증된 공식 브랜드 원본 `public/sorion-icon.svg`만 허용한다.
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
- 전체본: `SoriON-AI-0.8.7-full.zip`.
- 패치: `SoriON-AI-0.8.6-to-0.8.7-patch.zip`.
- 기준본: `SoriON-AI-0.8.6-full.zip`.
- 삭제 대상: 없음.
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
- GitHub Pages만으로는 음성 생성이 작동하지 않으며 별도 HTTPS FastAPI가 필요하다.
- `SORION_PUBLIC_API_BASE_URL`이 없으면 공개 Web은 편집·저장만 가능하고 엔진은 준비되지 않는다.
- 로컬 진단의 system TTS는 실제 AI가 아니며 MeloTTS·CosyVoice·GPU 모델은 별도 설치다.
- Web Speech 받아쓰기는 브라우저 지원과 권한에 따라 동작하지 않을 수 있다.
- 장문은 현재 블록 순차 생성이며 최종 WAV 재병합 Export는 미완료다.
- 자동 탐색은 보안상 전체 LAN을 스캔하지 않는다.
- 정식 npm 검사는 패키지 저장소 가용성에 영향을 받는다.
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
다음 목표 버전: **0.8.8 Korean Voice Quality Streaming**.
우선순위:
1. 공개 HTTPS FastAPI와 사설 GPU Worker 운영 템플릿.
2. Fun-CosyVoice 3 일반 TTS Adapter와 한국어 장문 품질 평가.
3. 첫 문장 Progressive Playback, SSE 진행률과 첫 오디오 지연 측정.
4. 장문 실패 구간만 재생성하고 재생·생성 순서를 일치시키는 queue 계약.
5. Android Chrome·iOS Safari·설치형 PWA 실기기 매트릭스.
금지: 수동 API·엔진 UI, github.io API 오탐, 채팅형 기본 제작 화면, 모델 없는 AI 성공 표시.
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
## 27. 2026-08-01 · v0.8.3~0.8.5 요약
1. 0.8.3은 SQLite JobStore·재시작 복구·claim·TTL·프로세스 간 취소를 추가했다.
2. 0.8.4는 자동 API bootstrap, 랜딩 Dock 숨김과 프로젝트 복원을 추가했다.
3. 0.8.5는 공통 IA, 자동 엔진 fallback·circuit breaker를 추가했고 CI 핫픽스로 Ruff·잔존 UI를 정리했다.
## 31. 2026-08-01 18:30 KST · v0.8.6 릴리스 기록
1. 작업 일시: 2026-08-01 18:30 KST.
2. 대상·기준: `0.8.5 CI Hotfix → 0.8.6`.
3. 변경 내용: 20,000자 장문 원고 편집기, 문장별 순차 제작, IndexedDB 세션 복원,
   공식 SoriON 아이콘, 상단 브랜드 홈 이동과 뒤로가기 1회 확인·2회 즉시 이탈을 추가했다.
4. 변경 이유: 한 문장 채팅형 제작은 오디오북·강의·광고처럼 긴 원고를 다루는 제품 목표와
   맞지 않았고, GitHub Pages가 자신을 Voice API로 오인해 연결 대기 오류를 반복했다.
5. 영향 범위: 랜딩·작업공간 IA, HomePage, 타임라인, Player 연계, 세션 저장소,
   PWA 아이콘, 브라우저 history, API 자동 탐색, 연결 진단, Pages workflow와 문서.
6. 주요 파일: `LongformComposer.tsx`, `HomePage.tsx`, `useExitConfirmation.ts`,
   `workspaceSessionRepository.ts`, `apiConnection.ts`, `httpClient.ts`, `connectivity.py`,
   `sorion-icon.svg`, `ci.yml`, `LONGFORM_VOICE_WORKSPACE.md`.
7. 검증 결과: API 90개·Worker 9개, 프로젝트 규칙, Python compileall·3.10 AST,
   TS/TSX 120개 구문, 상대 import 250개, CSS·JSON·YAML 구조 검사를 통과했다.
   로컬 `system` 엔진으로 147,848-byte WAV 실제 생성도 확인했다.
8. 알려진 제한: 현재 실행 환경에는 npm 의존성과 공식 Ruff가 없어 ESLint·정식 TypeScript
   project build·Vitest·Vite build·Ruff는 GitHub Actions 최종 확인이 필요하다. 공개 Pages는
   실제 HTTPS FastAPI 배포와 `SORION_PUBLIC_API_BASE_URL` 없이는 음성을 생성할 수 없다.
   로컬 System Voice는 실제 WAV를 만들지만 AI 모델 음성이 아니며 CosyVoice·GPU는 미준비다.
9. 산출물: `SoriON-AI-0.8.6-full.zip`,
   `SoriON-AI-0.8.5-ci-hotfix-to-0.8.6-patch.zip`.
10. 다음 예상 업데이트는 모바일 더빙 편집 IA 확정이다.
## 32. 2026-08-01 · v0.8.7 릴리스와 CI 핫픽스
1. 프로젝트 상단바, 화자·설정 Sheet, 세로형 대사 블록과 고정 플레이어를 추가했다.
2. 첫 핫픽스는 TimelineEditor 대사 버튼의 중복 접근성 이름을 번호·상태별로 분리했다.

## 33. 2026-08-01 20:05 KST · v0.8.7 Web quality CI 핫픽스 2
1. 기준: `0.8.7-ci-hotfix → 0.8.7-ci-hotfix-2`.
2. 현재 화자 선택과 같은 화자의 미리듣기 버튼이 `/혜린/` 조회에서 충돌한 문제를 수정했다.
3. 이름을 `현재 목소리 혜린 선택`과 `혜린 목소리 미리듣기`로 분리하고 popup·expanded 상태를 추가했다.
4. DubbingVoiceControls와 HomePage 테스트는 정확한 접근성 이름만 조회한다.
5. 제작 화면의 팝업 메뉴는 네이티브 `details/summary`에 의존하지 않고 명시적 button, React 상태, `aria-expanded`를 사용한다.
6. 프로젝트 메뉴와 대사 블록 메뉴는 선택 즉시 닫히며 대사 메뉴 이름에는 대사 번호를 포함한다.
5. API 90개·Worker 9개, TS/TSX 구문·상대 import·패치 동등성을 확인한다.
6. 다음 목표는 `0.8.8 Korean Voice Quality Streaming`이다.
