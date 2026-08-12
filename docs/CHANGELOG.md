# CHANGELOG

## 0.11.12 · Editing History, Speaker Memory & Engine Routing Trace

### Web quality duplicate-query hotfix · 2026-08-12

- GitHub Actions #101에서 `TimelineEditor.test.tsx`가 article과 내부 preview의 동일 `title`을 `getByTitle` 하나로 조회해 실패하던 테스트를 clip article의 접근성 이름 조회로 변경했습니다.
- `DubbingVoiceControls.test.tsx`가 추천 요약과 voice radio에 동시에 표시되는 `도윤`을 전역 `getByText`로 조회하던 테스트를 추천 `role=status` 영역으로 범위 제한했습니다.
- 제품 UI/엔진/재생/저장 로직은 변경하지 않고 테스트 selector의 의미 정확도만 높였습니다.
- 제품 버전은 0.11.12를 유지합니다.

- Timeline 편집을 최근 20단계 bounded Undo/Redo로 확장하고 `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`, `Ctrl/Cmd+Y`와 toolbar 버튼을 연결했습니다.
- 이동·재정렬·대사 수정·분할·쉼 추가·삭제·다중 삭제·일괄 목소리 변경을 history에 기록합니다.
- Undo/Redo에서 내용/voice가 달라진 clip은 폐기된 audio/job/track을 되살리지 않고 queued로 복원하며, 순서만 바뀐 ready clip은 기존 재생 결과를 유지합니다.
- 새 프로젝트·세션·저장 프로젝트 복원은 timeline history를 초기화해 다른 작업의 Undo 상태가 섞이지 않게 했습니다.
- 최근 승인한 화자-목소리 조합을 화자 원문이 아닌 hash key+voiceId만 최대 24건 저장하고 다음 Multi-Speaker Assist에서 우선 제안합니다.
- 장문 batch 완료 결과에 engine routing trace를 추가해 실제 엔진별 사용 횟수·switch 횟수·fallback 횟수·시도 엔진 수를 집계합니다.
- 기존 최대 2-way bounded parallel, circuit breaker, active-load 분산, EWMA 성능 감점과 명시적 엔진 선택 계약은 유지합니다.
- Editing History / Speaker Memory / Engine Routing Trace 전용 dependency-free preflight를 추가하고 제품 버전을 0.11.12로 동기화했습니다.

## 0.11.11 · Mobile Studio Flow & Natural Voice Playback

- 모바일 홈에서도 생성 플레이어 아래 주요 Dock을 함께 노출해 설정/품질 화면과 네비게이션 구조를 일관화했습니다.
- One-Flow의 빠른 프리셋 나열을 제거하고 현재 선택 목소리 1개만 표시하며, 누르면 팝업에서 전체 목록·상황 적합도·장점·주의점·미리듣기를 비교합니다.
- 팝업 미리듣기는 선택 목소리를 몰래 바꾸지 않으며, 대본 문맥 기반 추천은 제안만 하고 사용자가 선택하기 전에는 실제 생성 목소리를 변경하지 않습니다.
- 프리셋마다 자연스러운 speed/pitch 권장 범위를 추가하고 목소리 변경 시 이전 극단 설정을 새 프리셋의 권장 범위 안으로 보정합니다.
- 모바일 대본 입력 focus/키보드 viewport 변화 때 편집 칸을 화면 상단 작업 위치로 재정렬해 긴 입력 중 현재 작성 위치를 놓치지 않게 했습니다.
- 1024px 미만 타임라인도 실제 좌→우 time axis를 사용하고 모바일에서는 기본 zoom을 1.25배로 확대하며 왼쪽 고정 트랙 라벨을 제거해 가용 폭을 최대화했습니다.
- store-driven 생성 음성 재생 요청은 media play 직전에 플레이어 상태를 즉시 `playing`으로 연결하고 실패 시 오류와 함께 원복해 버튼 상태와 실제 음원 요청의 체감 단절을 줄였습니다.
- Mobile Studio Flow 전용 dependency-free preflight를 추가하고 앱·API·Worker 제품 버전을 0.11.11로 동기화했습니다.

## 0.11.10 · Horizontal Timeline Workspace

- PC Timeline Editor를 세로형 카드 감각에서 NLE형 가로 클립 스트립으로 재정비해 시간 진행과 편집 배치를 모두 좌→우로 통일했습니다.
- `timelineGeometry` 순수 모듈을 추가해 duration→pixel 폭, clip offset, canvas 폭, ruler tick을 하나의 X축 좌표계로 계산합니다.
- 클립 폭은 실제 재생 길이에 비례하고 zoom 배율은 초당 픽셀 단위에 직접 반영됩니다. ruler 눈금과 playhead도 같은 geometry를 사용합니다.
- PC 트랙 안의 직접 편집 버튼을 줄이고 상세 대사 수정은 기존 선택 클립 빠른 편집기로 집중시켜 타임라인 높이와 시각 복잡도를 낮췄습니다.
- 트랙 배경/눈금은 pointer drag scrubbing을 지원하고 클립 클릭은 seek와 분리해 선택·재배치 중 playhead가 의도치 않게 움직이지 않게 했습니다.
- 짧은 클립은 container query로 정보 밀도를 자동 축소하고, 모바일/좁은 화면의 기존 세로 편집 UX는 유지합니다.
- PC horizontal timeline 전용 dependency-free preflight와 geometry/component 회귀 테스트를 추가했습니다.
- 앱·API·Worker 제품 버전을 0.11.10으로 동기화했습니다.

## 0.11.9 · Multi-Speaker Assist & Resume Generation

- 모든 비어 있지 않은 줄이 명확한 `화자: 대사` 형식이고 2명 이상 화자가 있을 때 Multi-Speaker Assist를 표시합니다. 설명문이 섞인 대본은 자동 화자 배정 대상에서 제외합니다.
- 첫 화자는 현재 선택 목소리를 유지하고 이후 화자는 프리셋을 순환 제안하지만, 제안은 `이 화자 배정으로 만들기`를 사용자가 눌러 확인하기 전에는 생성에 사용하지 않습니다.
- 화자별 선택 목소리로 문장을 분할해 clip별 generation option을 만들고 기존 첫 음성 우선 + 최대 2-way bounded parallel + 원문 순서 복원 계약을 그대로 사용합니다.
- 화자별 배정 미리듣기는 현재 전역 목소리 선택을 바꾸지 않아 확인 완료 상태를 불필요하게 무효화하지 않습니다.
- 생성 취소 뒤 남은 queued 대사 수를 One-Flow 카드에 표시하고 `남은 대사 이어서 만들기`로 ready 클립을 보존한 채 나머지만 재개합니다.
- 프로젝트 저장에 `timelineClips`를 추가해 text·voiceId·voiceName과 jobIds 순서를 함께 보존하며 재오픈 시 다중 화자 타임라인을 그대로 복원합니다.
- Multi-speaker/resume 전용 dependency-free preflight 계약과 parser/UI/timeline 회귀 테스트를 추가했습니다.
- 앱·API·Worker 제품 버전을 0.11.9로 동기화했습니다.

