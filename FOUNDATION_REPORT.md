# SoriON AI 0.9.3-beta.3 Verification Report

결과 버전: **0.9.3-beta.3 · Engine Heartbeat 6.5 · Device Soak Recorder & Audio Archive Policy**

## Engine Heartbeat 6.5 Device Soak Recorder & Audio Archive Policy

- Quality Lab에 Android Chrome·iOS Safari 10·30·60분 wall-clock recorder를 추가했습니다.
- SSE 재연결, 음원 fetch 복구, 실제 재생 중단 시간을 별도 필드로 저장합니다.
- seam P95를 생성 대기 포함과 순수 decode 전환으로 분리하고 기기·엔진·프리셋별 P95·평균 RTF·실패율을 집계합니다.
- 목표 시간 98% 미만 또는 복구 시간 미입력은 warning, 명시 복구 실패는 failed로 처리합니다.
- 최종 Export 응답에 서버 임시 만료 시각·보관 분·download-only 정책을 추가했습니다.
- 보존 버튼은 음원·SRT·VTT를 사용자 기기로 다운로드하고 파일명 메타데이터만 로컬에 남깁니다. 서버 장기 archive는 만들지 않습니다.
- 검증: `Repository preflight 17/17, API pytest 139개, Worker pytest 14개, Python compileall, TS/TSX 171개 transpile 구문 검사`를 통과했습니다.
- 제한: 실제 10·30·60분 모바일 측정과 CosyVoice 모델 수치는 운영 기기에서 입력해야 하며 전체 ESLint·Vitest·semantic typecheck·Vite build는 검증된 npm lock 환경이 필요합니다.

## Engine Heartbeat 6.4 Signed Audio Rehydration & Device Certification

- TTS 최종 음원을 작업 ID·파일명·만료 시각에 바인딩한 HMAC-SHA256 URL로 제공하고 구간 URL과 서명 도메인을 분리했습니다.
- 새로고침 복원과 media element 오류에서 저장된 작업 ID로 `GET /tts/jobs/{job_id}/result`를 다시 조회해 새 최종 음원 URL을 발급합니다.
- 재발급은 작업 결과와 실제 파일이 서버 TTL 안에 모두 남아 있을 때만 성공하며 만료된 파일을 복구한 것처럼 표시하지 않습니다.
- seam 증거에 평균·P95·최대와 최종 WAV 교체 위치 오차를 추가했습니다.
- Android/iOS 실기기 기록은 기본 재생·네트워크 전환·백그라운드 복귀·설치형 PWA 시나리오와 10·30·60분 조합을 별도 인증 행으로 계산합니다.
- 복구 시나리오는 재생 완료와 SSE 재연결·음원 fetch 복구가 확인돼야 READY이며, 누락은 warning, 명시 실패는 failed입니다.
- 검증: `Repository preflight 16/16, API pytest 137개, Worker pytest 14개, Python compileall, TS/TSX 166개 transpile 구문 검사`를 통과했습니다.
- 제한: 실제 Android Chrome·iOS Safari·설치형 PWA 장시간 측정값은 저장소에서 생성하지 않으며, npm 설치 의존성 부재로 전체 ESLint·Vitest·semantic typecheck·Vite build는 GitHub Actions가 최종 판정합니다.

## Engine Heartbeat 6.3 Seam Metrics & Device Soak

