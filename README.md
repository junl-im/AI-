# AI 쇼츠 제작 스튜디오 v1.5.17

음악이나 영상을 브라우저 안에서 분석하고 하이라이트 추천, 9:16 미리보기, 편집, MP4 저장까지 이어주는 로컬 웹 스튜디오입니다. 미디어 파일과 분석 결과는 서버로 전송하지 않습니다.

## v1.5.17 적용 내용

- 실제 브라우저에서 priority 제거 전후를 비교해 계산 스타일이 유지되는 CSS 선언만 정리했습니다.
- 헤더 메타 레일, 작업실 단계 표시, 모바일 메뉴, 업로드·Dock 아이콘의 불필요한 `!important` 42개를 제거했습니다.
- CSS conflicts, same-value duplicates, shadowed declarations 0을 유지하면서 `!important`를 801개에서 759개로 낮췄습니다.
- 데스크톱·노트북·태블릿·모바일의 핵심 배치 수치와 오류·가로 overflow 0을 유지했습니다.
- 자동 QA 176/176과 process memory, GPU/media, service worker 감사를 통과했습니다.

## v1.5.16 적용 내용

- PC 작업실 상단에 `프로젝트`와 `쇼츠 카피 초안`을 하나의 utility hub로 정렬해 다른 작업 카드와 같은 흐름으로 배치했습니다.
- 세로 쇼츠 프레임과 단일 시작 CTA를 중심으로 상단 hero를 재디자인했습니다.
- 원본 미디어 선택은 `원본 불러오기` 카드 한 곳으로 통합했습니다. 상단 `작업실 시작`과 하단 `불러오기` 메뉴는 picker를 직접 열지 않고 해당 카드로 이동합니다.
- 프로젝트 JSON과 자막 SRT/VTT 불러오기는 별도 목적을 명확히 표시해 원본 미디어 선택과 구분했습니다.
- legacy mobile action bar CSS selector 9개와 rule 7개, declaration 35개를 제거했습니다.
- CSS conflicts, same-value duplicates, shadowed declarations는 0을 유지하고 `!important`는 801개로 낮췄습니다.
- 자동 QA 175/175와 4개 viewport, process memory, GPU/media, service worker 감사를 통과했습니다.

## v1.5.15 적용 내용

- source에서 도달할 수 없는 레거시 CSS selector 148개, rule 92개, declaration 290개를 제거했습니다.
- 불필요한 `!important` 21개, 사용되지 않는 keyframes 2개, 빈 at-rule 2개를 정리했습니다.
- CSS conflicts, same-value duplicates, shadowed declarations 0과 source-orphan selector 0을 달성했습니다.
- 자동 QA 174/174와 4개 viewport, process memory, GPU/media, service worker 감사를 통과했습니다.

## v1.5.14 적용 내용

- cross-file same-value selector-property 중복 57개 그룹을 모두 제거했습니다.
- grouped selector 일부만 중복인 규칙은 selector별로 분리해 다른 요소의 fallback을 유지했습니다.
- CSS source declaration 51개와 중복 `!important` 9개를 제거했습니다.
- CSS 기준을 conflicts 0, same-value duplicates 0, shadowed declaration 0, `!important` 824로 강화했습니다.
- 데스크톱·소형 노트북·태블릿·모바일의 주요 computed style·geometry와 결정적 screenshot이 v1.5.13과 동일함을 확인했습니다.
- same-value 중복 재유입 방지 검사와 재현 가능한 consolidation tool을 추가했습니다.
- 자동 QA 173/173, 4개 viewport, process memory, GPU/media, service worker 감사를 통과했습니다.

## v1.5.13 적용 내용

- 남아 있던 low-risk geometry·token·fallback selector-property 충돌을 모두 제거했습니다.
- selector 묶음의 다른 요소에 필요한 선언은 유지하고, 해당 selector에서 완전히 가려지는 속성만 안전하게 분리·삭제했습니다.
- 47개 CSS source declaration을 정리해 51개 shadowed selector-property occurrence를 제거했습니다.
- 실제 CSS 충돌을 48→0, shadowed declaration을 51→0으로 낮췄고 `!important`는 833을 유지했습니다.
- 데스크톱·소형 노트북·태블릿·모바일의 전체 DOM targeted computed style과 결정적 스크린샷이 v1.5.12와 동일함을 확인했습니다.
- 자동 QA 172/172, 4개 viewport, process memory, GPU/media, service worker 감사를 통과했습니다.

