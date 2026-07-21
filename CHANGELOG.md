# CHANGELOG

## v1.5.7 - Tablet & Small-Laptop Responsive Density

- 721~1179px 태블릿 dock을 4+4 두 줄에서 8단계 단일 행으로 변경해 높이를 약 154px에서 73px로 줄였습니다.
- 1180~1399px 소형 노트북 hero를 약 418px에서 275px로 압축해 진행 상태와 작업 카드가 첫 화면에 더 많이 보이도록 했습니다.
- tablet/small-laptop 전용 title, 설명, timeline, vertical frame 밀도를 추가하고 social strip은 해당 구간에서 숨겼습니다.
- 모바일 header display/min-height 중복과 navigation target border/shadow 중복을 제거해 실제 CSS 충돌을 338→334, 고위험 충돌을 85→81, shadowed declaration을 422→414로 낮췄습니다.
- Chromium 감사를 desktop·small laptop·tablet·mobile 4개 viewport로 확장하고 초기 hero/dock density를 계약으로 기록합니다.
- 자동 QA 164/164, 4개 viewport 오류·가로 overflow 0, 서비스워커 생명주기 검사를 통과했습니다.
- 중간 breakpoint의 안전한 최종 override로 `!important`가 904개로 늘어 다음 CSS 소유권 패치의 우선 회수 대상으로 기록했습니다.


## v1.5.6 - UI Clarity & Compact Workspace Entry

- 데스크톱 시네마틱 헤더의 최소 높이, 제목 크기, 좌우 간격을 줄여 첫 화면에 작업 상태와 작업실 카드가 더 많이 보이도록 다듬었습니다.
- 모바일 헤더와 4단계 시작 안내 카드의 높이·패딩·타이포를 압축해 하단 메뉴와 안내 문구가 겹치지 않고 더 여유 있게 보이도록 조정했습니다.
- 패널 제목에 작은 단계 색상 레일을 추가하고 작업실 배치 전환 버튼, 현재 단계 카드, 상단 진행 상태의 대비를 정리했습니다.
- `header-meta-rail.css`가 상단 버전·호환·디자이너 메타데이터의 최종 grid/display 소유자가 되도록 완전히 가려진 레거시 선언을 제거했습니다.
- 활성 `!important`는 866→863, 실제 selector-property 충돌은 342→338, 고위험 충돌은 89→85, shadowed declaration은 431→422로 감소했습니다.
- UI 전용 회귀 검사 1개를 추가해 자동 QA 163/163, PC·모바일 Chromium 오류 0건·가로 overflow 0px, 서비스워커 생명주기 검사를 통과했습니다.


## v1.5.5 - Mobile Control Ownership Consolidation

- 모바일 토스트의 dock 상태별 bottom 위치는 `mobile-menu-guide.css`가 단독 소유하도록 통합했습니다.
- bottom dock의 기본·모바일 geometry는 `ui-refinement.css`, 데스크톱 최종 높이·padding·radius는 `foundation-polish.css`가 소유하도록 정리했습니다.
- transport·preview·export·batch action 크기는 `flow-doctor.css`가 단독 소유하며 이전 hotfix·integrity 중복 선언을 제거했습니다.
- 시작 안내 패널의 desktop 표시 여부는 `desktop-prime-layout.css`, 모바일 surface와 workflow step geometry는 `ui-refinement.css`가 소유합니다.
- 이전 HyperConnect 전용 dock 규칙을 UI mode로 scope해 HyperFlow 화면에 섞이지 않게 했습니다.
- 활성 `!important`는 898→866, 실제 selector-property 충돌은 511→342, 고위험 충돌은 198→89, shadowed declaration은 675→431로 감소했습니다.
- v1.5.4와 비교한 데스크톱·모바일 계산 스타일은 유지됐으며 숨겨진 desktop start panel의 비활성 grid 값만 제거됐습니다.
- 자동 QA 162/162, PC·모바일 Chromium 오류 0건·가로 overflow 0px, 서비스워커 생명주기 검사를 통과했습니다.

## v1.5.4 - Classified CSS Ownership & Cascade Consolidation

- CSS 감사를 단순 selector 중복 집계에서 실제 로드 순서·미디어 조건·selector·property·값·`!important`를 추적하는 cascade 보고서로 확장했습니다.
- 디스크의 CSS 46개 중 실제 로드되는 45개와 보관 전용 `cinematic-hero.css`를 구분해 비활성 파일이 충돌 통계를 부풀리지 않게 했습니다.
- 충돌을 layout, skin, typography, interaction, token, other로 분류하고 위험도·최종 winner·전체 occurrence 목록을 JSON에 기록합니다.
- 추천 카드는 구조(`studio.css`), 상호작용(`ux.css`), 유리 재질(`glass-pro-ui.css`), 최종 스킨(`ui-refinement.css`)으로 소유권을 분리했습니다.
- 모바일 시네마틱 헤더의 크기·여백·라운드·배경·그림자는 `ui-refinement.css`가 단독 소유합니다.
- 1180px 이상 데스크톱 그리드의 열·영역·행·간격은 `workspace-layout-controls.css`, 표시·외곽 폭은 `desktop-prime-layout.css`가 단독 소유합니다.
- 활성 CSS 기준 `!important` 911→898, selector-property 충돌 526→511, 고위험 충돌 206→198, 가려진 선언 701→675로 감소했습니다.
- 런타임 자산 변경을 즉시 갱신하도록 버전과 서비스워커 캐시 키를 v1.5.4 / `1.5.4-css-ownership`으로 올렸습니다.
- 자동 QA 162/162, 새 PC·모바일 Chromium 감사, 새 서비스워커 생명주기 감사를 통과했습니다. 실미디어·20회 힙 감사는 런타임 JS가 바뀌지 않은 CSS-only 릴리스이므로 검증된 v1.5.3 결과를 명시적으로 상속합니다.

