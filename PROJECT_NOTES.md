# PROJECT NOTES v1.5.28

## 분석 namespace 보존·표시 규칙

- 일반 `prunePersistent()`는 현재 namespace의 TTL·LRU·용량 한도만 정리하고 이전 namespace를 자동 삭제하지 않습니다.
- 이전 namespace 전체 삭제는 `cleanupLegacyNamespaces: true`를 명시한 내부 작업 또는 사용자가 선택한 namespace 정리에서만 수행합니다.
- 상태 요약은 현재 namespace에만 원문을 허용하고, 이전 namespace는 이중 FNV 기반 16자리 `namespaceToken`만 외부에 제공합니다.
- namespace 상태에는 항목 수, 추정 바이트, 마지막 접근, 계약·앱 버전, tier 집합을 포함하되 파일명·경로·원시 키·분석 결과는 포함하지 않습니다.
- 현재 namespace는 선택 삭제 API에서 항상 제외하며 중복·알 수 없는 토큰은 삭제하지 않습니다.

## 유지보수 이력 규칙

- 이력 한도는 `ANALYSIS_CACHE_MAINTENANCE_HISTORY_LIMIT=20`입니다.
- 기록 대상은 단일/다중 항목 삭제, 조건별 무효화, 선택 namespace 삭제, 현재 cache clear, 자동 TTL/LRU/quota 정리입니다.
- 이력은 데이터베이스 토큰별 localStorage에 best-effort로 저장하고 최신 항목부터 제한 개수만 유지합니다.
- 이력에는 작업 유형·시각·삭제 개수·바이트·조건·비식별 토큰만 저장하며 원시 캐시 키와 이전 namespace 원문을 저장하지 않습니다.
- localStorage가 비활성·손상·quota 상태여도 캐시 핵심 동작은 실패하지 않아야 합니다.

## 저장소 진단 UI 규칙

- 상태 새로고침 시 현재·이전 namespace와 유지보수 이력을 함께 갱신합니다.
- 이전 namespace만 checkbox를 제공하고 현재 namespace는 보호 상태로 표시합니다.
- 선택 정리 완료 뒤 캐시 통계, namespace 목록, 이력을 한 번에 다시 읽습니다.
- 기존 캐시 항목 선택 삭제·조건별 무효화 UI와 namespace 선택 상태를 섞지 않습니다.

## QA·배포 기준

- 자동 QA 기준은 **212/212**입니다.
- 4개 viewport runtime error, Promise rejection, console error, horizontal overflow는 0이어야 합니다.
- CSS 실제 conflict·same-value duplicate·shadowed declaration은 0, `!important`는 593개를 유지해야 합니다.
- 런타임 build key는 `1.5.28-analysis-namespace-maintenance-history`입니다.
- 새 배포 전 integrity manifest를 다시 생성하고 version sync·서비스워커 콘텐츠 무결성·배포 패키지 검사를 통과해야 합니다.
- 상속 감사 파일에는 근거 버전과 상속 이유를 JSON 필드로 명시합니다.

## 다음 우선순위

1. 옵션 signature별 캐시 상태 필터·저장 비용 추세
2. 서비스워커 자산별 실패 상세·수동 롤백 UI
3. 중요 백업 보존 정책·복구 이력 편집
4. 실제 모바일 브라우저와 물리 GPU 장시간 검증

---

# PROJECT NOTES HISTORY — v1.5.27

## 분석 캐시 계약·선택 무효화 규칙

- 분석 캐시 계약 버전은 `ANALYSIS_CACHE_CONTRACT_VERSION=2`, namespace는 `analysis-contract-v2`입니다.
- 영구 레코드는 앱 버전, 계약 버전, 분석 tier, sample rate, motion sample 수, 옵션 signature를 개인정보 비노출 프로필로 저장합니다.
- 목록 식별자는 원시 캐시 키가 아닌 FNV-1a 비식별 토큰이며 여러 토큰을 한 번에 삭제할 수 있습니다.
- 조건별 무효화는 균형·속도·품질 tier 또는 현재 계약과 다른 레코드만 제거합니다.
- 이전 namespace 레코드는 TTL/LRU 정리와 구분해 별도 통계로 기록합니다.

## 서비스워커 감사 제어 규칙

- 실패 자산 재시도 명령은 최근 무결성 보고서의 누락·HTTP 오류·해시 불일치 자산만 대상으로 하며 기존 백오프를 우회합니다.
- 재다운로드 후 SHA-256을 다시 검증하고 성공 자산은 백오프 상태를 제거합니다.
- 감사 이력 초기화는 history·backoff·latest 상태를 선택적으로 초기화하며 앱 셸 캐시는 보존합니다.
- 등록 계층은 요청 ID와 제한 시간으로 메시지 응답을 연결해 다른 상태 요청과 결과가 섞이지 않도록 합니다.

## 중요 백업 이동·메타데이터 규칙

