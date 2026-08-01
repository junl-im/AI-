# SoriON AI MASTER HANDOVER

상태: **절대 필독 · 임시채팅 영구 메모리 원본**  
현재 기준 버전: **0.7.3 Handover Memory Baseline**  
기준 기능 버전: **0.7.2 CI Zero-Error Patch**  
최종 갱신: **2026-08-01 09:32 KST**  
제품 소유·디자인: **곰같은여우**  
서비스명: **SoriON AI / 소리온 AI** · 내부 코드명: **SOA**

> 이 프로젝트는 임시채팅에서 개발 중이므로 대화 메모리에 의존하면 안 된다.
> 다음 AI 또는 개발자는 작업 전에 이 파일과 루트 `DELIVERY_RULES.md`를 끝까지 읽는다.
> 이 파일은 제품 목표, 사용자 결정, 기술 상태, 금지 규칙, 배포 현실과 다음 작업을
> 보존하는 단일 인수인계 메모리다.
## 1. 다음 세션 시작 절차

1. `docs/HANDOVER.md`와 `DELIVERY_RULES.md`를 끝까지 읽는다.
2. `package.json` 버전과 패치 기준 버전을 비교하고 정확히 맞는 패치만 적용한다.
3. `.git`은 절대 삭제하거나 ZIP으로 덮어쓰지 않는다.
4. `docs/NEXT_UPDATE.md`, `docs/CHANGELOG.md`, 관련 설계 문서를 읽는다.
5. GitHub Actions 실패가 있으면 새 기능보다 안정화 패치를 먼저 만든다.
6. 실제 엔진이 없으면 성공·완료·AI 음질을 가장하지 않는다.
7. 완료 시 전체 ZIP, 덮어쓰기 패치 ZIP, SHA-256, HANDOVER, CHANGELOG,
   NEXT_UPDATE를 함께 갱신한다.
## 2. 프로젝트의 궁극적 목표

SoriON AI는 단순한 웹 음성 변환기가 아니라 **한국인을 위한 차세대 AI Voice Platform**이다.
모바일에서 약 10초 안에 자연스러운 한국어 TTS, 적법한 목소리 복제, 음성 변환,
STT 편집을 시작하고 더빙·성우 마켓·팟캐스트·실시간 변환으로 확장한다.

제품 방향:

- Voicebox보다 쉬운 사용성.
- ElevenLabs보다 한국어 발음·숫자·날짜·존댓말에 친화적.
- 초보자는 기본값으로 생성, 전문가는 Advanced에서 조절.
- 특정 모델·외부 API에 종속되지 않는 Engine Adapter.
- 모바일이 주 제품, PC는 편집·비교·운영 확장 화면.
- 핵심 작업은 3번 이내 터치.
- 슬로건: **목소리의 가능성을 켜다.**
## 3. 절대 제품 원칙

- 모바일 우선, 한국어 우선, PC 확장.
- 실제 기능을 3클릭 이내에 시작하고 Advanced는 기본 흐름을 방해하지 않음.
- Apple의 정돈된 밀도, Notion의 정보 구조, ChatGPT의 친근함을 결합.
- 실제 AI, System Voice, Mock, Browser Demo를 UI와 데이터에서 구분.
- 모델·Worker가 준비되지 않았으면 복제 성공으로 표시하지 않음.
- 음성 원본은 기본 로컬 보관이며 명시적 동의 없이 외부 업로드 금지.
- 타인 음성 무단 복제, 사칭, 사기, 금융·공공기관 악용 금지.
- 모델·라이선스·GPU 조건을 숨기지 않음.
- 엔진은 교체 가능한 Adapter 뒤에 둠.
- 테스트 없는 기능은 완료로 처리하지 않음.
## 4. 사용자가 확정한 UX·디자인

### 브랜드와 프레임

- 상단은 낮은 배너형. `곰같은여우 SoriON AI`는 항상 한 배너 안에 표시.
- 설명은 작게 약 10초 간격으로 전환.
- `SoriON AI` 마지막 `I`는 CSS 마이크.
- PC Voice Core는 CSS 마이크와 영역 안을 채우는 번개형 음파.
- 설정은 Dock이 아니라 `DESIGNED BY 곰같은여우` 옆 작은 톱니.
- 모바일 1프레임, PC는 메인 작업 + 상태·세션 보조 2프레임.
- 980px 미만에서는 1프레임.

### 생성 화면