## v1.5.12 적용 내용

- 같은 selector·media 조건에서 뒤쪽 선언에 완전히 가려지던 medium-risk CSS 선언을 제거했습니다.
- selector group 일부만 충돌하는 규칙은 안전하게 분리해 다른 selector의 fallback을 유지했습니다.
- field rhythm, disabled state, ambient overlay, auto-cut·cinematic brand·console·engine status surface, recommendation action, status dot의 최종 소유자를 단일화했습니다.
- CSS 충돌을 197→48, medium-risk 충돌을 149→0, `!important`를 841→833, shadowed declaration을 212→51로 낮췄습니다.
- 데스크톱·소형 노트북·태블릿·모바일 targeted computed style을 v1.5.11과 동일하게 유지했습니다.
- 자동 QA 171/171, 4개 viewport, process memory, GPU/media, service worker 감사를 통과했습니다.

## v1.5.11 적용 내용

- 헤더 설명문의 폭·색상·화면별 글자 크기를 최종 소유 파일로 통합하고, hero panel의 기본·데스크톱 높이 소유권을 분리했습니다.
- 숨겨진 workspace reveal pulse와 중복 scroll behavior 선언을 제거해 상호작용 모션 소유자를 단일화했습니다.
- CSS 충돌을 214→197, 고위험 충돌을 11→0, `!important`를 853→841, shadowed declaration을 239→212로 낮췄습니다.
- acceleration-requested와 software-fallback Chromium 모드에서 GPU process·media utility process RSS와 1280×720 30fps H.264/AAC 디코딩을 비교하는 감사를 추가했습니다.

## v1.5.10 적용 내용

- 현재 화면에 존재하지 않는 retired command group CSS와 obsolete DOM 조회 코드를 제거했습니다.
- control·preview surface, panel head, upload tile, form control, stage visibility, source media containment의 최종 CSS 소유 파일을 단일화했습니다.
- 4개 viewport 계산 스타일을 v1.5.9와 동일하게 유지하면서 CSS 충돌 214개, 고위험 충돌 11개, `!important` 853개, shadowed declaration 239개로 기준을 낮췄습니다.
- retired command group 재유입을 막는 전용 회귀 검사를 추가했습니다.
- 미디어 실행 경로는 변경되지 않아 v1.5.9의 장시간 MP4 안정성 결과를 상속합니다.

## v1.5.9 적용 내용

- 실제 1920×1080 MP4를 15분→30분→15분 순서로 같은 페이지에서 교체하고 분석·추천·2초 출력·정리하는 장시간 감사를 추가했습니다.
- 15분 분석 13.042초, 30분 분석 23.596초로 완료했고 재교체 분석, 출력 재생, operation·queue 해제, Object URL 전량 해제를 확인했습니다.
- brand panel, version badge, brand signature, bottom dock, primary/secondary button skin의 최종 CSS 소유자를 단일화했습니다.
- CSS 충돌 271개, 고위험 충돌 50개, `!important` 875개, shadowed declaration 314개로 기준을 낮췄습니다.
- 자동 QA 167/167, 4개 viewport 오류·가로 overflow 0, 서비스워커·process memory·장시간 MP4 감사를 통과했습니다.

## v1.5.8 적용 내용

- 반응형 shell 여백·하단 확보 공간·hero 제목 크기를 공통 CSS token으로 통합했습니다.
- header topline과 mobile title, desktop shell의 최종 CSS 소유 파일을 단일화했습니다.
- 현재 단계 neon chip 뒤에 완전히 가려진 이전 pseudo-label 스타일을 제거했습니다.
- CSS 충돌 304개, 고위험 충돌 69개, `!important` 879개로 기준을 낮췄습니다.
- Chromium RSS/USS, renderer JS heap, GPU·utility process category를 기록하는 보조 memory audit를 추가했습니다.
- 자동 QA 166/166, 4개 viewport 오류·가로 overflow 0, 서비스워커 생명주기를 통과했습니다.

## v1.5.7 적용 내용

- 721~1179px 태블릿 구간의 하단 메뉴를 2줄에서 8단계 단일 행으로 바꿔 작업 영역을 더 넓게 확보했습니다.
- 1180~1399px 소형 노트북 구간의 소개 hero와 세로 프레임을 압축해 작업 카드가 첫 화면에 바로 보이도록 했습니다.
- 모바일 header display/min-height와 현재 단계 panel border/shadow의 중복 소유권을 정리했습니다.
- Chromium 감사를 데스크톱, 소형 노트북, 태블릿, 모바일 4개 viewport로 확장했습니다.
- 자동 QA 164/164, 4개 viewport 오류·가로 overflow 0, 서비스워커 생명주기 검사를 통과했습니다.

