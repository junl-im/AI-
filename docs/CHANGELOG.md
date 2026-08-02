# CHANGELOG

## 0.9.3-beta.3 Engine Heartbeat 2 · Kakao guard, auto apply/play and preset routing

- 카카오톡 인앱 브라우저를 감지해 PC localhost 엔진 제한, 브라우저 음성 대체와 외부 브라우저 전환을 즉시 안내합니다.
- 프리셋·설정·타임라인·대기열의 모든 재생 버튼이 선택값을 먼저 적용하고 생성 또는 선택된 음성을 즉시 재생합니다.
- Browser Speech, System Voice와 MeloTTS에 프리셋별 운율을 적용하고 가능한 경우 서로 다른 한국어 시스템 음성을 선택합니다.
- CosyVoice는 `voice-presets`의 프리셋별 WAV를 실제 Worker 기준 음성으로 전달하며 기본 기준 음성 폴백을 유지합니다.
- Player 자동 재생, 카카오 감지, 브라우저 음성 선택과 API 프리셋 라우팅 회귀 테스트를 추가했습니다.

## 0.9.3-beta.3 CI Hardening 6 · Firebase public config and PWA logo budget

- Firebase Web 공개 설정 6개를 development·production Vite 환경에 등록하고 `.firebaserc`를 실제 프로젝트에 연결했습니다.
- Firestore와 Storage 규칙을 deny-by-default로 추가해 현재 Authentication 전용 범위를 강제했습니다.
- `sorion-logo.png`를 1024px 약 1.01MB로 최적화하고 1.5MiB PWA asset budget 검사를 추가했습니다.
- Repository preflight와 Web build가 Firebase 설정·PWA asset 크기를 모두 검증합니다.

## 0.9.3-beta.3 CI Hardening 5 · Deterministic Ruff import and automatic npm bootstrap

- verification route가 STT 모듈을 한 번만 import하도록 바꿔 반복 Ruff I001 원인을 제거했습니다.
- package-lock 부재를 즉시 실패시키던 수동 전제 대신 검증된 CI 자동 bootstrap을 복구했습니다.
- npm Firebase SDK를 제거하고 고정 버전 browser ESM을 로그인 시점에만 로드해 lock 해석 그래프를 축소했습니다.
- registry 진단과 probe 대상을 실제 잔존 패키지인 React로 변경하고 기존 lock 복원·proof 검증을 유지했습니다.

## 0.9.3-beta.3 CI Hardening 4 · Committed npm lock gate and Ruff import fix

- API verification의 일반 import와 alias import를 Ruff I001 기준대로 분리했습니다.
- 일반 push·PR은 누락된 npm lock을 네트워크에서 자동 생성하지 않고 즉시 정확한 조치 방법을 안내합니다.
- `GENERATE_WEB_LOCK.cmd`·`.sh`로 로컬에서 package-lock 생성, npm ci, 도구체인·전체 트리 검증을 한 번에 수행합니다.
- workflow 중복 `env` 키를 제거하고 preflight가 canonical import와 local lock bootstrap 파일을 검사합니다.

## 0.9.3-beta.3 CI Hardening 3 · Overlay-safe preflight and registry probing

- 누적 덮어쓰기에서 남는 구형 lock selector를 최신 호환 shim으로 덮어써 삭제 커밋 없이도 preflight가 복구됩니다.
- API verification/router import를 Ruff 기준으로 정렬했습니다.
- npm bootstrap은 registry 후보를 병렬 probe하고 응답 가능한 endpoint부터 사용합니다.
- lock 파일은 registry별 resolved URL을 생략해 다음 설치가 단일 host에 고정되지 않게 했습니다.

## 0.9.3-beta.3 CI Hardening 2 · Lock Bootstrap Isolation

- Repository preflight의 모든 검사를 끝까지 실행하고 JSON·로그 artifact와 정확한 annotation을 남김
- preflight 실패가 Web·API·Worker 품질 결과를 가리지 않도록 job 조건을 분리
- npm cache-only 우선 후 npm 공식 registry `.org`·`.com` endpoint를 순차 사용
- npm lock 생성 실패 시 기존 lock을 원상 복구하고 불완전 lock 전달을 차단
- 성공한 API·Worker lock은 npm lock 실패와 무관하게 검증 후 main에 부분 커밋
- npm·API·Worker audit 디렉터리를 먼저 생성해 빈 artifact 경고 제거

## 0.9.3-beta.3 · Verified Evidence & Long-form Export Soak

- 장문 WAV 병합을 청크 스트리밍과 원자적 임시 파일 교체 방식으로 변경
- FFmpeg hard timeout, 부분 산출물 정리와 ffprobe 실제 MP3 길이 측정 추가
- 10·30·60분 WAV·MP3 soak 실행기와 자막 드리프트·RTF·메모리 기록 추가
- 두 번째 STT 검수에서 같은 문장 ID의 재생성 전후 CER·WER·핵심 토큰 개선 증거 자동 저장
- 장치 이름과 메모를 기본 제거하는 품질 증거 JSON 내보내기와 Quality Lab 진행률 카드 추가
- 장문 Export·STT 증거·개인정보 제거·누적 폐기 경로 계약을 CI preflight에서 검사

## 0.9.3-beta.2 - 2026-08-02

### CI Failure-Domain Hardening

- npm, API uv, Worker uv lock 생성을 독립 작업으로 분리해 npm 장애가 Python 품질 결과를 가리지 않게 했습니다.
- cache-only 우선, 제한된 online retry, 명령 hard timeout으로 중첩 재시도와 장시간 정지를 제거했습니다.
- lock과 manifest SHA-256 증명을 추가해 설치·트리 검증을 통과한 lock만 품질 작업과 main 자동 커밋에 사용합니다.
- 전역 권한은 contents read로 축소하고 main 전용 lock 커밋 작업과 Pages 배포 작업에만 필요한 쓰기 권한을 부여합니다.
- 재실행 artifact 이름 충돌과 run-attempt 다운로드 불일치를 고정 이름+overwrite 방식으로 방지합니다.

