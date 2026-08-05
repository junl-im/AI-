# SoriON AI 0.9.3-beta.3 Verification Report

결과 버전: **0.9.3-beta.3 · Engine Heartbeat 6.8.3 · CI Quality Unblock & Approval Operator Gate**


## Engine Heartbeat 6.8.3 CI Quality Unblock & Approval Operator Gate

- GitHub Actions가 보고한 Ruff I001 3건을 import block 재정렬로 수정했습니다.
- Web quality의 미사용 `_checksum`, 제어문자 정규식, 불안정한 `groups` Hook 의존성 2건을 수정했습니다.
- 프리셋 승인 preview·apply·history·rollback 전체에 운영자 인증 게이트를 추가했습니다. loopback은 기본적으로 토큰 없이 허용하고 LAN·외부는 32자 이상 `SORION_VOICE_REVIEW_OPERATOR_TOKEN`이 필요합니다.
- 브라우저 운영자 토큰은 해당 탭의 `sessionStorage`에만 두고 승인 API의 `X-SoriON-Operator-Token` 헤더에만 전송합니다.
- 단순 `X-SoriON-User-ID` 문자열을 인증으로 취급하지 않고 actor 기록에 인증 방식과 선언 ID를 구분합니다. 거부된 접근은 본문 없이 감사 로그에 남깁니다.
- 승인 apply와 rollback은 동일 잠금 안에서 WAV·manifest·history를 다시 검증해 동시 요청의 lost update를 차단합니다.
- manifest 원자 교체와 approval JSONL append에 flush·fsync를 추가하고 WAV가 승인 후 변경된 경우 과거 manifest 롤백을 거부합니다.
- 재유입 방지용 `voice review operator gate / CI unblock` 검사를 추가해 repository preflight를 24개로 확장했습니다.
- 검증: Repository preflight 24/24, API pytest 171개, Worker pytest 14개, TS/TSX transpile 182개와 Python compileall을 통과했습니다.
- 제한: 현재 환경에는 Python 3.10 Ruff와 프로젝트 Web 의존성이 설치되지 않아 전체 Ruff·ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions 재실행이 최종 판정합니다.


## Engine Heartbeat 6.8.2 Signed Review Approval & Benchmark Dashboard

- 프리셋 승인은 현재 WAV·현재 manifest·검수 묶음 checksum을 다시 계산한 diff 미리보기와 명시적 확인 문구를 통과해야 적용됩니다.
- manifest schema v3는 approval ID, 승인 payload SHA-256, 선택적 HMAC-SHA256 서명과 key ID를 기록합니다. 서명 키가 없으면 상태를 `unsigned`로 유지합니다.
- 승인 전후 manifest snapshot을 append-only JSONL 감사 기록에 보존하고, 승인 뒤 파일이 바뀐 경우 stale apply와 위험한 롤백을 거부합니다.
- Engine Doctor와 실제 CosyVoice 합성 경로가 승인 payload digest와 설정된 신뢰 키의 서명을 재검증합니다.
- CosyVoice Worker의 모델 manifest digest·GPU·first audio·RTF·handoff 오차·성공 여부를 별도 자동 telemetry JSONL로 기록합니다. 짧은 자동 합성은 10·30·60분 soak로 계산하지 않습니다.
- Quality Lab benchmark 대시보드는 Worker 자동 자료와 실기기 soak를 분리하고 모델 digest·가속 장치·GPU·프리셋별 표본 수, 실패율과 P50/P95를 표시합니다.
- 검증: Repository preflight 23개, API pytest 164개, Worker pytest 14개, TS/TSX transpile 182개와 Python compileall을 통과했습니다.
- 제한: 실제 WAV·동의·권리 원본·서명 비밀키·모델 가중치·실기기 수치는 포함하지 않았습니다. 설치된 Web 의존성이 없어 전체 ESLint·semantic typecheck·Vitest·Vite build는 GitHub Actions 최종 확인이 필요합니다.

## Engine Heartbeat 6.8.1 Review Export Sync & Voice Selection Telemetry