## v1.5.0 - Workspace-First UX & Adaptive Parallel Analysis

- 파일을 열거나 작업 단계를 이동하면 소개 영역을 한 줄 작업 헤더로 접어 실제 작업 공간을 더 빠르게 보여줍니다.
- 상단 진행 카드에 전체 작업률, 현재 상태, 상황별 다음 행동 버튼을 추가했습니다.
- 자동 분석 중 직접 취소하고, 취소·실패 뒤 같은 위치에서 다시 분석할 수 있게 했습니다.
- UI 상태 판단과 다음 행동 연결을 `studio-experience-controller`로 분리해 단계형 로더에서 지연 로드합니다.
- 성능 여유가 있는 짧은 영상은 오디오 분석과 움직임 샘플링을 병렬 실행하고, 장시간·저메모리 환경은 안전 순차 모드를 유지합니다.
- 병렬 분석의 일부가 실패해도 가능한 결과를 유지하고 오디오 중심 또는 움직임 중심 분석으로 안전하게 축소합니다.
- 분석 캐시를 clone-safe 스냅샷, TTL, LRU 상한, 적중·만료·퇴출 통계를 가진 구조로 교체했습니다.
- 엔진 캐시에 런타임 진단이 섞이기 전의 깨끗한 결과만 저장해 재사용 결과 오염을 막았습니다.
- 자동 QA **149/149**, PC·모바일 Chromium, MP3·MP4·취소·재시도·10분 미디어, 서비스워커 생명주기 감사를 통과했습니다.

## v1.4.1 - Observable Service Worker Lifecycle

- 서비스워커 등록·활성·제어 상태를 조회하는 `getStatus()`를 추가했습니다.
- 등록 후 제어 여부를 확인하는 `waitUntilControlled()`를 추가했습니다.
- controller, update 발견, worker 상태 전환을 진단 기록에 남깁니다.
- 실제 `sw.js` 이벤트를 실행하는 격리 생명주기 감사를 추가했습니다.
- 이전 캐시 정리, 즉시 활성화, client claim, 오프라인 navigation 복구를 자동 검증합니다.
- 자동 QA **145/145**, 브라우저·실미디어 감사를 통과했습니다.

## v1.4.0 - Modular Render Workflow & Safe Queue DOM

- 렌더 큐 UI, export payload, 작업 실행, 실패 재시도, 편집 선택 복원을 `src/app/render-workflow-controller.js`로 분리했습니다.
- `src/app.js`는 렌더 세부 구현을 전용 컨트롤러에 위임하며 파일 크기를 약 11.4% 줄였습니다.
- 렌더 큐의 사용자·런타임 문자열을 HTML 템플릿 대신 DOM 노드와 `textContent`로 표시합니다.
- 렌더 operation의 중복 종료 시도를 제거하고 공통 `finally`에서 정확히 한 번 종료합니다.
- 렌더 성공·부분 실패·취소·예외 후 원래 후보와 수동 범위를 복원합니다.
- 새 컨트롤러를 앱 로딩 순서와 서비스워커 셸 캐시에 포함했습니다.
- 가짜 DOM·렌더 큐를 실행하는 전용 회귀 검사를 추가했습니다.
- 자동 QA **143/143**, PC·모바일 Chromium 오류 0건, MP3·MP4·취소·재시도·10분 미디어 E2E를 통과했습니다.

## v1.3.9 - Recovery Export, Clipboard Resilience & Editor-State Preservation

- 자동저장 피드백이 호출하던 누락된 공개 토스트 API를 구현해 저장·복구·삭제·내보내기 결과가 실제 화면에 표시됩니다.
- Clipboard API 권한·포커스 실패 시 DOM 기반 fallback을 사용하고, 실제 실패를 성공으로 안내하지 않도록 호출부를 보강했습니다.
- 일괄 렌더 전 사용자의 후보 선택과 수동 범위를 캡처해 성공·실패·취소 후 복원합니다.
- 렌더 중 파일이 교체되면 이전 미디어의 편집 스냅샷을 새 파일에 적용하지 않습니다.
- 수동 구간 미리보기 seek가 공용 정규화 결과를 사용하도록 수정했습니다.
- 유효한 자동저장 원문 백업과 손상 자동저장 원문·실패 이유 복구 번들 다운로드를 추가했습니다.
- 클립보드 fallback, 세션 복구 내보내기, 렌더 편집 상태 복원 동작 검사를 추가했습니다.
- 자동 QA **141/141**, PC·모바일 Chromium 오류 0건, MP3·MP4·취소·재시도·10분 미디어 E2E를 통과했습니다.

## v1.3.8 - Recoverable Sessions, Scoped Caches & Deterministic Worker Fallback