- 이전 WAV의 `ended`부터 다음 WAV의 실제 `playing`까지 구간 seam을 밀리초로 측정하고 생성 대기 포함 여부를 분리합니다.
- 트랙별 최근 20개 전환을 보존하고 Quality Lab에서 평균·최대·최근 전환과 개인정보 최소 JSON을 제공합니다.
- 25분 이내의 안전한 최종 원격 음원과 Browser Speech 대기열·재생 위치를 새로고침 뒤 복원하며 자동 재생은 하지 않습니다.
- 부분 음원, Blob URL, 소유권 해제가 필요한 미리듣기와 만료 서명 URL은 복원 대상에서 제외합니다.
- 브라우저 기기 증거는 online/offline, visibility, 백그라운드 복귀 시간과 BFCache 복원을 관찰 세션으로 누적합니다.
- 자동 이벤트 관찰은 실제 장시간 재생·SSE 성공 또는 gapless 인증으로 해석하지 않습니다.
- 검증: `Repository preflight 15/15, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 166개 transpile 구문 검사, 핵심 비-React 모듈 strict semantic 검사와 player session·browser evidence runtime smoke를 통과했습니다`
- 제한: 실제 Android Chrome·iOS Safari·PWA와 CosyVoice 프리셋 5종 soak는 별도 실기기·모델 환경이 필요합니다.

## Engine Heartbeat 6.2 Ordered Segment Queue & Device Evidence

- SSE·polling에서 뒤섞여 도착한 준비 구간을 작업별 coordinator가 번호순으로 정렬해 같은 Player Queue 트랙에 누적합니다.
- 현재 구간이 끝났는데 다음 구간이 늦으면 이전 구간을 반복하지 않고 `다음 구간 대기` 상태로 멈춘 뒤, 새 구간 도착 즉시 자동 재생합니다.
- 최종 WAV가 준비되면 완료한 구간 누적 시간과 현재 구간 재생 위치를 합산해 같은 트랙의 최종 파일 위치로 승계합니다.
- 부분 구간 재생 중 전체 파일 seek와 다운로드를 차단하고, 트랙 교체·삭제 시 모든 구간 Blob URL을 해제합니다.
- Quality Lab에 HTTPS·EventSource·Service Worker·PWA 표시 모드·사용자 제스처 재생을 분리 기록하는 현재 기기 재생 점검 카드를 추가했습니다.
- 자동 기능 감지는 실기기 인증이나 gapless 증거가 아니며, 백그라운드 복귀·장시간 SSE·네트워크 전환은 수동 증거로 남깁니다.
- 검증: Repository preflight 14/14, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 164개 transpile 구문 검사를 통과했습니다.
- 제한: 전달본에 npm lock과 설치 의존성이 없어 ESLint·Vitest·semantic typecheck·Vite production build는 GitHub Actions에서 최종 확인해야 합니다. 실제 Android Chrome·iOS Safari·PWA 장시간 측정은 아직 수행하지 않았습니다.

## Engine Heartbeat 6.1 Progressive Playback Stability & Male Presets

- 기존 도윤에 준호 저음·민준 활력 프리셋을 추가해 전체 5종, 남성 3종으로 확장했습니다.
- Web·FastAPI·CosyVoice setup 진단이 공통 프리셋 ID 목록을 사용해 화면과 Worker WAV 파일명이 어긋나지 않습니다.
- 모바일 목소리 선택 Sheet에 실제 동작하는 전체·남성·여성·중성 필터와 방향키 이동을 제공합니다.
- 첫 구간 서명 URL이 403·410으로 만료되면 작업 상태를 다시 조회해 새 서명 URL로 한 번 재시도합니다.
- 첫 구간을 재생하던 같은 트랙이 최종 WAV로 교체될 때 현재 위치와 재생 상태를 승계합니다.
- 프리셋 계약 preflight를 추가해 5개 ID, 남성 3종, UI 필터, API·Worker 공통 목록과 문서를 정적으로 검사합니다.
- 검증: Repository preflight 13/13, API pytest 135개, Worker pytest 14개, Python compileall, TS/TSX 159개 transpile 구문 검사를 통과했습니다.
- 제한: npm 의존성이 없어 ESLint·Vitest·semantic typecheck·Vite production build는 GitHub Actions에서 최종 확인해야 합니다. 실제 프리셋 WAV와 모델은 릴리스에 포함하지 않습니다.

## Engine Heartbeat 6 Partial Audio Delivery & Bridge Hardening

