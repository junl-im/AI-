# CHANGELOG

## v0.4.1 - UI Stability and Bottom Dock

### Fixed

- 파일 로드 후 원본 audio/video 컨트롤이 카드 높이를 밀어 UI가 틀어지는 문제를 줄였다.
- 미리보기 카드 내부 레이아웃이 파일 종류에 따라 흔들리지 않도록 원본 미디어 엘리먼트를 화면 밖 백그라운드 요소로 전환했다.
- 추천 리스트가 길어질 때 좌측 패널이 과도하게 늘어나는 문제를 완화했다.

### Changed

- 상단 히어로 디자인을 컴팩트하게 축소했다.
- 긴 설명문, 장식 미터, 불필요 배지를 숨겼다.
- 기존 상단 작업 도크를 숨기고 하단 고정 Dock 중심 UX로 전환했다.
- 파일 로드 후 `body.has-media` 상태 클래스로 더 작은 상단 레이아웃을 적용한다.
- 모바일 레거시 액션바는 숨기고 새 하단 Dock으로 통합했다.

### Added

- `assets/css/layout-dock.css`
- `src/ui/bottom-dock.js`
- `qa/layout_dock_smoke.js`
- 하단 고정 Dock 버튼
  - 파일
  - 분석
  - 추천
  - 편집
  - 미리보기
  - 썸네일
  - 내보내기

### QA

- QA checks: 31/31 passed.

## v0.4.0 - Draggable Range, Thumbnail Templates and Batch Export

- 파형 위 추천 구간 드래그 핸들 UI 추가
- 선택 구간 전체 이동, 시작 핸들, 끝 핸들 조절 추가
- 현재 재생 위치로 시작점 맞춤 버튼 추가
- 썸네일 템플릿 4종 추가
- 선택 템플릿을 미리보기, 썸네일 PNG, 영상 내보내기에 반영
- 추천 후보 일괄 내보내기 추가
- `assets/css/advanced-editor.css` 추가
- `src/ui/range-drag-controls.js` 추가

## v0.3.0 - UI/UX Polish

- 빠른 시작 버튼 추가
- 제작 단계 표시 추가
- 빠른 길이 칩 추가
- 상단 작업 도크 추가
- 모바일 하단 액션바 추가
- 1초 미세 조절 버튼 추가

## v0.2.0 - Captions and Projects

- SRT/VTT 자막 업로드/붙여넣기 추가
- 자막 스타일과 싱크 보정 추가
- 프로젝트 JSON 저장/불러오기 추가
- 썸네일 PNG 저장 추가

## v0.1.0 - MVP

- 로컬 오디오/비디오 분석
- 쇼츠 후보 추천
- 9:16 미리보기
- MediaRecorder 기반 내보내기