- 중요 백업 내보내기 형식은 `protected-session-backup` formatVersion 1 JSON 봉투입니다.
- 파일에는 검증 가능한 저장 스냅샷과 최대 60자 이름·240자 메모가 포함됩니다.
- 가져오기는 파일 크기, 형식, 스냅샷 디코딩, 체크섬과 프로젝트 스키마 검증을 통과해야 중요 슬롯에 저장됩니다.
- 중요 백업 메타데이터는 별도 localStorage 키에 저장하며 보호 해제·전체 세션 삭제 시 함께 제거됩니다.

## QA·배포 기준

- 자동 QA 기준은 **211/211**입니다.
- 4개 viewport runtime error, Promise rejection, console error, horizontal overflow는 0이어야 합니다.
- CSS 실제 conflict·same-value duplicate·shadowed declaration은 0, `!important`는 593개를 유지해야 합니다.
- 런타임 build key는 `1.5.27-selective-cache-integrity-retry-portable-backup`입니다.
- 미디어 소유 경로가 변경되지 않았으므로 장시간 감사 근거는 v1.5.24 결과를 명시적으로 상속합니다.
- 배포 전 `node tools/generate-integrity-manifest.js` 실행 후 전체 QA를 다시 통과해야 합니다.

## 다음 우선순위

1. 이전 분석 namespace 상태 표시와 선택 정리 이력
2. 서비스워커 자산별 실패 상세·수동 롤백 UI
3. 중요 백업 보존 정책·복구 이력 편집
4. 실제 모바일 브라우저와 물리 GPU 장시간 검증
---

# PROJECT NOTES HISTORY — v1.5.22


## 저장소 관리 규칙

- 앱의 localStorage 쓰기는 `AIShortsStorageManager.safeSet()`을 사용해 quota 및 비정상 저장소 오류를 공통 처리합니다.
- quota 오류 시 현재 쓰는 키를 보존하고 오래된 세션 백업·레거시 세션을 최대 3개 정리한 뒤 한 번만 재시도합니다.
- 수동 정리는 현재 세션과 현재 앱 셸 캐시를 보존하며 다른 사이트·다른 앱의 저장 데이터는 삭제하지 않습니다.
- 저장소 사용률은 80% 이상 `warning`, 92% 이상 `critical`로 분류합니다.

## 세션 연속성 규칙

- 현재 세션 스키마는 **v4**, 순환 백업은 **2개**, 백업 한도는 항목당 **750,000자**입니다.
- 구버전 세션은 읽은 즉시 v4로 마이그레이션하고 정상 저장이 가능하면 기본 키에 다시 기록합니다.
- 기본 세션이 손상되면 최신 정상 백업을 순서대로 검사해 복원하고, 복원 성공 시 기본 키를 자동 수리합니다.
- 원본 세션 내보내기는 정상 데이터의 원문을 보존하고, 손상 데이터 내보내기는 원문과 오류 이유를 함께 보존합니다.

## 서비스워커 진단 규칙

- 업데이트 확인은 최대 3회 수행하며 재시도 간격은 500ms, 1,000ms의 지수 백오프입니다.
- 상태에는 마지막 검사·성공·오류·다음 재시도 시각과 설치 보고서의 성공/실패/복구/캐시 항목 수를 포함합니다.
- 활성 서비스워커에 상태 요청 메시지를 보내 마지막 설치 보고서를 다시 받을 수 있어야 합니다.

## QA·배포 기준

- 자동 QA 기준은 **192/192**입니다.
- 4개 viewport runtime error, Promise rejection, console error, horizontal overflow는 0이어야 합니다.
- CSS 실제 충돌·same-value duplicate·shadowed declaration은 0을 유지해야 합니다.
- 런타임 build key는 `1.5.22-storage-quota-session-recovery`입니다.

## 다음 우선순위

1. 작은 파일 전체 해시·대형 파일 적응형 표본을 사용하는 분석 지문 정책
2. 지문 생성 비용과 분석 캐시 적중/실패 진단
3. 서비스워커 실패 자산 재시도·캐시 무결성 검사·복구 동작 고도화
4. 실제 모바일 브라우저와 물리 GPU 장시간 검증

---

# PROJECT NOTES HISTORY — v1.5.21 Persistence & Recovery Patch

## 지속 데이터 규칙

- 후보 핀 ID는 공백 제거, 길이 160자 제한, 중복 제거 후 최대 12개만 저장합니다.
- 현재 추천 후보가 준비된 시점에만 오래된 핀을 제거해 초기 로딩 중 정상 데이터를 잃지 않습니다.
- 외부 또는 오래된 UI가 전달한 알 수 없는 후보 ID는 저장하지 않습니다.

## 분석 캐시 식별 규칙