- 손상·과대 자동저장 세션을 별도 `invalid` 상태로 표시하고 복구 실패 상태에서도 기록 삭제를 항상 허용합니다.
- 서비스워커 활성화 시 `ai-shorts-studio-shell-` prefix의 이전 앱 캐시만 삭제해 같은 origin의 다른 서비스 캐시를 보존합니다.
- 렌더 종료 시 원본 미디어의 `currentTime`, `playbackRate`, `muted`, `volume`, 재생 상태를 작업 전 값으로 복원합니다.
- 렌더 경계에서 미디어 범위를 다시 정규화해 잘못된 직접 호출도 차단합니다.
- 분석 워커 무응답 watchdog과 `messageerror` 처리를 추가하고 정지 시 워커를 종료한 뒤 호환 분석으로 전환합니다.
- localStorage·프로젝트 설정에 enum 허용 목록, 수치 상한, 문자열·색상 정제, 알 수 없는 키 차단을 적용합니다.
- 부분·이전 프로젝트의 중첩 설정을 현재 상태에 깊은 병합해 누락 그룹이 사용자 설정을 지우지 않게 했습니다.
- 손상 지속 상태, 워커 정지, 서비스워커 캐시 범위 전용 회귀 검사 3개를 추가했습니다.
- 자동 QA **138/138**, PC·모바일 Chromium 오류 0건, MP3·MP4·취소·재시도·10분 미디어 E2E를 통과했습니다.
- 배포 과정에서 `PATCH_MANIFEST.txt` 또는 동일 목적의 임시 목록 파일을 생성하지 않는 원칙을 유지합니다.

## v1.3.7 - Render Resource Ownership, Bounded Captions & Update Coalescing

- 렌더 기능 사전 검사에서 `captureStream()`을 호출해 사용하지 않는 미디어 트랙이 남을 수 있던 부작용을 제거했습니다.
- 실제 렌더는 원본 캡처 스트림을 한 번만 만들고 성공·실패·취소·설정 실패 경로에서 캔버스·오디오·원본 영상 트랙을 모두 정리합니다.
- 렌더 과정에서 변경한 원본 미디어 `muted`·`volume`을 이전 값으로 복원합니다.
- 미디어 길이보다 큰 수동 시작점, 역순 시작·종료, 1초 미만 미디어를 공용 `normalizeMediaRange()`로 안전하게 보정합니다.
- 직접 붙여넣는 자막 텍스트를 100만 자, 자막 큐를 5,000개로 제한하고 초과 입력을 파싱 전에 거부합니다.
- 프로젝트 후보 ID에서 제어 문자를 제거하고 중복 ID에 고유 접미사를 부여해 DOM 선택·비교 충돌을 막았습니다.
- Update Sentinel과 버전 동기화 모듈의 직접 `registration.update()` 호출을 제거하고 서비스워커 소유 모듈의 `checkForUpdate()`로 통합했습니다.
- 동시에 발생하는 업데이트 확인은 하나의 Promise와 하나의 브라우저 업데이트 요청으로 합칩니다.
- 렌더 자원 정리, 범위·자막·후보 ID, 서비스워커 단일 소유 전용 회귀 검사 3개를 추가했습니다.
- 자동 QA 135/135, PC·모바일 Chromium 오류 0건, MP3·MP4·취소·재시도·10분 미디어 E2E를 통과했습니다.
- Git 메타데이터가 없는 전체 설치본에서도 `PATCH_BASE_ARCHIVE` 또는 `PATCH_BASE_DIR`로 직전 릴리스를 지정해 내용 기반 패치 ZIP을 만들 수 있습니다.
- 배포 과정에서 `PATCH_MANIFEST.txt` 또는 동일 목적의 임시 목록 파일을 생성하지 않는 원칙을 유지합니다.

## v1.3.6 - Release Consistency, Bounded Project Restore & Checkpointed E2E

- 실제 재검증에서 `index.html`의 v1.3.4 빌드 키와 v1.3.5 QA 기대값이 어긋나 100/131만 통과하던 배포 불일치를 수정했습니다.
- HTML·자산 쿼리·서비스워커 캐시·package·QA를 v1.3.6 / `1.3.6-adaptive-mobile`로 동기화했습니다.
- 서비스워커 등록과 업데이트 확인을 `AIShortsServiceWorkerRegistration` 한 곳으로 통합하고 비보안 외부 HTTP 등록을 건너뜁니다.
- manifest·service worker 제어 자산이 실패할 때 `index.html`로 잘못 폴백하지 않고 명시적인 503을 반환합니다.
- 프로젝트 스키마를 v3으로 올리고 후보·자막·문자열·파일 크기·미디어 시간 상한과 허용 설정 키를 적용했습니다.
- 미래 스키마, 과대 프로젝트·자막 입력, 프로토타입 오염 키, 비정상 시간 구간을 안전하게 거부하거나 보정합니다.
- 같은 파일 재선택, 지연 자동 분석 세션 경합, 취소 후 분석 상태, 프로젝트 설정 저장 누락을 수정했습니다.
- 최대 미디어 길이 경계에서 후보·자막 종료 시간이 상한을 넘을 수 있던 예외를 수정했습니다.
- 후보 ID의 CSS 특수 문자가 비교·핀 선택자를 깨뜨릴 수 있던 경로를 `dataset.id` 정확 비교로 변경했습니다.
- 실미디어 감사에 선택 시나리오와 체크포인트 저장을 추가하고 다운로드 감시 등록 경합을 제거했습니다.
- 패치 ZIP은 Git 변경 파일에서 직접 계산하며 `PATCH_MANIFEST.txt` 같은 중간 목록 파일을 생성하지 않습니다.
- 자동 QA 132/132, PC·모바일 Chromium 오류 0건, MP3·MP4·취소·재시도·10분 미디어 E2E를 통과했습니다.

