# HANDOFF v1.5.14

## 현재 상태

v1.5.14는 v1.5.13의 화면과 미디어 실행 경로를 유지하면서 cross-file same-value selector-property 선언을 모두 제거하고 중복 `!important`를 회수한 CSS deduplication 릴리스입니다.

- 자동 QA: **173/173 통과**
- 데스크톱·소형 노트북·태블릿·모바일 주요 computed style·geometry: v1.5.13 대비 **변화 0건**
- 결정적 screenshot 비교: 4개 viewport **픽셀 변화 0건**
- CSS 기준: `!important` 824, conflicts 0, same-value duplicates 0, shadowed 0
- 장시간 MP4 안정성: 미디어 실행 경로 미변경으로 v1.5.9의 15분→30분→15분 결과 상속
- process memory·GPU/media·service worker 감사는 v1.5.14 기준으로 재생성

## 적용 내용

- 동일 selector·at-rule context·property·value·importance를 여러 CSS 파일이 반복 선언하던 57개 그룹 제거
- grouped selector의 일부에만 중복이 있는 규칙 5개를 selector별로 분리해 다른 fallback 보존
- source declaration 51개 제거
- 중복 `!important` 9개 회수
- same-value duplicate inventory를 CSS 감사 JSON과 전용 smoke test에 추가
- 재현 가능한 `tools/consolidate-same-value-css.js` 포함
- runtime build key `1.5.14-cascade-dedup` 적용

## 검수 순서

1. `node qa/run_css_ownership_audit.js`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_process_memory_audit.py --cycles 16`
4. `python3 qa/run_gpu_media_capability_audit.py`
5. `node qa/run_service_worker_lifecycle.js`
6. `npm test`

## 알려진 제한

- 현재 headless 컨테이너는 물리 GPU/WebGL context를 제공하지 않아 hardware acceleration 여부를 직접 확정할 수 없습니다.
- 15분·30분 30fps 고비트레이트 카메라 원본과 모바일 Safari·Samsung Internet 실기기 검증은 별도 환경이 필요합니다.
- 남은 `!important`는 반응형·상태·접근성 override가 섞여 있어 화면별 회귀를 동반한 단계적 감축이 필요합니다.

## 다음 작업

1. 남은 `!important`를 owner·breakpoint 단위로 안전 감축
2. 실제 하드웨어 가속 데스크톱 Chromium에서 GPU·media decoder memory 재검증
3. 15분·30분 30fps 고비트레이트 카메라 원본 반복 검증
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# HANDOFF HISTORY — v1.5.13

## 현재 상태

v1.5.13은 v1.5.12의 계산 스타일과 미디어 실행 경로를 유지하면서 남아 있던 low-risk geometry·token·fallback CSS 충돌을 모두 제거한 zero-conflict cascade 릴리스입니다.

- 자동 QA: **172/172 통과**
- 데스크톱·소형 노트북·태블릿·모바일 전체 DOM targeted computed style: v1.5.12 대비 **변화 0건**
- 결정적 screenshot 비교: 4개 viewport **픽셀 변화 0건**
- 4개 viewport 런타임 오류·Promise 거절·콘솔 오류·가로 overflow: **0건**
- CSS 기준: `!important` 833, conflicts 0, medium/high-risk 0, shadowed 0
- 장시간 MP4 안정성: 미디어 실행 경로 미변경으로 v1.5.9의 15분→30분→15분 결과 상속
- process memory audit: 16회, runtime error 0, active operation 0, render queue 0
- GPU/media 비교: acceleration-requested·software-fallback 모두 H.264/AAC 디코딩 통과, GPU·media utility process 관측
- 서비스워커 생명주기: install·activate·old cache cleanup·offline navigation 통과

## 적용 내용

- low-risk conflict의 비우승 source declaration 47개를 exact selector·at-rule context 기준으로 제거
- selector group 일부만 충돌한 2개 규칙은 selector별로 분리해 비충돌 fallback 보존
- geometry, typography, glass fallback, responsive token의 최종 cascade owner 단일화
- shadowed selector-property occurrence 51건 제거
- zero-conflict 재유입 방지 smoke test 추가
- runtime build key `1.5.13-cascade-ownership` 적용

## 검수 순서

1. `node qa/run_css_ownership_audit.js`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_process_memory_audit.py --cycles 16`
4. `python3 qa/run_gpu_media_capability_audit.py`
5. `node qa/run_service_worker_lifecycle.js`
6. `npm test`

## 알려진 제한

- conflict는 0이지만 동일 값을 여러 파일이 선언하는 same-value duplicate 57건은 동작 fallback과 파일별 독립성을 고려해 별도 정리 대상으로 남겼습니다.
- 현재 headless 컨테이너는 물리 GPU/WebGL context를 제공하지 않아 hardware acceleration 여부를 직접 확정할 수 없습니다.
- 15분·30분 30fps 고비트레이트 카메라 원본과 모바일 Safari·Samsung Internet 실기기 검증은 별도 환경이 필요합니다.

## 다음 작업

1. same-value duplicate CSS와 `!important` 안전 감축
2. 실제 하드웨어 가속 데스크톱 Chromium에서 GPU·media decoder memory 재검증
3. 15분·30분 30fps 고비트레이트 카메라 원본 반복 검증
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# HANDOFF HISTORY — v1.5.12

## 현재 상태

v1.5.12는 v1.5.11의 계산 스타일과 미디어 실행 경로를 유지하면서 같은 selector·media 조건에서 뒤쪽 선언에 완전히 가려지던 medium-risk surface·state·control CSS를 제거한 릴리스입니다.

- 자동 QA: **171/171 통과**
- 데스크톱·소형 노트북·태블릿·모바일 targeted computed style: v1.5.11 대비 **변화 0건**
- 버전 문구 변경 전 4개 viewport screenshot 비교: desktop/laptop 픽셀 차이 0, tablet/mobile은 애니메이션 샘플 영역의 미세 차이만 확인
- 4개 viewport 런타임 오류·Promise 거절·콘솔 오류·가로 overflow: **0건**
- CSS 기준: `!important` 833, conflicts 48, medium/high-risk 0, shadowed 51
- 장시간 MP4 안정성: 미디어 실행 경로 미변경으로 v1.5.9의 15분→30분→15분 결과 상속
- process memory audit: 16회, runtime error 0, active operation 0, render queue 0
- GPU/media 비교: acceleration-requested·software-fallback 모두 H.264/AAC 디코딩 통과, GPU·media utility process 관측
- 서비스워커 생명주기: install·activate·old cache cleanup·offline navigation 통과

## 적용 내용

- medium-risk conflict 149건의 loser declaration을 exact selector·at-rule context 기준으로 제거
- selector 묶음에서 일부 selector만 가려진 경우 rule을 안전하게 분리해 다른 selector의 fallback 선언을 보존
- `.field` rhythm과 disabled button/mini-action opacity를 `ui-refinement.css` 중심으로 통합
- ambient overlay opacity, auto-cut surface, cinematic brand surface, console/engine status surface의 최종 소유권을 단일화
- 추천 생성 버튼과 상태 dot의 background·border·shadow 소유권을 단일화
- runtime build key `1.5.12-surface-state-ownership` 적용

## 검수 순서

1. `node qa/run_css_ownership_audit.js`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_process_memory_audit.py --cycles 16`
4. `python3 qa/run_gpu_media_capability_audit.py`
5. `node qa/run_service_worker_lifecycle.js`
6. `npm test`

## 알려진 제한

- 남은 48건은 low-risk geometry·token·fallback 충돌이며 현재 계산 결과에는 영향을 주지 않습니다.
- 현재 headless 컨테이너는 물리 GPU/WebGL context를 제공하지 않아 hardware acceleration 여부를 직접 확정할 수 없습니다.
- 15분·30분 30fps 고비트레이트 카메라 원본과 모바일 Safari·Samsung Internet 실기기 검증은 별도 환경이 필요합니다.

## 다음 작업

1. 남은 low-risk geometry·token·fallback CSS 충돌 통합
2. 실제 하드웨어 가속 데스크톱 Chromium에서 GPU·media decoder memory 재검증
3. 15분·30분 30fps 고비트레이트 카메라 원본 반복 검증
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# HANDOFF HISTORY — v1.5.11

## 현재 상태

v1.5.11은 v1.5.10의 화면과 미디어 실행 경로를 유지하면서 hero typography·interaction CSS 소유권을 통합하고 GPU/media process 비교 감사를 추가한 릴리스입니다.

- 자동 QA: **171/171 통과**
- 4개 viewport 런타임 오류·Promise 거절·콘솔 오류·가로 overflow: **0건**
- CSS 기준: `!important` 841, conflicts 197, high-risk 0, shadowed 212
- process memory audit 16회와 GPU/media 비교 감사 통과
- runtime build key `1.5.11-hero-gpu-ownership`

---

# HANDOFF HISTORY — v1.5.10

## 현재 상태

v1.5.10은 v1.5.9의 4개 viewport 계산 스타일과 미디어 실행 경로를 유지하면서 retired command group 잔여물과 control surface의 중복 CSS 소유권을 정리한 릴리스입니다.

- 자동 QA: **168/168 통과**
- 데스크톱·소형 노트북·태블릿·모바일 Chromium 오류·Promise 거절·콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- CSS 기준: `!important` 853, conflicts 214, high-risk 11, shadowed 239
- 장시간 MP4 안정성: 실행 경로 미변경으로 v1.5.9의 15분→30분→15분 결과 상속
- process memory audit: 16회, runtime error 0, active operation 0, render queue 0
- 서비스워커 생명주기: install·activate·old cache cleanup·offline navigation 통과

## 적용 내용

- 존재하지 않는 `.command-group*`, `.command-button*`, `.command-chip*` CSS와 DOM probe 제거
- control/preview surface background는 `shutter-glass-flow.css`, padding은 `foundation-polish.css`가 소유
- panel head spacing, upload tile, select·textarea skin은 `ui-refinement.css`가 소유
- HyperFlow stage visibility는 `studio-experience.css`가 소유
- legacy action dock visibility와 source media offscreen containment는 `layout-dock.css`가 소유
- runtime build key `1.5.10-control-ownership` 적용

## 검수 순서

1. `node qa/run_css_ownership_audit.js`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_process_memory_audit.py --cycles 16`
4. `node qa/run_service_worker_lifecycle.js`
5. `npm test`

## 알려진 제한