- 캐시 키는 이름, MIME, 상대 경로, 크기, 수정 시각, 길이, 분석 품질 설정과 콘텐츠 표본 지문을 포함합니다.
- 콘텐츠 지문은 파일 앞·중간·끝에서 각각 최대 16KB를 읽어 생성합니다.
- 동일 콘텐츠 재선택은 재사용 가능하며, 동일 메타데이터의 다른 콘텐츠는 별도 키가 되어야 합니다.

## 서비스워커·다운로드 규칙

- 선택 셸 자산 실패는 설치 보고서에 기록하되 핵심 셸이 정상이면 활성화를 허용합니다.
- 핵심 셸 실패는 새 캐시를 삭제하고 설치를 거부해 이전 정상 워커를 보존합니다.
- Object URL은 최소 10초 이상 유지하고 기본 45초 후 해제하며, 페이지 종료 시 남은 URL을 정리합니다.

## QA·배포 기준

- 자동 QA 기준은 **186/186**입니다.
- 4개 viewport runtime error, Promise rejection, console error, horizontal overflow는 0이어야 합니다.
- 런타임 build key는 `1.5.21-persistence-recovery-cache-download`입니다.

## 다음 우선순위

1. 서비스워커 설치 보고서와 저장소 사용량을 사용자 진단 화면에서 직접 확인
2. localStorage·Cache Storage 용량 초과 시 자동 정리와 사용자 안내
3. 작은 파일 전체 해시·대형 파일 가변 표본을 사용하는 분석 지문 정책 고도화
4. 모바일 Safari·Samsung Internet과 물리 GPU 환경 반복 검증

---

# PROJECT NOTES HISTORY — v1.5.20 Runtime Safety Patch

## 런타임 캐시 규칙

- 서비스워커는 navigation, manifest, worker control asset을 별도 network-first 경로로 처리합니다.
- runtime cache-first는 `assets/`, `src/` 아래 style·script·worker·image·font에만 적용합니다.
- media, JSON, 프로젝트 데이터, API형 요청은 Cache Storage에 넣지 않습니다.
- URL pathname이 `/`로 끝나는지만으로 navigation을 판정하지 않습니다.

## 버전 규칙

- 사용자·진단·엔진 메타데이터는 `AIShortsRuntimeConfig.APP_VERSION`을 기준으로 합니다.
- build key는 `1.5.21-persistence-recovery-cache-download`입니다.
- 자동 QA 기준은 **182/182**입니다.

---

# PROJECT NOTES HISTORY — v1.5.20 Structure Priority

## 구조·반응형 priority 감축 규칙

- 구조 우선순위는 desktop, small laptop, tablet, mobile viewport와 flow·workspace 상태에서 실제 Chromium 계산 스타일로 검증합니다.
- 선언의 `!important`를 제거했을 때 matched element의 geometry와 주요 computed style이 모두 같을 때만 normal cascade로 전환합니다.
- shorthand는 CSSOM longhand 확장 때문에 자동 제거하지 않고, 직접 매핑되는 source declaration만 감축합니다.
- Dock display·minimum size와 preview·waveform focus grid처럼 제거 시 값이 바뀌는 선언은 유지합니다.
- CSS conflicts, same-value duplicates, shadowed declarations는 계속 0을 유지합니다.

## QA·배포 기준

- 자동 QA 기준은 **180/180**입니다.
- 활성 `!important` 기준은 **593**입니다.
- `runtime-structure-priority-v1.5.21.json`은 v1.5.19 기준 73개 제거 기록을 보존해야 합니다.
- `runtime-browser-audit-v1.5.21.json`의 핵심 layout metrics는 v1.5.19와 동일해야 합니다.
- 4개 viewport runtime error와 horizontal overflow는 0이어야 합니다.
- process memory audit는 runtime error 0, active operation 0, render queue 0을 만족해야 합니다.
- long video audit는 미디어 실행 경로 미변경으로 v1.5.9 상속 계약을 사용합니다.
- 런타임 build key는 `1.5.21-structure-responsive-priority`입니다.

## 다음 우선순위

1. `ui-refinement.css`와 hero command surface의 남은 구조 priority 추가 감축
2. 물리 GPU가 있는 데스크톱 Chromium에서 hardware acceleration 비교
3. 15분·30분 30fps 카메라형·고비트레이트 원본 반복 검증
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# PROJECT NOTES HISTORY — v1.5.13

## Zero-conflict CSS cascade 규칙

- exact selector와 동일 at-rule context에서 최종 winner가 확정된 경우에만 앞선 loser declaration을 제거합니다.
- selector group 일부만 대상이면 규칙을 selector별로 분리해 다른 selector의 fallback을 보존합니다.
- 서로 다른 값을 갖는 selector-property conflict는 0을 유지합니다.
- 동일 값 중복은 conflict가 아니며 독립 stylesheet fallback 여부를 검토한 뒤 별도 단계에서 제거합니다.
- token은 최종 `foundation-polish.css` 또는 해당 반응형 소유 파일에서만 다른 값을 선언합니다.

## QA·배포 기준