## v1.3.5 - Runtime Guard & Safe User Data Rendering

- 서비스워커 등록을 전용 `AIShortsServiceWorkerRegistration` 모듈로 분리해 등록 소유권을 단일화했습니다.
- 실제 HTTPS·localhost 등록 성공 뒤 선언되지 않은 `runtimeConfig.APP_VERSION`을 참조하던 오류를 제거했습니다.
- 등록 성공·실패·중복 방지·업데이트 확인·실패 후 재시도를 자동 회귀 검사로 추가했습니다.
- 드래그앤드롭으로 들어온 PDF·문서 등 미지원 파일을 오디오로 오인하지 않고 분석 전에 차단합니다.
- 세션 파일명, 프로젝트 후보 제목·구간, 렌더 작업 라벨·오류를 동적 `innerHTML` 대신 안전한 텍스트 노드로 렌더링합니다.
- 공용 유틸에 미디어 종류 판별과 HTML 이스케이프 함수를 추가했습니다.
- 자동 QA를 131개로 확장하고 PC·모바일 Chromium UI 감사와 MP3·MP4·10분 미디어 E2E를 다시 통과했습니다.
- 전체 설치 ZIP과 v1.3.4 덮어쓰기 패치 ZIP을 함께 배포합니다.

## v1.3.4 - Adaptive Mobile Menu & Decode Memory Preflight

- 모바일 메뉴바를 현재 단계·다음 단계 중심의 핵심 4개 메뉴로 자동 축약했습니다.
- `전체 메뉴` 버튼으로 기존 8개 작업 메뉴를 언제든 4열×2행으로 펼칠 수 있습니다.
- 단계가 이동하면 모바일 메뉴는 자동으로 간단 모드로 돌아가 현재 작업과 다음 행동을 다시 안내합니다.
- 모바일 메뉴 안내에 `현재 … · 다음 …` 문구와 접근 가능한 `aria-expanded`·`aria-hidden` 상태를 적용했습니다.
- 오디오 디코딩 전에 파일 길이·크기·기기 메모리·무압축 여부를 이용해 예상 디코딩 메모리와 위험도를 계산합니다.
- 위험도가 높은 긴 파일은 안전 모드 안내와 진단 기록을 남기고, 브라우저 안정 범위를 크게 넘는 파일은 변환·분할 안내와 함께 분석을 막습니다.
- `decodeAudioData()` 호출 전에 원본 ArrayBuffer를 복제하던 `slice(0)`를 제거해 순간 원본 파일 메모리 복사를 한 번 줄였습니다.
- PC 8개 메뉴, 모바일 핵심 4개·전체 8개 전환, 네온 랜딩과 가로 overflow를 Chromium에서 검증했습니다.
- 20초 MP3·MP4, 취소, 실패 재시도와 실제 10분 MP3 분석·렌더 E2E를 다시 통과했습니다.
- 자동 QA를 129개로 확장하고 전체 설치 ZIP과 v1.3.3 덮어쓰기 패치 ZIP을 함께 배포합니다.

## v1.3.2 - Real Media E2E & Render Recovery

- Worker와 메인 스레드가 공유하는 `audio-analysis-core.js`를 추가해 분석 계산의 중복 구현을 제거했습니다.
- 오디오 분석 Worker 생성·실행 실패 시 배치형 메인 스레드 폴백으로 이어서 분석하고 AbortSignal을 확인합니다.
- 렌더 시작 전에 MediaRecorder와 canvas captureStream 필수 기능을 검사합니다.
- 원본 미디어 `play()`가 거절되면 빈 영상 녹화를 계속하지 않고 즉시 실패 처리합니다.
- 렌더 큐에 사용자용 `취소` 버튼과 cancelled 상태를 추가하고 다운로드 없이 안전하게 종료합니다.
- 실패 작업 재시도가 과거 operation token을 재사용하던 문제를 수정해 새 렌더 작업으로 다시 시작합니다.
- 합성 20초 MP3·MP4의 분석 → 추천 → 선택 → 2초 렌더 → 다운로드를 실제 Chromium에서 검증했습니다.
- 렌더 취소, 의도적인 재생 실패, 실패 항목 재시도와 ffprobe 출력 검증을 자동 감사에 포함했습니다.
- 자동 QA 124/124와 PC·모바일 Chromium 런타임 오류 0건을 확인했습니다.
- 전체 설치 ZIP과 v1.3.1 덮어쓰기 패치 ZIP을 함께 생성합니다.

## v1.3.1 - Resizable Prime Workspace & Focus Views