- headless Chromium의 GPU·media utility 분류는 hardware acceleration이 활성화된 실제 데스크톱 브라우저와 다를 수 있습니다.
- process RSS 합계는 shared allocation을 포함할 수 있고 개별 decoder buffer를 직접 귀속하지 않습니다.
- 30fps 고비트레이트 카메라 원본과 모바일 Safari·Samsung Internet 실기기 검증은 별도 환경이 필요합니다.

## 다음 작업

1. hardware-accelerated Chromium GPU·media decoder memory 비교
2. 15분·30분 30fps 고비트레이트 원본 반복 검증
3. 남은 hero/header typography·interaction 충돌 통합
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# HANDOFF HISTORY — v1.5.9

## 현재 상태

v1.5.9는 v1.5.8의 반응형 계산 결과를 유지하면서 핵심 UI 스킨의 CSS 소유권을 통합하고, 실제 15분·30분 1080p MP4의 같은 페이지 반복 분석·출력·정리를 검증한 릴리스입니다.

- 자동 QA: **167/167 통과**
- 데스크톱·소형 노트북·태블릿·모바일 Chromium 오류·Promise 거절·콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- 서비스워커 생명주기: install·activate·old cache cleanup·offline navigation 통과
- CSS 기준: `!important` 875, conflicts 271, high-risk 50, shadowed 314
- 장시간 MP4: 15분→30분→15분 파일 교체·분석·2초 출력·정리 통과
- Object URL: 각 반복 source 1개, export 0개 유지, 최종 active 0개
- process memory audit: 16회, runtime error 0, active operation 0, render queue 0

## 적용 내용

- `shutter-glass-flow.css`가 brand panel, version badge, bottom dock의 최종 skin을 소유
- `glass-pro-ui.css`가 brand signature의 glass skin을 소유
- `ui-refinement.css`가 primary/secondary button의 최종 skin을 소유
- 완전히 가려진 legacy skin·focus·surface 선언 제거
- 실제 1920×1080 장시간 MP4 same-page 안정성 감사와 smoke test 추가
- process memory audit profile cleanup 재시도·강제 정리 보강
- runtime build key `1.5.9-long-video-skin` 적용

## 검수 순서

1. `node qa/run_css_ownership_audit.js`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_process_memory_audit.py --cycles 16`
4. `python3 qa/run_long_video_stability.py`
5. `node qa/run_service_worker_lifecycle.js`
6. `npm test`

## 알려진 제한

- 장시간 감사 소스는 지속시간·seek·메모리 경로를 결정적으로 검증하기 위한 1920×1080, 1fps, all-keyframe, 저샘플레이트 mono 합성 MP4입니다. 고프레임 카메라 원본이나 고비트레이트 촬영물 검증을 대체하지 않습니다.
- process RSS 합계는 shared allocation을 포함할 수 있고 개별 GPU·decoder buffer를 직접 귀속하지 않습니다.
- headless Chromium GPU 동작은 hardware acceleration이 활성화된 데스크톱 브라우저와 다를 수 있습니다.
- 모바일 Safari·Samsung Internet 실기기 검증은 별도 환경이 필요합니다.

## 다음 작업

1. hardware-accelerated Chromium GPU·media decoder memory 비교
2. 15분·30분 30fps 카메라형·고비트레이트 원본 반복 검증
3. command group·control zone의 남은 CSS 소유권 통합
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# HANDOFF HISTORY — v1.5.8


## 현재 상태

v1.5.8은 v1.5.7의 반응형 계산 결과를 유지하면서 공통 geometry token, header/stage CSS 단일 소유권, Chromium process memory 보조 계측을 추가한 릴리스입니다.

- 자동 QA: **166/166 통과**
- 데스크톱·소형 노트북·태블릿·모바일 Chromium 오류·Promise 거절·콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- v1.5.7 대비 hero, stage, first panel, dock 계산 높이 변화: **0px**
- 서비스워커 생명주기: install·activate·old cache cleanup·offline navigation 통과
- CSS 기준: `!important` 879, conflicts 304, high-risk 69, shadowed 372
- process memory audit: 16회, runtime error 0, active operation 0, render queue 0

## 적용 내용

- `theme.css`에 화면별 shell gutter, clearance, hero title 공통 token 도입
- `header-meta-rail.css`가 header topline의 display/grid/alignment/gap/mobile height 단독 소유
- `ui-refinement.css`가 desktop shell과 mobile title 최종 geometry 단독 소유
- neon stage rail/chip에 가려진 이전 navigation pseudo-label 선언 제거
- Chromium process tree RSS/USS, renderer JS heap, GPU/utility category 보조 audit 추가
- runtime build key `1.5.8-responsive-memory` 적용

## 검수 순서

1. `node qa/run_css_ownership_audit.js`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_process_memory_audit.py --cycles 16`
4. `node qa/run_service_worker_lifecycle.js`
5. `npm test`

## 알려진 제한

- process RSS 합계는 shared allocation을 포함할 수 있어 OS 전체 unique memory와 동일하지 않습니다.
- GPU·media utility 분류는 process command line 기반 보조 지표이며 개별 decoder buffer를 직접 측정하지 않습니다.
- headless Chromium 결과는 hardware acceleration이 활성화된 desktop browser와 다를 수 있습니다.
- 실미디어·20회 힙 경로는 미디어 실행 코드가 동일하므로 v1.5.3 검증 결과를 상속합니다.

## 다음 작업

1. 15분·30분 고해상도 MP4 장시간 반복 분석·렌더·파일 교체
2. hardware-accelerated Chromium GPU·media decoder memory 비교
3. brand-panel·bottom-dock·button skin 고위험 CSS 소유권 추가 통합
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증

---

# HANDOFF HISTORY — v1.5.0

## 현재 상태

v1.5.0은 v1.4.1의 **145/145 기준선**에서 화면 진입 동선, 분석 취소 가능성, 단계별 다음 행동, 영상 분석 직렬 병목, 재사용 캐시의 변경 가능성을 다시 감사한 UI·UX/기능/엔진 개선 릴리스입니다.

최종 자동 QA는 **149/149**이며 PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류와 가로 overflow는 모두 0입니다. 실제 MP3·MP4 분석·출력, 렌더 취소, 의도적 실패 후 재시도, 10분 MP3 분석·6초 출력, 격리 서비스워커 생명주기 감사도 통과했습니다.

## 이번 점검에서 확인한 문제

1. 작업을 시작한 뒤에도 큰 소개 헤더가 화면 높이를 차지해 파일·추천·미리보기 패널이 첫 화면 아래로 밀렸습니다.
2. 사용자는 현재 단계는 볼 수 있었지만 전체 진행률과 가장 적절한 다음 행동을 한 곳에서 실행하기 어려웠습니다.
3. 자동 분석은 operation coordinator로 취소 가능한 구조였으나 사용자에게 분석 취소 버튼이 제공되지 않았습니다.
4. 영상 분석은 기기 성능과 파일 크기에 관계없이 오디오 분석 뒤 움직임 분석을 순차 실행했습니다.
5. 분석 캐시는 객체 참조를 그대로 반환해 호출부가 진단 메타데이터를 붙일 때 캐시 원본까지 변형될 가능성이 있었습니다.
6. 기존 UI 보정 레이어의 `min-height: !important` 때문에 소개 내용을 숨겨도 빈 높이가 남는 충돌이 있었습니다.

## 적용한 변경

### UI·UX

- `assets/css/studio-experience.css`를 최종 UI 소유 레이어로 추가했습니다.
- 파일을 열거나 다른 작업 단계로 이동하면 `data-studio-focus="workspace"`로 전환해 소개 콘텐츠와 장식 요소를 접고 헤더를 한 줄 작업 바 형태로 축소합니다.
- `소개 보기 / 작업실 바로가기` 토글로 사용자가 언제든 소개 모드와 작업 모드를 전환할 수 있습니다.
- `#hyperflowStage`에 현재 작업 설명, 접근 가능한 progressbar, 상황별 다음 행동 버튼을 추가했습니다.
- 다음 행동은 파일 열기, 분석 취소, 분석 재시도, 추천 생성, 후보 선택, 미리보기, 편집, 저장, 결과 확인 상태를 순서대로 해석합니다.
- 모바일에서도 축소 헤더, 세션 상태, 분석 진행률·취소, 현재 패널이 첫 화면에 더 빨리 나타나도록 레이아웃을 정리했습니다.
- 초기 구현에서 남았던 빈 소개 높이를 최종 CSS에서 명시적으로 52px까지 축소해 수정했습니다.

### 기능 안정화

- `#analysisCancelBtn`을 추가하고 `AIShortsOperationCoordinator.cancel('analysis', ...)` 단일 소유 경로로 자동 분석을 취소합니다.
- 분석 취소 중·취소 완료 상태를 버튼, 진행 표시, 토스트, 진단 기록에 동기화합니다.
- `ai-shorts-analysis-request` 이벤트를 추가해 다음 행동 컨트롤러가 기존 분석 실행 경로를 중복 구현하지 않고 재사용합니다.
- 취소 또는 실패 뒤 다음 행동이 다시 분석으로 연결되고, 상태 갱신 때 `ai-shorts-experience-sync` 이벤트를 발생시킵니다.
- 중복 모바일 파일 CTA는 기존 가져오기 동선과 충돌해 제거했습니다.

### 분석·성능 엔진

- `performance-budget.js`가 파일 길이·크기·CPU 코어·기기 메모리·메모리 위험도를 기반으로 `parallelAnalysis` 여부와 이유를 결정합니다.
- 8분 이하, 300MB 이하, 6코어 이상, 6GB 이상, 낮은 메모리 위험 조건의 영상은 오디오 분석과 움직임 샘플링을 병렬 실행합니다.
- 장시간 미디어, 저메모리, 안전 티어는 기존 안전 순차 분석을 유지합니다.
- `analysis-pipeline.js`는 `Promise.allSettled()` 기반 병렬 분석과 단조 증가 진행률을 사용합니다.
- 오디오 또는 움직임 한쪽이 실패해도 가능한 분석을 유지하고 사용자 경고와 전략 메타데이터를 남깁니다.
- 엔진 결과에 `parallel`, `sequential-safe`, `audio-only` 전략과 audio/motion/finalize/total 시간을 기록합니다.
- 분석 캐시는 clone-safe 스냅샷, typed-array 복제, 30분 TTL, LRU 상한, hits/misses/evictions/expired 통계를 제공합니다.
- 캐시 키에 sample rate, motion sample 수, cache namespace를 포함하고 런타임 annotation 이전 결과만 저장합니다.

## 주요 변경 파일

