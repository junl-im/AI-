# SoriON AI Handover Historical Entries · 0.8.0 to 0.9.3 Heartbeat 6.8.0

이 파일은 `docs/HANDOVER.md`의 1,200줄 안전 상한 유지를 위해 이동한 상세 이력입니다. 현재 목표·규칙·아키텍처·제한의 원본은 계속 `docs/HANDOVER.md`입니다.

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
7. Rule Director는 외부 LLM 없이 내용 용도·발음·호흡·속도·감정과 엔진 요구를 계산한다.
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
## 39. 0.9.3-beta.3 Engine Heartbeat 2
- 녹색 CI 기준을 유지하며 카카오 WebView 로컬 엔진 제한, 재생 버튼 자동 적용·재생, Browser/System/Melo 프리셋 운율과 CosyVoice 프리셋 WAV 라우팅을 연결했다.

## 40. 0.9.3-beta.3 Engine Heartbeat 3
- 500줄 하드 제한을 폐기하고 800줄 분리 권고·1,200줄 안전 상한으로 완화했다.
- 설정에 Engine Doctor를 추가해 API·실제 TTS·Worker·GPU·설치 단계와 프리셋 3종 준비 상태를 진단한다.
- 음성 시스템 주소 저장, 즉시 재진단, 자동 연결 복구와 민감 정보 제외 진단 복사를 제공한다.
- `START_ENGINE.cmd`가 프로젝트 `voice-presets` 폴더를 API 환경변수에 자동 연결한다.
- Setup API는 프리셋 준비 개수와 누락 파일을 반환하며 실제 음원은 저장소에 포함하지 않는다.
- 검증: preflight 11개, API 123개, Worker 14개, 신규 Web strict semantic 검사, 800/1,200줄 정책 fixture를 통과했다.
- 제한: 전체 npm 설치는 샌드박스 registry 404·외부 registry timeout으로 실행하지 못해 GitHub Actions가 ESLint·Vitest·Vite 최종 판정이다.

## 41. 0.9.3-beta.3 Engine Heartbeat 4
- 첫 화면 4단계를 한 화면 안의 2×2 또는 1×4 그리드로 정리했다.
- PC 1024px 이상은 왼쪽 프로젝트 목록, 중앙 Chat Workspace, 오른쪽 Voice Drawer의 3단 편집 구조다.
- 중앙 하단 Timeline Editor는 시간 눈금·플레이헤드·가로 클립·가위·삭제 도구를 표시한다.
- 상단 엔진 상태는 API·Worker·GPU 3점으로 유지하고 실패 계층은 작업 메시지로 즉시 기록한다.
- 검증: preflight 11개, API 123개, Worker 14개, compileall, 변경 TS/TSX transpile 및 전체 parser 154개 통과.
- 제한: npm 의존성 부재로 ESLint·Vitest·Vite production build는 GitHub Actions에서 최종 확인한다.

## 42. 2026-08-02 19:51 KST · 0.9.3-beta.3 Engine Heartbeat 5
1. 작업 일시: 2026-08-02 19:51 KST.
2. 대상/기준: `0.9.3-beta.3 · Engine Heartbeat 5`, 기준은 `Engine Heartbeat 4` 전체본.
3. 변경 내용: 공개 HTTPS Bridge 진단, 프리셋 WAV 사전검증, 서버 첫 음성 파일 준비 지표,
   PC 좌우 패널 조절·접기·로컬 저장을 추가했다.
4. 변경 이유: 모바일 정적 Web과 실제 Voice API의 연결 현실을 준비됨/미준비로 구분하고,
   손상·무음·클리핑 기준 음성을 Worker에 보내기 전에 차단하며, 장문 첫 결과 대기 시간을
   전체 병합 시간과 분리하기 위해서다.
5. 영향 범위: Web Engine Doctor·결과 카드·타임라인·PC 스튜디오, FastAPI connectivity·setup·TTS
   pipeline, CosyVoice TTS readiness, API/Web 계약과 운영 문서.
6. 주요 파일: `services/api/app/services/voice_preset_validation.py`, connectivity/setup/TTS schema와
   pipeline, `src/hooks/useDesktopStudioLayout.ts`, Engine Doctor·타임라인·결과 카드,
   `docs/SECURE_MOBILE_BRIDGE.md`, `docs/FIRST_AUDIO_LATENCY.md`.
7. 검증 결과: Repository preflight 11/11, API pytest 127개, Worker pytest 14개, Python compileall,
   프로젝트 규칙, TypeScript·TSX 156개 transpile 구문 검사를 통과했다.