- PC 3열 작업실에 두 개의 세로 리사이저를 추가해 불러오기·미리보기·후보 영역의 폭을 직접 조절할 수 있습니다.
- 포인터 드래그, 좌우 방향키, Shift+방향키, Home 초기화와 더블 클릭 초기화를 지원합니다.
- 조절한 3열 비율은 로컬에 저장하되, 미리보기·파형 집중 모드는 다음 실행에 복원하지 않아 시작 흐름을 가리지 않습니다.
- `미리보기 집중` 모드는 9:16 미리보기를 넓게 고정하고 후보·편집·저장을 오른쪽 작업 레일로 배치합니다.
- `파형 확대` 모드는 파형을 전체 폭으로 확장하고 컷·편집·미리보기·저장을 아래에 연결합니다.
- 집중 모드와 맞지 않는 메뉴로 명시적으로 이동하면 자동으로 3열 균형 배치로 돌아옵니다.
- 1180px 미만과 모바일에서는 작업실 조절 UI를 완전히 숨겨 기존 단계형 화면을 유지합니다.
- 실제 Chromium 1366×768에서 키보드 리사이즈, 두 집중 모드, 메뉴 8개, 네온 랜딩과 RAF·Mutation 안정화를 검증했습니다.
- 전체 설치 ZIP과 v1.3.0 덮어쓰기 패치 ZIP을 함께 생성합니다.

## v1.3.0 - Active Stage Beacon & Operation Coordination

- 진행 단계가 바뀔 때 현재 패널 외곽에 밝은 네온 띠와 1회 랜딩 스윕을 표시합니다.
- 단계별 `진행 중` 칩과 전용 SVG 아이콘을 추가하고 접근성 라이브 안내를 제공합니다.
- 같은 단계의 반복 동기화에서는 애니메이션을 다시 실행하지 않습니다.
- `AIShortsOperationCoordinator`를 추가해 분석·미리보기·렌더의 작업 ID와 미디어 세션을 관리합니다.
- 새 파일을 열면 이전 분석·미리보기·렌더가 취소되고 오래된 결과가 새 상태를 덮어쓰지 못하게 했습니다.
- 오디오 워커, 비디오 모션 샘플링, 분석 파이프라인, 렌더 큐와 MediaRecorder에 AbortSignal을 연결했습니다.
- 렌더 큐에 `cancelled` 상태와 취소 API를 추가하고 종료 시 타이머·트랙·볼륨을 정리합니다.
- PC 1366×768과 모바일 390×844 Chromium 감사에서 랜딩·지속 강조, 오류 0건, RAF·Mutation 안정화를 확인했습니다.
- 전체 설치 ZIP과 v1.2.9 덮어쓰기 패치 ZIP을 함께 생성합니다.

## v1.2.9 - Runtime Stability & PC Menu Containment

- PC 메뉴바 바깥 프레임은 970px, 내부 메뉴 레일은 1180px였던 상충 규칙을 통합했습니다.
- PC 1180·1280·1366·1920px에서 8개 메뉴를 한 줄로 표시하고, 1180px 미만에서는 4열×2행으로 안전하게 전환합니다.
- `.bottom-dock-tabs`가 부모보다 넓어지지 않도록 `width/max-width/min-width` 소유권을 명확히 했습니다.
- 단계형 UI 로더의 `editor`/`edit` 키 불일치와 v1.2.6 고정 버전 쿼리를 수정했습니다.
- 지연 스크립트에 10초 타임아웃, 실패 자산 제거와 `staged-ui-load-error` 진단을 추가했습니다.
- 런타임 건강 모듈이 `window.error`와 `unhandledrejection`을 수집하고 중복을 제거해 최근 오류를 제공합니다.
- 미디어 재생 거절 시 미리보기 RAF와 interval이 시작되지 않도록 수정했습니다.
- 렌더 성공·실패·중단 경로에서 RAF, interval, timeout, 캡처 트랙과 볼륨을 결정적으로 정리합니다.
- 세션 연속성 저장 주기를 30초로 완화하고 숨김 탭과 pagehide에서 heartbeat를 중단합니다.
- 제거된 `syncTopLine()`을 계속 호출하던 레거시 참조를 제거해 실제 브라우저 초기화 `ReferenceError`를 해결했습니다.
- 실제 Chromium 감사 결과를 읽는 회귀 검사를 추가해 전체 자동 QA **115/115**를 통과했습니다.
- 전체 설치 ZIP과 v1.2.8 덮어쓰기 패치 ZIP을 함께 생성합니다.

## v1.2.8 - Simplified Header Metadata Rail

- 상단 중앙의 `LOCAL · PRIVATE · 9:16` 상태 문구와 점 표시를 제거했습니다.
- 상단 메타를 왼쪽 빌드·기기 호환, 오른쪽 디자인 서명의 두 축으로 단순화했습니다.
- `FlowCommandBridge`가 제거된 중앙 상태 영역을 실행 중 다시 생성하지 않도록 수정했습니다.
- 모바일에서도 `BUILD`와 `DESIGNED BY` 라벨이 숨지 않도록 720px·390px 전용 간격과 글자 크기를 보정했습니다.
- `assets/css/header-meta-rail.css`를 추가해 기존 누적 CSS보다 마지막에 상단 메타 규칙을 명확히 소유하게 했습니다.
- 버전·빌드 키·서비스워커 캐시를 v1.2.8 / `1.2.8-header-meta`로 동기화했습니다.
- 상단 메타 전용 회귀 검사를 추가해 전체 자동 QA 112/112를 통과했습니다.
- 전체 설치 ZIP과 v1.2.7 덮어쓰기 패치 ZIP을 함께 생성합니다.

## v1.2.7 - Bespoke Vector Icons & Dual Distribution