- 신규: `assets/css/studio-experience.css`
- 신규: `src/ui/studio-experience-controller.js`
- 신규: `qa/studio_experience_smoke.js`
- 신규: `qa/analysis_cache_safety_smoke.js`
- 신규: `qa/parallel_analysis_smoke.js`
- 수정: `index.html`, `src/app.js`, `src/boot/staged-ui-loader.js`
- 수정: `src/engine/performance-budget.js`, `analysis-pipeline.js`, `analysis-cache.js`, `engine-kernel.js`
- 수정: `sw.js`, 버전 계약 QA, 브라우저·실미디어·서비스워커 감사 파일

## 최종 검증 결과

- 자동 QA: **149/149 통과**
- PC Chromium 1366×768: 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- 모바일 Chromium 390×844: 오류 0, Promise 거절 0, 콘솔 오류 0, 가로 overflow 0px
- PC 메뉴 8/8, 모바일 핵심 메뉴 4/4, 전체 메뉴 8/8
- 20초 MP3 출력 작업: **2.131초**, MP4 **397,377바이트**, ffprobe 통과
- 20초 MP4 출력 작업: **2.257초**, MP4 **133,975바이트**, ffprobe 통과
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 의도적 재생 실패 후 재시도: attempts 2, **2.195초**, MP4 **389,921바이트**, ffprobe 통과
- 10분 MP3 분석: **5.423초**
- 10분 분석 트랙: 8kHz, 약 **18.3MB**, 예상 decode 메모리 약 **219.7MB**
- 분석 후 decoded AudioBuffer·channelData 미보유, cache clone-safe 확인
- 6초 출력 작업: **6.190초**, MP4 **1,908,764바이트**, ffprobe 통과
- 병렬 모의 계측: 70ms 오디오 + 70ms 움직임 작업에서 병렬 경로가 순차 경로보다 최소 35ms 이상 단축
- 움직임 분석 실패 시 오디오 중심 결과 유지와 경고 발생 확인
- 서비스워커 install·skipWaiting·activate·이전 캐시 정리·clients.claim·오프라인 navigation 복구 통과
- 현재 배포 대상 유효 파일 **267개**, v1.4.1 기준 변경·신규 파일 **101개**, 삭제 파일 0

## 실행·검수 기록

1. v1.4.1 전체 설치본 압축 해제 및 자동 QA **145/145** 기준선 확인
2. PC·모바일 초기 화면, 작업 진입 높이, 메뉴·패널 접근 경로 감사
3. workspace-first CSS와 소개/작업실 토글 적용
4. 상태 기반 진행률·다음 행동 controller를 단계형 로더로 분리
5. 자동 분석 취소·재시도 사용자 경로 추가
6. 적응형 병렬 분석, 부분 실패 축소, clone-safe LRU 캐시 적용
7. 중복 모바일 파일 CTA를 QA 발견 후 제거
8. 누적 `min-height: !important` 충돌로 남은 빈 소개 높이를 화면 감사 후 수정
9. `python3 qa/run_browser_audit.py` 실행 및 Chromium 감사 통과
10. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset` 실행
11. `python3 qa/run_media_e2e.py --cases longAudio` 실행
12. `node qa/run_service_worker_lifecycle.js` 실행
13. 최종 `npm test` **149/149** 확인
14. 전체 설치 ZIP과 v1.4.1 기준 붙여넣기 패치 ZIP 생성·압축·적용 동일성 검증

## 배포·검수 순서

1. `npm test`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
4. `python3 qa/run_media_e2e.py --cases longAudio`
5. `node qa/run_service_worker_lifecycle.js`
6. `npm run package:full`
7. `PATCH_BASE_ARCHIVE=/path/to/AI_Shorts_Studio_v1.4.1_Full.zip PATCH_FROM_VERSION=1.4.1 npm run package:patch`
8. 전체·패치 ZIP `unzip -t`, 금지 항목, 패치 적용 후 전체 파일 해시 동일성, 적용본 `npm test` 확인

## 설계·소유권 결정

- `src/app.js`는 상태와 기존 기능을 소유하고, 단계별 안내·다음 행동 해석은 `AIShortsStudioExperience`가 소유합니다.
- 새 UI controller는 직접 부트 스크립트 수를 늘리지 않고 `staged-ui-loader`가 shell 단계에서 로드합니다.
- 분석 취소는 UI controller가 AbortController를 직접 만지지 않고 operation coordinator를 통해 요청합니다.
- 병렬 분석 여부는 UI가 아니라 performance budget이 결정합니다.
- 병렬 분기와 순차 분기는 같은 최종 분석 계약을 반환해야 합니다.
- 캐시에는 런타임 annotation이 없는 clone-safe 결과만 저장합니다.
- UI 최종 보정은 `studio-experience.css`가 소유하지만 장기적으로 46개 CSS 레이어를 기능별로 통합해야 합니다.

## 알려진 제한

- 현재 실제 Chromium 하네스의 `navigator.deviceMemory`는 4GB로 보고되어 실미디어 영상은 안전 순차 전략을 사용했습니다. 병렬 분기는 동일 파이프라인을 실행하는 모의 시간·부분 실패 검사로 검증했으며, 8코어·8GB 이상 실기기 벤치마크가 추가로 필요합니다.
- Chromium 감사는 비보안 인라인 환경이라 실제 localhost 서비스워커 제어와 localStorage 영속성은 실행하지 않습니다. 서비스워커 이벤트 코드는 격리 생명주기 감사로 검증했습니다.
- 모바일 Safari·Samsung Internet 실기기, 15분·30분 고해상도 MP4, 렌더·취소·파일 교체 반복 자원 누수는 추가 검증이 필요합니다.
- `src/app.js`는 여전히 1,526줄·87,917바이트이며 자막·품질·자동 컷 설정 책임을 더 분리해야 합니다.
- CSS 파일은 46개로 누적돼 최종 selector 소유권을 기능별 bundle로 통합해야 합니다.
- 패치 ZIP은 삭제 파일을 적용할 수 없습니다. 삭제가 생기는 버전은 전체 설치본 또는 별도 삭제 절차가 필요합니다.

## 다음 우선순위

1. 자막·품질·자동 컷 설정 controller 분리와 `src/app.js` 축소
2. CSS 46개 레이어의 selector 중복·`!important`·반응형 소유권 통합
3. 8코어·8GB 이상 실기기 병렬 분석 벤치마크와 전략 경계 조정
4. 렌더·취소·파일 교체 20회 반복 자원 누수 감사
5. 15분·30분 MP4 및 모바일 Safari·Samsung Internet 장시간 검증

---

## 이전 인수인계 원문 — v1.4.1

# HANDOFF v1.4.1

## 현재 상태

v1.4.1은 서비스워커 등록 모듈에 관찰 가능한 생명주기 상태를 추가하고, 실제 `sw.js` 이벤트 코드를 격리 런타임에서 실행해 설치·활성화·이전 캐시 정리·클라이언트 claim·오프라인 navigation fallback을 검증한 안정화 패치입니다. 자동 QA는 **145/145**를 통과했습니다.

## 적용한 수정

- `AIShortsServiceWorkerRegistration.getStatus()`로 지원·등록·활성·대기·제어 상태와 controller 전환 횟수를 조회합니다.
- `waitUntilControlled()`를 추가해 등록 완료와 페이지 제어 여부를 한 API에서 확인할 수 있게 했습니다.
- `controllerchange`, `updatefound`, worker `statechange`를 진단 기록에 남깁니다.
- 서비스워커 설치·활성화·fetch handler를 실제 소스 그대로 VM에서 실행하는 `qa/run_service_worker_lifecycle.js`를 추가했습니다.
- 이전 앱 캐시 삭제, 현재 셸 캐시 보존, `skipWaiting()`, `clients.claim()`, 오프라인 navigation 셸 복구를 자동 검증합니다.
- 브라우저·실미디어 감사를 v1.4.1 기준으로 다시 생성했습니다.

## 검수 순서

1. `node qa/run_service_worker_lifecycle.js`
2. `npm test`
3. `python3 qa/run_browser_audit.py`
4. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
5. `python3 qa/run_media_e2e.py --cases longAudio`
6. 전체 ZIP과 v1.4.0 기준 붙여넣기 패치 ZIP 무결성 및 적용 일치 검사

## 검수 결과

- 자동 QA: **145/145**
- 서비스워커 격리 생명주기 감사: install·activate·fetch 3개 handler 실행 통과
- `skipWaiting()` 1회, `clients.claim()` 1회 확인
- 이전 AI Shorts 셸 캐시 삭제 및 현재 셸 캐시 보존 확인
- 오프라인 navigation fallback HTTP 200 확인
- PC·모바일 Chromium 오류·Promise 거절·콘솔 오류 0
- MP3·MP4·취소·재시도·10분 MP3 E2E 통과

## 알려진 제한

현재 작업 실행 환경은 로컬 TCP 포트 바인딩이 차단되어 localhost에서의 실제 서비스워커 설치→제어 전환 E2E를 실행할 수 없었습니다. 이번 감사는 실제 `sw.js`를 격리 Service Worker API 모형에서 실행하는 결정적 검사입니다. 배포 서버 또는 로컬 개발 환경에서 localhost/HTTPS 실브라우저 생명주기 감사를 추가 실행해야 합니다.

## 다음 우선순위

1. 자막 설정 컨트롤러를 `src/app.js`에서 분리
2. 품질·자동 컷 설정 컨트롤러 분리
3. 누적 CSS 레이어의 소유권 통합과 중복 selector 측정
4. localhost/HTTPS 서비스워커 실브라우저 생명주기 감사

---

# HANDOFF v1.4.0

## 현재 상태

v1.4.0은 v1.3.9의 **141/141 기준선**에서 `src/app.js`의 렌더 책임을 분리하고, 렌더 큐 DOM 안전성 및 operation 종료 수명주기를 정리한 구조 개선 릴리스입니다.

최종 자동 검사는 **143/143**이며 PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류와 가로 overflow는 모두 0입니다. MP3·MP4 출력, 취소, 실패 후 재시도, 10분 MP3 분석과 6초 렌더도 새 컨트롤러 구조에서 다시 통과했습니다.

## 이번 점검에서 발견한 실제 문제

1. 약 96KB·1,600줄이던 `src/app.js`가 렌더 큐 UI, 내보내기 payload, 작업 실행, 재시도, 편집 선택 복원까지 동시에 소유해 변경 영향 범위가 지나치게 넓었습니다.
2. 렌더 큐 항목은 사용자·런타임 문자열을 HTML 템플릿으로 조립했습니다. 현재 escape 유틸이 존재해도 모듈 누락이나 미래 변경에서 안전성이 쉽게 깨질 수 있는 구조였습니다.
3. 렌더 operation은 성공 경로에서 `finishOperation()`을 호출한 뒤 공통 `finally`에서 다시 종료를 시도했습니다. coordinator가 두 번째 호출을 무시해 즉시 오류는 없었지만 종료 소유권과 진단 의미가 불명확했습니다.
4. 렌더 관련 QA가 구현 위치를 `src/app.js`로 고정해 책임 분리를 방해하고 있었습니다.
5. 새 핵심 컨트롤러가 추가되면서 직접 로딩 스크립트 예산이 44개에서 45개로 바뀌므로 명시적인 성능 계약 갱신이 필요했습니다.

## 적용한 수정

- `src/app/render-workflow-controller.js`를 추가해 렌더 큐 표시, export payload 생성, 렌더 실행, 실패 재시도, 편집 선택 캡처·복원을 한 소유자로 통합했습니다.
- `src/app.js`는 전용 컨트롤러를 생성하고 이벤트·내보내기 요청을 위임하도록 변경했습니다.
- 렌더 큐의 제목, 파일명, 상태, 오류를 `innerHTML` 템플릿 대신 `createElement()`와 `textContent`로 생성합니다.
- 렌더 operation은 결과 상태를 `completionResult`에 기록하고 공통 `finally`에서 정확히 한 번만 종료합니다.
- 렌더 성공·부분 실패·취소·예외 후에도 원래 후보와 수동 범위를 복원하며, 파일이 교체되면 이전 스냅샷을 복원하지 않습니다.
- 새 컨트롤러를 HTML 로딩 순서와 서비스워커 셸 캐시에 포함했습니다.
- 렌더 큐·재시도·operation·품질·ETA·편집 상태 QA를 새 소유권에 맞게 갱신했습니다.
- 가짜 DOM과 가짜 렌더 큐를 실제 실행하는 `qa/render_workflow_controller_smoke.js`를 추가했습니다.
- `src/app.js`를 **96,893바이트에서 85,874바이트로 약 11.4% 축소**했습니다.
- 자동 QA를 141개에서 **143개**로 확장했습니다.

## 주요 변경 파일

- `src/app/render-workflow-controller.js`: 렌더 워크플로 단일 소유자, 안전한 큐 DOM, 단일 operation 종료
- `src/app.js`: 렌더 책임 위임 및 이벤트 연결
- `index.html`: 컨트롤러를 메인 앱보다 먼저 로딩
- `sw.js`: 컨트롤러 오프라인 셸 캐시 포함
- `qa/render_workflow_controller_smoke.js`: 안전 DOM·단일 종료·선택 복원 동작 회귀
- `qa/render_queue_smoke.js`: 렌더 소유권 계약 갱신
- `qa/render_recovery_smoke.js`: 실패 재시도 위임 계약 갱신
- `qa/editor_state_preservation_smoke.js`: 단일 종료·공통 복원 경로 계약
- `qa/render_eta_smoke.js`: ETA·접근성 UI 소유 위치 갱신
- `qa/render_quality_planner_smoke.js`: bitrate 전달 위치 갱신
- `qa/operation_coordinator_smoke.js`: 앱과 렌더 컨트롤러의 작업 소유권 검사
- `qa/staged_ui_loading_smoke.js`: 핵심 직접 스크립트 예산 45개로 갱신

## 유지 규칙

1. `src/app.js`는 렌더 큐 행 DOM이나 MediaRecorder export payload를 직접 소유하지 않습니다.
2. 렌더 큐의 사용자·런타임 문자열은 `innerHTML`로 삽입하지 않고 `textContent`를 사용합니다.
3. 렌더 operation 종료는 하나의 공통 경로에서 정확히 한 번 호출합니다.
4. 렌더 내부 후보 순회는 사용자의 최종 선택 후보와 수동 범위를 변경하지 않습니다.
5. 미디어 세션이 교체되면 이전 렌더 스냅샷을 새 파일에 복원하지 않습니다.
6. 새 필수 앱 모듈은 `index.html`에서 의존 대상보다 먼저 로드하고 `sw.js` 셸 캐시에 포함합니다.
7. 렌더 컨트롤러의 안전성은 문자열 검사뿐 아니라 가짜 DOM·작업 큐 동작 검사로 유지합니다.
8. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
9. 기존 모듈형 엔진과 operation coordinator의 작업 소유권 계약을 유지합니다.
10. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 만들지 않습니다.

## 검수 결과

- `npm test`: **143/143 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- PC 메뉴 8/8, 모바일 간단 메뉴 4/4, 전체 메뉴 8/8
- 20초 MP3 출력: 2.264초, 418,961바이트, ffprobe 통과
- 20초 MP4 출력: 2.240초, 194,560바이트, ffprobe 통과
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 후 재시도: attempts 2, 2.212초, 382,921바이트, ffprobe 통과
- 10분 MP3 분석: 약 **6.164초**
- 장시간 분석 예산: 8kHz, 분석 트랙 약 **18.3MB**
- 예상 decode 메모리 약 **219.7MB**, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 렌더 출력: 약 **6.346초**, **1,670,118바이트**, ffprobe 통과
- 렌더 중 ETA 약 3초 노출, 완료 후 활성 operation 0
- 전체 설치본 유효 파일 **254개**, ZIP 항목 278개, 금지 항목 0
- v1.3.9 기준 덮어쓰기 패치 **91개 파일**, 금지 항목 0
- v1.3.9 전체 설치본 + v1.4.0 패치 결과가 v1.4.0 전체 설치본과 파일명·SHA-256 기준 완전 일치
- 전체 설치 ZIP을 별도 디렉터리에 풀어 `npm test` **143/143 재통과**

## 실행·검수 기록

1. v1.3.9 전체 설치본 압축 해제 및 `npm test` **141/141** 기준선 확인
2. 렌더 워크플로 컨트롤러 분리 및 `src/app.js` 위임 적용
3. 안전 DOM·단일 종료 동작 QA 추가
4. `npm test` 중 신규 버전 감사 파일 부재를 제외한 141/143 확인
5. `python3 qa/run_browser_audit.py` 실행
6. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset` 실행
7. `python3 qa/run_media_e2e.py --cases longAudio` 실행
8. 최종 `npm test` **143/143** 확인
9. 전체 ZIP과 v1.3.9 기준 덮어쓰기 패치 ZIP 생성·검증