- 장문 TTS가 각 WAV 구간을 완성할 때 작업 스냅샷의 `ready_segments`에 기록하고 SSE `segment-ready` 이벤트로 즉시 알립니다.
- 작업 ID·구간 번호·파일명·만료 시각을 HMAC-SHA256으로 묶은 단기 URL만 구간 음원에 접근할 수 있으며 응답은 private no-store입니다.
- Web은 첫 구간을 기존 Player Queue에 넣고 최종 병합 WAV가 도착하면 같은 트랙 ID를 유지한 채 교체합니다.
- 서버 첫 구간 준비, 브라우저 첫 바이트, `HTMLAudioElement.playing`, Browser Speech `onstart` 지연을 별도 기록합니다.
- FastAPI가 직접 보는 peer가 신뢰 CIDR 안에 있을 때만 `X-Forwarded-*`를 사용하며 공개 rate-limit bucket은 사용자 제공 client ID가 아닌 실제 client IP로 고정합니다.
- 공개 HTTPS Origin은 신뢰된 proxy 헤더에서만 만들고 내부 host가 최종 음원 URL에 노출되지 않도록 했습니다.
- 파일 단위 첫 구간 전달이며 후속 구간 gapless 재생과 PCM/WebSocket 스트리밍은 아직 제공하지 않습니다. 최종 WAV 위치 승계와 만료 URL 1회 재발급은 Heartbeat 6.1에서 보강했습니다.


## Engine Heartbeat 5.2.1 Focus Return Hotfix

- 프로젝트 메뉴의 `현재 작업 비우기` 항목이 사라진 뒤 브라우저 초점이 `body`로 이동해, 확인창을 Escape로 닫아도 메뉴 실행 버튼으로 돌아오지 않던 문제를 수정했습니다.
- modal 훅은 명시된 `returnFocusRef` DOM 노드를 effect 시작 시 캡처하고, cleanup에서 이전 활성 요소보다 우선해 복귀합니다.
- cleanup에서 `returnFocusRef.current`를 다시 읽지 않아 React Hooks의 mutable-ref 경고를 제거했습니다.
- 기존 `DubbingStudioHeader` 회귀 테스트가 이 동작을 직접 검증하며, preflight가 캡처·우선순위 계약을 정적으로 강제합니다.

## Engine Heartbeat 5.2 UI/UX Polish

- PC와 모바일 음성 설정의 속도·높낮이 범위와 말투 6종을 하나의 설정 모듈로 통합했습니다.
- 높낮이 0.5 단위가 FastAPI 정수 계약과 충돌해 422를 만들 수 있던 경로를 1단위와 안전 보정으로 수정했습니다.
- Bottom Sheet·확인창에 초기 초점, Tab 순환, Escape 닫기, 초점 복귀와 배경 스크롤 잠금을 공통 적용했습니다.
- 미리듣기 준비 중 중복 요청을 차단하고, 동작하지 않는 필터 탭을 비조작형 정보 태그로 변경했습니다.
- 프로젝트 메뉴의 바깥 클릭·Escape 닫기, 현재 프로젝트의 비조작형 의미, 접힌 패널 리사이저 상태를 보강했습니다.
- 7~9px 데스크톱 보조 글자를 10~12px 중심으로 높이고 터치·클릭 영역과 모션 감소 동작을 다듬었습니다.
- 세부 발견 사항과 남은 실브라우저 확인 범위는 `docs/UI_UX_AUDIT_HEARTBEAT_5_2.md`에 기록했습니다.

## Engine Heartbeat 5.1 Web Quality Hotfix

- `HomePage` 세션 복원 테스트가 데스크톱 Voice Drawer와 모바일 Voice Settings Sheet의 동일한 `밝게` 버튼을 전역 조회하던 문제를 수정했습니다.
- 복원 검증 대상을 `음성 설정` dialog 내부로 제한해 반응형 UI가 동시에 DOM에 존재해도 단일 요소를 안정적으로 선택합니다.
- 의존성 설치 전 preflight에서도 전역 중복 조회가 다시 들어오지 않도록 Web 테스트 계약 검사를 추가했습니다.