8. 제한/주의: 전달본에 npm lock과 설치 의존성이 없어 ESLint·Vitest·semantic typecheck·Vite build는
   실행하지 못했다. 테스트 Python 3.13.5는 지원 상한 3.12 밖이다. `first_audio_ms`는 서버 파일
   준비 시간이며 실제 재생 시작이 아니다. forwarded header는 진단 전용이고 partial-ready 재생은 미구현이다.
9. 산출물: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-5-full.zip`,
   `SoriON-AI-0.9.3-beta.3-engine-heartbeat-4-to-0.9.3-beta.3-engine-heartbeat-5-patch.zip`, SHA-256 목록.
10. 다음 예상 업데이트: Engine Heartbeat 6에서 segment-ready 실제 전달·재생, 브라우저 audible-start
    측정, 신뢰 프록시 allowlist와 실제 모델·모바일 증거를 완성한다.

## 43. 2026-08-02 20:23 KST · 0.9.3-beta.3 Engine Heartbeat 5.1 Web Quality Hotfix
1. GitHub Actions Web quality에서 `HomePage.test.tsx`의 세션 복원 테스트가 동일 이름의 `밝게` 버튼 두 개를 전역 조회해 실패했다.
2. 원인은 데스크톱 Voice Drawer와 모바일 Voice Settings Sheet가 반응형 CSS와 무관하게 JSDOM에 함께 존재하는 구조였다.
3. 실제 검증 대상인 `음성 설정` dialog를 먼저 찾고 `within(dialog)`으로 활성 말투 버튼을 조회하도록 수정했다.
4. `check-web-test-contracts.mjs`에 dialog 범위 조회 필수와 전역 중복 조회 금지 계약을 추가했다.
5. Repository preflight 11/11은 통과했다. 샌드박스 npm registry 404와 외부 DNS timeout으로 Vitest 전체 실행은 불가하며 GitHub Actions가 최종 판정한다.
6. 런타임 제품 코드는 변경하지 않았고, 영향 범위는 Web 테스트와 dependency-free 회귀 게이트뿐이다.

## 44. 2026-08-02 20:45 KST · 0.9.3-beta.3 Engine Heartbeat 5.2 UI/UX Polish
1. PC와 모바일의 음성 속도·높낮이·말투 옵션을 `src/voice/voiceControlOptions.ts` 단일 계약으로 통합했다.
2. 이전 PC 높낮이 0.5 단위가 FastAPI 정수 schema와 충돌해 422가 날 수 있어 정수 단위로 통일하고 복원·전송 전에 clamp·반올림한다.
3. `useModalDialog`를 추가해 Voice Sheet, 종료·초기화 확인창에 초기 초점, Tab trap, Escape, body scroll lock과 초점 복귀를 적용했다.
4. 미리듣기 준비 중 버튼 재실행을 막고, 가짜 필터 탭은 정보 태그로 바꾸며 목소리 radio의 방향키 이동을 추가했다.
5. 프로젝트 메뉴는 바깥 클릭·Escape로 닫고, 동작 없는 현재 프로젝트 버튼을 상태 요소로 바꾸며 접힌 패널 separator를 비활성화했다.
6. 데스크톱 보조 글자와 컨트롤 크기·대비를 높이고 reduced motion 환경에서 패널 전환을 제거했다.
7. Repository preflight 11/11, API pytest 127개, Worker pytest 14개, Python compileall, TS/TSX parser 160개와 transpile 159개 구문 검사를 통과했다.
8. npm 설치는 내부 registry의 패키지 404와 외부 registry timeout 때문에 완료하지 못했다. ESLint·Vitest·semantic typecheck·Vite build는 GitHub Actions에서 최종 판정한다.
9. 남은 수동 확인은 360/390/430px Sheet·가상 키보드, 1180/1280/1440px 3단 레이아웃, NVDA·VoiceOver, Safari range와 실제 TTS 연속 미리듣기다.

## 45. 2026-08-02 21:32 KST · 0.9.3-beta.3 Engine Heartbeat 5.2.1 Focus Return Hotfix
1. GitHub Actions Web quality에서 `DubbingStudioHeader`의 초기화 확인창을 Escape로 닫은 뒤 프로젝트 메뉴 버튼에 초점이 복귀하지 않는 테스트가 실패했다.
2. 메뉴 항목 unmount 뒤 `document.activeElement`가 연결된 `body`가 되어, 기존 훅이 명시적 `returnFocusRef`보다 `body`를 우선한 것이 원인이었다.
3. `useModalDialog`는 effect 시작 시 이전 활성 요소와 명시적 복귀 DOM 노드를 지역 변수로 캡처한다.
4. cleanup은 연결된 명시적 복귀 대상을 먼저 선택하고, 없을 때만 이전 활성 요소를 사용한다.
5. cleanup에서 mutable `returnFocusRef.current`를 직접 읽지 않아 React Hooks annotation 경고를 제거했다.
6. `check-web-test-contracts.mjs`가 캡처·우선순위 계약과 cleanup의 ref 직접 읽기 금지를 강제한다.
7. 샌드박스 npm registry의 `@eslint/js@9.22.0` 404로 전체 Web lint·Vitest·typecheck·build는 재실행하지 못했으며 GitHub Actions가 최종 판정한다.

## 46. 2026-08-03 02:20 KST · 0.9.3-beta.3 Engine Heartbeat 6 Partial Audio Delivery & Bridge Hardening
1. 장문 Pipeline은 각 구간 WAV가 준비될 때 `JobSegmentAudio`를 작업 저장소에 기록하고 SSE에서 `segment-ready`를 별도 발행한다.
2. 성공한 구간 파일은 일반 음원 TTL 동안 보존하고 실패·취소 시 생성된 부분 파일을 제거한다.
3. 구간 URL은 작업 ID·번호·파일명·만료 시각 HMAC을 검증하고 작업 스냅샷에 같은 파일이 등록됐을 때만 반환한다.
4. 운영은 `SORION_SEGMENT_URL_SIGNING_SECRET`을 모든 API 인스턴스에 동일하게 배포해야 하며 비어 있으면 재시작 때 URL이 무효가 되는 임시 Secret을 쓴다.
5. Web은 첫 구간만 조기 재생하고 최종 WAV를 같은 Player Queue 트랙 ID로 교체한다. 후속 구간 gapless queue와 재생 위치 승계는 미구현이다.
6. 지연 지표는 서버 `ready_after_ms`, 실제 첫 응답 chunk, `playing`, Browser Speech `onstart`로 분리한다.
7. 전달 헤더는 FastAPI가 직접 보는 peer가 `SORION_TRUSTED_PROXY_CIDRS` 안에 있을 때만 사용하고 proxy는 기존 외부 헤더를 반드시 덮어써야 한다.
8. 공개 rate-limit key는 회전 가능한 `X-SoriON-Client-ID`가 아니라 유효 client IP로 고정하며 client ID는 audit actor에만 보조 기록한다.
9. Repository preflight 12/12, API pytest 133개, Worker pytest 14개, Python compileall과 TS/TSX 159개 transpile 검사를 통과했다.
10. 내부 npm registry 404로 전체 Web lint·Vitest·semantic typecheck·Vite build는 실행하지 못했으므로 GitHub Actions가 최종 Web 판정이다.

## 47. 2026-08-03 08:47 KST · 0.9.3-beta.3 Engine Heartbeat 6.1 Progressive Playback Stability & Male Presets
1. 기존 도윤 남성 프리셋에 준호 저음·민준 활력을 추가해 전체 5종, 남성 3종으로 확장했다.
2. `src/tts/voicePresets.ts`는 성별 메타데이터와 필터 함수를 제공하고 모바일 Voice Picker는 전체·남성·여성·중성 실제 필터를 사용한다.
3. FastAPI `voice_presets.py`가 canonical ID 목록을 소유하고 Setup 진단과 CosyVoice preset 탐색이 같은 목록을 import한다.
4. 실제 음성 WAV는 저장소에 포함하지 않으며 `jun-deep.wav`, `min-energetic.wav`도 기존 검사·동의·권리 규칙을 따른다.
5. 첫 구간 URL이 403·410이면 작업 상태에서 새 서명을 받아 한 번 다시 fetch하고, 갱신 불가 시 만료 URL을 Player에 넣지 않는다.
6. Player는 같은 트랙의 partial URL이 final URL로 바뀌면 현재 시간과 재생 상태를 캡처해 metadata 준비 후 복원한다.
7. 검증: preflight 13/13, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 159개 transpile 구문 통과.
8. npm 의존성은 전달본에 없어 ESLint·Vitest·semantic typecheck·Vite build는 GitHub Actions가 최종 판정한다.
9. 다음 목표는 두 번째 이후 구간의 ordered queue, 실기기 decode gap 측정과 프리셋 5종 실제 모델 증거다.

## 48. 2026-08-03 10:47 KST · 0.9.3-beta.3 Engine Heartbeat 6.2 Ordered Segment Queue & Device Evidence
1. 장문 구간은 SSE·polling 도착 순서와 무관하게 `nextSegmentIndex` 기준으로 정렬하고 같은 Player Queue 트랙의 `progressive.segments`에 누적한다.
2. 앞 번호 구간이 빠지면 뒤 구간을 건너뛰지 않으며, 현재 구간 종료 뒤 다음 구간이 없으면 반복 대신 `다음 구간 대기` 상태로 멈춘다.
3. 대기 중 새 구간이 도착하면 사용자 선택·트랙 ID를 유지하고 자동 재생하며, 최종 WAV가 도착하면 누적 완료 시간과 현재 구간 위치를 합산해 handoff한다.
4. 부분 재생 중 전체 seek·다운로드는 차단하고, 중복·교체·삭제된 구간 Blob URL은 Player Store가 해제한다.
5. Quality Lab의 현재 기기 재생 점검은 Secure Context, online, EventSource, Service Worker, Media Session, PWA 표시 모드와 사용자 제스처 재생을 개인정보 최소 JSON으로 저장한다.
6. 자동 감지 결과는 gapless·백그라운드 복귀·장시간 SSE·네트워크 전환의 실기기 통과 증거가 아니며 해당 항목은 수동 측정으로 남긴다.
7. 검증: preflight 14/14, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 164개 transpile 구문 검사를 통과했다.
8. 전달본에 npm lock과 설치 의존성이 없어 ESLint·전체 Vitest·semantic typecheck·Vite build는 GitHub Actions가 최종 판정한다. `tsc -b`는 누락된 Vite·Vitest·Node 타입 패키지만 보고했다.
9. 다음 목표는 seam gap 실측, 새로고침 복구, Android Chrome·iOS Safari·PWA soak와 실제 CosyVoice 프리셋 5종 증거다.

## 49. 2026-08-03 12:17 KST · 0.9.3-beta.3 Engine Heartbeat 6.3 Seam Metrics & Device Soak
1. Player는 현재 구간 `ended` 시각과 다음 구간 `playing` 시각의 차이를 seam gap으로 기록하고 다음 구간 생성 대기 포함 여부를 별도 플래그로 남긴다.
2. seam은 트랙별 최근 20개만 보존하며 Quality Lab에서 평균·최대·최근 전환을 표시하고 사용자 문장 없이 JSON으로 내보낸다.
3. `playerSession`은 25분 이내의 원격 최종 API 음원과 Browser Speech만 localStorage에 저장한다. 부분 음원·progressive segment·Blob·revoke 대상은 제외한다.
4. 새로고침 뒤 대기열, 선택 트랙, 반복 모드, 재생 속도와 최종 음원 위치를 복원하지만 autoplay 정책과 사용자 의도를 위해 자동 재생하지 않는다.
5. Browser evidence v2는 online/offline, visibility, 숨김 누적·최장 시간, 백그라운드 복귀와 BFCache pageshow를 관찰 세션으로 누적한다.
6. 관찰 이벤트는 실제 음성 재생·SSE 유지 성공을 인증하지 않으며 Android Chrome·iOS Safari·PWA 수동 soak가 여전히 필요하다.
7. 검증: `Repository preflight 15/15, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 166개 transpile 구문 검사, 핵심 비-React 모듈 strict semantic 검사와 player session·browser evidence runtime smoke를 통과했습니다`.
8. 다음 목표는 만료된 최종 음원을 작업 ID로 재발급하고 실제 기기 10·30·60분 soak와 seam P95를 확보하는 Heartbeat 6.4다.

## 50. 2026-08-03 13:17 KST · 0.9.3-beta.3 Engine Heartbeat 6.4 Signed Audio Rehydration & Device Certification
1. 기준 버전은 Engine Heartbeat 6.3이며 목표는 만료 URL 재발급, seam P95·handoff 오차, 모바일 인증 시나리오 분리다.
2. 최종 TTS URL을 `job_id + final + filename + expires` HMAC으로 서명하고 segment 서명과 도메인을 분리했다.
3. Web API 음원은 `rehydration.kind=tts-final`과 작업 ID를 저장하며 새로고침 또는 audio error에서 완료 결과를 재조회한다.
4. 재발급은 작업 결과와 실제 음원 파일이 30분 TTL 안에 남아 있을 때만 성공하며 삭제된 파일을 복원하지 않는다.
5. Player는 부분→최종 교체 목표 위치와 실제 위치 차이를 기록하고 Quality Lab은 seam 평균·P95·최대와 handoff P95를 내보낸다.
6. 실기기 benchmark는 baseline, network-switch, background-resume, installed-pwa 시나리오와 재생 완료·SSE·fetch 복구 필드를 지원한다.
7. Quality summary는 기존 15개 장치 coverage와 Android/iOS 모바일 인증 24개 coverage를 분리한다.
8. 주요 변경 파일은 TTS signer/routes/tests, player session/persistence/dock, seam/device cards, verification schema/routes/tests와 운영 문서다.
9. 검증은 preflight 16/16, API 137개, Worker 14개, Python compileall, TS/TSX 166개 구문 검사를 통과했다. npm 설치 의존성 부재로 전체 ESLint·Vitest·semantic typecheck·Vite build는 CI 최종 판정이다.
10. 전체 ZIP은 `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.4-signed-audio-device-certification-full.zip`, 패치는 `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.3-to-0.9.3-beta.3-engine-heartbeat-6.4-signed-audio-device-certification-patch.zip`으로 전달한다.
11. Heartbeat 6.5 Device Soak Recorder & Audio Archive Policy 완료:
    - Quality Lab에서 Android/iOS 10·30·60분 측정 세션을 직접 시작·종료한다.
    - SSE reconnect, audio fetch recovery, playback interruption을 개별 밀리초로 기록한다.
    - 기기·엔진·프리셋별 first audio·복구·seam P95와 실패율을 서버가 집계한다.
    - Export 서버 파일은 30분 임시이며 사용자 다운로드만 보존으로 인정한다.
    - 로컬 보존 기록에는 파일명 메타데이터만 남고 음성 바이트·원문·전체 URL은 저장하지 않는다.
12. Heartbeat 6.6 Field Evidence & Reproducible Web Quality를 완료했으며 다음 목표는 Heartbeat 6.7 Field Evidence Intake & Local Export Bundle이다.

## 52. 2026-08-03 15:19 KST · 0.9.3-beta.3 Engine Heartbeat 6.5.2 Stream Handoff CI Hotfix
1. 기준 버전은 Heartbeat 6.5.1이며 제품 버전 `0.9.3-beta.3`은 변경하지 않았다.
2. CI의 부분 구간 3건 실패는 tee probe의 cancel promise를 playback branch 소비 전에 await한 교착 가능성이 원인이었다.
3. probe cancel은 비동기로 시작하고 playback stream을 Blob으로 소비한 뒤 완료를 기다리도록 수정했다.
4. 최종 WAV 승계 테스트는 외부 Store 갱신과 DOM source 반영을 동기화한 뒤 metadata·play를 검증한다.
5. 다음 기능 목표는 Heartbeat 6.7 Field Evidence Intake & Local Export Bundle이다.

## 53. 2026-08-03 18:27 KST · 0.9.3-beta.3 Engine Heartbeat 6.7 Field Evidence Intake & Local Export Bundle
1. 기준 버전은 Heartbeat 6.6이며 제품 버전은 변경하지 않았다.
2. evidence v2와 Web quality run report를 preview/import/list API로 가져온다.
3. SHA-256 재계산, 허용 schema·phase 계약, bundle·record 중복 차단을 등록 전에 수행한다.
4. 브라우저 로컬 ZIP은 최대 20개/250MiB, 파일별 SHA-256 manifest, 진행률과 취소를 제공한다.
5. npm lock 검사를 preflight에 포함하되 패치가 기존 검증 lock을 덮어쓰거나 임의 생성하지 않는다.
6. 다음 목표는 가져온 증거 보존·검토와 CosyVoice 5종 실제 benchmark schema다.

## 54. 2026-08-05 10:17 KST · 0.9.3-beta.3 Engine Heartbeat 6.7.1 Voice Preset Fidelity Hotfix
1. 작업 일시(KST): 2026-08-05 10:17 KST.
2. 대상/기준: `0.9.3-beta.3 · Engine Heartbeat 6.7.1`, 기준은 사용자가 전달한 `Engine Heartbeat 6.7` 전체본이다.
3. 변경 내용: 프리셋 ID·성별·후보 순번 계약을 Web과 API에 추가하고 Browser, Windows, macOS, eSpeak, MeloTTS, CosyVoice의 음성 선택과 오류 처리를 수정했다. 알려진 프리셋은 반대 성별, 알 수 없는 성별, 같은 후보 순환 또는 기본 WAV로 조용히 대체되지 않는다.
4. 변경 이유: 화면에는 남성·인물별 프리셋으로 표시되지만 실제로는 여성 음성 또는 하나의 공통 음성이 재생되던 정합성 문제를 막기 위해서다.
5. 영향 범위: Web Browser Speech 선택·재생 오류 UI, FastAPI 프리셋 계약, System/Melo/CosyVoice 어댑터, 엔진 오케스트레이터의 fallback·circuit breaker, 회귀 검사와 운영 문서다.
6. 주요 파일: `src/tts/voicePresets.ts`, `src/tts/browserSpeech.ts`, `src/components/navigation/LinkedPlayerDock.tsx`, `services/api/app/services/voice_presets.py`, `services/api/app/services/engine_orchestrator.py`, `services/api/app/engines/tts/{system_tts.py,melo_tts.py,cosyvoice_worker_tts.py}`, Windows PowerShell 스크립트, 테스트와 `docs/VOICE_PRESET_FIDELITY.md`다.
7. 검증 결과: Repository preflight 20개, API pytest 154개, Worker pytest 14개, 핵심 프리셋 회귀 29개, TS/TSX transpile 179개, Browser runtime smoke, Python compileall과 `check-voice-preset-contracts.mjs`를 통과했다. 전체 npm 의존성 설치는 내부 registry의 `zustand@5.0.8` 404로 실행하지 못했다.
8. 제한/주의: 실제 5개 화자 WAV와 CosyVoice 모델은 포함하지 않았다. Browser/System/eSpeak는 전용 인물이 아닌 기기·엔진 근사 음성이며 운영체제에 충분한 별도 후보가 없으면 일부 프리셋이 명시적으로 미지원될 수 있다. WAV만으로 성별·신원·동의를 자동 판정하지 않는다.
9. 산출물: `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.7.1-voice-preset-fidelity-full.zip`, `SoriON-AI-0.9.3-beta.3-engine-heartbeat-6.7-to-6.7.1-voice-preset-fidelity-patch.zip`, `SHA256SUMS.txt`.
10. 다음 예상 업데이트: Heartbeat 6.8에서 프리셋별 동의·출처·선언 성별·WAV SHA-256 manifest, Engine Doctor 검토 상태, 5종 A/B 청취 승인과 실제 CosyVoice benchmark를 추가한다.

## 55. 2026-08-05 15:50 KST · 0.9.3-beta.3 Engine Heartbeat 6.8.0 Preset Evidence Review
1. 기준 버전은 Heartbeat 6.7.1이며 제품 버전 `0.9.3-beta.3`은 변경하지 않았다.
2. 5개 프리셋마다 consent, rights, integrity, human review를 기록하는 동일 ID manifest schema와 pending 템플릿을 추가했다.
3. 전용 WAV 사용 조건을 오디오 품질뿐 아니라 동의 confirmed, `tts-inference` 권리, 사람 approved, 실제 SHA-256·파일 크기 일치까지 확대했다.
4. 동일한 WAV SHA-256을 둘 이상의 인물 프리셋에 등록하면 진단과 실제 CosyVoice 합성 양쪽에서 차단한다.
5. Engine Doctor는 WAV/manifest/최종 사용 가능 수, 프리셋별 checksum과 중복 ID, 현재 브라우저 음성 실제 배정 근거를 표시한다.
6. Quality Lab의 A/B 프리셋을 5종 선택 방식으로 바꾸고 IndexedDB 키와 CSV에 voice ID·이름·선언 성별을 추가했다.
7. 개인정보 제외 진단 복사본은 로컬 경로·WAV·원문을 제외하고 프리셋 인증·checksum·중복 상태만 포함한다.
8. 검증 결과: Repository preflight 21개, API pytest 158개, Worker pytest 14개, CosyVoice 전용 8개, TS/TSX transpile 177개와 Python compileall을 통과했다. 전체 npm quality는 내부 registry의 `zustand@5.0.8` 404로 GitHub Actions 최종 판정이다.
9. 제한: 실제 5개 화자 WAV·동의/권리 원본·CosyVoice 모델은 포함하지 않았다. manifest 템플릿은 pending이며 Browser/System 음성은 전용 인물이 아닌 기기 근사값이다.
10. 다음 예상 업데이트는 Heartbeat 6.8.1의 A/B 검수 내보내기·manifest 연계, System/Melo 실제 화자 telemetry, 프리셋별 CosyVoice benchmark다.