## 0.11.8 · Fast One-Flow & Safe Parallel Generation

- 장문 전체 생성은 첫 대사를 우선 완성·자동 재생한 뒤 나머지를 최대 2개씩 bounded parallel로 처리해 순차 생성 대기시간을 줄입니다.
- 병렬 요청의 완료 순서가 달라도 플레이어 대기열을 원문 타임라인 순서로 다시 정렬해 재생 순서가 바뀌지 않습니다.
- One-Flow 카드에 생성 완료 수·동시 생성 수 progress bar와 `생성 중지`를 추가하고, 취소 뒤 아직 시작하지 않은 대사는 queued 상태로 남겨 다시 이어갈 수 있게 했습니다.
- 현재 대본의 첫 문장을 선택한 목소리·속도·높낮이·말투 설정으로 바로 들어보는 `첫 문장 미리듣기`를 추가했습니다.
- SRT/VTT 텍스트를 클립보드에서 그대로 붙여 넣어도 cue 번호·타임코드를 자동 제거하며, `말하기 좋게 정리`는 Markdown 제목/목록/인용 장식과 불필요한 공백만 정리합니다.
- 대본 통계에 2명 이상 명시적 `화자: 대사` 표기가 있을 때 화자 수를 안내해 다인 대본을 빠르게 확인할 수 있게 했습니다.
- player queue에 `alignTrackOrder`를 추가하고 One-Flow preflight가 병렬 상한·순서 복원·취소·대본 정리·실제 대본 미리듣기 계약을 검사합니다.
- 앱·API·Worker 제품 버전을 0.11.8로 동기화했고, `set-app-version`/`check-version-sync`가 API의 버전 고정 fixture 8개까지 자동 갱신·검사해 릴리스 승격 뒤 테스트 문자열이 뒤처지는 회귀를 막습니다.

## 0.11.7 · One-Flow Dubbing UX

### CI chain hotfix · 2026-08-10

- GitHub 커밋 `b5cd5cb`가 0.11.5 기준선 위에 0.11.7 패치만 적용되어 0.11.6 recovery evidence/session safety 누적 파일 21개가 빠진 상태를 복구합니다.
- 누락된 `check-recovery-evidence-session-safety.mjs`와 recovery provenance/session schema v3 구현, evidence bundle schema v3 및 legacy v2 verifier 호환을 완전본과 동기화합니다.
- 현재 GitHub 상태에서 재현되던 API evidence 3건 실패(schema 2/3 불일치)를 제거합니다.
- `run-preflight.mjs`는 검사 스크립트가 없을 때 raw `MODULE_NOT_FOUND` 대신 누락 파일과 패치 기준 불일치를 직접 안내합니다.
- 제품 버전은 0.11.7을 유지하며 기능 범위는 변경하지 않습니다.

- 새 프로젝트의 PC 기본 상태를 좌우 패널 접힘 집중 모드로 바꾸고 헤더 `프로 패널` 버튼으로 프로젝트 목록과 Voice Drawer를 한 번에 펼칠 수 있게 했습니다.
- 중앙 Longform Composer에 빠른 목소리 선택, 미리듣기/세부설정, 대본 편집, 생성 행동을 결합해 `목소리 → 대본 → 바로 더빙 → 듣기` 한 흐름으로 정리했습니다.
- 기본 5개 프리셋을 별도 Sheet 없이 즉시 바꾸는 빠른 선택을 추가하면서 전체 Voice Picker와 기존 속도·높낮이·말투 설정은 유지했습니다.
- 빈 프로젝트에서는 타임라인을 숨기고 생성 후 또는 `빈 대사부터 직접 편집`을 눌렀을 때만 노출하며, 제작 기록은 접힌 `details`로 축소했습니다.
- TXT·MD·SRT·VTT 파일 선택과 drag-and-drop 가져오기를 추가하고 SRT/VTT cue 번호·타임코드·단순 태그를 대본에서 제거합니다.
- `Ctrl/Cmd+Enter` 즉시 생성, 첫 준비 음성 자동 재생, 첫 대본 기반 새 프로젝트 제목 자동 제안을 추가했습니다.
- one-flow UX를 dependency-free repository contract와 단위 테스트 토큰으로 고정하고 desktop layout 저장 키를 v3로 승격했습니다.

## 0.11.6 · Recovery Evidence Classification & Session Safety

- 복구 증거에 `observed-device`, `synthetic-injection`, `not-applicable` provenance를 추가하고 실제 실기기 recorder와 Recovery Path Injection을 schema/UI/export에서 분리했습니다.
- synthetic Recovery Path Injection이 성공해도 Android/iOS recovery certification coverage 또는 READY를 충족하지 못하도록 API summary와 기록 판정을 강화했습니다.
- evidence bundle 신규 export를 schema v3로 올리되 verifier는 기존 schema v2 bundle hash를 같은 규칙으로 계속 검증합니다.
- workspace session schema v3에 batch retry snapshot을 추가하고 최근 6건·재시도 3회 상한의 성공/실패/건너뜀/실패 분류 집계만 저장합니다.
- batch retry snapshot sanitizer가 clip ID, 원문, 음원, 임의 error 문자열을 폐기하며 복원 UI도 개인정보 최소 저장 범위를 명시합니다.
- recovery evidence/session safety dependency-free 계약과 API 회귀 테스트를 추가하고 앱·API·Worker 제품 버전을 0.11.6으로 동기화했습니다.
- 승인 Chromium baseline PNG가 아직 없으므로 baseline-required CI 강제 전환은 하지 않았습니다.

## 0.11.5 · Editor Command UX & Adaptive Engine Load Awareness

- 타임라인 다중 선택에 `Ctrl/Cmd+A`, `R`, `Shift+R`, `Alt+←/→`, `Delete`, `Esc`, `?` 키보드 명령과 항상 보이는 command bar를 추가했습니다.
- 준비된 음원을 덮어쓰는 일괄 재생성과 삭제는 영향 범위를 먼저 확인하고 실행하며, 일괄 이동은 직전 1회 Undo를 제공합니다.
- auto 엔진 선택은 현재 실행 중 요청 수를 임시 감점해 동시 생성 요청을 준비된 backup 엔진으로 분산합니다. 명시적 엔진 선택은 변경하지 않습니다.
- 성능 관찰 세션을 `idle/warming/active/expired`로 구분하고 표본 수, 남은 관찰창, 시작/최근 표본 시각, EWMA 지연·안정도를 Engine Doctor와 Quality Diagnostics에 연결했습니다.
- 성능 관찰창 만료 뒤 새 표본은 새 세션으로 시작하며 오래된 EWMA와 섞지 않습니다.
- editor command/engine observation dependency-free 계약과 동시 부하 분산·관찰 세션 회귀 테스트를 추가했습니다.