## Engine Heartbeat 5

- 공개 HTTPS Voice API 요청을 로컬·사설 주소와 분리해 `/connectivity`와 Engine Doctor에서 진단합니다.
- 프리셋 WAV 3종을 실제 PCM 구조, 1~30초 길이, 16~48kHz, 채널 수, 무음·클리핑 비율로 검사하고 차단 사유를 표시합니다.
- 장문 합성에서 첫 구간 파일 준비 시간과 최종 병합 완료 시간을 분리해 결과 카드와 타임라인에 표시합니다.
- PC 3단 편집 패널을 포인터·키보드로 조절하고 접기와 너비를 `localStorage`에 저장합니다.
- 서버 지연은 실제 스피커 재생 시작 시간이 아니며 Browser Speech의 실제 시작 값은 아직 수집하지 않습니다.


## Engine Heartbeat 4

- 첫 화면의 1·2·3·4 작업 흐름을 모바일 2×2, 넓은 PC 1×4로 재배치해 마지막 단계가 잘리지 않게 했습니다.
- PC 1180px 이상에서 왼쪽 프로젝트 히스토리, 가운데 Chat Workspace, 오른쪽 Voice Drawer의 3단 편집 화면을 제공합니다.
- 타임라인을 가로 트랙·시간 눈금·플레이헤드·가위·삭제 도구가 보이는 CapCut형 편집 영역으로 변경했습니다.
- 우측 상단 엔진 표시는 API·Worker·GPU 3점으로 단순화하고 계층 실패를 작업 메시지에 자동 기록합니다.

## Engine Heartbeat 3

- 설정에 Engine Doctor를 추가해 API·실제 TTS·CosyVoice Worker·GPU와 설치 단계를 한 번에 진단합니다.
- 음성 시스템 주소 저장·즉시 재진단·자동 연결 복구와 개인 음원·로컬 경로를 제외한 상태 복사를 제공합니다.
- `START_ENGINE.cmd` 실행 시 프로젝트의 `voice-presets` 폴더를 API에 자동 연결합니다.
- Setup API가 프리셋 WAV 3종의 준비 개수와 누락 파일을 명시적으로 반환합니다.
- 500줄 하드 제한을 폐기하고 800줄 분리 권고, 1,200줄 안전 상한으로 완화했습니다.

## Engine Heartbeat 2

- 카카오톡 인앱 브라우저를 User-Agent로 감지해 PC localhost 엔진 연결 불가를 즉시 안내하고 외부 브라우저 전환 버튼을 제공합니다.
- 프리셋·설정·타임라인·대기열의 재생 버튼은 선택값을 자동 적용한 뒤 생성 또는 선택된 트랙을 즉시 재생합니다.
- Browser Speech는 프리셋별 한국어 음성 후보, 속도와 높낮이를 적용하고 System·Melo도 같은 프리셋 운율을 사용합니다.
- CosyVoice는 `sori-warm.wav`, `on-clear.wav`, `dam-calm.wav`를 실제 Worker 기준 음성으로 라우팅하며 없는 경우 기본 기준 음성으로 폴백합니다.
- 기기에 한국어 음성이 하나뿐이면 Browser/System 프리셋 차이는 음색이 아니라 속도·높낮이 중심으로 제한됩니다.

## CI Hardening 6

- `sorion-logo.png`를 1254px RGBA 2.46MB에서 1024px RGB 약 1.01MB로 최적화해 Workbox 2MiB 제한 아래로 낮췄습니다.
- `.env.development`와 `.env.production`에 공개 Firebase Web 설정을 등록해 로컬 개발과 GitHub Pages production build에서 자동 로드합니다.
- `.firebaserc`를 `device-streaming-96b2272c`에 연결하고 Firestore·Storage는 deny-by-default 규칙으로 잠갔습니다.
- preflight와 Web build가 PWA asset budget 및 Firebase 설정 일관성을 검사합니다.