- 자동 QA 기준은 **172/172**입니다.
- CSS 상한은 활성 `!important` 833, 실제 충돌 0, medium/high-risk 0, shadowed declaration 0입니다.
- 4개 viewport runtime error와 horizontal overflow는 0이어야 하며 v1.5.12 전체 DOM targeted computed style을 유지합니다.
- process memory audit는 16회 이상, runtime error 0, active operation 0, render queue 0을 만족해야 합니다.
- GPU/media 비교는 두 모드 디코딩 성공, GPU process·media utility process 관측, runtime error 0을 만족해야 합니다.
- long video audit는 실행 경로 미변경으로 `runtime-long-video-stability-v1.5.13.json`의 v1.5.9 상속 계약을 사용합니다.
- 런타임 build key는 `1.5.13-cascade-ownership`입니다.

## 다음 우선순위

1. same-value duplicate CSS와 `!important` 안전 감축
2. 물리 GPU가 있는 데스크톱 Chromium에서 hardware acceleration 비교
3. 15분·30분 30fps 카메라형·고비트레이트 원본 반복 검증
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# PROJECT NOTES HISTORY — v1.5.12

## Surface·state CSS 소유권 규칙

- exact selector와 동일 at-rule context에서 뒤쪽 declaration이 완전히 덮는 medium-risk loser만 제거합니다.
- selector group의 일부만 충돌할 때는 rule을 selector별로 분리해 비충돌 selector의 선언을 보존합니다.
- `.field` gap/color/font-weight는 `ui-refinement.css`가 소유합니다.
- disabled opacity는 `ui-refinement.css`, disabled cursor는 각 구조 파일이 소유합니다.
- auto-cut surface는 `shutter-glass-flow.css`, cinematic brand surface는 `hero-command-deck.css`가 소유합니다.
- console surface background는 `shutter-glass-flow.css`, shadow/padding은 `foundation-polish.css`가 소유합니다.
- engine status, recommendation action, status dot의 최종 skin은 CSS audit snapshot으로 고정합니다.

## QA·배포 기준

- 자동 QA 기준은 **171/171**입니다.
- CSS 상한은 활성 `!important` 833, 실제 충돌 48, medium/high-risk 충돌 0, shadowed declaration 51입니다.
- 4개 viewport runtime error와 horizontal overflow는 0이어야 하며 v1.5.11 targeted computed style을 유지합니다.
- process memory audit는 16회 이상, runtime error 0, active operation 0, render queue 0을 만족해야 합니다.
- GPU/media 비교는 두 모드 디코딩 성공, GPU process·media utility process 관측, runtime error 0을 만족해야 합니다.
- long video audit는 실행 경로 미변경으로 `runtime-long-video-stability-v1.5.12.json`의 v1.5.9 상속 계약을 사용합니다.
- 런타임 build key는 `1.5.12-surface-state-ownership`입니다.

## 다음 우선순위

1. 남은 low-risk geometry·token·fallback CSS ownership 통합
2. 물리 GPU가 있는 데스크톱 Chromium에서 hardware acceleration 비교
3. 15분·30분 30fps 카메라형·고비트레이트 원본 반복 검증
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# PROJECT NOTES HISTORY — v1.5.11

## Hero typography·interaction 소유권 규칙

- `.hero-compact-note` generic max-width는 `layout-dock.css`, color는 `glass-pro-ui.css`가 소유합니다.
- cinematic hero base width/max-width와 base min-height는 `hero-command-deck.css`가 소유합니다.
- desktop/mobile 최종 hero typography와 height는 `ui-refinement.css`가 소유합니다.
- workspace reveal animation은 `motion-stability.css`, document scroll behavior는 `shutter-glass-flow.css`가 소유합니다.

## QA·배포 기준

- 자동 QA 기준은 **171/171**입니다.
- CSS 상한은 `!important` 841, conflicts 197, high-risk 0, shadowed 212입니다.
- 런타임 build key는 `1.5.11-hero-gpu-ownership`입니다.

---

# PROJECT NOTES HISTORY — v1.5.10

## Command·control CSS 소유권 규칙

- retired `.command-group*`, `.command-button*`, `.command-chip*` selector와 관련 DOM probe는 다시 추가하지 않습니다.
- control zone·preview card의 surface background는 `shutter-glass-flow.css`, 내부 padding은 `foundation-polish.css`가 소유합니다.
- `.panel-head` spacing, `.upload-tile`, select·textarea 최종 skin은 `ui-refinement.css`가 소유합니다.
- HyperFlow stage visibility는 `studio-experience.css`, legacy action dock visibility와 source media containment는 `layout-dock.css`가 소유합니다.
- 구조·배치 파일은 위 최종 skin·visibility 속성을 다시 선언하지 않습니다.

## QA·배포 기준