- `문장 하나면,`: #111, 800.
- `목소리는 바로 시작됩니다.`: #7A7A7A, 600.
- 보라·파랑 radial glow 1개, 입력 카드는 헤더와 32px 겹침.
- 첫 화면에 500자 입력, 카운터, 발음 보정 토글을 즉시 표시.
- 예시: `2026년 8월 1일 → 이천이십육년 팔월 일일`.
- 목소리는 가로 스크롤 칩.
- 빈 입력 CTA: `변환할 문장을 입력하세요`.
- 입력 후 CTA: `WAV로 생성하기 (약 3초)`.
- 생성 후 메인 영역은 파형 대신 문장별 자동 분할 리스트.
- 전체 재생은 Linked Player Dock이 담당.

### Dock

- #1A1F2E 계열 반투명 배경과 blur 유지.
- 순서: `만들기 → 복제 → 품질 → 프로젝트`; 만들기는 항상 첫 번째.
- 터치 높이 최소 44px, 권장 52px; active는 pill + inner shadow.
- 어느 스크롤 위치에서 눌러도 해당 페이지 상단으로 이동.
- 음성이 없으면 메뉴만, 준비되면 플레이어가 메뉴 **위에** 표시.
- 큐, 이전·다음, 반복, 속도, 탐색, 다운로드 지원.
- 설정을 Dock에 다시 넣지 않음.
## 5. 현재 버전의 의미

`0.7.3`은 기능 추가가 아닌 **인수인계 메모리 기준점**이다.

- 기능 코드는 0.7.2와 동일.
- 현재 버전 표기와 문서·릴리스 자료를 0.7.3으로 정리.
- 다음 기능 버전은 `0.7.4 GPU Deployment & Progressive Playback`.
- 다음 세션은 0.7.3 전체본 또는 0.7.2→0.7.3 패치에서 시작.
## 6. 현재 아키텍처와 배포 현실

```text
GitHub Pages / Mobile PWA
React 19 + Vite 8 + TypeScript 5.9 + Tailwind 4 + Motion + Zustand
        │ HTTPS API
FastAPI Gateway · Python 3.10
CORS · rate limit · audit · TTS · Korean preprocessing · clone proxy
        │ private HMAC request
CosyVoice Worker · Python 3.10
health · readiness · GPU diagnostics · jobs · SSE · WAV
```

- GitHub Pages는 정적 웹만 실행하며 Python API·GPU Worker를 포함하지 않음.
- 공개 서비스는 별도 HTTPS FastAPI와 사설 GPU Worker가 필요.
- 모바일의 `localhost`는 PC가 아니라 휴대폰 자신.
- 공개 HTTPS에서 로컬 HTTP API 호출은 혼합 콘텐츠 정책으로 막힐 수 있음.
- Repository: `junl-im/AI-`
- Pages: `https://junl-im.github.io/AI-/`
## 7. 현재 구현 기능

### Web/PWA

- 모바일 1프레임·PC 2프레임, 500자 TTS, 한국어 발음 보정.
- capability 기반 목소리·감정·속도·피치 UI.
- 진행률·취소·오류·문장별 분할 결과.
- 적응형 Linked Player Dock과 최대 20개 큐.
- IndexedDB 프로젝트·품질 평가·음성 프로필.
- 품질 연구소 A/B 비교와 JSON·CSV 보고서.
- 모바일 녹음·업로드·품질 검사·동의 기반 목소리 복제.
- API 연결 진단 설정 화면.

### FastAPI Gateway

- Health, Setup, Connectivity, Engine Registry.
- 숫자·날짜·시각·금액·퍼센트·단위·약어 정규화.
- 기본 180자 분할, PCM WAV 병합, UUID 작업, timeout·cancel·동시 제한.
- UUID 음원, TTL 정리, 복제 동의·샘플 검증, Worker proxy.
- 공개 rate limit과 JSONL 감사 로그.

### CosyVoice Worker

- `/health`와 `/ready` 분리.
- 모델 경로·필수 파일·CUDA·GPU·VRAM·디스크 진단.
- 문장별 job, SSE revision, cancel, 실패·취소 구간 retry.
- segment WAV, merged WAV, 종료 job TTL.
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

- CosyVoice Worker 인터페이스와 공식 `AutoModel` adapter 경계는 구현됨.
- 릴리스 ZIP에는 모델 가중치·PyTorch·CUDA·CosyVoice 저장소가 없음.
- 모델 미설치 시 `/health`는 정상이어도 `/ready`는 not-ready.
- 실제 한국어 자연스러움·화자 유사도·지연·VRAM 벤치마크는 미완료.
- 상업 배포 전 선택한 모델 가중치의 모델 카드·사용 조건을 재검토.
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
POST /tts/jobs/{job_id}/cancel
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
## 10. 저장·개인정보·동의