- manifest schema v2가 사람 승인 당시 WAV SHA-256과 검수 묶음 checksum 참조를 기록하며, 현재 WAV가 달라지면 승인 상태를 `stale`로 자동 무효화합니다.
- 동의·권리 만료일까지 30일 이하인 프리셋을 경고하고 만료된 증거는 계속 사용 차단합니다.
- Quality Lab은 승인 후보·재검토·거부 결정을 저장하고 canonical payload SHA-256이 포함된 검수 묶음 JSON을 내보내고 검증해 다시 가져옵니다.
- 가져온 묶음은 로컬 평가만 병합하며 manifest의 승인 상태, 검수자, 검수 시각과 WAV checksum을 자동 변경하지 않습니다.
- Engine Doctor가 Windows System.Speech와 MeloTTS의 실제 선택 화자 이름·ID·판정 성별·선택 근거를 프리셋별로 표시합니다.
- 실기기 benchmark는 모델 ID·버전·digest, 가속 장치, GPU와 프리셋으로 분리하고 first audio·RTF·실패율·seam·final handoff P95를 같은 그룹에서 집계합니다.
- 검증: Repository preflight 22개, API pytest 161개, Worker pytest 14개, TS/TSX transpile 179개, 검수 묶음 runtime smoke, Python compileall과 review sync/telemetry 계약 검사를 통과했습니다.
- 제한: 실제 화자 WAV·동의·권리 원본·모델 가중치·실기기 성능 자료는 포함하지 않았습니다. 전체 npm Web 품질은 내부 registry의 `zustand@5.0.8` 404로 GitHub Actions 최종 확인이 필요합니다.

## Engine Heartbeat 6.8.0 Preset Evidence Review

- 5개 인물 프리셋마다 구조화된 manifest를 추가해 표시 이름·선언 성별·참조 WAV, 동의, 이용 권리, SHA-256, 파일 크기와 사람 청취 검수를 기록합니다.
- Engine Doctor는 WAV 품질 통과, manifest 구조·증거 통과, 최종 사용 가능을 분리하며 실제·선언 checksum과 중복 등록 ID를 표시합니다.
- CosyVoice는 동의 확인, `tts-inference` 이용 허용, 사람 승인, checksum 일치와 프리셋 간 고유 WAV가 모두 확인된 동일 ID 파일만 사용합니다.
- 같은 WAV 바이트를 여러 인물 파일명으로 복사하면 진단과 실제 합성 경로에서 모두 차단합니다.
- Browser Speech의 현재 기기별 실제 음성명·URI·성별 판정·후보 순번 근거를 Engine Doctor에서 확인합니다.
- Quality Lab A/B 비교를 혜린 고정에서 5개 프리셋 선택 방식으로 확장하고 IndexedDB·CSV 판정 기록에 프리셋 ID·이름·성별을 보존합니다.
- 검증: Repository preflight 21개, API pytest 158개, Worker pytest 14개, CosyVoice 전용 회귀 8개, TS/TSX transpile 177개, Python compileall과 증거·정합성 계약 검사를 통과했습니다.
- 제한: 실제 5개 화자 WAV·동의 증빙·모델 가중치는 포함하지 않았습니다. 제공 manifest는 `pending` 템플릿이며 실제 npm Web 전체 검사는 내부 registry의 `zustand@5.0.8` 404로 GitHub Actions 최종 확인이 필요합니다.

## Engine Heartbeat 6.7.1 Voice Preset Fidelity Hotfix

- 여성·남성·중성 메타데이터와 실제 엔진 후보 선택을 연결하고 반대 성별 묵시적 폴백을 차단했습니다.
- 남성 후보가 1개뿐일 때 도윤·준호·민준 모두에게 반복 배정하지 않고 후순위 프리셋을 미지원 처리합니다.
- CosyVoice는 알려진 프리셋에 동일 ID 전용 WAV를 필수로 하며 공통 기본 기준 음성을 대체 사용하지 않습니다.
- MeloTTS의 단일 `KR` 화자, macOS 공통 `Yuna`, Windows·Browser 순번 순환 선택 문제를 제거했습니다.
- 프리셋별 호환성 부족은 엔진 전체 고장이 아니므로 실패 횟수와 circuit breaker를 증가시키지 않습니다.
- 검증: Repository preflight 20개, API pytest 154개, Worker pytest 14개, 핵심 프리셋 회귀 29개, TS/TSX transpile 179개, Browser runtime smoke, Python compileall과 음성 계약 검사를 통과했습니다.
- 제한: 실제 5개 화자 WAV와 모델은 포함하지 않았습니다. Browser/System/eSpeak 결과는 전용 인물이 아닌 기기·엔진 근사 음성입니다. 전체 npm Web 품질은 registry 404로 GitHub Actions 최종 확인이 필요합니다.

## Engine Heartbeat 6.7 Field Evidence Intake & Local Export Bundle