## 0.11.4 · Visual Baseline Approval & Recovery Provenance

- Chromium 1024/1280/1440 workspace capture에 승인 baseline 저장 모드와 허용 오차 pixel diff를 추가했습니다.
- 일괄 음성 작업은 최근 6건의 세션 재시도 이력을 유지하고 성공/실패/건너뜀과 실패 원인을 빠르게 확인할 수 있습니다.
- Runtime soak 비교는 원본 파일명·파일 SHA-256·수집 시각을 provenance로 표시하고 비교 증거 JSON으로 내보냅니다.
- 엔진 성능 관찰창이 만료되면 오래된 EWMA 표본을 새 요청과 섞지 않고 새 관찰 세션으로 재시작합니다.

## 0.11.3 · Failure-Guided Editing & Adaptive Performance Routing

- 일괄 재생성 실패를 엔진·프리셋·연결·취소·기타로 분류하고 결과 카드에서 원인 그룹별 재시도를 제공합니다.
- 빠른 실패 재시도는 기본 3회로 제한하고 상한 이후에는 원인을 확인한 뒤 명시적인 선택 재생성을 사용하도록 안내합니다.
- 엔진 auto 라우팅에 최근 표본 EWMA 안정도·지연 기반 성능 감점을 추가하고 최소 4개 표본·120초 관찰창을 기본값으로 사용합니다.
- 성능 감점은 TTL 이후 자동 소멸하며 명시적 엔진 선택, circuit cooldown, half-open 단일 probe 계약을 변경하지 않습니다.
- Engine Doctor·Quality Diagnostics가 단발 soft-degrade 우회와 성능 기반 자동 감점을 구분해 표시합니다.
- `SORION_ENGINE_PERFORMANCE_MIN_SAMPLES`, `SORION_ENGINE_PERFORMANCE_WINDOW_SECONDS` 설정과 dependency-free 회귀 계약을 추가합니다.
- 앱·API·Worker 제품 버전을 0.11.3으로 동기화합니다.

## 0.11.2 · Batch Recovery UX & Adaptive Engine Routing

- 일괄 재생성 결과를 성공·실패·건너뜀으로 요약하고 실패가 남으면 해당 클립만 자동 선택해 재시도 동선을 줄입니다.
- 타임라인 도구막대에 `대사 전체`와 `실패만` 빠른 선택을 추가하고 일괄 작업 중 중복 실행을 잠급니다.
- 최근 엔진 실패 직후 circuit open 전에도 짧은 soft-degrade 감점을 적용해 auto 라우팅이 같은 불안정 엔진을 연속으로 다시 선택하지 않게 합니다.
- soft-degrade는 명시적 엔진 선택을 막지 않으며, circuit cooldown 종료 뒤 half-open 단일 probe가 항상 우선하도록 분리합니다.
- Engine API·Quality Lab·Engine Doctor에 자동 선택 감점, 남은 우회 시간과 선택 사유를 연결합니다.
- `SORION_ENGINE_SOFT_DEGRADE_SECONDS` 설정과 batch recovery/adaptive routing dependency-free 회귀 계약을 추가합니다.
- 앱·API·Worker 제품 버전을 0.11.2로 동기화합니다.

## 0.11.1 · Visual Regression & Safe Batch Voice Editing

- 다중 선택 클립에 voice 변경 영향 preview, 목소리만 적용, 적용 후 순차 재생성, 실패만 재시도를 추가합니다.
- voice 변경 시 기존 audio/track/job을 폐기하고 revision을 증가시켜 이전 음원이 새 프리셋으로 남지 않게 합니다.
- Browser voice inventory v2가 프리셋별 실제 배정을 보존하고 변경 전후 diff를 Engine Doctor에 표시합니다.
- production build 뒤 Chromium 1024/1280/1440px에서 실제 작업공간을 구성해 overflow·3분할·Compact Dock·배치 편집 배치를 검사하고 PNG/SHA manifest를 남깁니다.
- Chromium 검사는 Web quality와 별도 continue-on-error 단계로 증거를 먼저 업로드한 뒤 실패를 최종 반영합니다.
- 앱·API·Worker 제품 버전을 0.11.1로 동기화합니다.

## 0.11.0 · Adaptive Engine Resilience & Recovery

- 엔진 circuit breaker를 half-open 단일 probe 방식으로 강화해 cooldown 종료 순간 장애 엔진으로 동시 요청이 재폭주하는 문제를 방지합니다.
- 명시적으로 선택한 엔진도 열린 circuit을 존중하고, 반복 probe 실패는 설정 가능한 상한 내에서 지수 cooldown을 적용하며 성공하면 backoff 단계를 초기화합니다.
- 프리셋 호환 불가 `SOA-4022`는 엔진 장애 횟수에서 제외하고 취소된 probe는 점유 상태를 안전하게 해제합니다.
- System TTS·MeloTTS·CosyVoice Worker에 runtime refresh를 추가하고 엔진별 재탐지 후 circuit을 초기화하는 운영 API를 제공합니다. 실행 중 합성이 있으면 reset을 거절하고 재탐지 중 신규 합성은 backup으로 격리합니다.
- Engine API·Quality Lab·Engine Doctor에 시도/성공/실패, 성공률, 지연시간, 누적 격리, cooldown, half-open probe와 최근 성공·실패 시각을 연결합니다.
- Web 엔진 카탈로그는 cooldown/probing 엔진을 자동 선택에서 제외하고 예상 복구 시점에 캐시를 무효화해 상태를 다시 조회합니다.
- 엔진 회복력 계약을 dependency-free preflight에 추가하고 API 회귀 테스트에 동시 probe·bounded backoff·runtime reset·재탐지 시나리오를 고정합니다.
- 앱·API·Worker 제품 버전을 0.11.0으로 동기화합니다.

## 0.10.8 · CI Test Contract Stability Hotfix

- `browserPlaybackEvidence.test.ts`에서 진단용 장애 주입 테스트가 `afterEach()` 내부에 중복 삽입되어 Vitest가 테스트 안의 `test()` 호출로 판정하던 구조를 제거합니다.
- HomePage 장문 통합 테스트를 0.10.5 이후의 실제 편집 UX와 동기화해, 선택 문장은 단일 빠른 편집기에서 검증하고 나머지 문장은 타임라인 카드 텍스트로 검증합니다.
- dependency-free 프로젝트 규칙에 위 두 회귀 형태를 고정해 같은 CI 오류가 의존성 설치 전 preflight 단계에서 다시 들어오지 않도록 합니다.
- 앱·API·Worker 제품 버전을 0.10.8로 동기화합니다.

## 0.10.7 · Recovery Evidence & Voice Inventory Diagnostics

