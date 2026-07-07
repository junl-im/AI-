# HANDOFF - AI 쇼츠 제작 스튜디오 v0.8.1 Lean Dock UI/UX 성능 패치

## 목적

사용자 피드백 기준으로 하단 Dock이 너무 많은 기능을 담아 복잡해졌고, 파일 로드 후 레이아웃/반응성 부담이 커질 수 있었습니다. v0.8.1은 Dock을 📂 파일 열기와 ⚡ 분석하기 두 개의 핵심 액션으로 축소하고, UI 동기화와 정지 미리보기 렌더링을 더 가볍게 정리했습니다.

## 주요 변경 파일

- `index.html` : 하단 Dock 마크업을 2버튼 구조로 교체, v0.8.1 문구 반영
- `assets/css/layout-dock.css` : Lean Dock 50:50 레이아웃, 큰 터치 버튼, containment 성능 규칙 추가
- `src/ui/bottom-dock.js` : 7버튼 동기화 제거, 파일/분석 2버튼만 유지, polling 제거
- `src/app.js` : 정지 미리보기 렌더링을 RAF 배치 방식으로 변경
- `qa/layout_dock_smoke.js` : Lean Dock 앵커 검수로 갱신
- `qa/lean_dock_performance_smoke.js` : Dock polling 제거, RAF 렌더, CSS containment 검수 추가
- `package.json` : 버전 및 QA 체크 갱신
- `sw.js` : 캐시 버전 v0.8.1로 갱신

## Dock 설계

Dock은 사용자가 가장 자주 누르는 시작 액션만 남겼습니다.

- 📂 파일 열기: 원본 오디오/영상 선택
- ⚡ 분석하기: 현재 파일을 분석하고 쇼츠 후보 생성

추천, 편집, 미리보기, 썸네일, 내보내기는 기존 화면 내부 버튼으로 유지합니다. 이렇게 해야 Dock이 작고 빠르며, 모바일에서 하단을 과하게 차지하지 않습니다.

## 성능 메모

- `bottom-dock.js`의 `setInterval` polling을 제거했습니다.
- 버튼 상태는 MutationObserver와 이벤트를 통해 감지한 뒤 `requestAnimationFrame`으로 한 번에 동기화합니다.
- `renderPreviewStill()`은 여러 UI 입력에서 반복 호출되어도 한 프레임에 한 번만 실제 렌더링합니다.
- 주요 패널에 `contain`/`content-visibility`를 적용해 파일 로드 후 레이아웃 재계산 부담을 줄였습니다.

## 검수 순서

1. `npm run check` 실행
2. `npm run serve` 실행 후 브라우저에서 열기
3. 하단 Dock이 📂 파일 열기 / ⚡ 분석하기 두 개만 보이는지 확인
4. 두 버튼이 동일한 폭으로 크게 표시되는지 확인
5. 파일 선택 후 Dock이 깨지지 않고 분석 버튼이 활성화되는지 확인
6. 분석 후 기존 추천/편집/미리보기/내보내기 기능이 화면 내부 버튼으로 정상 동작하는지 확인

## 알려진 제한

- Dock에서 미리보기/내보내기 바로가기는 의도적으로 제거했습니다.
- 저사양 모바일에서는 긴 영상 분석 자체가 오래 걸릴 수 있습니다. 다만 Dock UI 동기화와 정지 미리보기 렌더 부담은 v0.8.0보다 낮췄습니다.