- SoriON field evidence v2와 Heartbeat 6.6·6.7 Web quality run report를 서버에서 구분 검증합니다.
- 5MiB 상한, schema·제품 버전·허용 필드·phase 명령·결과·SHA-256을 preview 단계에서 재계산합니다.
- bundle/report SHA와 record/evidence SHA를 함께 사용해 동일 파일과 동일 실행 내용의 중복 등록을 차단합니다.
- 원본 JSON은 checksum 파일명으로 원자 저장하고 출처·commit SHA·run ID·등록 시각을 별도 index에 남깁니다.
- 브라우저 로컬 ZIP은 WAV·MP3·SRT·VTT·JSON 최대 20개/250MiB, 안전 파일명, 파일별 SHA-256 manifest, 진행률·취소와 대용량 경고를 제공합니다.
- repository preflight에 npm lock 무결성과 Evidence Intake/Local Bundle 계약을 포함해 총 20개 검사를 수행합니다.
- 제품 버전은 `0.9.3-beta.3`으로 유지합니다.

## Engine Heartbeat 6.6 Field Evidence & Reproducible Web Quality

일반 Push·PR에서 lock을 자동 생성·커밋하던 경계를 제거하고 커밋된 `package-lock.json`만 검증하도록 CI를 변경했습니다. lint, semantic typecheck, Vitest와 Vite build는 하나의 7단계 실행기가 수행하며 입력 lock, 단계별 로그와 dist 파일의 SHA-256을 `.sorion/web-quality` report로 보존합니다. report verifier는 JSON checksum만 보는 것이 아니라 실제 로그·lock·dist 파일을 다시 대조합니다.

Quality evidence bundle은 schema v2 manifest를 사용합니다. 장치 이름, 브라우저 상세 버전과 메모를 기본 제거하고 각 레코드와 정규화된 전체 묶음에 SHA-256을 부여합니다. Web은 다운로드 직전에 서버 검증 endpoint를 호출합니다. checksum은 우발적 또는 비인가 변경 탐지용이며 발행자 신원이나 측정 진실성을 보증하는 전자서명은 아닙니다.

검증: Repository preflight 18/18, API pytest 143개, Worker pytest 14개, Python compileall, TS/TSX 171개 transpile 구문 검사, Web quality plan·report·로그 변조 역검증과 CI YAML parse 통과. Ruff와 전체 npm Web quality는 현재 sandbox에 설치된 의존성이 없어 실행하지 못했으며 커밋된 lock을 사용하는 GitHub Actions가 최종 판정합니다.

## Engine Heartbeat 6.5.2 Stream Handoff CI Hotfix

GitHub Actions가 추가로 보고한 Web 테스트 4건을 수정했습니다. 부분 WAV 준비 경로에서 `ReadableStream.tee()`의 probe 분기를 다른 분기 소비 전에 `await cancel()`해 표준 Web Streams 구현에서 교착될 수 있던 실제 런타임 문제를 제거했습니다. 최종 WAV 교체 테스트는 Zustand 외부 상태 변경 후 새 `src`가 DOM에 반영된 시점에 metadata 이벤트를 검증하도록 동기화했습니다. 제품 버전은 계속 `0.9.3-beta.3`입니다.

검증: Repository preflight 17/17, API pytest 139개, Worker pytest 14개, Python compileall, TS/TSX 171개 transpile 구문 검사, Web Streams tee/cancel 런타임 스모크 통과. 전체 npm 기반 Web quality는 sandbox registry의 `@eslint/js@9.22.0` 404로 GitHub Actions 재실행이 필요합니다.

## Engine Heartbeat 6.5.1 CI Regression Hotfix

GitHub Actions가 보고한 Ruff 1건, Web 테스트 8건과 Hooks 경고 1건을 원인 단위로 수정했습니다. 제품 기능 범위는 6.5와 동일하며 자동재생 초기값, 부분→최종 음원 위치·상태 승계, visibility 시간 측정, SSE/WAV 테스트 fixture 안정성만 보강했습니다.

검증: Repository preflight 17/17, API pytest 139개, Worker pytest 14개, Python compileall, TS/TSX 171개 transpile 구문 검사 통과. 전체 npm 기반 Web quality는 sandbox registry 제한으로 GitHub Actions 재실행이 필요합니다.

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
- Heartbeat 6.6부터 일반 Push·PR은 커밋된 package-lock만 verify-only로 처리하며 누락·stale lock은 자동 생성 없이 실패합니다.
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