- Worker telemetry 집계에 `group_key`를 API 필수 필드로 추가하고 Web `WorkerTelemetryAggregate.groupKey`까지 연결해 기준선이 없는 그룹도 History 조회가 안전하게 동작하도록 수정합니다.
- `voice_preset_approval.py`의 primitive alias 다중 import를 모듈 import로 단순화해 Ruff I001 재발 가능성을 줄입니다.
- Quality Lab에서 `runtime-soak/2` 이전·현재 JSON을 직접 선택해 P95 응답, 성공률, 메모리·연결 증가와 복구 시간 회귀를 비교합니다.
- 실제 네트워크를 변경하지 않는 온라인 복귀·페이지 복귀·Network Information change 이벤트 주입 카드로 앱 복구 처리 경로를 점검합니다.
- Engine Doctor가 브라우저 음성 inventory fingerprint 변화를 감지하고 `voiceschanged` 때 프리셋 배정과 엔진 카탈로그를 다시 평가합니다.
- recovery evidence·voice inventory·Worker group key 연결을 고정하는 dependency-free repository 계약 검사를 추가합니다.
- 앱·API·Worker 제품 버전을 0.10.7로 동기화합니다.

## 0.10.6 · Baseline Recovery & Multi-Clip Editing

- 운영자 benchmark baseline의 append-only JSONL 이력을 조회하고, 현재 기준선과 과거 기준선을 비교한 뒤 기존 기록을 지우지 않고 `restored` 이벤트로 복원합니다.
- 기준선 복원 API와 운영자 화면에 history·preview·restore 흐름을 추가해 잘못된 복원 뒤에도 이전 상태로 다시 되돌릴 수 있게 합니다.
- 타임라인에서 `Ctrl/Cmd` 다중 선택과 `Shift` 범위 선택을 지원하고, 2개 이상 선택 시 일괄 이동·삭제 패널을 제공합니다.
- 단일 선택은 0.10.5의 빠른 편집기를 그대로 유지하고, 재생 중 자동 선택은 다중 선택을 해제하지 않도록 분리합니다.
- jsdom에 없는 `scrollIntoView`를 안전하게 가드하고, 중복 음성 미리듣기 접근성 이름·Dock Browser Speech 라벨·품질 보고서 버전 fixture를 현재 UI 계약과 동기화합니다.
- Ruff I001이 발생한 writer lease·benchmark baseline·voice preset approval import 순서를 정리합니다.
- 앱·API·Worker 제품 버전을 0.10.6으로 동기화합니다.

## 0.10.5 · Compact Dock & Practical Clip Editor

- 일반 Dock의 핵심 순서를 `재생/일시정지 → 진행바 → 시간/제목 → 보조 제어`로 고정하고 PC에서 한 줄의 얕은 transport로 압축합니다.
- 만들기 화면 전용 Dock도 재생 버튼 바로 옆에 긴 진행바를 배치하고 장식 파형을 제거해 세로 점유를 줄입니다.
- 타임라인 카드 내부의 반복 textarea를 제거하고 선택 클립 전용 빠른 편집 패널에서 수정·저장·미리듣기·재생성·분할·삭제를 처리합니다.
- Enter는 선택 클립 빠른 편집기에 포커스를 이동하고 `Ctrl/Cmd+Enter`는 저장 후 재생성을 실행합니다.
- Dock 순서와 빠른 편집 진입을 고정하는 Vitest 회귀 테스트와 dependency-free Studio UX 계약 검사를 강화합니다.
- 0.10.4의 프리셋 호환 `SOA-4022`, Browser Speech 연속 폴백, System TTS eSpeak 보조 경로와 반대 성별 강제 대체 금지는 유지합니다.
- 앱·API·Worker 제품 버전을 0.10.5로 동기화합니다.

## 0.10.4 · Voice Preset Engine Reliability Hotfix

- 서버 엔진들이 특정 프리셋만 표현하지 못한 경우를 `SOA-4022`로 구분하고, `auto` 생성은 호환 Browser Speech까지 계속 시도합니다.
- System TTS가 가능한 로컬 백엔드를 복수로 유지해 Windows/macOS 기본 음성이 프리셋과 맞지 않거나 실행 실패하면 설치된 eSpeak 한국어 백엔드로 재시도합니다.
- System Engine Doctor 진단에 보조 백엔드 선택 근거를 표시하고 eSpeak가 있으면 pitch 지원 가능성도 엔진 capability에 반영합니다.
- MeloTTS의 `YoungHo` 계열 남성 화자 이름 판정을 Browser/System과 동일하게 맞췄습니다.
- 전용 CosyVoice WAV가 없는데 다른 인물 음색으로 가장하는 폴백은 추가하지 않았으며, 호환 로컬 음성이 전혀 없으면 지원 불가를 유지합니다.
- 프리셋 호환 API·System 이중화·Melo 판정 회귀 테스트와 repository preset 계약 검사를 강화했습니다.
- 앱·API·Worker 제품 버전을 0.10.4로 동기화합니다.

## 0.10.3 · Compact playback dock & direct timeline editing

- PC 일반 Dock과 만들기 전용 Dock을 얕은 2단 구조로 줄여 작업 화면의 세로 공간을 돌려줍니다.
- 준호·민준은 같은 성별 한국어 음성이 1개뿐인 기기에서도 프리셋별 속도·높낮이 차이로 안전하게 재사용하며 반대 성별은 차단합니다.
- 프리셋 미리듣기 버튼이 준비 취소·재생·일시정지·계속 재생 상태를 즉시 표시합니다.
- 타임라인에 실제 플레이어 위치를 연결하고 트랙 클릭 seek, 확대·축소, 자동 선택·스크롤과 단축키 편집을 추가합니다.
- 클립에 재생·편집·분할·삭제 직접 도구와 선택·재생 강조를 적용합니다.
- 앱·API·Worker 제품 버전을 0.10.3으로 동기화합니다.

## 0.10.2 · Recovery soak & managed lock interface

- 장시간 API·Worker 검사에서 이전 실행의 응답 P95, 성공률, 복구 시간, 메모리와 열린 연결 증가를 비교합니다.
- 수동·주간 soak 중 Worker를 실제 재시작하고 45초 안의 자동 복구 여부를 증거 JSON으로 기록합니다.
- 이전 soak 보고서를 GitHub Actions cache에 보존하고 현재 결과를 다음 실행 기준으로 교체합니다.
- 승인 writer 잠금을 `WriterLeaseCoordinator` Protocol과 backend factory 뒤로 분리하며 기본 SQLite fencing 계약을 유지합니다.
- 1024·1280·1440px PC 3분할의 좌·중앙·우 폭을 계산 함수와 회귀 테스트로 고정합니다.
- 앱·API·Worker 제품 버전을 0.10.2로 동기화합니다.

## 0.10.1 · Approval modularization & operator baselines

- 923줄 승인 서비스를 orchestration, canonical hash·diff, 원자 저장·history, 갱신 대기열 모듈로 분리합니다.
- 기존 승인·재서명·롤백의 writer lease, fencing token, file lock과 적용 직전 재검증을 유지합니다.
- 같은 엔진·모델 digest·장치·프리셋의 최근 5건을 운영자 확정 기준선으로 저장합니다.
- 기준선 원본 측정 ID·시각 목록의 SHA-256과 집계값만 보존하고 음성·사용자 문장은 저장하지 않습니다.
- 운영자 기준선 교체·폐기 이력을 JSONL로 남기고 자동 기준선과 별도로 회귀를 판정합니다.
- 앱·API·Worker 제품 버전을 0.10.1로 동기화합니다.