### Resilient Lock Bootstrap

- npm registry의 ETIMEDOUT, EAI_AGAIN, ECONNRESET, 429·502·503·504를 일시 장애로 분류해 lock 생성과 `npm ci`를 자동 재시도합니다.
- 실패 실행에서도 npm cache와 시도별 lock 감사 로그를 artifact로 보존해 재실행이 앞선 다운로드를 재사용합니다.
- Web quality의 locked install도 같은 cache와 재시도 정책을 사용합니다.

### Real Device Evidence & Selective STT Regeneration

- Windows CUDA, Apple Silicon, CPU, Android, iOS의 10·30·60분 측정 진행률 summary API와 Quality 화면을 추가했습니다.
- 서버 WAV를 Faster Whisper로 검수하고 CER·WER·핵심 토큰 기준에 실패한 문장 ID만 새 TTS job으로 재생성합니다.
- 문장별 재생성 횟수를 작업공간에 저장하며 기본 2회 이후 자동 재생성을 차단합니다.
- API 테스트 112개와 Worker 테스트 14개를 통과했습니다.

## 0.9.3-beta.1 CI Hotfix 2 - 2026-08-02

### CI Quality Findings Fix

- API `main.py`의 엔진 import 순서를 Ruff 규칙에 맞게 정렬했습니다.
- Vitest fetch mock의 호출 인자 타입을 함수 선언에서 보존해 TypeScript 오류를 제거했습니다.
- 장문 생성 callback이 안정적인 `generateAll` 함수에 의존하도록 바꿔 React Hook 경고를 제거했습니다.
- Artifact Action을 Node 24 네이티브 `upload-artifact@v6`, `download-artifact@v7`로 올리고 강제 런타임 환경 변수를 제거했습니다.
- 프로젝트 규칙이 구형 Artifact Action과 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` 재유입을 차단합니다.

## 0.9.3-beta.1 CI Hotfix 1 - 2026-08-02

### Lockfile Bootstrap Deadlock Fix

- 일반 push·PR에서 lock 파일이 없으면 `locks:check`로 먼저 실패하던 CI 모순을 제거했습니다.
- 세 lock 중 하나라도 누락되면 자동으로 생성·감사하고 같은 실행의 Web·API·Worker에 전달합니다.
- 세 lock이 모두 있으면 자동 갱신하지 않고 `locks:check`와 `uv lock --check`만 수행합니다.
- 의도적인 강제 갱신은 기존 `generate_lockfiles=true` 수동 입력으로 유지합니다.
- 생성된 lock과 감사 로그의 artifact 보존 기간을 7일로 늘리고 커밋 절차를 Job Summary에 표시합니다.

## 0.9.3-beta.1 - 2026-08-02

### Stale File Recurrence Prevention

- `public/sorion-icon.svg`를 `.gitignore`, Git 인덱스 정리, pre-push 훅과 CI 조기 검사로 영구 차단했습니다.
- 패치 적용 스크립트가 `DELETE_LIST.txt`를 실제 삭제한 뒤 변경 파일을 덮어쓰도록 전환했습니다.
- 누적 ZIP 덮어쓰기만으로 삭제가 적용된다고 가정하지 않습니다.

### Device Verification, STT Measurement & Final Export

- 실제 장치의 첫 음성 지연, RTF, 메모리·VRAM, 재시도·실패를 JSONL로 기록하는 API를 추가했습니다.
- Faster Whisper 선택 Adapter와 CER·WER·날짜·금액·퍼센트·단위·영문 오류 측정을 추가했습니다.
- 완료 WAV와 쉼 블록을 병합하고 실제 frame 시간으로 SRT·VTT를 생성합니다.
- FFmpeg가 있을 때 MP3를 만들며 미완료 구간은 기본적으로 Export를 차단합니다.
- Web 타임라인에 최종 WAV·MP3와 자막 다운로드 동선을 추가했습니다.

## 0.9.3-alpha.3 - 2026-08-02

### Reproducible CI Lock Evidence Gate

- Node 22.18.0과 npm 10.9.3을 nvm, node-version, packageManager와 Volta에 동일하게 고정했습니다.
- `vite-plugin-pwa 1.3.0`의 Vite 8 peer 선언과 전체 npm dependency tree를 설치 결과에서 검사합니다.
- GitHub Actions가 npm·API uv·Worker uv lock을 생성하고 경고 로그와 함께 artifact로 제공합니다.
- 검증된 lock을 Web·API·Worker가 같은 실행에서 내려받아 `npm ci`와 `uv sync --locked`로 재검증합니다.
- 다음 기능 범위를 실기기 검증, STT 실측, 전체 WAV·MP3·SRT·VTT Export로 제한했습니다.
- 생성된 lock 파일은 임의 작성하지 않으며 Actions artifact를 검토한 뒤 저장소에 커밋해야 합니다.

## 0.9.3-alpha.2 - 2026-08-02

### Web Quality Toolchain Stabilization

- Vite 8과 맞지 않던 Vitest 3을 4.1.10으로 교체했습니다.
- Vite 8 peer 지원이 없는 Tailwind 4.1.10을 4.3.3으로 교체했습니다.
- TypeScript 5.9 지원 범위 밖이던 typescript-eslint 8.26.0을 8.65.0으로 교체했습니다.
- `@eslint/js`, `@testing-library/dom`을 직접 선언하고 모든 직접 npm 버전을 정확히 고정했습니다.
- Node 22.18.0, strict peer dependency, Vite override, manifest·설치 그래프 CI 검사를 추가했습니다.
- 136개 TypeScript·TSX 파일의 구문·상대 import 검사와 기존 API 100개·Worker 14개 회귀 검사를 통과했습니다.

## 0.9.3-alpha.1 - 2026-08-02

### Verified Local Model Readiness Foundation

- Worker가 모델 로딩 전에 모델 경로, 매니페스트 schema, 라이선스 동의와 SHA-256을 검증합니다.
- 모델 루트 밖 경로, 중복 파일, 잘못된 digest, 크기·체크섬 불일치를 readiness 단계에서 차단합니다.
- 변경되지 않은 모델 파일의 digest를 재사용해 반복 상태 조회의 대형 파일 재해싱을 줄였습니다.
- CUDA, Apple Silicon MPS, 명시적 CPU 저속 모드와 최소 VRAM·디스크 여유를 진단합니다.
- 모델 매니페스트 생성·검증 CLI와 API 연결 상태의 무결성·하드웨어 검사를 추가했습니다.
- API 100개와 Worker 14개 테스트를 통과했습니다.

## 0.9.2 CI Hotfix 2 - 2026-08-02

### Stale Brand Asset Cleanup

- 누적 덮어쓰기 저장소에 남은 `public/sorion-icon.svg`를 삭제 대상으로 다시 고정했습니다.
- Windows용 `APPLY_HOTFIX.cmd`, macOS·Linux용 `APPLY_HOTFIX.sh`를 추가했습니다.
- `npm run cleanup:stale-brand`로 삭제와 잔존 SVG 검사를 재현할 수 있습니다.
- 프로젝트 규칙 오류에 정확한 복구 명령을 표시합니다.

## 0.9.2 - 2026-08-02

### Korean Voice Orchestrator Blueprint

- TTS·음성 복제·변환·STT·정렬·노이즈 제거·향상 엔진을 하나의 무료 카탈로그로 분류했습니다.
- CosyVoice 3, MeloTTS, Faster Whisper, DeepFilterNet3와 Rule Director를 코어 채택했습니다.
- F5-TTS 공식 pretrained checkpoint는 비상업 모델 조건 때문에 연구 전용으로, Kokoro는 한국어 자동 경로에서 제외했습니다.
- OpenVoice V2는 선택 Adapter, Seed-VC는 GPL 외부 프로세스 플러그인으로 분리했습니다.
- `/api/v1/engines/catalog`와 엔진 blueprint CI 검사를 추가했습니다.

### Rule-Based AI Director

- 외부 LLM 없이 제작 용도, 생성 구간, 영문 발음, 문장 호흡, 속도·피치·감정과 무료 엔진 순서를 계산합니다.
- 원문 보존을 기본으로 하며 문장 재작성은 수행하지 않습니다.
- 설정 화면에서 자동 파이프라인과 채택 엔진을 읽기 전용으로 확인할 수 있습니다.

## 0.9.0 - 2026-08-01

### Free-First Engine Policy

- 서버 기본 정책을 `free-only`로 설정해 유료 공급자 Adapter를 자동 등록·호출하지 않습니다.
- CosyVoice Worker, MeloTTS, System Voice를 무료 서버 후보로 우선하며 Browser Speech를 공개 Web 안전망으로 유지합니다.
- `balanced`를 서버 운영자가 명시한 경우에만 NAVER·Google·Azure·ElevenLabs가 후보가 됩니다.
- 엔진 정보에 `cost_tier`, `auto_eligible`을 추가하고 전략 API에 비용 정책과 자동 순서를 공개합니다.

### Progressive TTS Progress

- `GET /api/v1/tts/jobs/{job_id}/events` SSE 진행 스트림을 추가했습니다.
- Web은 SSE를 우선 사용하고 미지원·연결 실패 시 기존 polling으로 자동 대체합니다.
- 뒤 블록이 완료돼도 현재 플레이어 트랙이 임의로 바뀌지 않도록 Queue 선택을 안정화했습니다.
- 설정 화면에 `무료 우선 자동` 상태를 읽기 전용으로 표시합니다.

## 0.8.9 - 2026-08-01

### Unified Product Shell

- 프로젝트·품질·복제·설정 페이지를 공통 PageScaffold와 동일한 헤더·간격·상태 영역으로 통합했습니다.
- 첫 화면과 더빙 작업공간의 고유 목적은 유지하면서 내부 페이지의 IA와 카드 리듬을 일관되게 맞췄습니다.

### Korean Neural Engine Mesh

- CosyVoice Worker 일반 TTS, NAVER CLOVA Voice, Google Chirp 3 HD, Azure Neural Voice, ElevenLabs v3 Adapter를 등록했습니다.
- 자격 증명·Worker·동의된 기준 음성이 실제 준비된 엔진만 자동 후보로 사용합니다.
- 한국어 특화도·품질 등급·요청 기능 적합성 기반 자동 순위와 장문·스트리밍 진단 메타데이터를 추가했습니다.
- 연속 실패 circuit breaker와 로컬·브라우저 안전망을 유지합니다.

### Automatic API Failover

- 런타임 JSON과 `SORION_PUBLIC_API_BASE_URLS`로 여러 HTTPS API 후보를 자동 탐색합니다.
- 현재 연결 주소가 실패하면 그 주소를 제외하고 다음 정상 API를 자동 승계합니다.
- 사용자는 API 주소나 엔진을 직접 선택하지 않습니다.

## 0.8.8 - 2026-08-01

### Header Restore & Official Brand Asset

- 만들기 화면에도 0.8.6 공통 상단 배너를 복원했습니다.
- 모든 작업 페이지에서 작은 SoriON 프로그램명·공식 로고·페이지명을 유지합니다.
- 사용자 제공 PNG를 원본 그대로 사용하고 근사 SVG 로고를 삭제했습니다.
- favicon과 PWA 아이콘을 같은 원본에서 다시 생성했습니다.

### Browser Voice Fallback

- 공개 Voice API가 없거나 네트워크 연결에 실패하면 Web Speech API 한국어 음성을 자동 사용합니다.
- 장문 문장 블록·플레이어 Queue·프로젝트 저장 흐름에서 브라우저 음성을 실제 재생합니다.
- 실제 API 엔진이 준비되면 서버 엔진을 우선하며 브라우저 엔진은 추천 엔진을 가로채지 않습니다.
- 브라우저 음성은 AI·WAV로 표시하지 않고 다운로드와 위치 탐색을 비활성화합니다.
- API 백그라운드 자동 재연결은 계속 유지합니다.

### Reliability

- Browser Speech 단위 테스트와 Player Dock 재생 회귀를 추가했습니다.
- 중복된 타임라인 polling 정리와 프로젝트 옵션 복원 호출을 정리했습니다.

## 0.8.7 CI Hotfix 4 - 2026-08-01

- 종료 확인 훅 테스트의 popstate 상태 갱신을 `act()` 안에서 실행해 확인창 조회 타이밍을 안정화했습니다.
- HomePage 테스트가 변경 가능한 placeholder 문구가 아니라 최대 20,000자 장문 입력 계약을 검증하도록 수정했습니다.
- 두 회귀 조건을 별도 Web 테스트 계약 검사로 고정해 Vitest 실행 전에 재발을 차단합니다.

## 0.8.7 CI Hotfix 3 - 2026-08-01

- 네이티브 `details/summary` 프로젝트 메뉴가 JSDOM에서 열림 상태를 안정적으로 반영하지 못해 Vitest가 메뉴 항목을 찾지 못하던 문제를 수정했습니다.
- 프로젝트 메뉴와 대사 블록 메뉴를 명시적 React 상태·button·`aria-expanded` 구조로 교체했습니다.
- 메뉴 선택 뒤 자동으로 닫히고, 각 대사 메뉴는 대사 번호를 포함한 고유 접근성 이름을 사용합니다.
- 프로젝트 규칙에 제작 화면의 `details/summary` 재도입 방지 검사를 추가했습니다.

## 0.8.7 CI Hotfix 2 - 2026-08-01

- 현재 화자 선택 버튼과 같은 화자의 미리듣기 버튼이 부분 이름 검색에서 충돌하던 문제를 수정했습니다.
- 선택 버튼은 `현재 목소리 {이름} 선택`, 미리듣기는 `{이름} 목소리 미리듣기`로 명확히 구분합니다.
- 화자·설정 버튼에 dialog popup과 펼침 상태를 추가했습니다.
- DubbingVoiceControls와 HomePage 테스트를 정확한 접근성 이름 기준으로 강화했습니다.

## 0.8.7 CI Hotfix - 2026-08-01

- TimelineEditor의 여러 음성 생성 버튼이 동일한 접근성 이름을 사용하던 문제를 수정했습니다.
- 버튼 이름에 대사 번호와 생성 상태를 포함해 테스트와 스크린리더가 대상을 구분할 수 있습니다.
- 실패 대사 재시도 테스트가 2번 대사 버튼을 정확히 선택하도록 회귀 기대값을 강화했습니다.
- 기능·데이터·API 계약은 변경하지 않으며 다음 목표는 0.8.8로 유지합니다.

## 0.8.7 - 2026-08-01

### Dubbing Studio Workspace

- 프로젝트 제목·자동 저장 상태·음성 시스템 상태를 상단 제작 바에 통합
- 화자 선택과 속도·피치·감정·숫자 발음 설정을 전용 Bottom Sheet로 분리
- 문장별 직접 편집·생성·재생·분할·이동·삭제가 가능한 세로형 대사 블록
- 새 대사·쉼 추가와 현재 음원 다운로드 동선 연결
- 하단 전체 폭 플레이어에서 현재 트랙·진행률·이전·재생·다음을 항상 제공
- 작업 비우기를 공통 workspace reset과 커스텀 확인창으로 보호

### Compatibility

- 0.8.6 장문 자동 분할, IndexedDB 복원, block revision과 recover-first 유지
- 자동 API bootstrap과 EngineOrchestrator 계약 유지
- 기존 프로젝트의 pitch 누락은 기본값 0으로 안전하게 복원

### Verification

- 프로젝트 규칙과 독립 TypeScript semantic 검사 통과
- API 90개·Worker 9개 및 패치 적용 동등성 검사 대상

## 0.8.6 - 2026-08-01

### Longform Voice Studio

- ChatGPT형 composer를 최대 20,000자 장문 내용 편집기로 교체
- 문자·문단·블록 수와 예상 음성 길이 표시
- 일반 Enter 줄바꿈, Ctrl/⌘+Enter 제작, 생성 후 내용 유지
- 서버 연결 대기 중 누른 제작 요청을 연결 복구 뒤 자동 재개

### Brand and Navigation

- 공식 SoriON 아이콘을 favicon, PWA, 랜딩과 작업공간 상단에 통일
- 모든 상단 브랜드 클릭을 첫 페이지 이동으로 연결
- 첫 뒤로가기 커스텀 종료 확인, 두 번째 뒤로가기 즉시 이탈
- 첫 페이지 Dock 비노출 유지

### Automatic Voice API

- `*.github.io` same-origin과 `:8443` Voice API 오탐 제거
- Actions 변수 `SORION_PUBLIC_API_BASE_URL`을 build 환경에 자동 주입
- `/connectivity`와 `/engines`가 같은 추천·health 정보를 사용
- API 연결 모듈을 요청 모듈과 분리해 500줄 제한과 회귀 경계를 유지

### Mobile Session

- IndexedDB 작업공간 저장, localStorage·memory fallback
- 세션·블록 revision, pagehide 체크포인트와 recover-first 결과 복구

### Verification

- API 90 passed, Worker 9 passed
- 프로젝트 규칙, TypeScript 구문·상대 import, Python 회귀 검사

## 0.8.5 CI Hotfix - 2026-08-01

- Ruff UP035에 맞춰 `Awaitable`, `Callable`을 `collections.abc`에서 가져옵니다.
- HomePage의 프로젝트 복원 Effect가 안정적인 함수 참조를 의존하도록 수정했습니다.
- 누적 덮어쓰기 저장소에 남은 수동 연결 UI 파일을 삭제 대상으로 명시했습니다.
- 삭제 전에도 CI가 깨지지 않도록 패치 ZIP에는 무해한 전환용 stub을 포함합니다.
- API 89개와 Worker 9개 회귀 테스트를 다시 통과했습니다.

## 0.8.5 - 2026-08-01

### Unified Workspace UX & IA

- 만들기 화면을 메뉴 이동 중에도 유지해 초안·채팅·타임라인 손실을 막았습니다.
- 품질·프로젝트·설정에 공통 작업공간 헤더와 일관된 다크 정보 계층을 적용했습니다.
- 설정 직접 진입, 프로젝트 loading/error/empty/retry와 공통 내비게이션 원본을 추가했습니다.

### Automatic Engine Orchestration

- 준비 상태와 운영 우선순위에 따라 실행 엔진을 자동 정렬합니다.
- 주 엔진 실패 시 같은 요청 안에서 다음 준비 엔진으로 자동 전환합니다.
- 반복 실패 엔진을 cooldown 동안 자동 제외하는 circuit breaker를 추가했습니다.
- 실행 시도 순서, fallback 여부, 엔진 성공·실패와 cooldown을 API·품질 연구소에 연결했습니다.

### Verification

- FastAPI 테스트 89개 통과
- CosyVoice Worker 테스트 9개 통과
- 프로젝트 규칙, Python compileall, Python 3.10 AST 검사 통과
- TypeScript·TSX 110개 구문, 상대 import 82개와 shim 기반 의미·참조 검사 통과
- 공식 Web 품질과 Ruff는 의존성·DNS 제한으로 GitHub Actions 최종 확인 필요

## 0.8.4 - 2026-08-01

### Automatic Engine Bootstrap & Project Restore

- 사용자가 API 주소를 입력하거나 엔진을 수동 선택하는 연결 Bottom Sheet를 제거했습니다.
- 앱 시작 시 같은 Origin, 배포 환경 변수, 마지막 성공 주소와 안전한 로컬 후보를 자동 탐색합니다.
- 자동 탐색에 성공하면 API·TTS·Worker·GPU 상태를 확인하고 준비된 실제 엔진을 자동 선택합니다.
- 연결 실패 시 설정 화면을 띄우지 않고 네트워크 복귀·앱 포그라운드·단계적 재시도로 다시 탐색합니다.
- 초기 랜딩에서는 메뉴와 Player Dock을 렌더링하지 않고 작업공간 진입 뒤에만 표시합니다.
- 최근 프로젝트 항목을 실제 불러오기 버튼으로 바꾸고 채팅·보이스·타임라인을 복원합니다.
- 저장된 job ID가 남아 있으면 새 합성을 보내지 않고 SQLite 결과를 먼저 복구합니다.
- 여러 문장 중 일부 생성이 실패해도 job ID 위치가 뒤섞이지 않도록 null 자리까지 보존합니다.
- 만료된 음원은 자동 재생성하지 않고 해당 블록에서 다시 생성할 수 있도록 안내합니다.

### Verification

- FastAPI 테스트 77개 통과
- CosyVoice Worker 테스트 9개 통과
- 프로젝트 규칙, 108개 TypeScript·TSX 구문 검사, 대체 strict 타입 검사와 diff whitespace 검사 통과
- npm 패키지 저장소 404·외부 registry timeout으로 정식 ESLint, TypeScript, Vitest, Vite build는 실행하지 못함

## 0.8.3 - 2026-08-01

### Persistent Job Store/Atomic Claim

- 메모리 기반 TTS job 상태를 교체 가능한 JobStore 계층으로 분리했습니다.
- 기본 저장소를 SQLite WAL 모드로 구성하고 job ID, 요청 fingerprint, 진행 상태와 완료 결과를 저장합니다.
- API 재시작 뒤에도 완료 job 상태와 `/result` 응답을 복구합니다.
- 여러 API 프로세스가 같은 DB를 사용할 때 `BEGIN IMMEDIATE` 원자적 claim으로 동일 job을 한 번만 실행합니다.
- owner 프로세스가 사라진 작업은 claim TTL 뒤 다른 프로세스가 재획득합니다.
- 결과 TTL과 이력 TTL을 분리하고 완료 결과 만료 뒤 HTTP 410 tombstone을 유지합니다.
- 장기 실행 서버에서도 조회·재요청 시 만료 결과와 이력을 즉시 정리합니다.
- 다른 API 프로세스에서 요청한 취소를 SQLite 신호와 owner watcher로 실제 Task에 전달합니다.
- job 충돌과 결과 만료를 감사 로그 이벤트로 기록합니다.
- CI Web 테스트는 파일 직렬 실행을 사용하고 PNA middleware import 정렬 오류를 수정했습니다.

### Verification

- FastAPI 테스트 77개 통과
- CosyVoice Worker 테스트 9개 통과
- 프로젝트 규칙, Python compileall, Python 3.10 AST, git diff whitespace 검사 통과
- 현재 실행 환경의 패키지 저장소에 Ruff 0.15.22와 npm 의존성이 없어 정식 Ruff와 Web 품질 검사는 실행하지 못함

## 0.8.2 - 2026-08-01

### API PNA CI Hotfix

- Starlette 버전에 따라 `Access-Control-Request-Private-Network` preflight가 400이 되던 문제를 수정했습니다.
- 표준 Origin·Method·요청 헤더 검증은 그대로 유지하면서 PNA 확장 헤더만 호환 처리하는 `PrivateNetworkCORSMiddleware`를 추가했습니다.
- 허용된 GitHub Pages Origin은 200과 `Access-Control-Allow-Private-Network: true`를 반환합니다.
- 잘못된 Origin 또는 `SORION_ALLOW_PRIVATE_NETWORK=false`에서는 계속 400으로 차단합니다.
- 프로젝트 규칙에 PNA 전용 미들웨어 계약을 추가했습니다.

### CI Hotfix

- VoicePresetSelector 테스트를 현재 접근성 이름인 `혜린 추천`·`도윤 또렷함`에 맞췄습니다.
- 모바일 연결 취소 회귀 테스트를 polling 횟수 대신 동일 job join으로 동기화했습니다.
- API·Worker Ruff를 `0.15.22`로 고정해 CI 린트 결과의 재현성을 높였습니다.

### Mobile Job Recovery/API Idempotency

- HTTP 요청이 취소되어도 TTS 생성 Task가 계속 실행되도록 `asyncio.shield`를 적용했습니다.
- 동일 job ID·동일 요청은 실행 중 Task를 공유하고 완료 결과를 재사용합니다.
- 동일 job ID를 다른 payload에 재사용하면 `SOA-4009`와 HTTP 409로 차단합니다.
- 요청 fingerprint와 완료 결과를 JobManager history 수명 동안 함께 보존합니다.
- 타임라인 음성 블록에 job ID를 저장하고 재시도 시 기존 작업을 먼저 복구합니다.
- 연결 오류에서는 job ID를 유지하고 404·410 또는 terminal 상태에서만 새 job을 만듭니다.
- 블록별 single-flight와 편집·분할 시 Abort/polling 정리를 추가했습니다.
- iOS private mode·quota 오류를 위한 localStorage 메모리 fallback을 추가했습니다.
- `crypto.randomUUID()` 미지원 모바일 브라우저용 호환 ID 생성기를 추가했습니다.

### Verification

- FastAPI 테스트 65개 통과
- CosyVoice Worker 테스트 9개 통과
- Python compileall, 프로젝트 규칙, 108개 TypeScript·TSX 구문 검사 통과
- npm 내부 저장소 404로 Web 의존성 설치·정식 test/lint/build는 실행하지 못함
- Ruff 미설치로 공식 Ruff 명령은 실행하지 못함

## 0.8.1 - 2026-08-01

### Mobile Engine/API Reliability

- 모바일 API 주소 정규화, 최근 성공 주소, 안전 자동 탐색을 강화했습니다.
- API·TTS·Worker·GPU 상태를 별도 계층으로 표시합니다.
- 네트워크 전환·앱 복귀 시 자동 재검사와 단계적 재연결을 추가했습니다.
- GET 요청 재시도, 요청 ID, 모바일 timeout, 오류 분류를 추가했습니다.
- TTS POST 응답이 끊겨도 job ID로 완료 결과를 복구할 수 있습니다.
- 재시도 대기 중 AbortSignal listener를 완료·취소 시 정리합니다.
- Private Network preflight와 모바일 CORS 응답을 강화했습니다.
- 입력·타임라인·Dock·바텀시트의 모바일 터치 영역과 safe-area를 보강했습니다.

## 0.8.0 - 2026-08-01

### Chat-to-Timeline 전체 UX 개편

- 초기 브랜드 랜딩을 유지하고 Dock 진입 후 편집 작업공간으로 전환
- 대형 브랜드 헤더를 편집 모드에서 58px compact header로 축소
- 500자 대형 입력 폼을 ChatGPT형 메시지 composer로 교체
- 광고톤, 느린 속도, 숫자 읽기, 밝은 톤 추천 프롬프트 추가
- 브라우저 지원 시 한국어 Web Speech 입력 추가
- 혜린·도윤·소리 세로 보이스 라이브러리와 선택 프리뷰 추가
- 문장을 음성·쉼 블록으로 쌓는 CapCut형 타임라인 추가
- 블록 드래그·좌우 이동·자르기·길게 눌러 수정·실패 구간 재시도 추가
- 첫 블록 완성 즉시 Linked Player Dock에 추가하는 Progressive Playback 적용
- API 미설정 오류를 채팅 시스템 메시지와 연결 바텀시트에서 즉시 해결
- API·Worker·GPU 상태 점과 안전한 API 후보 탐색·붙여넣기 추가
- 불필요한 중간 프레임과 이중 카드 테두리 제거
- 모바일 보이스 라이브러리를 선택 요약 + 펼침형 세로 목록으로 변경
- API 연결, 실제 TTS 준비, Demo 전용 상태를 분리해 엔진 상태 오판 방지
- 타임라인 블록에 생성 옵션을 저장해 이전 문장 재시도 시 목소리가 바뀌지 않도록 수정

### 연결 안정성

- API URL 정규화와 저장 주소·localhost·현재 호스트 자동 탐색 강화
- Connectivity 응답에 API, TTS, clone readiness와 Worker 설정 여부 추가
- API 실패를 브라우저 데모 성공으로 조용히 숨기지 않는 새 작업 흐름 적용

### 검증

- FastAPI 테스트 56개 통과
- CosyVoice Worker 테스트 9개 통과
- Python compileall 및 Python 3.10 AST 검사
- TypeScript·TSX 구문 검사와 대체 정적 타입 검사
- CSS 10개 파싱, 프로젝트 규칙, 실제 API·Worker·System TTS HTTP 통합 검사, 패치 동등성 검사

## 0.7.3 - 2026-08-01

### Added

- `docs/HANDOVER.md`를 임시채팅용 영구 프로젝트 메모리로 재구성
- 제품 목표, 사용자 확정 UX, 현재 아키텍처, 엔진 상태, 보안, 환경 변수,
  CI 회귀, 제한, 다음 작업을 한 파일에 보존
- 다음 세션 시작 절차와 HANDOVER 갱신 규칙
- 이전 상세 HANDOVER와 오래된 CHANGELOG 보존 아카이브
- 프로젝트 규칙 검사에 MASTER HANDOVER 필수 구역과 500줄 제한 추가

### Changed

- Web·API·Worker 표시 버전을 `0.7.3`으로 통일
- `START_HERE.md`의 첫 절차를 HANDOVER 필독으로 변경
- 다음 기능 목표를 `0.7.4 GPU Deployment & Progressive Playback`으로 이동
- `DELIVERY_RULES.md`에 임시채팅 인수인계 메모리 절대 규칙 추가

### Notes

- 기능 코드는 `0.7.2`와 동일하다.
- 이 릴리스의 목적은 다음 AI·개발자가 대화 메모리 없이도 정확히 이어서 개발하도록
  기준 상태를 고정하는 것이다.

### Verification

- 프로젝트 절대 규칙 검사 통과
- FastAPI 테스트 56개 통과
- CosyVoice Worker 테스트 9개 통과
- Python compileall·Python 3.10 AST 검사 통과
- HANDOVER 500줄 제한 통과

## 0.7.2 - 2026-08-01

### Fixed

- Worker의 `Mapping`, `Awaitable`, `Callable` import를 `collections.abc`로 이동해 Ruff `UP035`를 해결했다.
- 상수 이름을 사용하는 `getattr`를 직접 속성 접근으로 바꿔 Ruff `B009`를 해결했다.
- FastAPI `File`·`Form` 기본값을 `Annotated` 메타데이터로 이동해 Ruff `B008`을 해결했다.
- API Worker 테스트의 사용하지 않는 `json` import를 제거해 Ruff `F401`을 해결했다.
- 짧은 여러 문장이 기본 180자 한도 안에서 하나의 UI 구간으로 합쳐지던 문제를 수정했다.
- 복제 작업 polling effect가 전체 `job` 객체를 참조하면서 부분 의존성만 선언하던 Hook 경고를 수정했다.

### Added

- Ruff 회귀 패턴과 React Hook polling 계약을 검사하는 프로젝트 규칙을 추가했다.
- 기본 길이에서도 문장 경계를 유지하는 `splitTextForUi` 회귀 테스트를 추가했다.

### Verification

- FastAPI 테스트 56개 통과
- CosyVoice Worker 테스트 9개 통과
- Python compileall 및 Python 3.10 AST 문법 검사 통과
- 프로젝트 절대 규칙 검사 통과

## 0.7.1 - 2026-07-31

- API와 CosyVoice Worker 사이 서비스 토큰·HMAC-SHA256 요청 서명을 추가했다.
- 만료 요청, 변조 body, 잘못된 토큰을 Worker에서 차단한다.
- API와 Worker에 사용자/IP·서비스 토큰 기준 요청 제한을 추가했다.
- 음성 데이터 없이 운영 메타데이터만 남기는 JSONL 감사 로그를 추가했다.
- production Worker에서 보안 Secret이 없으면 readiness를 차단한다.
- 모델 필수 파일, CUDA, VRAM, 디스크 여유 공간, CPU 실행 정책 진단을 추가했다.
- SSE event id와 Last-Event-ID 복구 계약을 추가했다.
- 종료된 Worker 작업·입력 샘플 TTL 정리를 추가했다.
- 버전을 0.7.1로 통일하고 보안·인수인계 문서를 갱신했다.

## 0.7.0 - 2026-07-31

### Added

- 별도 `services/worker` CosyVoice 실행 서비스
- Worker `/health`, `/ready`, `/v1/diagnostics` 상태 계약
- GPU·CUDA·VRAM·모델 경로·adapter 로딩 진단
- 공식 `AutoModel`과 `inference_cross_lingual(stream=True)` 기반 선택 설치 adapter
- 문장별 작업 생성, SSE 이벤트, 취소, 실패·취소 구간 재시도
- 문장별 WAV와 최종 병합 WAV 제공
- FastAPI 복제 작업 프록시 API와 음원 프록시
- 실제 복제 문장 입력, 진행률, 취소·재시도 UI
- 완료 음원의 Linked Player Dock 자동 연결
- Worker 전용 Python 3.10 CI job

### Changed

- Worker 프로세스 health와 모델 readiness를 별도로 표시
- Worker가 준비되지 않으면 복제 작업 생성 API를 503으로 차단
- 복제 프로필 생성 시 Worker readiness를 다시 확인
- CI 배포 조건에 Worker quality를 추가

### Verification

- API pytest 53개 통과
- Worker pytest 5개 통과
- Python compileall, 프로젝트 규칙, YAML·TS/TSX·CSS 정적 검사 통과
- 기본 Worker Uvicorn 시작과 health·not-ready 응답 확인
- FastAPI↔Worker HTTP 연결과 capability 상태 전달 확인
- 전체본 290개, 변경·추가 66개, 삭제 0개
- 패치 적용본과 전체본 파일 해시 일치
- 전체·패치 ZIP 무결성 통과

## 0.6.4 - 2026-07-31

### Changed

- 생성 훅과 보조 문장의 색상·굵기 계층 분리
- 보라·파랑 radial glow와 32px 오버랩 입력 카드 적용
- 첫 화면 입력 제한을 500자로 조정하고 실시간 카운터 노출
- 목소리 선택을 모바일 가로 스크롤 칩으로 변경
- 입력 상태에 따라 WAV 생성 CTA 문구와 활성 상태 변경
- Dock 터치 영역 확대와 active pill inner shadow 적용

### Added

- 숫자·날짜 자동 변환 토글과 실제 API `normalize_text` 계약
- 생성 후 문장별 완료 구간 리스트
- Dock 메뉴 클릭 시 페이지 상단 이동
- 텍스트 분할 UI 유틸리티와 Web·API 회귀 테스트

### Verification

- 프로젝트 규칙, FastAPI 50 tests, compileall 통과
- TypeScript·TSX 87개 파일 구문 검사와 CSS 파싱 통과
- npm registry 제한으로 정식 Web quality와 Ruff는 GitHub Actions에서 최종 확인
- 전체본과 패치 적용본 해시 일치 및 ZIP 무결성 통과

## 0.6.3 - 2026-07-31

### Changed

- Dock 플레이어를 주요 메뉴보다 위에 배치
- 기존 앱 배경과 이어지는 어두운 반투명 Dock 색상 톤 유지
- 음성이 준비된 경우에만 연계형 플레이어 렌더링
- 음원 유무에 따라 작업 화면의 하단 안전 여백을 자동 조절
- 모바일과 PC 모두 `플레이어 → 메뉴` 순서로 통일

### Added

- 메뉴 전용 Dock과 플레이어 포함 Dock 상태 클래스
- 플레이어 조건부 표시와 DOM 순서를 검증하는 Web 회귀 테스트
- 프로젝트 규칙에 조건부 플레이어·상단 배치·적응형 여백 계약 추가

### Verification

- 프로젝트 절대 규칙 검사 통과
- FastAPI 테스트 49개 통과
- Python compileall 통과
- 변경 TypeScript·TSX 정적 검사와 CSS 파싱 통과
- 패치 적용본과 전체본 260개 파일 완전 일치
- npm registry에 `@tailwindcss/vite`가 없어 정식 Web quality는 GitHub Actions에서 최종 확인

## 0.6.2 - 2026-07-31

### Fixed

- GitHub Pages에서 존재하지 않는 같은 Origin `/api/v1`을 기본 API로 호출하던 문제
- API 장애가 Demo WAV 전환에 가려져 엔진 연결 상태를 알기 어렵던 문제
- `.env` 없이 FastAPI를 실행할 때 GitHub Pages Origin이 CORS 기본값에서 빠지던 문제
- Python 3.10 지원 프로젝트가 Setup에서 Python 3.11 이상을 요구하던 문제
- CosyVoice Worker URL만 설정하고 실제 health를 확인하지 못하던 문제
- API health의 snake_case 응답과 상대 음원 URL을 웹에서 정확히 변환하지 않던 문제

### Added

- `/api/v1/connectivity` 통합 연결 진단 API
- Health·Setup·TTS·복제·통합 진단 5경로 검사와 응답 시간 표시
- 실제 TTS, CORS, 임시 음원 저장소, CosyVoice Worker 상태 보고
- 정적 배포, PC localhost, 모바일 LAN, 공개 HTTPS API 경고
- `npm run dev:api` FastAPI 실행 명령
- Worker `/health` 실제 probe와 상태 스냅샷
- CORS·연결 진단·Worker probe 회귀 테스트

### Verification

- FastAPI 테스트 49개 통과
- 실제 Uvicorn health·connectivity·CORS preflight 통과
- Linux 시스템 TTS WAV 생성·다운로드·RIFF 검사 통과
- Python compileall 통과
- TypeScript·TSX 구문 검사 통과
- npm registry 제한으로 정식 Web quality는 GitHub Actions에서 최종 확인

## 0.6.1 - 2026-07-31

### Fixed

- Compact 배너로 변경된 뒤에도 과거 짧은 문구를 찾던 `BrandMasthead` 테스트 수정
- 제목 마이크와 Voice Core 마이크의 안정적인 회귀 검사용 test id 복원
- JSDOM에서 `Blob.arrayBuffer()`가 없거나 덮어쓰기 어려운 환경의 WAV 테스트 수정
- 테스트 폴리필을 단순 prototype 대입 대신 `Object.defineProperty` 방식으로 강화

### Added

- 배너의 현재 한국어 설명 3종과 마이크 표식이 구현·테스트에 함께 존재하는지 규칙 검사
- Mock WAV 테스트가 FileReader fallback을 직접 보유하는지 규칙 검사

### Changed

- 웹·API·품질 보고서 버전을 `0.6.1`로 통일

### Verification

- FastAPI 테스트 44개 통과
- 프로젝트 절대 규칙 검사 통과
- Python compileall 통과
- npm registry 제한으로 로컬 Vitest 전체 실행은 불가하며 GitHub Actions가 최종 판정

## 0.6.0 - 2026-07-31

### Added

- 모바일 마이크 녹음과 WAV·MP3·M4A·WEBM·OGG 음성 파일 선택
- 길이, 무음 비율, 클리핑, RMS 음량의 브라우저 1차 품질 검사
- `녹음 → 확인·동의 → 목소리 만들기` 3단계 복제 준비 화면
- 권리 확인, AI 합성 고지, 사칭·사기 금지의 명시적 동의 게이트
- IndexedDB v3 `voiceProfiles` 로컬 우선 저장소
- FastAPI `/voice-clones/capabilities`, `/profiles`, 삭제 API
- UUID 샘플 저장, 25MB 제한, 7일 TTL, WAV 컨테이너·최소 길이 검사
- 별도 `CosyVoiceCloneEngine` Worker 연결 경계
- Dock 재생 대기열, 이전·다음, 전체·한 곡 반복, 재생 속도, 다운로드
- TTS 결과와 복제 원본 샘플의 단일 플레이어 orchestration
- Object URL 트랙 소유권과 제거 시 메모리 해제

### Changed

- 하단 Dock 메뉴를 만들기, 복제, 품질, 프로젝트 네 항목으로 변경
- 브라우저 FormData 요청은 `Content-Type`을 강제하지 않도록 HTTP 클라이언트 수정
- API와 웹 표시 버전을 `0.6.0`으로 통일
- 릴리스 산출물에서 `.sorion`, Python 캐시, 테스트 캐시를 제거

### Security

- 동의가 하나라도 빠진 복제 프로필 요청 차단
- 실제 Worker가 없을 때 복제 성공으로 표시하지 않음
- 원본 음성의 공개 조회 라우트 미제공
- 동의 철회 시 로컬과 API 임시 샘플 삭제 요청

### Verification

- FastAPI 테스트 44개 통과
- Python compileall 통과
- 외부 모듈 선언 기반 TypeScript strict 소스·테스트 검사 통과

## Archived releases

- 0.2.0–0.5.8: `docs/archive/CHANGELOG_0.2.0-0.5.8.md`
- 0.1.x: `docs/archive/CHANGELOG_0.1.x.md`

## 0.9.1

- 결제 계정이 필요한 음성 Adapter와 Secret 설정을 현재 제품 소스에서 제거했습니다.
- CosyVoice·MeloTTS·System Voice·Browser Speech 무료 실행 경계를 고정했습니다.
- Firebase Hosting Spark와 GitHub Pages를 정적 Web 전용으로 명시했습니다.
- 데스크톱 정적 Web의 localhost 무료 런타임 자동 탐색을 추가했습니다.
- CI에 허용 목록 밖 엔진과 서버형 Firebase 설정을 차단하는 검사를 추가했습니다.