- 자동 QA 기준은 **168/168**입니다.
- CSS 상한은 활성 `!important` 853, 실제 충돌 214, 고위험 충돌 11, shadowed declaration 239입니다.
- 4개 viewport runtime error와 horizontal overflow는 0이어야 하며 v1.5.9의 계산 스타일을 유지합니다.
- process memory audit는 16회 이상, runtime error 0, active operation 0, render queue 0을 만족해야 합니다.
- long video audit는 실행 경로 미변경으로 `runtime-long-video-stability-v1.5.10.json`의 v1.5.9 상속 계약을 사용합니다.
- 런타임 build key는 `1.5.10-control-ownership`입니다.

## 다음 우선순위

1. hardware-accelerated Chromium에서 GPU·media decoder memory 비교
2. 15분·30분 30fps 카메라형·고비트레이트 원본 반복 검증
3. 남은 hero/header typography·interaction 충돌 통합
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# PROJECT NOTES HISTORY — v1.5.9

## 핵심 UI skin 소유권 규칙

- brand panel, version badge, bottom dock의 최종 background·border·backdrop skin은 `shutter-glass-flow.css`가 소유합니다.
- brand signature의 최종 glass skin은 `glass-pro-ui.css`가 소유합니다.
- 일반 primary/secondary button의 최종 visual skin은 `ui-refinement.css`가 소유합니다.
- 구조·배치·상호작용 파일은 위 skin 속성을 다시 선언하지 않습니다.
- computed style을 바꾸지 않는 완전 shadowed 선언부터 제거하는 원칙을 유지합니다.

## Long video audit 규칙

- `qa/run_long_video_stability.py`는 같은 Chromium 페이지에서 15분→30분→15분 1920×1080 MP4를 교체합니다.
- 각 반복은 실제 파일 열기, 자동 분석, 추천, 2초 출력, queue 정리, 강제 GC, Object URL 상태 수집을 포함합니다.
- 장시간 미디어는 `sequential-safe`, 적응형 분석 샘플레이트, 제한된 motion sample, decoded buffer 비보존 조건을 만족해야 합니다.
- 각 반복 뒤 operation과 render queue는 0이어야 하고 source URL은 하나만 활성화되며 dispose 뒤 모든 URL은 0이어야 합니다.

## QA·배포 기준

- 자동 QA 기준은 **167/167**입니다.
- CSS 상한은 활성 `!important` 875, 실제 충돌 271, 고위험 충돌 50, shadowed declaration 314입니다.
- 4개 viewport runtime error와 horizontal overflow는 0이어야 합니다.
- process memory audit는 16회 이상, runtime error 0, active operation 0, render queue 0을 만족해야 합니다.
- long video audit는 15분→30분→15분 전 구간 통과와 최종 Object URL 0을 만족해야 합니다.
- 런타임 build key는 `1.5.9-long-video-skin`입니다.

## 다음 우선순위

1. hardware-accelerated Chromium에서 GPU·media decoder memory 비교
2. 15분·30분 30fps 카메라형·고비트레이트 원본 반복 검증
3. command group·control zone의 남은 CSS ownership 통합
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# PROJECT NOTES HISTORY — v1.5.8


## Responsive token·CSS 소유권 규칙

- 공통 shell gutter, top/bottom clearance, hero title scale은 `theme.css`의 `--responsive-*` token이 소유합니다.
- header topline의 display, columns, alignment, gap, mobile min-height는 `header-meta-rail.css`만 소유합니다.
- 1180px 이상 shell width/padding-bottom과 720px 이하 title typography는 `ui-refinement.css`만 소유합니다.
- 현재 단계 표시는 `active-stage-beacon.css`의 rail/chip을 사용하며 이전 `is-navigation-target::after` 라벨은 다시 만들지 않습니다.
- tablet dock geometry와 desktop workspace grid 소유권은 v1.5.7 계약을 유지합니다.

## Process memory audit 규칙

- `qa/run_process_memory_audit.py`는 동일 Chromium 세션에서 UI navigation을 반복하며 process tree RSS/USS와 renderer JS heap을 수집합니다.
- GPU·media utility는 Chromium command line process category 기반 보조 지표이며 decoder buffer의 정확한 귀속으로 해석하지 않습니다.
- headless GPU와 실제 hardware browser의 차이를 명시하며 long MP4 실미디어 검증을 대체하지 않습니다.

## QA·배포 기준

- 자동 QA 기준은 **166/166**입니다.
- CSS 상한은 활성 `!important` 879, 실제 충돌 304, 고위험 충돌 69, shadowed declaration 372입니다.
- 4개 viewport runtime error와 horizontal overflow는 0이어야 하며 v1.5.7의 hero/dock 계산 높이를 유지합니다.
- process memory audit는 16회 이상, runtime error 0, active operation 0, render queue 0을 만족해야 합니다.
- 런타임 build key는 `1.5.8-responsive-memory`입니다.

## 다음 우선순위