## 0.10.0 · Always-on preset runtime & PC three-pane layout

- 프리셋 미리듣기 요청을 내부 대기열에 유지하고 API·Worker·브라우저 음성이 준비되면 자동으로 다시 실행합니다.
- 연결 실패 뒤 1~15초 점진 재시도, 새 프리셋 선택 시 이전 요청·늦은 결과 무효화를 적용합니다.
- 활성 12초·백그라운드 45초 heartbeat와 60초 전체 점검, 포커스·페이지 복귀·네트워크 변경 자동 재연결을 적용합니다.
- 일반 작업 화면에서 인앱 브라우저 엔진 안내와 API·Worker·GPU·주소·연결 여부를 숨깁니다.
- PC 3분할 기준을 1180px에서 1024px로 낮추고 레이아웃 저장 키를 v2로 갱신해 좌우 패널을 기본 펼침 상태로 복구합니다.
- 앱·API·Worker 제품 버전을 0.10.0으로 동기화합니다.

## 0.9.9 · CI quality hotfix

- `voice_preset_approval.py`의 `app.services` import를 Ruff isort 순서로 재정렬해 I001을 해결합니다.
- LinkedPlayerDock 테스트에서 렌더 초기 source 동기화 `pause()` 호출을 초기화하고 사용자 일시정지 호출만 검증합니다.
- import 순서와 테스트 기준점 회귀를 dependency-free preflight에서 차단합니다.
- 앱·API·Worker 제품 버전을 0.9.9로 동기화합니다.

## 0.9.8 · Quality gate compatibility

- Ruff UP035에 맞춰 `Iterator`와 `Mapping` import를 `collections.abc`로 이동합니다.
- 미래 annotation의 불필요한 따옴표를 제거하고 file lock timeout 예외에 원래 오류를 연결합니다.
- 모바일 `DubbingVoiceControls`에 현재 선택 엔진을 전달해 누락된 필수 prop 오류를 해결합니다.
- Engine Doctor 테스트의 부분 mock을 `unknown` 경유 캐스팅으로 명시해 TypeScript 변환 경고를 해결합니다.
- 동일한 Ruff·Web 타입 회귀를 검사하는 dependency-free quality gate compatibility preflight를 추가합니다.
- 앱·API·Worker 제품 버전을 0.9.8로 동기화합니다.

## 0.9.7 · Natural playback controls

- 재생 버튼을 누르면 실제 media `play` 또는 Browser Speech `onstart` 이벤트를 기다리지 않고 즉시 일시정지 버튼으로 전환합니다.
- 준비 중 또는 재생 중 일시정지를 누르면 요청을 즉시 멈추고 재생 버튼으로 복원합니다.
- Browser Speech 실행별 run ID를 추가해 취소된 utterance의 늦은 callback이 최신 버튼 상태를 덮지 못하게 합니다.
- 파일 음원과 브라우저 음성의 즉시 버튼 전환 회귀 테스트와 repository preflight 계약을 추가합니다.
- 앱·API·Worker·보고서의 제품 버전을 0.9.7로 동기화합니다.

## 0.9.6 · Long-run reliability & writer safety

- 승인·재서명·롤백에 SQLite writer lease와 fencing token을 추가해 stale writer의 파일 반영을 차단합니다.
- 기존 thread lock과 OS file lock을 유지해 동일 프로세스·동일 호스트·공유 승인 저장소의 쓰기 경합을 단계별로 막습니다.
- 5·30·60분 API·Worker soak를 기존 CI workflow의 수동·주간 job으로 분리하고 생존율, 응답 P95, 최장 중단, 복구 시간과 API 메모리 증가를 기록합니다.
- 개인정보 제외 감사 자료를 검증된 JSON, 파일별 SHA-256 manifest와 README를 포함한 ZIP으로 내보냅니다.
- 앱·API·Worker·보고서의 제품 버전을 0.9.6으로 동기화합니다.

## 0.9.5 · Benchmark baseline & privacy-safe audit bundle

- 같은 모델·digest·가속기·프리셋 그룹에서 최초 5건과 최근 5건의 비중첩 window를 비교합니다.
- Worker telemetry의 실패율, first audio P95, RTF P95와 final handoff P95 회귀를 stable·warning·regressed로 판정합니다.
- 총 10건 미만은 기준선 부족으로 표시하며 모델·장치가 달라진 자료를 성능 저하로 섞지 않습니다.
- 승인 history, 신뢰 키 교체 진행, benchmark 회귀와 device coverage를 개인정보 제외 감사 JSON으로 내보냅니다.
- 감사 JSON에서 actor·reviewer·IP·GPU 원문·signature·실제 WAV·비밀키를 제외하고 GPU 조건은 SHA-256 fingerprint로 대체합니다.
- 다운로드 전에 레코드와 전체 bundle SHA-256을 서버에서 다시 계산해 변조를 탐지합니다.

## 0.9.4 · Visible version sync

- 첫 화면과 업데이트 알림은 사용자 제품 버전 `v0.9.4`만 표시합니다.
- 앱·API·Worker·품질 보고서·로컬 Export의 버전을 0.9.4로 통일했습니다.
- `VERSION`을 단일 제품 버전 기준으로 추가하고 `npm run version:set -- 0.9.5`로 다음 버전을 한 번에 올릴 수 있습니다.
- Engine Heartbeat와 revision은 설정의 고급 빌드 정보에만 유지합니다.
- Service Worker 갱신 뒤 build ID를 query에 넣어 새 배포본을 강제로 다시 불러옵니다.

## 0.9.3-beta.3 Engine Heartbeat 6.8.4 · Trust key rotation & evidence renewal queue

- active·previous HMAC 신뢰 키 ring과 무중단 key rotation을 추가했습니다.
- 이전 신뢰 키 manifest를 검증한 뒤 현재 active key로 diff 미리보기·재서명할 수 있습니다.
- 동의·권리 만료, WAV 결박 불일치, unsigned·이전 키 상태를 갱신 대기열로 모았습니다.
- 승인 apply·재서명·rollback에 로컬 파일시스템 프로세스 간 잠금을 추가했습니다.
- 기존 승인·WAV·검수 묶음 결박을 유지하며 알 수 없는 서명은 자동 덮어쓰지 않습니다.

## 0.9.3-beta.3 Engine Heartbeat 6.8.3.3 · Seamless engine runtime