- 문자형 메뉴 기호와 운영체제별 이모지를 AI 쇼츠 스튜디오 전용 SVG 라인 아이콘으로 교체했습니다.
- 파일 열기, 추천, 후보, 미리보기, 파형, 컷, 편집, 저장을 포함한 20종의 24×24 아이콘 자산을 `assets/icons/studio/`에 추가했습니다.
- `assets/css/icon-system.css`를 추가해 메뉴, 버튼, 상태 배지와 동적 UI가 같은 아이콘 문법을 사용하게 했습니다.
- 활성·비활성·실패·진행 상태는 SVG 자체 색상이 아니라 `currentColor`와 CSS mask로 표현합니다.
- 추천, 후보, 렌더, 세션 복구, 저장 완료 등 동적 모듈이 문자 기호를 다시 삽입하던 부분을 `data-icon` 기반으로 변경했습니다.
- 토스트 상태 아이콘도 성공·경고·오류·파일·저장 의미에 맞는 전용 벡터 마스크로 통일했습니다.
- 서비스워커 셸 캐시에 아이콘 CSS와 SVG 20종을 포함했습니다.
- 전체 설치 ZIP과 v1.2.6 덮어쓰기 패치 ZIP을 함께 만드는 배포 스크립트와 패치 매니페스트를 추가했습니다.
- 아이콘 자산과 이중 배포 계약을 검사하는 QA를 추가해 전체 자동 검사 111/111을 통과했습니다.
- PC 1440×1080, 모바일 390×844 Chromium 정적 렌더에서 아이콘 크기·마스크·활성 색상과 메뉴 겹침을 확인했습니다.
- 버전, 빌드 키와 서비스워커 캐시를 v1.2.7 / `1.2.7-icon-system`으로 동기화했습니다.

## v1.2.6 - Unified Editorial UI Refinement

- PC·모바일 작업 화면의 표면, 테두리, 그림자와 여백을 공통 디자인 토큰으로 통일했습니다.
- 중첩 카드와 과한 글로우를 줄이고 바깥 프레임 1개와 명암 중심의 계층 구조로 정리했습니다.
- 입력·선택·텍스트 영역, 기본 버튼과 핵심 액션 버튼의 높이·반경·포커스를 통일했습니다.
- PC 메뉴바를 하단 중앙의 8개 항목 단일 플로팅 레일로 변경했습니다.
- 모바일 메뉴바는 4열×2행을 유지하면서 높이, 대비와 아이콘·라벨 간격을 개선했습니다.
- 모바일 상단과 4단계 안내 패널을 압축하고 안내 문장을 짧게 다듬었습니다.
- 후보 카드, 업로드 영역, 파형·타임라인과 스크롤바의 시각 체계를 정리했습니다.
- `assets/css/ui-refinement.css`와 `qa/ui_refinement_smoke.js`를 추가했습니다.
- 전체 자동 QA 109/109를 통과하고 PC 1440×1080, 모바일 390×844 Chromium 정적 렌더를 확인했습니다.
- 분석·추천·렌더 엔진과 v1.2.5 단계형 로딩 구조는 변경하지 않았습니다.
- 버전, 빌드 키와 서비스워커 캐시를 v1.2.7 / `1.2.7-icon-system`로 동기화했습니다.

## v1.2.5 - Staged UI Hydration

- 초기 HTML에서 직접 실행하던 스크립트를 54개에서 39개로 줄였습니다.
- `src/boot/staged-ui-loader.js`를 추가해 보조 UI 16개를 `shell`, `editing`, `export` 단계로 분리했습니다.
- 기본 흐름·세션·안정화 UI 9개는 첫 유휴 시간 또는 사용자 접근 의도에서 로드합니다.
- 후보 비교·범위 조절·저장 준비·품질 계획 UI 6개는 후보·미리보기·편집 단계에 들어갈 때 로드합니다.
- 저장 완료 센터 1개는 내보내기 단계에 진입할 때만 로드합니다.
- 마우스 오버, 키보드 포커스, 포인터 다운과 내비게이션 요청을 사용해 클릭 전에 필요한 단계를 미리 준비합니다.
- `startup-performance.js`를 메인 앱보다 먼저 실행해 저사양 프로필과 장기 작업 감시가 초기 렌더 전에 적용되게 했습니다.
- 서비스워커 설치 시 지연 모듈 16개를 한꺼번에 내려받지 않고, 실제 첫 요청에서 `cacheFirst`로 저장하도록 변경했습니다.
- 보이는 내보내기 버튼에 남아 있던 `⬇` 기호를 메뉴와 같은 `↓` 글리프로 통일했습니다.
- 단계 로딩 전용 회귀 검사 `qa/staged_ui_loading_smoke.js`를 추가했습니다.
- 전체 자동 QA 108/108, Chromium CDP 런타임 단계 로딩 감사 오류 0건을 확인했습니다.
- 버전, 빌드 키와 서비스워커 캐시를 v1.2.5 / `1.2.5-icon-system`로 동기화했습니다.

## v1.2.4 - Navigation Focus & Studio Glyphs

- 파일을 열면 분석 시작과 동시에 `추천` 화면으로 이동하고, 분석 완료 후 후보 화면으로 이어지도록 진행 내비게이션을 수정했습니다.
- 앱 진행 이벤트가 `FlowCommandBridge`와 `FlowDirectorFinal`을 우선 사용하도록 내비게이션 소유권을 단일화했습니다.
- PC Prime 작업실에서 현재 대상 패널에 `현재 작업` 표시, 외곽 강조와 짧은 포커스 펄스를 적용했습니다.
- 메뉴의 활성 항목에 `aria-current=step`을 적용하고 가로 메뉴에서 활성 항목이 중앙으로 보이도록 했습니다.
- 상단 버전 바로 옆에 CSS 기반 기기 아이콘과 `모바일 · PC 호환` 문구를 추가했습니다.
- 주요 메뉴 기호를 `＋ ✦ ◆ ▶ ∿ ✂ ◫ ↓` 스튜디오 글리프로 통일했습니다.
- 자동 QA 106/106과 합성 WAV 진행 흐름 검사를 통과했습니다.