1. 15분·30분 고해상도 MP4 장시간 분석·렌더·파일 교체 반복 검증
2. hardware-accelerated Chromium에서 GPU·media decoder memory 비교
3. brand-panel, bottom-dock, button skin의 남은 고위험 CSS 소유권 통합
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# PROJECT NOTES HISTORY — v1.5.5


## 모바일 컨트롤 소유권 규칙

- 모바일 toast bottom은 `mobile-menu-guide.css`만 소유합니다.
- HyperFlow dock geometry는 기본·모바일 `ui-refinement.css`, 1180px 이상 `foundation-polish.css`가 소유합니다.
- transport·preview·export 버튼의 최소 크기, padding, radius, font-size는 `flow-doctor.css`가 소유합니다.
- 시작 안내 패널은 desktop 표시 여부 `desktop-prime-layout.css`, 모바일 surface·workflow step `ui-refinement.css`로 분리합니다.
- HyperConnect용 generic dock selector는 반드시 `body[data-ui="hyperconnect-flow"]`로 scope합니다.

## v1.5.5 QA·배포 기준

- 자동 QA 기준은 **162/162**입니다.
- CSS 상한은 활성 `!important` 866, 실제 충돌 342, 고위험 충돌 89, shadowed declaration 431입니다.
- v1.5.4 대비 visible computed style 변경 없이 데스크톱·모바일 오류와 가로 overflow가 0이어야 합니다.
- 런타임 build key는 `1.5.5-mobile-control-ownership`입니다.

## 다음 우선순위

1. Chromium process RSS와 GPU/미디어 native memory 보조 계측
2. 15분·30분 고해상도 MP4 장시간 분석·출력 반복 검증
3. 남은 고위험 layout·skin selector의 다음 소유권 묶음 통합

---

## v1.5.4 기준에서 이어받은 CSS 소유권 규칙

## CSS 소유권 규칙

- 감사 대상 cascade는 `index.html`에 실제 연결된 45개 CSS만 사용하며, 보관 파일은 별도 inventory로 기록합니다.
- 충돌 단위는 동일 at-rule context의 동일 selector와 property입니다. 값 또는 `!important`가 다를 때만 실제 충돌로 분류합니다.
- 추천 카드: 구조는 `studio.css`, 상호작용은 `ux.css`, backdrop 재질은 `glass-pro-ui.css`, 기본·선택 스킨은 `ui-refinement.css`가 소유합니다.
- 모바일 시네마틱 헤더의 min-height, padding, border-radius, background, box-shadow는 `ui-refinement.css`가 소유합니다.
- 1180px 이상 기본 작업 그리드의 columns, areas, rows, column-gap, row-gap은 `workspace-layout-controls.css`가 소유합니다. display, width, margin은 `desktop-prime-layout.css`가 소유합니다.
- 소유권 통합은 최종 computed style을 바꾸지 않는 완전 shadowed 선언부터 제거합니다.

## QA·배포 기준

- 현재 자동 QA 기준은 **162/162**입니다.
- CSS 상한은 활성 `!important` 898, 실제 충돌 511, 고위험 충돌 198, shadowed declaration 675입니다.
- PC·모바일 Chromium 오류와 가로 overflow는 0이어야 하며, 데스크톱 workspace 리사이즈·집중 모드가 유지되어야 합니다.
- 런타임 CSS 변경 시 APP_VERSION, BUILD_KEY, HTML asset query, 서비스워커 cache name을 함께 올립니다.
- CSS-only 릴리스는 JS 미디어 경로가 동일함을 명시할 때 직전 실미디어·힙 감사 결과를 상속할 수 있지만, 브라우저·CSS·서비스워커 감사는 새 버전으로 재생성합니다.

---

# PROJECT NOTES v1.5.0

## UI·UX 소유권

- `AIShortsStudioExperience`는 소개/작업실 모드, 진행률, 현재 설명, 상황별 다음 행동만 소유합니다.
- 기존 분석·추천·미리보기·렌더 기능을 복제하지 않고 DOM 상태와 외부 요청 이벤트를 통해 연결합니다.
- 작업을 시작하면 소개 영역을 접되 `소개 보기`로 복원할 수 있어야 합니다.
- 분석·렌더처럼 취소 가능한 긴 작업은 같은 상태 카드에서 취소 또는 재시도 행동을 제공해야 합니다.
- 최종 UI 보정은 `studio-experience.css`가 소유하며 새 `!important`는 기존 누적 소유권 충돌을 해결하는 경우에만 사용합니다.

## 분석 엔진 규칙

- 병렬 여부는 `performance-budget.js`의 파일·기기·메모리 예산이 단일 결정합니다.
- 장시간·저메모리·안전 티어는 항상 순차 분석을 유지합니다.
- 병렬 작업은 `Promise.allSettled()`로 부분 실패를 수용하고 가능한 분석 결과를 반환합니다.
- 진행률은 병렬 작업 완료 순서와 관계없이 뒤로 이동하지 않아야 합니다.
- 결과 메타데이터에는 분석 전략과 단계별 소요 시간을 남깁니다.
- 캐시는 런타임 annotation 이전의 clone-safe 스냅샷만 저장합니다.
- typed array를 포함한 캐시 반환값은 호출부가 수정해도 저장 원본과 다른 조회 결과를 바꾸지 않아야 합니다.
- cache key는 분석 품질 설정과 namespace를 포함하며 TTL·LRU 상한을 유지합니다.

