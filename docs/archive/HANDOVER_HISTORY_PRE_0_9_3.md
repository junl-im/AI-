# Archived HANDOVER history

이 문서는 HANDOVER 안전 상한을 유지하기 위해 0.11.35에서 분리한 과거 개발 이력입니다. 최신 기준선은 `docs/HANDOVER.md`를 사용합니다.

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
- 공개 FastAPI는 TLS reverse proxy 뒤에 두고 Worker와 같은 포트를 직접 노출하지 않는다.
- `X-Forwarded-*`는 Heartbeat 5에서 공개 Origin 진단 전용이며 인증·권한 판정에 사용하지 않는다.
- reverse proxy는 외부 forwarded header를 제거한 뒤 자신의 값만 전달한다.
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
SORION_COSYVOICE_TTS_PROFILE_ID, SORION_COSYVOICE_PRESET_DIRECTORY
SORION_WORKER_SERVICE_TOKEN, SORION_WORKER_SIGNATURE_SECRET
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
- 소스 파일은 800줄부터 분리를 권고하고 1,200줄 안전 상한만 차단.
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
- 전체 후보본: `SoriON-AI-0.11.24-recovery-batch-editor-responsibility-split-full.zip`.
- 덮어쓰기 패치: `SoriON-AI-0.11.23-to-0.11.24-recovery-batch-editor-responsibility-split-patch.zip`.
- 정확한 패치 기준: 사용자가 전달한 `0.11.23 · Focused Voice Surface & Picker Polish` 전체본.
- 이번 릴리스 추적 파일 삭제: 없음.
- `.git`, `.sorion`, `node_modules`, `dist`, Python cache, 실행 DB, 사용자 음성·Secret·모델 가중치는 산출물에서 제외한다.
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
- 장문 TTS는 첫 구간 파일 준비 시간을 측정하지만 해당 구간을 Web에 즉시 전달·재생하는 partial-ready 경로는 아직 없다.
- `first_audio_ms`는 서버 파일 준비 시간이며 브라우저 decode·`playing`·실제 스피커 출력 시작을 포함하지 않는다.
- Browser Speech의 실제 `onstart` 지표는 아직 수집하지 않으며 `null`을 유지한다.
- 공개 Bridge 진단은 프록시 forwarded header를 사용하므로 신뢰 프록시 allowlist 강화가 필요하다.
- 자동 탐색은 보안상 전체 LAN을 스캔하지 않는다.
- 정식 npm·uv lock 생성은 패키지 저장소 가용성에 영향을 받지만 component별 실패 범위로 격리한다.
- Heartbeat 6.6부터 CI는 lock을 자동 커밋하지 않는다. `generate_lockfiles=true` 결과는 artifact로 검토한 뒤 사람이 커밋한다.
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
다음 목표 버전: **0.11.26 · Chromium Multi-Scene Evidence & Real MY VOICE Recovery**.
우선순위:
1. 0.11.25 R1을 GitHub Actions에서 critical/full Vitest, semantic typecheck, lint, Vite build까지 녹색으로 고정하고 실제 카카오톡 Android/iOS에서 preset 미리듣기와 종료 확인 `계속 만들기`를 재검증한다.
2. desktop 1024/1280/1440과 mobile 360/390/430 Chromium evidence에서 workspace, Voice Picker/Drawer, multi stale recovery dialog를 scene별로 분리 확인한다.
3. 실제 MY VOICE Worker와 동의된 프로필이 있을 때만 stale profile 교체 후 재생성 성공과 first-audio latency를 측정한다.
4. Web quality와 모바일 WebView 검증이 녹색인 상태에서만 TimelineEditor의 남은 rendering/keyboard orchestration 책임 추가 분리를 판단한다.
5. 승인되지 않은 pixel baseline이나 실제 모델·실기기 증거가 없는 결과를 완료 증거로 승격하지 않는다.
금지: CI/모바일 failure 확인 상태에서 새 기능 진행, 측정 전 병렬도 자동 상향, 대규모 rewrite와 기능 추가 동시 진행, 동의·권리 없는 음성 포함, 모델 없는 성공 표시.
## 22. 변경 이력 보존 위치
- 0.7.3 이전 MASTER HANDOVER:
  `docs/archive/HANDOVER_MASTER_0.7.3.md`.
- 0.5.8~0.7.2 상세 기록:
  `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`.
- 전체 버전 요약:
  `docs/CHANGELOG.md`.
- 0.8.0~0.9.3 Heartbeat 6.8.0 상세 이력:
  `docs/archive/HANDOVER_HISTORY_0.8.0_TO_0.9.3_HEARTBEAT_6.8.0.md`.
## 23. 과거 상세 이력 archive

0.8.0~0.9.3 Heartbeat 6.8.0의 상세 릴리스 이력은 `docs/archive/HANDOVER_HISTORY_0.8.0_TO_0.9.3_HEARTBEAT_6.8.0.md`로 이동했습니다. 현재 목표·규칙·아키텍처·제한과 0.11.x 최신 이력은 이 본문을 기준으로 합니다.

0.11.4~0.11.9 상세 릴리스 이력은 `docs/archive/HANDOVER_HISTORY_0.11.4_TO_0.11.9.md`로 이동했습니다. 현재 목표·규칙·아키텍처·제한과 최근 릴리스 이력은 이 본문을 기준으로 합니다.