## 배포·검수 순서

1. `npm test`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
4. `python3 qa/run_media_e2e.py --cases longAudio`
5. `npm run package:full`
6. `PATCH_BASE_ARCHIVE=/path/to/AI_Shorts_Studio_v1.3.9_Improved.zip npm run package:patch`
7. 전체·패치 ZIP `unzip -t`, 금지 항목, 패치 적용 후 전체 파일 해시 동일성 확인

## 다음 우선순위

1. 자막·품질·자동 컷 설정을 `src/app.js`에서 editor settings controller로 분리
2. 45개 CSS 레이어의 최종 소유자와 override 순서를 기능별로 통합
3. localhost/HTTPS 서비스워커 설치→대기→활성화→컨트롤 전환 자동 감사
4. 렌더·취소·파일 교체 20회 반복 자원 누수 감사
5. 15분·30분 MP4 장시간 분석·렌더 계측
6. 모바일 Safari·Samsung Internet 실기기 검증

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이라 실제 서비스워커 lifecycle과 localStorage 지속성을 실행하지 않습니다.
- 새 렌더 컨트롤러는 핵심 경로라 직접 로딩 스크립트가 45개입니다. 다음 구조 패치에서 부트 번들·모듈 로더 통합을 검토해야 합니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 적용할 수 없습니다. 삭제가 생기는 버전은 별도 삭제 절차나 전체 설치본이 필요합니다.

---

## 이전 인수인계 원문 — v1.3.9

# HANDOFF v1.3.9

## 현재 상태

v1.3.9는 v1.3.8의 **138/138 기준선**에서 세션 피드백, 손상 기록 보존, 클립보드 권한 실패, 일괄 렌더 후 편집 상태 변형을 재감사한 안정화 릴리스입니다.

최종 자동 검사는 **141/141**이며 PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류와 가로 overflow는 모두 0입니다. MP3·MP4 출력, 취소, 실패 후 재시도, 10분 MP3 분석과 6초 렌더도 새 버전 기준으로 통과했습니다.

## 이번 점검에서 발견한 실제 문제

1. 세션 연속성 모듈은 `AIShortsFeedbackUX.toast()`를 호출했지만 피드백 모듈에 해당 공개 메서드가 없어 수동 저장·복구·삭제 결과가 사용자에게 표시되지 않았습니다.
2. 클립보드 API가 권한·포커스 문제로 거부되면 fallback 없이 즉시 실패했고, 일부 호출부는 실제 복사 여부를 확인하지 않아 성공처럼 안내할 수 있었습니다.
3. 일괄 렌더가 후보를 순회하면서 전역 선택 후보를 바꾼 뒤 마지막 후보를 남겨 사용자가 보던 편집 대상과 수동 구간이 바뀔 수 있었습니다.
4. 수동 구간을 정규화한 뒤에도 미디어 seek는 원래 입력 시작값을 사용해 화면 위치와 실제 렌더 범위가 어긋날 수 있었습니다.
5. 손상 자동저장은 삭제할 수는 있었지만 원문을 보존해 외부 복구·진단에 활용할 방법이 없었습니다.
6. 기존 QA 상당수는 문자열 계약 검사라 위와 같은 실제 API 누락·실패 fallback을 잡지 못했습니다.

## 적용한 수정

- `AIShortsFeedbackUX.toast(message, kind, options)` 공개 API를 추가해 실제 토스트, 접근성 안내, 햅틱까지 연결했습니다.
- Clipboard API 실패 시 숨김 textarea와 `execCommand('copy')` fallback을 사용하고 최종 결과를 Boolean으로 반환합니다.
- 자막·진단 복사는 실제 복사 성공을 확인하고 실패 시 진단과 오류 안내를 남깁니다.
- 일괄 렌더 전 선택 후보·수동 범위를 캡처하고 성공·실패·취소 공통 `finally`에서 복원합니다.
- 렌더 중 파일이 교체된 경우 오래된 편집 스냅샷을 새 미디어에 적용하지 않습니다.
- 수동 범위 seek는 공용 정규화 결과의 `selected.start`를 사용합니다.
- 세션 카드에 `기록 백업`/`손상 기록 저장` 버튼을 추가했습니다.
- 유효한 세션은 원문 JSON을 그대로, 손상 세션은 원문·실패 이유·메타데이터를 복구 번들 JSON으로 내려받습니다.
- 실제 동작을 실행하는 신규 회귀 검사 3개를 추가해 QA를 138개에서 141개로 확장했습니다.