## QA·배포 기준

- 현재 자동 QA 기준은 **149/149**입니다.
- PC·모바일 화면 감사, MP3·MP4, 취소, 실패 재시도, 10분 미디어, 서비스워커 격리 생명주기를 모두 통과해야 합니다.
- 실제 병렬 분석 실기기 검증과 모의 병렬 시간 검증을 구분해 기록합니다.
- 전체 ZIP과 직전 릴리스 기준 붙여넣기 패치 ZIP을 함께 제공합니다.
- 변경·판단·실패·제약·다음 작업은 반드시 `HANDOFF.md`에 누적합니다.
- `PATCH_MANIFEST.txt`, Python 캐시, Git 메타데이터, `node_modules`, 이전 ZIP은 배포에 포함하지 않습니다.

---

# PROJECT NOTES v1.4.1

- 서비스워커 등록과 업데이트 소유자는 계속 `AIShortsServiceWorkerRegistration` 하나입니다.
- 생명주기 상태 조회는 `getStatus()`, 제어 대기는 `waitUntilControlled()`를 사용합니다.
- controller/update/state 전환은 진단 로그에 남겨야 합니다.
- 로컬 포트 차단 환경에서는 격리 생명주기 감사를 사용하되, localhost/HTTPS 실브라우저 검증 미실행 사실을 인수인계에 명시합니다.

---

# PROJECT NOTES v1.4.0

## 설계 결정

- `src/app.js`는 전체 앱 오케스트레이션을 담당하되 렌더 세부 흐름은 전용 컨트롤러에 위임합니다.
- `AIShortsRenderWorkflowController`가 렌더 큐 UI, export payload, 작업 실행, 재시도, 편집 선택 복원을 단일 소유합니다.
- 사용자·런타임 문자열을 렌더 큐에 표시할 때 `innerHTML`을 사용하지 않습니다.
- operation 종료는 공통 수명주기 경로에서 정확히 한 번 수행합니다.
- 서비스워커 등록과 모든 업데이트 확인은 `AIShortsServiceWorkerRegistration`이 단일 소유합니다.
- 서비스워커 cache cleanup은 `ai-shorts-studio-shell-` 네임스페이스에만 적용합니다.
- 자동저장 레코드는 유효하지 않아도 삭제와 원문 내보내기가 가능해야 합니다.
- 클립보드 복사는 권한·포커스 실패를 예상하고 fallback 결과까지 확인합니다.
- 패치 파일 목록용 `PATCH_MANIFEST.txt`나 동일 목적의 임시 파일을 생성하지 않습니다.

## 렌더 워크플로 규칙

1. `src/app.js`는 `AIShortsRenderWorkflowController.create()`를 통해 렌더 기능을 구성합니다.
2. 컨트롤러는 메인 앱보다 먼저 로드되고 서비스워커 셸 캐시에 포함됩니다.
3. 렌더 큐 행은 DOM 노드와 `textContent`로만 구성합니다.
4. 렌더 시작 전 사용자의 선택 후보와 수동 범위를 캡처합니다.
5. 성공·부분 실패·취소·예외의 공통 종료 경로에서 편집 상태를 복원합니다.
6. 미디어 파일 객체가 바뀌었으면 과거 스냅샷을 복원하지 않습니다.
7. 렌더 operation의 `finish()`는 정확히 한 번만 호출합니다.
8. 다운로드 서비스가 없으면 성공처럼 진행하지 않고 명시적으로 실패합니다.
9. 기능 검사 후 경고는 사용자와 diagnostics에 모두 남깁니다.

## 지속 상태·프로젝트 규칙

1. 현재 프로젝트 스키마는 v3입니다.
2. 미래 스키마는 추측해 복구하지 않고 업데이트 안내와 함께 거부합니다.
3. 후보 24개, 자막 5,000개, 프로젝트 텍스트 약 250만 자를 기본 상한으로 사용합니다.
4. 설정 enum은 허용 목록에 있는 값만 복구하고 수치는 기능별 상한으로 clamp합니다.
5. 부분 프로젝트의 중첩 설정은 현재 설정을 기반으로 깊은 병합합니다.

## 분석·서비스워커 규칙

1. 분석 워커의 오류·잘못된 메시지·무응답은 공유 분석 코어 fallback으로 연결합니다.
2. 서비스워커 등록과 `registration.update()`는 등록 소유 모듈만 호출합니다.
3. 현재 앱 캐시를 보존하고 같은 prefix의 이전 캐시만 삭제합니다.
4. 다른 origin cache namespace는 삭제하지 않습니다.