IndexedDB `sorion-ai`, schema v3:

- `projects`: 프로젝트 메타데이터.
- `qualityReviews`: 품질 평가·메모.
- `voiceProfiles`: 샘플 Blob·분석·동의 기록.

정책:

- 샘플은 기본 브라우저 로컬 저장, Firebase 자동 업로드 금지.
- 서버 샘플 TTL 7일, 생성 음원 30분, Worker 종료 job 60분.
- 사용자 파일명을 서버 저장 경로로 사용하지 않음.
- 동의 철회 시 로컬 프로필·서버 샘플·향후 prompt cache를 함께 폐기.
- 원문·음성 본문은 감사 로그에 기록하지 않음.
## 11. 보안 경계

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

서명은 method + path + timestamp + body SHA-256의 HMAC-SHA256.

- `/health`만 무인증; `/ready`, `/v1/*`는 인증.
- Worker는 인터넷에 직접 공개하지 않고 사설 네트워크에 둠.
- Secret은 저장소·ZIP에 넣지 않고 배포 플랫폼 Secret으로 주입.
- production에서 Secret이 없으면 ready가 되지 않아야 함.
## 12. 환경 변수

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
SORION_GENERATION_TIMEOUT_SECONDS
SORION_MAX_CONCURRENT_GENERATIONS
SORION_AUDIO_TTL_MINUTES
SORION_AUDIO_DIRECTORY
SORION_MAX_SEGMENT_CHARS
SORION_VOICE_CLONE_DIRECTORY
SORION_VOICE_CLONE_TTL_DAYS
SORION_VOICE_CLONE_MAX_FILE_BYTES
SORION_COSYVOICE_WORKER_URL
SORION_COSYVOICE_WORKER_TIMEOUT_SECONDS
SORION_COSYVOICE_WORKER_JOB_TIMEOUT_SECONDS
SORION_WORKER_SERVICE_TOKEN
SORION_WORKER_SIGNATURE_SECRET
SORION_PUBLIC_RATE_LIMIT_PER_MINUTE
SORION_AUDIT_LOG_PATH
```

Worker:

```text
SORION_WORKER_ENVIRONMENT
SORION_WORKER_OUTPUT_PATH
SORION_WORKER_MODEL_PATH
SORION_WORKER_ADAPTER_MODULE
SORION_WORKER_DEVICE
SORION_WORKER_ALLOW_CPU
SORION_WORKER_MIN_VRAM_MB
SORION_WORKER_REQUIRED_MODEL_FILES
SORION_WORKER_MAX_CONCURRENT_JOBS
SORION_WORKER_MAX_SAMPLE_BYTES
SORION_WORKER_JOB_TTL_MINUTES
SORION_WORKER_CORS_ORIGINS
SORION_WORKER_AUTH_TTL_SECONDS
SORION_WORKER_RATE_LIMIT_PER_MINUTE
SORION_WORKER_AUDIT_PATH
```
## 13. 로컬 실행

요구 환경: Node 22+, npm 10+, Python 3.10 이상 3.13 미만, uv.
실제 CosyVoice에는 별도 PyTorch·CUDA·모델 설치가 필요.

```bash
cp .env.example .env
npm install
npm run dev:worker
npm run dev:api
npm run dev
```

기본 주소: Web 5173, API 8000, Worker 9000.
## 14. CI와 배포

활성 Workflow는 `.github/workflows/ci.yml` 하나.

```text
SoriON CI & Pages
├─ Web quality
├─ API quality · Python 3.10
├─ CosyVoice Worker quality · Python 3.10
└─ Deploy GitHub Pages
```

- push는 main, PR은 main·develop.
- Pages Source는 `GitHub Actions`; branch deployment와 병행 금지.
- Web·API·Worker 모두 성공해야 Pages 배포.
- uv action은 검증된 SHA, GitHub Actions는 Node 24 대응 버전.
- Vite·PWA base는 `/AI-/`.
## 15. 코딩 규칙

- 소스 파일 500줄 이하.
- Python Ruff 100칸, 한글·CJK 표시 폭 2칸.
- TypeScript strict, `any` 금지.
- 외부 입력 Pydantic 검증, 라우터에서 모델 라이브러리 직접 호출 금지.
- 비밀키·SVG·모델·음성 바이너리 Git 커밋 금지.
- Deprecated API 신규 사용 금지.
- 함수 한 책임; UI·저장·엔진 호출을 한 함수에 섞지 않음.
- 사용자 오류는 한국어.
- `main` 직접 커밋 금지; `develop`, `feature/*`, `fix/*`, `docs/*`.
- 실제 동작 없는 UI와 테스트 없는 기능 금지.
## 16. 반드시 기억할 CI 회귀

- Python 3.10: `datetime.UTC` 금지, `timezone.utc` 사용.
- Python 3.10: `asyncio.TimeoutError` 명시 처리.
- Ruff E501은 한글을 2칸으로 계산할 수 있음.
- UP035: `Mapping`, `Awaitable`, `Callable`은 `collections.abc`.
- B009: 상수 `getattr` 대신 직접 속성 접근.
- B008: FastAPI `File()`·`Form()`은 `Annotated`.
- F401 unused import 제거.
- React Testing Library는 `afterEach(cleanup)`.
- JSDOM Blob은 FileReader fallback.
- 테스트 조회는 가능하면 `within(renderResult.container)`.
- Hook effect는 전체 객체 대신 안정적인 ID·status 의존성.
- `setup-uv@v8` 같은 추측 태그 금지, 검증 SHA 사용.
- GitHub Pages branch deployment와 Actions deployment 중복 금지.
- 기능 추가 전 CI 초록색 확인.
## 17. 현재 검증 기준

0.7.2 기능 기준 마지막 확인:

- API pytest 56개.
- Worker pytest 9개.
- Python compileall, Python 3.10 AST, 프로젝트 규칙 통과.
- Web 테스트·Hook 오류는 0.7.2에서 수정.
- sandbox npm registry 제한으로 정식 Vitest·ESLint·Vite build는 GitHub Actions가 최종 판정.

0.7.3은 문서·버전 기준점이므로 기능 테스트 개수는 0.7.2와 동일.
## 18. 알려진 제한과 위험

- 실제 CosyVoice GPU 음질·성능 미검증.
- 모델 자동 다운로드·체크섬·로딩 진행 UI 미완성.
- 첫 문장 조기 재생·progressive playlist 미완성.
- Worker 재시작 작업 복구 미완성.
- speaker prompt cache·동의 철회 연계 미완성.
- MP3·M4A·WEBM·OGG 서버 디코딩·2차 품질 검사 미완성.
- 최종 사용자 인증 부족.
- Firebase는 선택적 동기화이며 원본 음성 Storage 미사용.
- 브라우저·OS별 MediaRecorder MIME 차이.
- 상업 배포 전 모델 가중치 라이선스 재검토 필요.
## 19. 절대 전달 규칙

최종 응답 순서:

1. 결과
2. 전체 통파일 ZIP, 덮어쓰기 사용 가능한 패치 ZIP
3. 다음 예상 업데이트 내역

매 릴리스 필수:

```text
SoriON-AI-{version}-full.zip
SoriON-AI-{from}-to-{version}-patch.zip
SoriON-AI-{version}-artifacts.sha256
docs/HANDOVER.md
docs/CHANGELOG.md
docs/NEXT_UPDATE.md
docs/patches/{version}/PATCH_README.md
docs/patches/{version}/PATCH_MANIFEST.txt
```

삭제가 있으면 `DELETE_LIST.txt`. ZIP에서 `.git`, node_modules, dist, venv, cache,
`.sorion`, Secret, 모델 가중치, 사용자 음성을 제외.
## 20. 현재 산출물과 패치 기준

- 전체본: `SoriON-AI-0.7.3-full.zip`
- 패치: `SoriON-AI-0.7.2-to-0.7.3-patch.zip`
- 체크섬: `SoriON-AI-0.7.3-artifacts.sha256`
- 패치 기준: 정확히 `0.7.2`
- 삭제 파일: 없음
- 이전 전체본: `SoriON-AI-0.7.2-full.zip`
## 21. 다음 목표 · 0.7.4

`0.7.4 GPU Deployment & Progressive Playback`

1. GPU 서버 템플릿과 사설 Worker 네트워크.
2. 모델 manifest·다운로드·체크섬·로딩 진행률.
3. CUDA·PyTorch·VRAM 호환 진단.
4. 첫 완성 문장을 Dock에 즉시 연결.
5. 뒤 문장을 생성하면서 순차 재생.
6. SSE 누락 revision·segment 복구.
7. Worker 상태 스냅샷과 재시작 복구.
8. speaker prompt cache와 동의 철회 즉시 폐기.
9. MP3·M4A·WEBM·OGG 서버 디코딩.
10. 실제 GPU 한국어 음질·유사도·지연·VRAM 벤치마크.
## 22. 다음 작업에서 하지 말 것

- CI 실패 상태에서 기능을 계속 쌓지 않음.
- 모델 미설치 상태를 복제 완료로 표현하지 않음.
- Pages에 Python이 실행된다고 가정하지 않음.
- Worker를 공개 인터넷에 직접 노출하지 않음.
- 음성을 동의 없이 업로드·보존하지 않음.
- 라이선스 검토 없이 새 엔진을 기본값으로 지정하지 않음.
- FoxBear 코드를 통째로 복사하지 않음.
- Dock에 설정을 다시 넣거나 빈 플레이어를 상시 표시하지 않음.
- SVG를 추가하지 않음.
- HANDOVER를 단순 변경 목록으로 축소하지 않음.
## 23. 핵심 문서 지도

- 전달 규칙: `DELIVERY_RULES.md`
- 비전: `docs/VISION.md`
- 영구 메모리: `docs/HANDOVER.md`
- 변경 이력: `docs/CHANGELOG.md`
- 다음 작업: `docs/NEXT_UPDATE.md`
- 아키텍처: `docs/ARCHITECTURE.md`
- 엔진: `docs/ENGINE_STRATEGY.md`
- 연결: `docs/API_CONNECTIVITY.md`
- Worker: `docs/COSYVOICE_WORKER.md`
- 보안: `docs/SECURITY.md`
- 복제: `docs/VOICE_CLONE.md`
- Dock: `docs/PLAYER_DOCK.md`
- 테스트: `docs/TEST.md`
- UI: `docs/UI_GUIDE.md`
- 과거 HANDOVER: `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`
- 과거 CHANGELOG: `docs/archive/CHANGELOG_0.2.0-0.5.8.md`
## 24. 릴리스 핵심 연혁

- 0.1.x 기반·Pages·전달 체계.
- 0.2.0 모바일 Voice Workspace.
- 0.3.0 한국어 TTS Pilot.
- 0.4.0 정규화·분할·WAV 병합·품질 연구소.
- 0.5.0 Setup·진행률·IndexedDB 평가.
- 0.5.1 Compact Brand Banner.
- 0.5.2–0.5.7 Workflow·Python 3.10·Ruff·테스트 안정화.
- 0.5.8 PC 2프레임·Linked Player Dock.
- 0.6.0 모바일 목소리 복제 기반.
- 0.6.1–0.6.3 Web·연결·Dock 안정화.
- 0.6.4 Premium Creation UX.
- 0.7.0 CosyVoice Worker 실행.
- 0.7.1 인증·제한·감사·SSE 복구.
- 0.7.2 CI zero-error 수정.
- 0.7.3 MASTER HANDOVER 기준점.
## 25. 2026-08-01 09:32 KST · v0.7.3 릴리스 기록

1. 작업 일시: 2026-08-01 09:32 KST.
2. 대상·기준: `0.7.2 → 0.7.3`.
3. 변경: HANDOVER를 목표·결정·아키텍처·기능·엔진·보안·환경·CI·제한·다음 작업을
   포함하는 영구 메모리로 재구성.
4. 이유: 임시채팅에서 대화 메모리가 저장되지 않아 다음 세션이 결정을 잃을 수 있음.
5. 영향: 버전 표기, HANDOVER, CHANGELOG, NEXT_UPDATE, START_HERE,
   DELIVERY_RULES, RELEASE, 문서 아카이브.
6. 주요 파일: `docs/HANDOVER.md`, `DELIVERY_RULES.md`, `START_HERE.md`,
   `docs/archive/HANDOVER_HISTORY_0.5.8-0.7.2.md`.
7. 검증: 프로젝트 규칙, API·Worker 테스트, compileall, 패치 동등성, ZIP 무결성.
8. 제한: 기능 코드는 0.7.2와 동일, 실제 GPU 검증은 다음 릴리스.
9. 산출물: `SoriON-AI-0.7.3-full.zip`,
   `SoriON-AI-0.7.2-to-0.7.3-patch.zip`.
10. 다음: `0.7.4 GPU Deployment & Progressive Playback`.
## 26. 이 파일 갱신 규칙

매 릴리스마다 현재 버전·시각, 기능·연결 상태, 새 사용자 결정, 환경 변수·API,
검증 개수·미실행 검사, 제한·위험, 산출물, 다음 목표, 릴리스 기록을 갱신한다.
폐기된 결정은 삭제하지 말고 `폐기됨`과 이유를 기록한다. 500줄에 가까워지면
오래된 상세 이력만 `docs/archive`로 옮기고 목표·규칙·아키텍처·제한은 제거하지 않는다.