## 주요 변경 파일

- `src/ui/feedback-ux.js`: 실제 공개 토스트 API
- `src/utils/core-utils.js`: 권한 실패를 견디는 클립보드 fallback
- `src/download/download-service.js`: 진단 복사 결과 검증
- `src/app.js`: 자막 복사 실패 처리, 편집 선택 캡처·복원, 정규화 seek
- `src/ui/session-continuity.js`: 유효·손상 자동저장 원문 내보내기
- `qa/clipboard_fallback_smoke.js`: 클립보드 동작 회귀
- `qa/session_recovery_export_smoke.js`: 세션 원문·복구 번들 회귀
- `qa/editor_state_preservation_smoke.js`: 렌더 후 편집 상태 복원 회귀

## 유지 규칙

1. 공개 피드백 API는 no-op이 아니라 실제 UI와 접근성 알림을 수행해야 합니다.
2. 복사 성공 메시지는 Clipboard API 또는 fallback이 실제 성공한 뒤에만 표시합니다.
3. 일괄 렌더의 내부 후보 순회는 사용자의 최종 편집 선택을 변경하지 않습니다.
4. 미디어 세션이 바뀌면 이전 렌더의 선택 스냅샷을 복원하지 않습니다.
5. seek·미리보기·렌더는 동일한 정규화 범위를 사용합니다.
6. 자동저장 원문이 존재하면 파싱·스키마 검증 실패와 관계없이 사용자가 삭제하거나 내려받을 수 있어야 합니다.
7. 손상 기록 내보내기는 원문을 변형하거나 유실하지 않습니다.
8. 서비스워커는 자신의 캐시 prefix에 속한 이전 캐시만 삭제합니다.
9. 렌더가 변경한 원본 미디어 상태는 작업 전 값으로 복원합니다.
10. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
11. 기존 **모듈형 엔진**과 operation coordinator의 작업 소유권 계약을 유지합니다.
12. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 만들지 않습니다.

## 검수 결과

- `npm test`: **141/141 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- 20초 MP3 출력: 1.945초, 411,006바이트, ffprobe 통과
- 20초 MP4 출력: 1.948초, 223,556바이트, ffprobe 통과
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 재생 실패 후 새 작업 재시도: attempts 2, 2.094초, 477,026바이트
- 10분 MP3 분석: 약 **5.864초**
- 장시간 분석 예산: 8kHz, 분석 트랙 약 **18.3MB**
- 예상 decode 메모리 약 **219.7MB**, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 렌더 출력: 약 **5.908초**, **1,559,014바이트**, ffprobe 통과
- 렌더 중 ETA 약 3초 노출, 완료 후 활성 operation 0
- 전체 설치 ZIP `unzip -t` 통과, 파일 250개, 금지 항목 0
- 전체 설치 ZIP을 별도 디렉터리에 풀어 `npm test` **141/141 재통과**

## 배포·검수 순서

1. `npm test`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
4. `python3 qa/run_media_e2e.py --cases longAudio`
5. `npm run package:full`
6. 필요 시 `PATCH_BASE_ARCHIVE=/path/to/ai-shorts-studio-v1.3.8-release.zip npm run package:patch`
7. ZIP `unzip -t`, SHA-256, 금지 항목 확인

## 다음 우선순위

1. localhost/HTTPS에서 서비스워커 설치→대기→활성화→컨트롤 전환 및 localStorage 복구 자동 감사
2. 렌더·취소·파일 교체 20회 반복 시 MediaStream·AudioContext·ObjectURL 누수 계측
3. 15분·30분 MP4 분석 시간, decode peak memory, 장시간 렌더 성공률 계측
4. 모바일 Safari·Samsung Internet 실기기 장시간 렌더 검증
5. 40개가 넘는 CSS 레이어와 누적 UI 보정 모듈의 소유권 통합
6. 약 1,600줄의 `src/app.js`를 파일·분석·편집·렌더 controller로 분리

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이라 실제 서비스워커 lifecycle과 localStorage 지속성을 실행하지 않습니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 적용할 수 없습니다. 삭제가 생기는 버전은 별도 삭제 절차나 전체 설치본이 필요합니다.

---

## 이전 인수인계 원문 — v1.3.8

# HANDOFF v1.3.8

## 현재 상태

v1.3.8은 v1.3.7의 **135/135 기준선**에서 저장 복구·서비스워커 캐시 범위·렌더 원본 상태·분석 워커 정지·지속 설정 손상을 재감사한 안정화 릴리스입니다.

최종 자동 검사는 **138/138**이며 PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류와 가로 overflow는 모두 0입니다. MP3·MP4 출력, 취소, 실패 후 재시도, 10분 MP3 분석과 6초 렌더도 다시 통과했습니다.

## 이번 점검에서 발견한 실제 문제

1. 손상되거나 상한을 넘은 자동저장 세션이 localStorage에 남으면 복구는 실패하면서 기록 삭제 버튼까지 비활성화돼 사용자가 정상 상태로 돌아갈 수 없었습니다.
2. 서비스워커 활성화 시 현재 앱 캐시를 제외한 같은 origin의 모든 Cache Storage 항목을 삭제해 다른 앱·서비스 캐시까지 지울 수 있었습니다.
3. 렌더 후 원본 미디어의 재생 위치와 재생 속도가 렌더 종료 상태에 남아 편집 흐름을 바꿀 수 있었습니다.
4. 분석 워커가 오류 이벤트 없이 응답을 멈추면 Promise가 끝없이 대기해 자동 분석이 완료되지 않았습니다.
5. localStorage 설정이나 프로젝트 설정이 변조·손상되면 잘못된 duration·enum·수치·문자열 값이 상태에 들어가 추천 0개, 비정상 렌더 옵션, UI 불일치를 만들 수 있었습니다.
6. 부분 설정만 가진 이전 프로젝트를 불러올 때 중첩 설정 객체가 통째로 교체돼 현재 사용자의 자막·품질 설정이 사라질 수 있었습니다.

## 적용한 수정

- 손상 세션을 `invalid` 상태로 구분해 복구 실패 이유를 표시하고, 원본 레코드가 존재하면 삭제 버튼을 항상 사용할 수 있게 했습니다.
- 서비스워커 캐시 삭제를 `ai-shorts-studio-shell-` 네임스페이스의 이전 버전으로 제한했습니다.
- 렌더 전 `currentTime`, `playbackRate`, `muted`, `volume`, 재생 여부를 저장하고 성공·실패·취소 cleanup에서 복원합니다.
- 렌더러 내부에서도 공용 `normalizeMediaRange()`를 다시 적용해 호출 계층을 우회한 잘못된 범위를 거부합니다.
- 분석 워커에 무응답 watchdog을 추가하고 진행 메시지마다 갱신하며, 정지·잘못된 메시지에서는 워커를 종료한 뒤 메인 스레드 호환 분석으로 전환합니다.
- `ANALYSIS_WORKER_STALL_MS`를 런타임 설정으로 분리하고 최소 안전값을 적용했습니다.
- 상태 저장·복구에 enum 허용 목록, 수치 상한, 문자열·색상 정제, 알 수 없는 키 차단을 적용했습니다.
- 프로젝트 설정은 검증된 키만 복구하고 중첩 그룹을 깊은 병합해 부분·이전 프로젝트가 현재 설정을 지우지 않도록 했습니다.
- 신규 회귀 검사 3개를 추가해 QA를 135개에서 138개로 확장했습니다.
- `PATCH_MANIFEST.txt` 또는 같은 목적의 임시 목록 파일은 생성하지 않습니다.

## 주요 변경 파일

- `src/ui/session-continuity.js`: 손상 세션 상태·삭제 가능 복구 흐름
- `assets/css/session-continuity.css`: 손상 세션 경고 상태
- `sw.js`: 앱 네임스페이스 한정 캐시 정리
- `src/render/vertical-renderer.js`: 범위 재검증과 원본 미디어 상태 복원
- `src/analysis/audio-feature-extractor.js`: 워커 무응답 watchdog·messageerror fallback
- `src/config/app-runtime-config.js`: 분석 워커 정지 시간 예산
- `src/state/app-state.js`: 지속 설정 허용 목록·정규화·안전 저장
- `src/project/project-service.js`: 프로젝트 설정 정규화·부분 중첩 설정 깊은 병합
- `qa/persisted_state_recovery_smoke.js`: 손상 설정·세션·부분 프로젝트 회귀
- `qa/analysis_worker_stall_smoke.js`: 무응답·잘못된 워커 메시지 회귀
- `qa/service_worker_cache_scope_smoke.js`: 다른 서비스 캐시 보존 회귀

## 유지 규칙

1. 자동저장 원문이 존재하면 파싱·스키마 검증 실패와 관계없이 사용자가 삭제할 수 있어야 합니다.
2. 서비스워커는 자신의 캐시 prefix에 속한 이전 캐시만 삭제합니다.
3. 렌더가 변경한 원본 미디어의 위치·속도·음량·음소거·재생 상태는 작업 전 값으로 복원합니다.
4. 공개 UI에서 범위를 검증해도 렌더 경계에서 다시 검증합니다.
5. 워커 기반 분석은 오류 이벤트뿐 아니라 무응답과 잘못된 메시지를 감지해 결정적으로 종료·대체해야 합니다.
6. localStorage와 프로젝트에서 복구하는 설정은 동일한 허용 목록·상한·문자열 정제 정책을 따라야 합니다.
7. 부분 프로젝트 설정은 현재 설정을 기반으로 깊은 병합하며 누락 그룹을 삭제하지 않습니다.
8. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
9. **Update Sentinel**은 진단과 캐시 정리를 담당하며 등록 객체를 직접 업데이트하지 않습니다.
10. 기존 **모듈형 엔진**과 operation coordinator의 작업 소유권 계약을 유지합니다.
11. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 만들지 않습니다.

## 검수 결과