- 일반 작업·복제 화면에서 API 주소, Worker, GPU와 엔진 ID를 숨기고 자동 준비 상태만 표시합니다.
- 여러 API 후보를 병렬 검사해 가장 빠른 정상 후보를 선택하고 느린 요청을 취소합니다.
- 보이는 탭 20초, 숨은 탭 90초 heartbeat와 120초 통합 갱신으로 연결을 자동 유지합니다.
- 통합 응답의 음성 방식 목록을 15초 cache하고 중복 요청을 하나로 합칩니다.
- API가 Worker HTTP 연결 풀을 재사용하고 health·readiness를 병렬 검사하며 15초 supervisor로 재연결합니다.
- 설정의 상세 기술 진단은 접힌 고급 개발자 영역에서만 로드합니다.


## 0.9.3-beta.3 Engine Heartbeat 6.8.3.1 · Web quality test compatibility hotfix

- Evidence Intake가 `File.text()` 미지원 환경에서 `FileReader`로 자동 전환해 jsdom·구형 브라우저에서도 JSON 객체를 읽습니다.
- 배열 JSON과 5MiB 초과 파일은 읽기 구현 오류 대신 기존의 객체·용량 오류 메시지로 거부합니다.
- LinkedPlayerDock 테스트의 브라우저 음성 fixture를 여성 프리셋과 호환되는 한국어 음성으로 맞춰 `speechSynthesis.speak()`와 시작 지연 telemetry를 다시 검증합니다.
- TypeScript 5.9의 `BufferSource`·`BlobPart` 제약에 맞춰 로컬 ZIP 바이트를 `Uint8Array<ArrayBuffer>`로 고정합니다.
- Repository preflight 24개, TS/TSX parse 183개, Evidence Intake·Browser Speech·Local ZIP focused runtime smoke를 통과했습니다.

## 0.9.3-beta.3 Engine Heartbeat 6.8.3 · CI quality unblock and approval operator gate

- GitHub Actions가 보고한 Ruff import 정렬 3건과 Web lint·Hooks 4건을 수정합니다.
- 프리셋 승인 preview·apply·history·rollback 전체에 loopback 또는 운영자 토큰 인증을 요구합니다.
- 원격 토큰은 32자 이상이어야 하며 잘못된 토큰·미설정 원격 접근·짧은 서버 토큰을 서로 다른 오류 코드로 거부합니다.
- 브라우저 토큰은 탭 sessionStorage에만 보존하고 승인 API 요청 헤더에만 사용합니다.
- 승인 apply·rollback의 최종 WAV·manifest 재검사와 파일 쓰기를 동일 잠금 안에서 수행해 동시 요청 덮어쓰기를 차단합니다.
- manifest 원자 교체와 approval history append에 flush·fsync를 적용하고 WAV 변경 뒤 위험한 rollback을 거부합니다.
- 인증·경합·CI 오류 재유입을 막는 dependency-free preflight를 추가해 총 24개 검사를 수행합니다.

## 0.9.3-beta.3 Engine Heartbeat 6.8.2 · Signed review approval and benchmark dashboard

- 현재 WAV·manifest·검수 묶음 checksum을 재계산하는 승인 diff 미리보기와 명시적 apply confirmation을 추가합니다.
- 미리보기 뒤 파일 상태가 바뀌면 stale 승인 적용을 거부하고 승인 전후 manifest snapshot을 감사 JSONL에 보존합니다.
- manifest schema v3에 approval ID, signed payload SHA-256, 선택적 HMAC-SHA256과 signing key ID를 추가합니다.
- Engine Doctor와 CosyVoice 합성 경로에서 payload digest와 설정된 신뢰 키의 서명 상태를 검증합니다.
- 최근 승인 rollback은 현재 manifest가 승인 직후 상태와 같은 경우에만 허용하고 사유와 관련 approval ID를 기록합니다.
- CosyVoice Worker 합성의 모델 digest·장치·GPU·first audio·RTF·handoff 오차·실패 원인을 별도 자동 telemetry로 저장합니다.
- Quality Lab에 Worker 자동 telemetry와 10·30·60분 실기기 soak를 분리한 모델·GPU·프리셋별 P50/P95 benchmark 표를 추가합니다.
- signed review/benchmark 정적 계약을 repository preflight에 추가해 총 23개 검사를 수행합니다.

## 0.9.3-beta.3 Engine Heartbeat 6.8.1 · Review export sync and voice selection telemetry

- manifest schema를 v2로 올리고 사람 승인에 승인 당시 WAV SHA-256과 검수 묶음 checksum 참조를 기록합니다.
- 승인된 WAV가 교체되거나 checksum이 달라지면 사람 검수를 `stale`로 자동 무효화하고 CosyVoice 사용을 차단합니다.
- 동의·권리 만료일까지 30일 이하인 프리셋을 경고하고 만료된 증거는 계속 차단합니다.
- Quality Lab에 승인 후보·재검토·거부 결정을 추가하고 SHA-256 검증 검수 묶음 JSON 내보내기·가져오기를 제공합니다.
- 검수 묶음 가져오기는 로컬 평가만 병합하며 manifest의 승인 상태·검수자·WAV checksum을 자동 변경하지 않습니다.
- Engine Doctor가 Windows System.Speech와 MeloTTS의 실제 선택 화자명·speaker ID·판정 성별·선택 근거를 표시합니다.
- 실기기 benchmark를 모델 ID·버전·digest·가속 장치·GPU·프리셋별로 그룹화하고 final handoff 오차 P95를 집계합니다.
- review sync/telemetry 정적 계약 검사를 추가해 repository preflight를 22개로 확장합니다.

## 0.9.3-beta.3 Engine Heartbeat 6.8.0 · Preset evidence review

- 5개 인물 프리셋별 consent·rights·integrity·human review manifest schema와 안전한 pending 템플릿을 추가합니다.
- Engine Doctor가 WAV 품질, manifest 인증, 최종 사용 가능 수를 분리하고 checksum 불일치·다른 프리셋과의 동일 WAV를 차단합니다.
- CosyVoice 실제 합성도 동의·권리·사람 승인·SHA-256·고유 음성을 모두 검사해 진단 우회를 허용하지 않습니다.
- 현재 기기의 Browser Speech 실제 배정 음성명·URI·성별 판정 근거와 후보 부족 사유를 표시합니다.
- Quality Lab A/B를 5개 프리셋 선택 방식으로 확장하고 로컬 판정·CSV에 프리셋 ID·이름·성별을 기록합니다.
- 개인정보 제외 진단 복사본에 프리셋별 인증·checksum·중복 상태를 포함합니다.
- 실제 화자 WAV와 동의 자료는 포함하지 않으며 템플릿이 pending인 상태를 READY로 가장하지 않습니다.

## 0.9.3-beta.3 Engine Heartbeat 6.7.1 · Voice preset fidelity hotfix