## v1.5.6 적용 내용

- 데스크톱·모바일 소개 영역을 압축해 작업실 진입과 현재 단계 확인을 빠르게 했습니다.
- 모바일 4단계 안내 카드와 하단 메뉴의 크기·간격을 다듬었습니다.
- 패널 제목, 작업실 배치 버튼, 현재 단계 카드의 시각적 위계를 강화했습니다.
- 헤더 metadata의 CSS display/grid 소유권을 단일화했습니다.
- CSS 충돌 338개, 고위험 충돌 85개, `!important` 863개로 기준을 낮췄습니다.
- 자동 QA 163/163과 PC·모바일 Chromium, 서비스워커 생명주기 검사를 통과했습니다.

## v1.5.5 적용 내용

- 모바일 toast, bottom dock, transport/export 버튼, 시작 안내 패널의 CSS 소유권을 단일화했습니다.
- dock의 화면별 최종 크기와 기존 동작을 유지하면서 중복 cascade를 제거했습니다.
- 활성 `!important` 866개, 실제 충돌 342개, 고위험 충돌 89개로 기준을 낮췄습니다.
- 서비스워커 캐시 키를 `1.5.5-mobile-control-ownership`으로 갱신했습니다.
- 자동 QA 162/162와 PC·모바일 Chromium, 서비스워커 생명주기 검사를 통과했습니다.


## v1.5.4 적용 내용

- 실제 활성 CSS 45개의 로드 순서와 미디어 조건을 따라 동일 selector·property의 값 충돌을 분류합니다.
- 추천 카드, 모바일 시네마틱 헤더, 데스크톱 작업 그리드의 최종 소유 파일을 단일화했습니다.
- 활성 CSS의 `!important`를 911개에서 898개로, 실제 충돌을 526개에서 511개로 줄였습니다.
- 전체 충돌 목록·위험도·최종 cascade winner는 `qa/runtime-css-ownership-v1.5.4.json`에 기록됩니다.
- 서비스워커 캐시 키를 `1.5.4-css-ownership`으로 갱신해 기존 설치에서도 새 스타일을 받습니다.
- 자동 QA 162/162, PC·모바일 Chromium 오류 0건·가로 overflow 0px, 서비스워커 생명주기 감사를 통과했습니다.

## v1.5.3 적용 내용

- 자막·품질·자동 컷 설정의 정규화, 저장, UI 동기화를 전용 설정 컨트롤러로 분리했습니다.
- 설정 범위 보정과 프리셋·초기화 경로를 중앙화해 화면과 저장 상태 불일치를 줄였습니다.
- 분석·미리보기·렌더 작업을 20회 반복하는 cleanup 감사를 추가했습니다.
- 자동 QA 162/162를 실제 MP3·MP4·취소·재시도·10분 미디어 감사를 유지했습니다.
- 동일 Chromium 페이지에서 실제 MP3 분석·추천·1초 렌더를 20회 반복하고, 강제 GC 뒤 JS 힙 추세와 Object URL 해제를 검사하는 감사를 추가했습니다.

## v1.5.0 적용 내용

- 작업 시작 후 큰 소개 영역을 자동으로 접어 작업 패널을 첫 화면에 더 빨리 표시합니다.
- 상단 상태 카드에서 전체 진행률, 현재 단계, 가장 적절한 다음 행동을 확인하고 실행할 수 있습니다.
- 자동 분석을 직접 취소하고 취소·실패 뒤 다시 시작할 수 있습니다.
- UI 안내 책임을 `studio-experience-controller`로 분리해 지연 로드합니다.
- 성능 여유가 있는 짧은 영상은 오디오와 움직임을 병렬 분석합니다.
- 장시간·저메모리 환경은 안전 순차 분석을 유지합니다.
- 한 분석 축이 실패해도 가능한 결과를 유지하고 경고를 제공합니다.
- 분석 캐시는 clone-safe LRU·30분 TTL·상태 통계를 사용해 재사용 결과 오염을 막습니다.

## 검수 결과