- `npm test`: **138/138 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0, 가로 overflow 0px
- 20초 MP3·MP4 출력 정상
- 렌더 취소: 다운로드 0, 활성 operation 0
- 재생 실패 후 새 작업 재시도 정상
- 10분 MP3 분석: 약 **6.223초**
- 장시간 분석 예산: 8kHz, 분석 트랙 약 **18.3MB**
- 예상 decode 메모리 약 **219.7MB**, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 렌더 출력: 약 **6.015초**, **1,426,623바이트**, ffprobe 통과
- 렌더 중 ETA 약 3초 노출, 완료 후 활성 operation 0
- 전체·패치 ZIP 압축 무결성 통과, 금지 항목 0
- v1.3.7 전체 ZIP + v1.3.8 패치 결과가 v1.3.8 전체 ZIP 243개 파일과 해시 기준 완전 일치
- 전체 설치 ZIP을 별도 디렉터리에 풀어 `npm test` 138/138 재통과

## 배포·검수 순서

1. `npm test`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
4. `python3 qa/run_media_e2e.py --cases longAudio`
5. `PATCH_BASE_ARCHIVE=/path/to/ai-shorts-studio-v1.3.7-release.zip npm run package`
6. 전체·패치 ZIP `unzip -t`, SHA-256, 패치 적용 후 파일 해시 동일성 확인
7. ZIP 내부에 `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 중첩 `dist`·ZIP이 없는지 확인

## 다음 우선순위

1. localhost/HTTPS에서 서비스워커 설치→대기→활성화→컨트롤 전환 자동 감사
2. 렌더·취소·파일 교체 20회 반복 시 MediaStream·AudioContext·ObjectURL 누수 계측
3. 15분·30분 MP4 분석 시간, decode peak memory, 장시간 렌더 성공률 계측
4. 모바일 Safari·Samsung Internet 실기기 장시간 렌더 검증
5. 손상 세션 내용을 다운로드해 복구·진단할 수 있는 사용자 도구 검토

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이라 실제 서비스워커 lifecycle을 실행하지 않습니다. 캐시 범위와 API 계약은 단위 검증됐지만 배포 서버의 waiting→activate 전환은 별도 확인이 필요합니다.
- 워커 watchdog은 UI 영구 대기를 막지만 CPU·메모리 압박으로 정상 분석이 제한 시간을 넘으면 호환 분석을 다시 수행해 총 시간이 늘 수 있습니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 적용할 수 없습니다. 삭제가 생기는 버전은 별도 삭제 절차나 전체 설치본이 필요합니다.

---

## 이전 인수인계 원문 — v1.3.7

# HANDOFF v1.3.7

## 현재 상태

v1.3.7은 v1.3.6의 **132/132 기준선**에서 다음 감사 라운드를 시작해, 기존 QA가 놓친 렌더 스트림 수명·수동 범위 경계·직접 붙여넣기 자막·중복 후보 ID·서비스워커 수동 업데이트 경합을 수정한 안정화 릴리스입니다.

최종 자동 검사는 **135/135**이며 PC·모바일 Chromium 오류, Promise 거절, 콘솔 오류와 가로 overflow는 모두 0입니다. MP3·MP4 저장, 취소, 재생 실패 후 재시도, 10분 MP3 분석·6초 렌더도 다시 통과했습니다.

## 이번 점검에서 발견한 실제 문제

1. 렌더 지원 여부를 확인하는 `inspectRenderCapability()`가 `captureStream()`을 호출해 검사만으로 미디어 트랙을 생성할 수 있었습니다.
2. 실제 렌더 초기 설정이 중간에 실패하면 canvas·audio·source video 트랙 일부가 남을 수 있었습니다.
3. 렌더가 원본 미디어의 `muted`를 변경한 뒤 항상 원래 상태로 돌려놓지는 않았습니다.
4. 사용자가 미디어 길이보다 큰 시작점이나 역순 시작·종료를 직접 입력하면 종료가 시작보다 작아질 수 있었습니다.
5. 직접 붙여넣는 자막은 파일 크기 사전 검사와 달리 텍스트·큐 개수 상한이 없어 UI와 렌더가 장시간 멈출 수 있었습니다.
6. 가져온 프로젝트에 같은 후보 ID가 여러 개 있으면 선택·비교·핀 상태가 같은 항목으로 충돌할 수 있었습니다.
7. Update Sentinel과 버전 동기화가 소유 모듈을 거치지 않고 `registration.update()`를 직접 호출해 동시에 여러 업데이트 요청이 생길 수 있었습니다.
8. 전체 설치 ZIP에서 개발을 이어가는 비-Git 환경에서는 기존 패치 스크립트가 기준 commit을 찾지 못해 `npm run package`가 실패했습니다.

## 적용한 수정

- 렌더 사전 검사는 `captureStream` 함수 존재 여부만 확인하고 스트림을 만들지 않습니다.
- 실제 렌더에서 source capture stream을 한 번만 생성하고, 성공·실패·취소·설정 실패 모두 생성한 트랙을 중지합니다.
- 사용되지 않는 source video track도 cleanup 대상에 포함했습니다.
- 렌더 전 원본 미디어의 `muted`와 `volume`을 저장하고 종료 시 복원합니다.
- `src/utils/core-utils.js`에 `normalizeMediaRange()`를 추가해 수동 범위와 프로젝트 후보·자막 범위가 같은 규칙을 사용하게 했습니다.
- 직접 붙여넣는 자막을 100만 자, 파싱 결과를 5,000개 큐로 제한하고 초과 시 진단을 남깁니다.
- 프로젝트 후보 ID에서 제어 문자를 제거하고 중복 ID에는 고유 접미사를 부여합니다.
- `AIShortsServiceWorkerRegistration.checkForUpdate()`를 추가해 Update Sentinel과 버전 동기화가 이 API에만 위임하도록 했습니다.
- 동시 업데이트 확인은 공유 Promise로 합쳐 브라우저 `registration.update()`를 한 번만 실행합니다.
- 패치 스크립트에 `PATCH_BASE_ARCHIVE`·`PATCH_BASE_DIR` 경로를 추가해 Git 없이도 직전 릴리스와 SHA-256 내용 비교로 변경 파일만 압축합니다.
- 신규 회귀 검사 3개를 추가해 QA를 132개에서 135개로 확장했습니다.
- `PATCH_MANIFEST.txt` 또는 같은 목적의 임시 목록 파일은 생성하지 않습니다.

## 주요 변경 파일

- `src/render/vertical-renderer.js`: 부작용 없는 기능 검사, 단일 캡처 생성, 트랙·미디어 상태 cleanup
- `src/utils/core-utils.js`: 공용 `normalizeMediaRange()`
- `src/app.js`: 수동 범위 보정, 직접 붙여넣기 자막 상한·진단
- `src/caption/caption-service.js`: 텍스트·큐 상한을 적용한 bounded parser
- `src/project/project-service.js`: 공용 범위 정규화, 후보 ID 정제·고유화
- `src/boot/service-worker-registration.js`: 등록·업데이트 단일 소유와 동시 업데이트 합치기
- `src/boot/update-sentinel.js`: 업데이트 확인을 소유 모듈에 위임
- `src/boot/app-version-sync.js`: freshness 확인을 소유 모듈에 위임
- `qa/render_resource_cleanup_smoke.js`: 캡처 사전 검사와 스트림 cleanup 회귀
- `qa/range_caption_guard_smoke.js`: 범위·자막·후보 ID 경계값 회귀
- `qa/service_worker_owner_smoke.js`: 업데이트 단일 소유·동시 호출 합치기 회귀

## 유지 규칙

1. 렌더 지원 여부 확인 함수는 스트림·AudioContext·ObjectURL을 생성하지 않습니다.
2. 생성한 모든 MediaStreamTrack은 성공·실패·취소·초기화 실패에서 반드시 중지합니다.
3. 렌더가 변경한 원본 미디어 상태는 작업 전 값으로 복구합니다.
4. 미디어 시간 구간은 공용 `normalizeMediaRange()`를 통과해야 합니다.
5. 후보·자막 구간은 양수 길이를 유지하면서 실제 미디어 끝을 넘지 않아야 합니다.
6. 직접 붙여넣기와 파일 가져오기는 같은 자막 크기·큐 상한을 사용합니다.
7. 프로젝트 후보 ID는 제어 문자가 없고 프로젝트 안에서 유일해야 합니다.
8. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
9. **Update Sentinel**은 진단과 캐시 정리를 담당하며 등록 객체를 직접 업데이트하지 않습니다.
10. 기존 **모듈형 엔진**과 operation coordinator의 작업 소유권 계약을 유지합니다.
11. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 만들지 않습니다.

## 검수 결과

- `npm test`: **135/135 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0
- PC 메뉴 8/8, 모바일 간단 메뉴 4/4, 전체 메뉴 8/8
- PC·모바일 가로 overflow: 0px
- 20초 MP3·MP4 출력 정상
- 렌더 취소: 다운로드 0, 활성 operation 0
- 재생 실패 후 새 작업 재시도 정상
- 10분 MP3 분석: 약 6.734초
- 장시간 분석 예산: 8kHz, 분석 트랙 약 18.3MB
- 예상 decode 메모리 약 219.7MB, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 렌더: 약 5.866초, 1,208,719바이트, ffprobe 통과
- v1.3.6 전체 ZIP + v1.3.7 패치 적용 결과가 현재 소스 238개 파일과 해시 기준 완전 일치
- 전체·패치 ZIP 압축 오류 0, 금지 항목 0
- 렌더 중 ETA 표시와 완료 후 operation 해제 확인

## 배포·검수 순서

1. `npm test`
2. `python3 qa/run_browser_audit.py`
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`
4. `python3 qa/run_media_e2e.py --cases longAudio`
5. 전체 ZIP과 v1.3.6 기준 덮어쓰기 ZIP 생성(`PATCH_BASE_ARCHIVE` 또는 Git 기준 사용)
6. `unzip -t`와 SHA-256 확인
7. ZIP 내부에 `PATCH_MANIFEST.txt`, Python 캐시, `.git`, `node_modules`, 이전 배포 ZIP이 없는지 확인

## 다음 우선순위

1. localhost/HTTPS에서 서비스워커 설치→대기→활성화→컨트롤 전환 자동 감사
2. 15분·30분 MP4 분석 시간, decode peak memory, 장시간 렌더 성공률 계측
3. 렌더·취소·파일 교체를 20회 반복하는 MediaStream·AudioContext·ObjectURL 누수 스트레스 감사
4. 모바일 Safari·Samsung Internet 실기기 장시간 렌더 검증
5. 프로젝트 스키마 마이그레이션 로그와 사용자 복구 안내 개선

## 알려진 제한