- 알 수 없는 프리셋 ID를 첫 여성 프리셋으로 바꾸지 않고 명시적 오류로 처리합니다.
- Browser Speech가 한국어 음성 이름·URI에서 성별을 확인하며 반대 성별과 성별이 명시된 중성 대체를 차단합니다.
- 도윤·준호·민준의 별도 남성 후보가 부족할 때 같은 음성을 순환 재사용하지 않습니다.
- Windows System.Speech와 macOS `say`가 성별·프리셋별 후보를 선택하며 공통 음성 강제값을 제거합니다.
- eSpeak는 여성·남성 변형 번호를 분리하고, MeloTTS는 단일 `KR` 화자와 같은 화자 중복 대체를 차단합니다.
- CosyVoice의 알려진 5개 프리셋은 동일 ID 전용 WAV가 없으면 기본 기준 음성으로 대체하지 않습니다.
- 프리셋 호환성 부족은 엔진 장애나 circuit breaker 실패로 계산하지 않고 다음 엔진을 시험합니다.
- 플레이어는 호환 브라우저 음성이 없을 때 조용히 기본 음성을 재생하지 않고 사용자에게 오류를 표시합니다.
- 음성 정합성 계약 문서와 회귀 검사를 추가하고 제품 버전은 `0.9.3-beta.3`으로 유지합니다.

## 0.9.3-beta.3 Engine Heartbeat 6.7 · Field evidence intake and local export bundle

- field evidence v2와 완료된 Web quality run report를 서버 checksum으로 preview·등록합니다.
- bundle/report SHA와 record/evidence SHA 기준으로 중복 증거를 차단합니다.
- 가져온 원본 JSON은 checksum 파일명으로 원자 저장하고 출처 metadata를 index에 기록합니다.
- Quality Lab에 증거 가져오기 이력과 WAV·MP3·SRT·VTT·JSON 브라우저 로컬 ZIP을 추가합니다.
- ZIP은 파일별 SHA-256 manifest, 20개/250MiB 상한, 진행률·취소와 100MiB 초과 모바일 경고를 제공합니다.
- npm lock 검사를 repository preflight 필수 단계로 올리고 제품 버전은 `0.9.3-beta.3`으로 유지합니다.

## 0.9.3-beta.3 Engine Heartbeat 6.6 · Field evidence and reproducible Web quality

- 일반 Push·PR에서 누락 lock을 만들거나 검증 lock을 자동 커밋하던 CI 경로를 제거했습니다.
- lint, TypeScript, Vitest와 Vite build를 동일한 7단계 Web quality runner로 실행합니다.
- 입력 package manifest·lock, 단계별 로그와 dist 파일에 SHA-256을 기록하고 artifact로 보존합니다.
- verifier가 report JSON, 실제 로그, 현재 lock과 dist manifest를 다시 대조하며 변조 fixture를 preflight에서 검사합니다.
- Quality evidence bundle schema v2에 레코드별 SHA-256, category count, 정규화 records hash와 bundle hash를 추가했습니다.
- 장치 이름·브라우저 상세 버전·메모를 기본 제거하고 다운로드 전에 서버 검증 endpoint를 호출합니다.
- checksum은 변조 감지용이며 실제 측정 진실성이나 발행자 신원을 보증하는 전자서명으로 표현하지 않습니다.

## 0.9.3-beta.3 Engine Heartbeat 6.5.2 · Stream handoff CI hotfix

- Fixed a Web Streams deadlock risk by consuming the playback branch before awaiting cancellation of the tee probe branch.
- Kept first-byte telemetry while allowing partial WAV blobs to complete under standards-compliant stream implementations.
- Synchronized the final-WAV handoff test with the actual DOM `src` update before dispatching `loadedmetadata`.
- Added a dependency-free guard that rejects the unsafe `await probe.cancel()` pattern.

## 0.9.3-beta.3 Engine Heartbeat 6.5.1 · CI regression hotfix

- Ruff UP012가 지적한 불필요한 UTF-8 `encode` 인자를 제거했습니다.
- 플레이어가 기존 `playRequestId`를 새 요청으로 오인해 복원 음원을 자동 재생하던 문제를 수정했습니다.
- 부분→최종 WAV 교체 시 재생 상태 ref와 최신 재생 위치를 동기적으로 보존합니다.
- progressive segment 배열을 `useMemo`로 안정화해 Hooks 의존성 경고를 제거했습니다.
- visibility 관찰 시계를 주입 가능하게 만들어 숨김 시간 테스트가 전역 시계 호출에 영향받지 않게 했습니다.
- SSE asset resolver mock과 WAV Response fixture를 실제 모듈·Undici 계약에 맞춰 Web 테스트를 안정화했습니다.
- dependency-free preflight가 새 자동재생·위치 승계·시계·테스트 fixture 계약을 강제하도록 갱신했습니다.

## 0.9.3-beta.3 Engine Heartbeat 6.5 · Device soak recorder and audio archive policy

- Quality Lab에 Android/iOS 10·30·60분 실기기 recorder와 JSON 내보내기를 추가합니다.
- SSE 재연결·음원 fetch 복구·재생 중단 시간을 분리하고 기기·엔진·프리셋별 P95를 집계합니다.
- seam을 생성 대기 포함과 순수 decode 전환으로 분리합니다.
- Export 서버 임시 만료 시각과 download-only 보존 정책을 응답·UI에 표시합니다.
- 음원·SRT·VTT 다운로드 보존 기록은 파일명 메타데이터만 로컬에 저장하며 삭제 UI를 제공합니다.
- device soak/archive dependency-free preflight와 API·Web helper 회귀 테스트를 추가합니다.


## 0.9.3-beta.3 Engine Heartbeat 6.4 · Signed audio rehydration and device certification

- 최종 TTS WAV를 작업 전용 HMAC URL로 제공하고 작업 결과 조회로 새 URL을 재발급합니다.
- 새로고침 세션과 재생 오류에서 동일 트랙·재생 위치를 보존하며 만료 URL을 한 번 복구합니다.
- seam 평균·P95·최대와 최종 WAV handoff 위치 오차를 Quality Lab JSON에 기록합니다.
- Android/iOS의 기본·네트워크 전환·백그라운드 복귀·설치형 PWA 10·30·60분 인증 coverage를 추가합니다.
- signed audio/device certification dependency-free preflight와 API·세션 회귀 테스트를 추가합니다.

## 0.9.3-beta.3 Engine Heartbeat 6.3 · Seam metrics and device soak

- WAV 구간 `ended → playing` 전환 시간을 생성 대기 포함 여부와 함께 트랙별로 기록
- Quality Lab에 평균·최대·최근 seam과 개인정보 최소 JSON 내보내기 추가
- 25분 이내 안전한 최종 원격 음원·Browser Speech 대기열과 재생 위치를 새로고침 뒤 복원
- 부분 음원·Blob·만료 서명 URL을 플레이어 persistence에서 제외하고 복원 뒤 자동 재생 차단
- online/offline, visibility, 숨김 누적 시간, 백그라운드 복귀와 BFCache 관찰 세션 추가
- seam·복원·기기 soak 계약을 dependency-free preflight와 Web 단위 테스트에 추가

## 0.9.3-beta.3 Engine Heartbeat 6.2 · Ordered segment queue and device evidence

