# HANDOFF - AI 쇼츠 제작 스튜디오 v0.9.0

## 이번 패치 목적

사용자 요청: “엔진 보강, 강화, 최강 엔진을 향해. 모든 것은 모듈화.”

v0.9.0은 기존 UI/UX를 유지하면서 내부 구조를 **모듈형 엔진 아키텍처**로 전환한 패치입니다. 기능을 계속 얹는 방식에서 벗어나, 이후 고급 분석/자막/얼굴추적/렌더러를 안전하게 교체하거나 확장할 수 있게 만들었습니다.

## 주요 추가 파일

```text
src/engine/module-registry.js
src/engine/performance-budget.js
src/engine/analysis-pipeline.js
src/engine/scoring-pipeline.js
src/engine/engine-kernel.js
assets/css/engine-panel.css
qa/modular_engine_smoke.js
```

## 앱 연결 지점

`index.html`에서 엔진 파일들은 기존 분석/추천 모듈 뒤, `src/app.js` 앞에 로드됩니다.

`src/app.js`는 다음 전역 엔진을 사용합니다.

```js
global.AIShortsEngineKernel
```

분석 시:

```js
engineKernel.analyzeMedia(...)
```

추천 계산 시:

```js
engineKernel.createRecommendations(...)
```

## 엔진 모듈 개념

현재 등록되는 기본 모듈은 다음과 같습니다.

```text
audio.feature.extractor
video.motion.sampler
auto.cut.detector
recommendation.scoring.pipeline
render.quality.effects
```

현재는 모두 브라우저 로컬 기반입니다. 서버 API나 유료 기능은 포함하지 않았습니다.

## 중요 유지 정책

- 하단 Dock은 사용자 요청대로 2개만 유지합니다.
  - 📂 파일 열기
  - ⚡ 분석하기
- `Design by 곰같은여우` 브랜딩 유지
- 버튼/상태별 햅틱 피드백 유지
- 파일 로드 후 원본 video/audio 컨트롤이 UI를 밀지 않도록 숨김 유지
- 모듈형 구조는 늘리되 화면 정보량은 늘리지 않는 방향 유지

## 검수

```bash
npm run check
```

v0.9.0 기준 신규 체크:

```text
qa/modular_engine_smoke.js
```

이 체크는 엔진 파일 존재, index 로딩 순서, app 연결, state 저장소, 서비스워커 캐시, 추천 카드 엔진 배지를 검사합니다.

## 다음 개발자가 봐야 할 곳

1. `src/engine/engine-kernel.js` - 앱과 엔진 사이의 관문
2. `src/engine/analysis-pipeline.js` - 분석 파이프라인
3. `src/engine/scoring-pipeline.js` - 점수 보강/재정렬
4. `src/app.js` - 실제 연결부
5. `qa/modular_engine_smoke.js` - 구조 깨짐 방지 체크


## 검수 순서

1. `npm run check` 실행
2. `qa/modular_engine_smoke.js` 통과 확인
3. 브라우저에서 파일 열기 → 분석하기 → 추천 카드 선택 → 미리보기 확인
4. 하단 Dock이 📂 파일 열기 / ⚡ 분석하기 2개만 표시되는지 확인

## 알려진 제한

- 모든 분석은 무료 브라우저 로컬 기반이므로 대용량/저사양 기기에서는 안전 모드로 동작할 수 있습니다.
- 비디오 파일의 오디오 디코딩은 브라우저 코덱 정책에 따라 실패할 수 있으며, 이 경우 움직임 중심 fallback 분석을 사용합니다.
- 햅틱 진동은 `navigator.vibrate`를 지원하는 기기에서만 실제로 울립니다.