- 현재 Chromium 감사 하네스는 비보안 인라인 환경이라 실제 서비스워커 lifecycle을 실행하지 않습니다. API 소유권과 경합은 단위 검증됐지만 배포 서버 전환은 별도 확인이 필요합니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 적용할 수 없습니다. 삭제가 생기는 버전은 별도 삭제 절차나 전체 설치본이 필요합니다.

---

## 이전 인수인계 원문 — v1.3.6


## 요약

v1.3.6는 v1.3.5 작업물의 검수 결과를 다시 재현하면서 발견된 **배포 버전 불일치**, **서비스워커 이중 업데이트**, **프로젝트·세션 입력 상한 부재**, **실미디어 감사 경합**을 수정한 안정화 릴리스입니다.

초기 재검증에서 문서상 131/131과 달리 실제 `npm test`는 100/131이었습니다. `index.html`이 아직 `1.3.4` 빌드 키를 사용하고 QA만 새 버전을 기대한 것이 주원인이었습니다. 이를 숨기지 않고 소스·HTML·서비스워커·QA·문서를 v1.3.6 기준으로 다시 맞췄습니다.

## 이번 점검 기록

1. `PATCH_MANIFEST.txt` 생성 방식을 제거했습니다. 패치 ZIP은 Git 변경 파일을 직접 계산하며 중간 매니페스트를 만들지 않습니다.
2. 서비스워커 등록 성공 뒤 존재하지 않는 변수에 접근하던 경로를 제거했습니다.
3. `AIShortsVersionSync`가 별도로 `registration.update()`를 호출하던 이중 소유를 제거했습니다.
4. 서비스워커 제어 자산 실패 시 앱 HTML이 대신 반환되는 폴백을 막았습니다.
5. 프로젝트 스키마를 v3으로 올리고 후보·자막·문자열·파일 크기·미디어 시간 상한을 추가했습니다.
6. 미래 스키마와 과대 JSON/SRT를 거부하고, 알 수 없는 설정·프로토타입 키를 제거합니다.
7. 최대 미디어 길이 경계에서 후보·자막 종료 시간이 상한을 넘을 수 있던 예외를 수정했습니다.
8. 프로젝트 후보 ID를 CSS 선택자 문자열에 삽입하던 경로를 제거해 `]`, 역슬래시 등 특수 문자 ID에서도 비교·핀 선택이 끊기지 않게 했습니다.
9. 같은 파일 재선택, 지연 자동 분석의 이전 파일 경합, 취소 상태 정리, 프로젝트 설정 저장 누락을 수정했습니다.
10. 실미디어 감사의 다운로드 감시를 렌더 시작 전에 등록하고, 각 시나리오 완료 시 결과를 체크포인트 저장하도록 변경했습니다.
11. PC·모바일 Chromium 감사와 MP3·MP4·취소·재시도·10분 미디어 E2E를 다시 실행했습니다.

## 주요 변경 파일

- `src/boot/service-worker-registration.js`: 등록 가능 환경, 단일 실행, 업데이트 확인, 성공·실패 진단과 재시도를 소유합니다.
- `src/boot/app-version-sync.js`: DOM과 로컬 버전만 동기화하고 서비스워커 작업은 등록 모듈에 위임합니다.
- `src/boot/update-sentinel.js`: **Update Sentinel** 진단과 이전 셸 캐시 정리를 유지합니다.
- `sw.js`: navigation과 제어 자산의 네트워크 폴백을 분리합니다.
- `src/project/project-service.js`: 스키마 v3, 개수·길이·시간 상한, 설정 키 허용 목록과 정규화를 담당합니다.
- `src/app.js`: 파일 크기 사전 검사, 같은 파일 재선택, 지연 분석 세션 확인, 프로젝트 설정 저장을 담당합니다.
- `src/ui/session-continuity.js`: 세션 복구에도 프로젝트 스키마 검증과 크기 제한을 재사용합니다.
- `qa/project_import_guard_smoke.js`: 비정상 JSON·미래 스키마·경계 시간·과대 입력을 검사합니다.
- `qa/run_media_e2e.py`: 선택 시나리오 실행과 체크포인트 저장을 지원합니다.
- `tools/create-patch-zip.sh`: Git diff 기반으로 패치 ZIP을 만들며 매니페스트 파일을 생성하지 않습니다.

## 유지 규칙

1. 서비스워커 등록과 `registration.update()`는 `AIShortsServiceWorkerRegistration`만 소유합니다.
2. 앱 본체와 버전 동기화 모듈에서 `navigator.serviceWorker.register()`를 직접 호출하지 않습니다.
3. 서비스워커는 HTTPS 또는 localhost 계열에서만 등록합니다.
4. navigation 실패는 앱 셸로 복구할 수 있지만 manifest·service worker 제어 자산 실패는 HTML로 대체하지 않습니다.
5. 프로젝트·세션 JSON은 `AIShortsProjectService.parseProjectText()`를 거쳐야 합니다.
6. 후보·자막·선택 범위는 양수 길이를 유지하되 미디어 시간 상한을 넘지 않아야 합니다.
7. 파일명·프로젝트 문자열·렌더 라벨은 동적 `innerHTML`에 넣지 않습니다.
8. 분석·렌더 취소 후 operation과 UI 상태가 모두 정리되어야 합니다.
9. 실미디어 감사는 시나리오별 결과를 즉시 저장해야 합니다.
10. `PATCH_MANIFEST.txt`나 동일 목적의 임시 배포 목록 파일을 생성하지 않습니다.

## 검수 순서

1. `npm test`로 문법, 버전·캐시, 서비스워커, 프로젝트 입력, UI와 기존 회귀를 검사합니다.
2. `python3 qa/run_browser_audit.py`로 PC·모바일 오류, 메뉴, overflow와 작업실 조절을 확인합니다.
3. `python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset`을 실행합니다.
4. `python3 qa/run_media_e2e.py --cases longAudio`로 결과 파일에 장시간 항목을 병합합니다.
5. `npm run package`로 전체 ZIP과 v1.3.4 덮어쓰기 ZIP을 생성합니다.
6. 두 ZIP에 `unzip -t`를 실행하고 SHA-256 체크섬을 생성합니다.
7. ZIP 내부에 `PATCH_MANIFEST.txt`, `.git`, `node_modules`, 이전 배포 ZIP이 없는지 확인합니다.

## 검수 결과

- `npm test`: **132/132 통과**
- Chromium desktop 1366×768: 오류·Promise 거절·콘솔 오류 0
- Chromium mobile 390×844: 오류·Promise 거절·콘솔 오류 0
- PC 메뉴: 8/8 표시
- 모바일 간단 메뉴: 4/4 표시, 현재 단계 유지
- 모바일 전체 메뉴: 8/8 표시
- PC·모바일 가로 overflow: 0px
- 20초 MP3·MP4 출력 정상
- 렌더 취소: cancelled 1, 다운로드 0, 활성 operation 0
- 실패 재시도: 첫 시도 failed 1, 재시도 attempts 2·done 1
- 10분 MP3 분석: 약 5.79초
- 10분 분석 예산: 8kHz, 약 18.3MB, decode 예상 약 219.7MB, 위험도 medium
- 분석 후 decoded AudioBuffer·channelData 미보유
- 6초 출력과 렌더 ETA 정상

## 배포 규칙

1. 전체 설치 ZIP과 기준 버전 덮어쓰기 ZIP을 함께 만듭니다.
2. 이번 v1.3.6 패치 기준은 Git HEAD의 v1.3.4입니다.
3. 패치 대상은 Git 변경 파일에서 직접 계산합니다.
4. 중간 매니페스트 파일은 만들지 않습니다.
5. 삭제 파일이 생기면 패치 생성은 실패시키고 별도 적용 절차를 문서화합니다.
6. 전체·패치 ZIP 모두 압축 무결성과 SHA-256을 확인합니다.

## 다음 우선순위

1. 실제 localhost/HTTPS에서 서비스워커 설치→대기→활성화→컨트롤 전환 E2E 추가
2. 15분·30분 MP4의 분석 시간, decode peak memory, 렌더 성공률 계측
3. 모바일 Safari·Samsung Internet 실기기 장시간 렌더 검증
4. 초기 CSS와 지연 UI 자산을 단계별 번들로 정리해 첫 페인트 비용 축소
5. 프로젝트 스키마 v2→v3 명시적 마이그레이션 로그와 사용자 안내 추가

## 알려진 제한

- 인라인 Chromium 감사에서는 실제 서비스워커 설치가 비활성입니다. 등록 API 계약은 단위 검증되지만 배포 서버의 업데이트 전환은 별도 검증이 필요합니다.
- Web Audio 전체 디코딩 특성상 매우 긴 무압축 오디오의 순간 peak memory는 여전히 클 수 있습니다.
- 15분·30분 고해상도 MP4와 모바일 Safari·Samsung Internet 장시간 출력은 실기기 검증이 필요합니다.
- 패치 ZIP은 삭제 파일을 자동 처리하지 않습니다. 삭제가 필요한 릴리스는 별도 삭제 절차가 필요합니다.

---

# HANDOFF v1.5.3 추가 기록

## 패치 목표

v1.5.0 이후 남아 있던 `src/app.js`의 설정 UI 책임과 반복 작업 후 소유권 잔류 가능성을 줄이는 구조 안정화 패치입니다.

## 적용 내용

- `src/app/settings-controller.js` 신규 추가
  - 자막 옵션 정규화·저장·UI 동기화·프리셋·초기화 소유
  - 품질 옵션 정규화·저장·UI 동기화·초기화 소유
  - 자동 컷 옵션 정규화·저장·UI 동기화 소유
- `src/app.js`의 관련 함수는 전용 컨트롤러에 위임하고 미리보기·추천 재계산 같은 앱 오케스트레이션만 유지
- 서비스워커 셸 캐시에 설정 컨트롤러 추가
- `qa/settings_controller_smoke.js` 추가
- `qa/repeated_operation_cleanup_smoke.js` 추가
  - 미디어 세션, 분석, 미리보기, 렌더를 20회 반복
  - 각 주기 종료 후 active operation 0건 및 취소 signal 확인

## 검증 결과

- 자동 QA: 152/152
- 데스크톱·모바일 오류, Promise rejection, console error: 0
- 가로 overflow: 0px
- 실제 MP3·MP4 분석·추천·렌더 성공
- 렌더 취소 및 실패 후 재시도 성공
- 10분 MP3 장시간 분석·렌더 성공
- 20회 반복 operation cleanup: 잔류 0건
- 서비스워커 install·activate·offline navigation 감사 성공

## 유지 계약