- SSE·polling에서 뒤섞여 도착한 준비 구간을 번호순으로 처리하는 Web coordinator를 추가했습니다.
- 다음 구간이 늦으면 대기 상태를 표시하고 도착 즉시 같은 트랙에서 자동 재생합니다.
- 최종 WAV 교체 시 완료 구간 누적 시간과 현재 구간 위치를 합산해 재생 위치를 승계합니다.
- 부분 재생 중 전체 seek·다운로드를 차단하고 모든 구간 Blob URL의 수명을 Player Store가 관리합니다.
- Quality Lab에 HTTPS·EventSource·PWA·Service Worker·사용자 제스처 재생을 분리 기록하는 브라우저 기기 증거 카드를 추가했습니다.
- 자동 감지 결과를 gapless 또는 실기기 인증으로 과장하지 않는 문서·preflight 계약을 추가했습니다.

## 0.9.3-beta.3 Engine Heartbeat 6.1 · Progressive playback stability and male presets

- 준호 저음·민준 활력 남성 프리셋을 추가해 전체 5종, 남성 3종으로 확장
- 모바일 목소리 Sheet에 전체·남성·여성·중성 실제 필터와 공통 성별 메타데이터 추가
- Web·FastAPI·CosyVoice가 하나의 5개 프리셋 ID 계약을 사용하고 Setup 진단을 0/5~5/5로 확장
- 만료된 첫 구간 서명 URL을 작업 상태 재조회로 한 번 갱신한 뒤 재요청
- 첫 구간에서 최종 WAV로 같은 트랙이 교체될 때 재생 위치와 재생 상태 승계
- 프리셋·부분 재생 회귀 계약, API 135개, Worker 14개, preflight 13개, TS/TSX 159개 구문 검사 통과

## 0.9.3-beta.3 Engine Heartbeat 6 · Partial audio delivery and bridge hardening

- 장문 구간 WAV 준비 상태를 `ready_segments`와 `segment-ready` SSE로 공개하고 첫 구간을 최종 병합 전에 재생
- 작업·구간·파일·만료를 결합한 HMAC-SHA256 단기 URL과 private no-store 음원 응답 추가
- 첫 구간 트랙을 최종 WAV로 같은 ID에서 교체해 대기열 선택과 순서를 유지
- 서버 준비·첫 바이트·실제 재생·Browser Speech 시작 지연을 분리 기록
- 신뢰 proxy CIDR 밖의 전달 헤더 무시, 공개 Origin 정규화와 client IP 기반 rate-limit 강화
- Caddy·Nginx 경계, 운영 Secret, URL 만료와 현재 파일 단위 전달 제한 문서화
- API 133개, Worker 14개와 dependency-free preflight 12개 회귀 검사 통과

## 0.9.3-beta.3 Engine Heartbeat 5.2.1 · Focus return hotfix

- 확인창을 연 메뉴 항목이 unmount되며 활성 요소가 `body`로 바뀌어 초점 복귀가 실패하던 문제 수정
- `returnFocusRef`가 지정되면 이전 활성 요소보다 명시적 복귀 대상을 우선하도록 modal cleanup 계약 변경
- effect 시작 시 복귀 DOM 노드를 지역 변수에 캡처해 React Hooks mutable-ref cleanup 경고 제거
- 동일한 ref 직접 읽기와 복귀 우선순위 회귀를 dependency-free preflight에서 차단

## 0.9.3-beta.3 Engine Heartbeat 5.2 · UI/UX polish

- PC·모바일 음성 설정의 속도·높낮이 범위와 말투 6종을 공통 계약으로 통합
- 높낮이 소수 단위와 FastAPI 정수 계약 충돌을 제거하고 복원·전송 값을 안전 보정
- Bottom Sheet·확인창에 초기 초점, Tab 순환, Escape 닫기, 초점 복귀, 배경 스크롤 잠금 적용
- 미리듣기 중 중복 요청 차단, 목소리 radio 방향키 이동과 상태 안내 개선
- 동작하지 않는 필터 탭 제거, 프로젝트 메뉴 닫기 동작과 현재 프로젝트 의미 개선
- 데스크톱 보조 텍스트·컨트롤 가독성, 패널 separator 의미와 reduced-motion 동작 보강
- UI/UX 컴포넌트 테스트와 dependency-free preflight 계약 추가

## 0.9.3-beta.3 Engine Heartbeat 5.1 · Web quality hotfix

- `HomePage` 자동 복원 테스트의 `밝게` 버튼 조회를 `음성 설정` dialog 내부로 제한
- 데스크톱 Voice Drawer와 모바일 Voice Settings Sheet가 함께 렌더링될 때 발생한 Testing Library 중복 요소 실패 제거
- 같은 전역 조회가 재도입되면 dependency-free preflight에서 차단하는 테스트 계약 추가

## 0.9.3-beta.3 Engine Heartbeat 5 · Secure mobile bridge and first-audio readiness

- `/connectivity`와 Engine Doctor가 공개 HTTPS Voice API Bridge를 로컬·공개 HTTP와 분리 진단
- CosyVoice 프리셋 WAV 3종을 Worker 요청 전에 포맷·길이·샘플레이트·무음·클리핑 기준으로 검사
- 장문 TTS의 첫 구간 파일 준비 시간 `first_audio_ms`를 전체 생성 시간과 분리해 결과·타임라인에 표시
- PC 3단 스튜디오의 좌우 패널 너비 조절·접기와 로컬 상태 저장 추가
- 공개 Bridge·지연 지표의 보안 경계와 해석 제한 문서화

## 0.9.3-beta.3 Engine Heartbeat 4 · Three-pane desktop studio and CapCut timeline

- 첫 화면의 4단계 설명을 모바일 2×2, 넓은 화면 1×4로 배치해 가로 잘림을 제거
- PC 편집 화면을 프로젝트 히스토리 / Chat Workspace / Voice Drawer 3단 구조로 재편
- 최근 로컬 프로젝트를 왼쪽에서 바로 열고, 음성 프리셋과 속도·높낮이·말투를 오른쪽에서 즉시 조정
- 타임라인에 시간 눈금, 플레이헤드, 가로 음성 클립, 가위와 삭제 버튼을 직접 노출
- API·Worker·GPU 상태를 상단 3점으로 상시 표시하고 실패를 작업 메시지로 자동 전달

## 0.9.3-beta.3 Engine Heartbeat 3 · Engine Doctor and preset autowiring

- 설정에 API·TTS·Worker·GPU·설치 단계를 분리 진단하는 Engine Doctor를 추가
- Voice API 주소 저장·즉시 재진단·자동 연결 복구와 개인정보 제외 상태 복사 추가
- `START_ENGINE.cmd`가 프로젝트 `voice-presets` 폴더를 자동 연결
- Setup API가 CosyVoice 프리셋 WAV 3종의 준비 개수와 누락 파일을 반환
- 소스 500줄 하드 제한을 800줄 권고·1,200줄 안전 상한으로 완화

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