## v1.2.3 - Shorts Pulse Hero

- 상단을 쇼츠의 세로 비율과 빠른 컷 흐름이 직접 보이는 `Shorts Pulse Hero`로 개편했습니다.
- 큰 제품명, 0:00 → 0:15 컷 타임라인, 9:16 프레임과 HOOK·BEAT·CAPTION 큐를 배치했습니다.
- 모바일에서는 PC용 세로 프레임과 시작 액션을 숨겨 하단 메뉴바와 역할이 겹치지 않게 했습니다.
- 상단 메타를 버전·쇼츠 스튜디오·로컬 상태·디자인 서명의 한 기준선으로 통일했습니다.
- 자동 QA 105/105와 응답성 런타임 감사를 통과했습니다.

## v1.2.2 - Editorial Masthead & Viewport Rendering Diet

- 상단을 장식형 컨트롤 데크에서 고급 편집 도구의 에디토리얼 마스트헤드로 재구성했습니다.
- 버전과 `Design by 곰같은여우`를 테두리 배지에서 텍스트형 메타 레일로 바꿨습니다.
- 필름 스트립, 뷰파인더 코너, 회전 릴과 제목 밑 장식선을 제거했습니다.
- 오른쪽 시작 영역의 중첩 카드 테두리를 없애고 하나의 세로 구분선과 시작 레일로 연결했습니다.
- 기존 `cinematic-hero.css` 로딩과 프리캐시를 제거하고 상단 스타일을 `hero-command-deck.css` 하나로 통합했습니다.
- 첫 화면 밖 상세 패널에 `content-visibility: auto`를 적용해 초기 페인트를 지연했습니다.
- 자동 QA 105/105와 응답성 런타임 감사를 통과했습니다.

## v1.2.1 - Cinematic Command Deck Hero

- 상단 구역을 단순 브랜드 배너에서 시네마틱 스튜디오 컨트롤 데크로 전면 개편했습니다.
- PC 상단을 브랜드 카피와 `STUDIO READY` 시작 패널의 2열 구조로 구성했습니다.
- `새 프로젝트 시작` 액션을 기존 `fileInput`과 연결해 별도 상태 로직 없이 즉시 원본을 선택할 수 있습니다.
- 로컬 처리, 자동 추천, 9:16 렌더 등 제품의 핵심 가치를 상단 기능 칩으로 정리했습니다.
- 필름 릴, 뷰파인더 프레임, 그리드와 스펙트럼 타이포그래피를 사용하되 실제 작업 정보를 전달하도록 구성했습니다.
- 모바일에서는 시작 패널과 플랫폼 스트립을 숨겨 하단 메뉴바와 기능이 중복되지 않도록 했습니다.
- 저사양 모드와 모션 감소 설정에서 릴 회전, 색상 흐름과 블러를 줄이는 폴백을 추가했습니다.
- 키보드 포커스 표시와 로컬 처리 안내 문구를 유지해 접근성과 신뢰성을 강화했습니다.
- `assets/css/hero-command-deck.css`와 `qa/hero_command_deck_smoke.js`를 추가했습니다.
- 버전, 빌드 키와 서비스워커 캐시를 v1.2.1로 동기화했습니다.
- 전체 QA를 104개로 확장했습니다.

## v1.2.0 - Runtime Responsiveness & Menu Bar Terminology

- 사용자에게 보이는 `Dock` 명칭을 `메뉴바`로 통일했습니다.
- 사이트 초기화 직후 메인 스레드가 점유되어 `페이지 응답 없음`이 발생하는 현상을 재현했습니다.
- 추천 개수, 후보 목록, 메뉴 상태를 감시하던 여러 MutationObserver의 피드백 루프를 제거했습니다.
- 텍스트, 속성, 클래스와 활성 메뉴는 실제 값이 달라질 때만 변경하도록 멱등성 가드를 추가했습니다.
- `flow-polish`와 `flow-doctor`에 상태 시그니처 기반 중복 프레임 건너뛰기를 적용했습니다.
- 후보·작업 공간 Observer가 자체 속성 변경을 다시 감지하지 않도록 관찰 범위를 좁혔습니다.
- Update Sentinel의 현재 캐시 식별을 새 빌드 키와 일치시켰습니다.
- 런타임 응답성 회귀 검사 `qa/runtime_responsiveness_smoke.js`를 추가했습니다.
- 전체 QA를 103개로 확장했습니다.

## v1.1.9 - Desktop Prime Workspace & Mobile Flow Landing