- 설정 값의 경계 처리와 DOM 반영은 `settings-controller.js`가 단일 소유합니다.
- `app.js`는 설정 변경 이후 필요한 미리보기, 추천, 자동 컷 재계산만 담당합니다.
- 설정 컨트롤러는 `app.js`보다 먼저 로드되어야 하며 서비스워커 셸에 포함되어야 합니다.
- operation coordinator의 각 채널은 완료 또는 취소 후 active map에 남아서는 안 됩니다.

## 알려진 제한

- 현재 브라우저 감사는 inline asset harness이므로 실제 localhost 서비스워커 제어권 획득은 별도 환경에서 확인해야 합니다.
- 이번 반복 감사는 operation 소유권과 취소 신호를 검증하며 브라우저 힙의 장기 추세 계측은 다음 패치 대상으로 남깁니다.

## 다음 우선순위

1. 20회 실제 미디어 분석·렌더 브라우저 힙 추세 감사
2. 렌더 준비 단계의 canvas/audio graph 재사용 가능성 검토
3. `app.js`의 파일 가져오기·프로젝트 입출력 컨트롤러 분리
4. 누적 CSS 레이어의 중복 selector와 `!important` 소유권 통합

## v1.5.3 인수인계 기록
### 적용
- 프로젝트 JSON 저장/불러오기 UI 책임을 `AIShortsProjectIOController`로 이동했습니다.
- `app.js`는 컨트롤러 생성과 이벤트 연결만 담당합니다.
- 렌더러는 동일 구간·자막·품질 옵션의 정규화 결과를 bounded LRU 캐시로 재사용합니다.
- 캐시 상한은 24개이며 `clearRenderPlanCache()`로 즉시 비울 수 있습니다.

### 유지 계약
- 프로젝트 본문 스키마 검증은 계속 `project-service.js`가 소유합니다.
- 파일 크기 제한과 사용자 파일 읽기는 `project-io-controller.js`가 소유합니다.
- 미디어가 교체되면 기존 operation/session 방어 로직을 우회하지 않습니다.
- 렌더 플랜에는 런타임 미디어 객체, 스트림, 캔버스, AbortSignal을 저장하지 않습니다.

### 검증
- project I/O controller smoke와 bounded render plan cache smoke를 추가했습니다.
- 전체 정적·동작 QA, 브라우저 감사 계약, 실미디어 감사 계약을 재검증했습니다.

### 다음 우선순위
- 실제 Chromium heap snapshot 기반 20회 미디어 반복 추세 측정.
- 파일 가져오기 전용 controller 분리와 object URL 생명주기 단일 소유권화.
- 46개 CSS 파일의 selector 충돌 보고서 생성 및 레이어 통합.
- 렌더 프레임에서 반복 생성되는 gradient/text measurement 비용 계측.


## v1.5.3 - media ownership and render-frame efficiency

- Added `src/app/media-import-controller.js` as the single owner of media intake and source Object URLs.
- Previous source Object URLs are revoked before replacement and the active URL is revoked during page disposal.
- Stale delayed auto-analysis is blocked by both media-session identity and import sequence.
- Added bounded canvas-context caches for the base frame gradient and repeated text measurements.
- Updated architecture-sensitive QA so moved responsibilities are checked in their owning controller rather than by brittle `app.js` string assumptions.
- Fresh Chromium desktop/mobile audit was generated for v1.5.3.
- The full real-media suite was attempted, but the combined runner exceeded the available execution window after completing early scenarios. The previously validated v1.5.2 full media artifact is retained as the regression contract; this limitation is explicitly carried forward.
- All source, packaging, service-worker, controller, cache and regression checks pass: 161/161.

## v1.5.3 - 실제 미디어 반복 힙 추세 감사

### 패치 목표

기존 20회 operation 정리 검사를 실제 Chromium의 동일 페이지 반복으로 확장해, 파일 교체·자동 분석·추천 생성·1초 렌더·다운로드를 20회 수행한 뒤 JS 힙과 Object URL 수명주기가 누적되는지 확인합니다.

### 적용 내용

- `qa/run_heap_stability.py`를 추가했습니다.
- 16초 합성 MP3를 실제 Chromium에 반복 입력하고 매 주기 분석·추천·렌더·다운로드를 완료합니다.
- `--js-flags=--expose-gc`와 CDP `Runtime.getHeapUsage`를 사용해 GC 이후 V8 JS 힙을 주기별로 기록합니다.
- `URL.createObjectURL()`/`URL.revokeObjectURL()`을 감사 범위에서 계측해 원본 URL 1개 유지, 임시 출력 URL 비누적, 페이지 종료 후 0개를 확인합니다.
- 매 주기 operation 0건, 비실행·빈 렌더 큐, 페이지 오류 0건을 함께 검사합니다.
- `qa/heap_stability_smoke.js`가 커밋된 20회 감사 결과와 힙 성장·기울기 상한을 일반 `npm test`에서 검증합니다.

### 검증 결과

- 실제 미디어 반복: **20/20회 완료**
- 자동 QA: **162/162 통과**
- 워밍업 구간 중앙값: **3.812 MiB**
- 마지막 5회 중앙값: **4.193 MiB**
- 중앙값 증가: **0.381 MiB / 10.0%**
- 전체 선형 기울기: **-0.011 MiB/회**
- Object URL: 생성 40, 해제 40, disposal 뒤 활성 0
- 각 주기 active operation 0, 렌더 큐 0, page/runtime error 0

### 유지 계약

- 반복 감사의 각 주기는 같은 Chromium 페이지와 같은 JS 런타임에서 실행해야 합니다.
- 원본 미디어 Object URL은 작업 중 정확히 1개만 활성 상태여야 하며 교체 시 이전 URL을 해제해야 합니다.
- 출력 다운로드 URL은 다음 주기로 누적되어서는 안 되고, 페이지 disposal 뒤 모든 계측 URL이 0개여야 합니다.
- 힙 판정은 초기 워밍업 뒤 5개 구간 중앙값과 마지막 5개 구간 중앙값, 전체 회귀 기울기를 함께 사용합니다.
- 실제 브라우저 감사 스크립트는 무거우므로 `npm test`에서 재실행하지 않고 결과 JSON 계약만 빠르게 확인합니다.

### 검수 순서

1. `python3 qa/run_heap_stability.py --cycles 20`
2. `node qa/heap_stability_smoke.js`
3. `npm test`
4. 필요 시 `python3 qa/run_browser_audit.py`

### 알려진 제한

- 이번 수치는 V8 JS 힙과 embedder/backing-storage 보조 지표이며 GPU 메모리, Chromium 프로세스 전체 RSS, OS 미디어 디코더 네이티브 할당을 완전하게 증명하지 않습니다.
- 인라인 자산 하네스이므로 localhost/HTTPS 서비스워커 제어와 localStorage 지속성은 범위 밖입니다.
- 20회 완료 렌더는 16초 MP3의 1초 선택 구간을 사용합니다. 장시간 MP4·모바일 브라우저의 네이티브 메모리 추세는 별도 실기기 감사가 필요합니다.

### 다음 우선순위

1. CSS 46개 레이어의 실제 selector+property 충돌 분류와 고위험 소유권 통합
2. Chromium 프로세스 RSS·GPU/미디어 네이티브 메모리 보조 계측
3. 15분·30분 MP4 장시간 분석·렌더와 파일 교체 반복
4. 모바일 Safari·Samsung Internet 실기기 반복 안정성 검증


## v1.5.4 - CSS selector-property ownership consolidation

### 패치 목표

46개 CSS 파일을 단순 selector 개수로 보지 않고 실제 활성 로드 순서와 at-rule context에서 동일 selector·property가 어떤 값으로 덮이는지 분류하고, 완전히 가려진 고위험 선언부터 제거합니다.

### 적용 내용

- `qa/run_css_ownership_audit.js`를 재작성해 45개 활성 CSS와 1개 보관 CSS를 분리합니다.
- 각 선언의 context, selector, property, value, `!important`, load index를 기록하고 layout/skin/typography/interaction/token/other와 위험도를 계산합니다.
- 전체 conflict occurrence와 최종 cascade winner, 핵심 소유권 snapshot을 `runtime-css-ownership-v1.5.4.json`에 저장합니다.
- 추천 카드의 base background/border-color/box-shadow는 `ui-refinement.css`, backdrop은 `glass-pro-ui.css`, cursor/transition은 `ux.css`가 단독 소유합니다.
- 모바일 시네마틱 헤더의 크기·padding·radius·background·shadow는 `ui-refinement.css`가 단독 소유합니다.
- 데스크톱 studio grid의 columns/areas/rows/gap은 `workspace-layout-controls.css`, display/width/margin은 `desktop-prime-layout.css`가 단독 소유합니다.
- 구조 이동에 맞춰 `desktop_prime_layout_smoke.js`가 실제 소유 파일을 검사하도록 변경했습니다.
- 버전과 캐시 키를 v1.5.4 / `1.5.4-css-ownership`으로 갱신했습니다.

### 정량 결과

- 활성 `!important`: 911 → 898 (-13)
- 실제 selector-property 충돌: 526 → 511 (-15)
- 고위험 충돌: 206 → 198 (-8)
- shadowed declaration: 701 → 675 (-26)

### 검증

- 자동 QA: **162/162**
- PC·모바일 Chromium window error, unhandled rejection, console error: 0
- PC·모바일 horizontal overflow: 0px
- 데스크톱 toolbar·resizer·keyboard resize·preview/waveform focus 정상
- 모바일 데스크톱 전용 컨트롤 비노출 정상
- 서비스워커 v1.5.4 install·activate·이전 cache 정리·offline navigation 정상
- 실미디어·20회 힙 감사는 JS 미디어 경로가 동일한 CSS-only 릴리스이므로 검증된 v1.5.3 artifact를 명시적으로 상속

### 유지 계약

- 보관 CSS를 활성 cascade 충돌 수치에 포함하지 않습니다.
- 동일 selector라도 media/supports context가 다르면 같은 충돌로 합치지 않습니다.
- shorthand와 longhand 간 computed cascade는 현재 보고서의 직접 충돌 수치 밖이므로 제거 전 브라우저 computed style을 확인합니다.
- runtime CSS를 변경한 릴리스는 build key와 service worker cache name을 반드시 갱신합니다.

### 다음 우선순위

1. `.toast` 모바일 bottom 위치 단일 소유권화
2. `.bottom-dock-tab` min-height 및 transport/export 버튼 크기 통합
3. `.start-command-panel` display/grid-template-columns 통합
4. Chromium RSS·GPU·미디어 네이티브 메모리 보조 계측