- 자동 QA: **175/175**
- 데스크톱·소형 노트북·태블릿·모바일 Chromium 오류, Promise 거절, 콘솔 오류: **0건**
- 4개 viewport 가로 overflow: **0px**
- CSS: `!important` 801, 실제 충돌 0, same-value duplicate 0, shadowed declaration 0
- source-orphan selector 0, unused active keyframes 0, empty at-rule 0
- 실제 15분→30분→15분 1080p MP4 안정성 계약은 미디어 실행 경로 미변경으로 v1.5.9 결과 상속
- Chromium process memory audit 16회, runtime error 0
- GPU/media capability 비교: 두 모드 H.264/AAC 디코딩 통과, GPU·media utility process 관측
- 서비스워커 install·activate·이전 cache 정리·offline navigation 통과

## 실행

```bash
npm run serve
```

브라우저에서 `http://localhost:8080`을 엽니다.

## 전체 검수

```bash
npm test
python3 qa/run_browser_audit.py
python3 qa/run_media_e2e.py --cases audio,video,cancel,retry --reset
python3 qa/run_media_e2e.py --cases longAudio
python3 qa/run_heap_stability.py --cycles 20
python3 qa/run_process_memory_audit.py --cycles 16
python3 qa/run_gpu_media_capability_audit.py
node qa/run_service_worker_lifecycle.js
```

## 주요 구조

분석·추천·렌더 기능은 기존 **모듈형 엔진** 계약 위에서 동작하며, v1.5.0은 그 위에 적응형 병렬 분석과 clone-safe 캐시를 추가합니다.


- 메인 앱 상태·오케스트레이션: `src/app.js`
- 작업 진행률·다음 행동·소개/작업실 전환: `src/ui/studio-experience-controller.js`
- 적응형 분석 예산: `src/engine/performance-budget.js`
- 병렬·순차 분석 파이프라인: `src/engine/analysis-pipeline.js`
- clone-safe LRU 분석 캐시: `src/engine/analysis-cache.js`
- 설정 정규화·저장·UI 동기화: `src/app/settings-controller.js`
- 렌더 워크플로·큐 UI: `src/app/render-workflow-controller.js`
- 렌더 실행·미디어 복원: `src/render/vertical-renderer.js`
- 서비스워커 등록·업데이트: `src/boot/service-worker-registration.js`
- 변경·검수·제약 누적 기록: `HANDOFF.md`

## 배포 파일 생성

```bash
npm run package:full
PATCH_BASE_ARCHIVE=/path/to/AI_Shorts_Studio_v1.5.14_CSS_Dedup_Full.zip PATCH_FROM_VERSION=1.5.14 npm run package:patch
```

전체 ZIP은 모든 실행·문서·QA 파일을 포함합니다. 패치 ZIP은 v1.5.14 설치 폴더 위에 같은 경로로 덮어쓸 변경·신규 파일만 포함합니다.

## 알려진 제한

- headless 컨테이너에서는 물리 GPU/WebGL context가 노출되지 않아 GPU process와 media utility RSS·디코딩 성공만 보조 확인했습니다. 실제 하드웨어 가속 메모리와 decoder surface는 데스크톱 실기기 계측이 필요합니다.
- orphan selector 판정은 정적 HTML·JavaScript 참조와 명시적 동적 클래스 prefix allowlist를 사용합니다. 새로운 동적 클래스 생성 규칙을 추가할 때 allowlist와 회귀 검사도 함께 갱신해야 합니다.

실제 Chromium 감사 기기는 4GB 메모리로 보고돼 실미디어 영상은 안전 순차 전략을 사용했습니다. 병렬 분기는 모의 시간·부분 실패 검사로 통과했으며 8코어·8GB 이상 실기기 계측이 추가로 필요합니다. 모바일 Safari·Samsung Internet과 15분·30분 고해상도 MP4 장시간 출력도 별도 검증 대상입니다.


### v1.5.3
Media import and Object URL cleanup are isolated in `src/app/media-import-controller.js`; repeated render paint work uses bounded context-local caches.


### v1.5.4 CSS ownership rule

- 추천 카드의 구조·상호작용·재질·최종 스킨은 각각 지정된 파일만 소유합니다.
- 1180px 이상 기본 작업 그리드의 track·area·row·gap은 `workspace-layout-controls.css`만 소유합니다.
- 새 CSS 변경은 `qa/run_css_ownership_audit.js`와 `qa/css_ownership_smoke.js`의 위험도·상한 계약을 함께 갱신해야 합니다.