- PC 화면을 3열 Prime 작업실로 재구성했습니다.
- PC에서 불러오기, 추천, 미리보기, 후보, 파형을 동시에 확인할 수 있게 했습니다.
- 컷, 정밀 편집, 저장, 프로젝트 영역을 같은 분할 그리드의 다음 행으로 연결했습니다.
- 모바일 첫 화면의 파일 열기/프로젝트 불러오기 중복 카드를 제거했습니다.
- 모바일 본문을 4단계 진행 순서 안내로 단순화하고 파일 선택은 하단 메뉴바에 맡겼습니다.
- 상단 버전과 `Design by 곰같은여우`를 같은 줄 양 끝에 정렬했습니다.
- 제목 아래 제품 설명의 최대 폭과 좌우 안쪽 여백을 조정했습니다.
- `assets/css/desktop-prime-layout.css`와 `qa/desktop_prime_layout_smoke.js`를 추가했습니다.
- 전체 QA를 102개로 확장했습니다.

## v1.1.8 - Foundation UX & Runtime Performance

- 첫 화면을 실제 시작 명령과 4단계 워크플로 중심으로 재구성했습니다.
- 중복된 자동 분석/편집 안내 그룹을 숨기고, 파일을 연 뒤 시작 패널이 접히도록 했습니다.
- 히어로, 카드, 메뉴바의 높이와 여백을 줄여 작업 밀도를 개선했습니다.
- 모바일 상단 호환성 배지를 정리해 브랜드와 시작 버튼이 먼저 보이도록 했습니다.
- `src/ui/ux-controls.js`의 700ms 반복 동기화를 이벤트 기반 프레임 배치 방식으로 교체했습니다.
- `src/ui/range-drag-controls.js`의 500ms DOM 재생성을 제거하고 상태 시그니처 기반 갱신을 적용했습니다.
- `src/ui/startup-performance.js`를 추가해 저사양·데이터 절약·모션 감소 환경에 자동 대응합니다.
- `assets/css/foundation-polish.css`를 추가해 UI 계층, 반응형과 저사양 렌더링을 최종 보정합니다.
- `qa/runtime_performance_smoke.js`를 추가했습니다.
- 전체 QA를 101개로 확장했습니다.

## v1.1.7 - Update Sentinel + Engine Boost Profile

- 정보 모달에 업데이트 적용 상태와 캐시 진단 기능을 추가했습니다.
- 브라우저 성능을 MAX-STABLE / PRO-STABLE / SAFE-STABLE로 감지하는 엔진 프로필을 추가했습니다.

## v1.5.3 - Settings Ownership & Repeated-Run Stability

- 자막, 출력 품질, 자동 컷 설정의 정규화·저장·UI 동기화를 `src/app/settings-controller.js`로 분리했습니다.
- 메인 앱은 설정 세부 DOM 처리 대신 전용 컨트롤러 API를 호출하도록 단순화했습니다.
- 자막 크기·줄 수·투명도, 품질 범위, 컷 민감도 값을 중앙에서 경계 처리합니다.
- 설정 프리셋과 초기화가 같은 저장·동기화 경로를 사용하도록 통합했습니다.
- 분석·미리보기·렌더 작업을 20회 반복하는 operation cleanup 감사를 추가해 잔류 작업 0건을 확인합니다.
- 신규 설정 컨트롤러 동작 검사를 추가하고 서비스워커 오프라인 셸에 포함했습니다.
- 자동 QA **152/152**, PC·모바일 Chromium, MP3·MP4·취소·재시도·10분 미디어, 서비스워커 생명주기 감사를 통과했습니다.

## v1.5.3
- 프로젝트 저장/불러오기 책임을 `src/app/project-io-controller.js`로 분리했습니다.
- 프로젝트 파일 크기 사전검사, 적용, 진단 기록, UI 동기화를 단일 경로로 통합했습니다.
- 렌더 옵션 정규화 결과를 최대 24개로 제한된 LRU 렌더 플랜 캐시에 재사용합니다.
- 렌더 플랜 캐시의 통계·명시적 정리 API와 회귀 검사를 추가했습니다.
- 프로젝트 입출력 및 렌더 준비 캐시 검사를 포함해 자동 QA를 확장했습니다.


## v1.5.3 - media ownership and render-frame efficiency

- Added `src/app/media-import-controller.js` as the single owner of media intake and source Object URLs.
- Previous source Object URLs are revoked before replacement and the active URL is revoked during page disposal.
- Stale delayed auto-analysis is blocked by both media-session identity and import sequence.
- Added bounded canvas-context caches for the base frame gradient and repeated text measurements.
- Updated architecture-sensitive QA so moved responsibilities are checked in their owning controller rather than by brittle `app.js` string assumptions.
- Fresh Chromium desktop/mobile audit was generated for v1.5.3.
- The full real-media suite was attempted, but the combined runner exceeded the available execution window after completing early scenarios. The previously validated v1.5.2 full media artifact is retained as the regression contract; this limitation is explicitly carried forward.
- All source, packaging, service-worker, controller, cache and regression checks pass: 161/161.

## v1.5.3 - Repeated Real-Media Heap Stability Audit

- Added a same-page 20-cycle Chromium audit covering real MP3 import, analysis, recommendation generation, one-second rendering, and download cleanup.
- Added forced-GC V8 heap sampling through CDP and trend checks using warm-window/last-window medians plus per-cycle slope.
- Instrumented source and export Object URLs to verify one live source during work, no accumulating export URLs, and zero active URLs after disposal.
- Added fast regression validation of the committed browser audit artifact to the regular QA suite.
- Documented that V8 heap evidence does not fully cover GPU memory, whole-process RSS, or native media-decoder allocations.
- The 20-cycle audit passed with 0.381 MiB median-window growth, -0.011 MiB/cycle slope, all 40 Object URLs revoked, and the full automated suite at 162/162.