## CI Hardening 5

- Ruff 0.15.22 기준으로 verification route가 `app.services.stt_evaluation` 모듈을 한 번만 import하도록 정리했습니다.
- 누락되거나 manifest와 불일치한 package-lock은 CI가 cache 우선·제한 registry fallback으로 자동 bootstrap하고, 정상 lock은 verify-only로 처리합니다.
- npm Firebase SDK 의존성을 제거하고 고정 버전 공식 browser ESM을 로그인 시점에만 동적으로 로드합니다.
- lock 생성 실패 로그와 기존 lock 복원, 설치·전체 트리·SHA-256 proof 계약을 유지합니다.
- local `GENERATE_WEB_LOCK`은 필수 단계가 아니라 registry 장애 시 사용할 수 있는 복구 수단입니다.

## 완료

- 장문 WAV 병합을 청크 스트리밍으로 바꿔 구간 전체와 긴 쉼을 한 번에 메모리에 올리지 않습니다.
- WAV·SRT·VTT·MP3를 임시 파일로 완성한 뒤 최종 이름으로 교체하며 오류 시 부분 산출물을 삭제합니다.
- FFmpeg에 hard timeout을 추가하고 ffprobe로 실제 MP3 컨테이너 길이를 측정합니다.
- 10·30·60분 WAV·MP3 soak 6개 시나리오의 RTF, 메모리, 길이, 자막 드리프트를 JSONL로 기록합니다.
- 선택 재생성 후 두 번째 STT 검수에서 같은 문장 ID의 전후 CER·WER와 핵심 토큰 개선량을 자동 저장합니다.
- Quality Lab에서 STT 개선 기록과 Export soak 진행률을 표시하고, 장치 이름과 메모가 제거된 증거 JSON을 내려받습니다.
- 기존 CI failure-domain 분리, lock SHA-256 proof, 최소 권한과 누적 삭제 차단을 유지합니다.

## 검증

- API pytest 135개 통과
- Worker pytest 14개 통과
- Python compileall 통과
- Repository preflight 14개 통과
- TypeScript·TSX 164개 파일 transpile 구문 검사 통과
- 802줄 fixture는 경고 후 통과, 1,202줄 fixture는 1,200줄 안전 상한으로 실패
- Setup API 프리셋 0/5·부분 준비·5/5 진단 테스트와 남성 3종 canonical 계약 확인
- 프로젝트 규칙, 폐기 파일, Web manifest, free-only, engine blueprint, 모델 onboarding 검사 통과
- 합성 무음 10·30·60분 WAV·MP3 6개 시나리오 완료
- WAV 길이·자막 드리프트 0ms, MP3 ffprobe 길이와 자막 차이 192ms 이내

## 해석 제한

합성 무음 soak는 파일 병합, FFmpeg, 컨테이너 길이와 자막 타임코드 안정성만 검증합니다. 실제 한국어 음질, CosyVoice 처리 속도, CUDA·MPS·모바일 메모리 성능을 증명하지 않습니다. 실제 장치·모델 증거는 `.sorion/quality`에 별도로 기록해야 합니다.

전달받은 전체본에는 `package-lock.json`과 정상 설치된 `node_modules`가 없어 전체 ESLint·Vitest·TypeScript semantic 검사·Vite production build를 실행하지 못했습니다. `tsc -b`는 Vite·Vitest·Node 타입 패키지 부재만 보고했습니다. 대신 Repository preflight 14개, 부분 음원·Bridge·프리셋·ordered playback 계약, TypeScript·TSX 164개 파일 transpile 구문 검사, API 135개, Worker 14개와 Python compileall을 통과했습니다. 테스트 런타임은 Python 3.13.5였으며 프로젝트 지원 범위는 3.10~3.12입니다. 자동 브라우저 기능 감지는 실제 Android Chrome·iOS Safari·PWA 장시간 검증을 대체하지 않습니다.