## 런타임·QA 원칙

- 정적 QA와 실제 Chromium 감사를 모두 통과해야 릴리스합니다.
- 렌더 컨트롤러는 가짜 DOM과 가짜 렌더 큐로 실제 동작을 검사합니다.
- 큐 제목·오류의 HTML 태그 문자열이 literal text로 남는지 검사합니다.
- render operation 종료 횟수와 렌더 후 선택 복원을 동작으로 검사합니다.
- MP3·MP4 저장, 취소, 실패 재시도, 장시간 분석, ETA를 검사합니다.
- 실미디어 감사 결과는 각 시나리오 완료 직후 JSON에 저장합니다.
- 현재 릴리스 기준 자동 QA는 **143/143**입니다.

## 배포 원칙

- 전체 설치 ZIP과 직전 릴리스 기준 덮어쓰기 ZIP을 함께 제공합니다.
- Git 없는 설치본에서는 직전 ZIP/디렉터리와 현재 파일 내용을 SHA-256으로 비교합니다.
- 삭제 파일이 있으면 자동 패치를 중단하고 별도 적용 절차를 요구합니다.
- 전체·패치 ZIP 모두 `unzip -t`, 금지 항목, 패치 적용 후 파일 해시 동일성을 확인합니다.

## 다음 우선순위

1. 자막·품질·자동 컷 설정 controller 분리
2. CSS 45개 레이어의 소유권·override 통합
3. 실제 localhost/HTTPS 서비스워커 lifecycle과 localStorage 복구 E2E 감사
4. 렌더·취소·파일 교체 20회 반복 자원 누수 감사
5. 15분·30분 MP4 장시간 계측
6. 모바일 Safari·Samsung Internet 실기기 검증

## v1.5.3 구조 메모
- 프로젝트 파일 UI 입출력: `src/app/project-io-controller.js`
- 프로젝트 데이터 검증/스키마: `src/project/project-service.js`
- 렌더 준비 재사용: `AIShortsVerticalRenderer.prepareRenderPlan()`
- 렌더 플랜 캐시는 순수 옵션만 보관하며 최대 24개입니다.


### v1.5.3 ownership rule
Media source Object URLs belong only to `media-import-controller.js`. Other modules may read `state.fileUrl` but must not create or revoke the active source URL. Render paint caches must remain bounded and context-scoped.

## v1.5.3 반복 힙 감사 규칙

- 실제 반복 누수 감사는 새 브라우저를 매번 열지 않고 동일 Chromium 페이지에서 수행합니다.
- 주기별 정상 상태는 active operation 0, 렌더 큐 비실행·빈 목록, 원본 Object URL 1개입니다.
- 페이지 disposal 뒤 계측된 source/export Object URL은 모두 0개여야 합니다.
- JS 힙은 강제 GC 뒤 기록하고 워밍업 구간 중앙값과 마지막 구간 중앙값, 선형 기울기를 함께 판정합니다.
- `runtime-heap-stability-v*.json`은 재현 가능한 실브라우저 감사 산출물이며 `heap_stability_smoke.js`가 릴리스 계약을 확인합니다.
- 이 감사는 V8 힙 누적을 감시하지만 GPU·브라우저 전체 RSS·OS 디코더 네이티브 메모리의 완전한 누수 증명으로 해석하지 않습니다.

---

# PROJECT NOTES v1.5.29

## 분석 캐시 계약

- 현재 영구 분석 캐시 계약은 v3입니다.
- 자동 컷 옵션은 stable serialization 후 16자리 signature로 캐시 키에 포함합니다.
- 캐시 키와 분석 결과는 동일한 단일 옵션 스냅샷을 사용해야 합니다.
- 새 분석 옵션이 결과에 영향을 주면 signature 입력도 함께 갱신해야 합니다.
- 이전 계약 namespace는 자동 삭제하지 않고 비식별 상태 확인과 선택 정리 흐름을 유지합니다.

## 진단·성능 계약

- 전체 레코드 스캔 한 번에서 entries, namespace, option signature snapshot을 함께 생성합니다.
- 정책 정리 뒤 UI는 캐시된 maintenance snapshot을 사용하며 불필요한 `readAll()`을 추가하지 않습니다.
- 저장 비용 추세는 최대 48개, 유지보수 이력은 최대 20개로 제한합니다.
- 추세·진단·UI에는 파일명, 경로, 원시 키, 옵션 원문, 분석 본문을 넣지 않습니다.

## 현재 QA·배포 기준

- 자동 QA 기준은 **213/213**입니다.
- build key: `1.5.29-analysis-signature-storage-trend`
- 서비스워커 cache: `ai-shorts-studio-shell-v1.5.29-analysis-signature-storage-trend`
- 전체 설치 ZIP과 v1.5.28 기준 덮어쓰기 패치 ZIP을 함께 배포합니다.
