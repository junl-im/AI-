# QA REPORT - AI Shorts Studio v0.4.1

## 자동 검수 결과

```text
AI Shorts Studio QA summary
  Passed: 31/31
  Failed: 0/31
```

## 실행 명령

```bash
npm run check
```

## 통과 항목

- JavaScript syntax check
  - config
  - state
  - utils
  - audio feature extractor
  - video motion analyzer
  - recommendation engine
  - caption service
  - project service
  - vertical renderer
  - download service
  - waveform view
  - timeline view
  - UX controls
  - range drag controls
  - bottom dock controls
  - site guards
  - runtime health
  - worker
  - service worker
  - app
- duplicate function declaration smoke test
- external dependency smoke test
- core DOM anchor smoke test
- UI/UX anchor smoke test
- layout dock smoke test
- advanced editor smoke test
- recommendation engine smoke test
- render capability smoke test
- docs handoff smoke test
- caption service smoke test
- project service smoke test

## v0.4.1 중점 검수

### 1. 파일 로드 후 레이아웃 안정성

- `sourceVideo`와 `sourceAudio`가 `.is-visible` 상태가 되어도 실제 화면 레이아웃을 차지하지 않도록 `layout-dock.css`에서 숨김 처리했다.
- 원본 미디어 엘리먼트는 렌더링/재생 소스로 유지하되, 사용자 조작은 캔버스 미리보기와 Dock 버튼으로 수행한다.

### 2. 상단 컴팩트 디자인

- 긴 히어로 설명문을 짧은 문구로 축소했다.
- 장식 미터와 불필요 배지를 숨겼다.
- 파일 로드 후 `body.has-media` 상태에서 상단 높이를 한 번 더 줄인다.
- 단계 표시를 작은 칩 형태로 유지한다.

### 3. 하단 고정 Dock

필수 DOM 앵커를 확인했다.

```text
bottomDock
bottomDockTitle
bottomDockMeta
bottomAnalyzeBtn
bottomRecommendBtn
bottomEditBtn
bottomPreviewBtn
bottomThumbnailBtn
bottomExportBtn
```

Dock 버튼의 연결 정책:

- `파일`: 기존 `fileInput` label 연결
- `분석`: 기존 `analyzeBtn` click mirror
- `추천`: 추천 카드 영역으로 scroll
- `편집`: 구간/자막 편집 영역으로 scroll
- `미리보기`: 기존 `previewBtn` click mirror
- `썸네일`: 기존 `thumbnailBtn` click mirror
- `내보내기`: 기존 `exportBtn` click mirror

### 4. 기존 기능 회귀 방지

- v0.4.0의 파형 드래그 핸들 앵커 유지
- 썸네일 템플릿 앵커 유지
- 후보 일괄 내보내기 앵커 유지
- v0.3.0의 UI/UX 앵커 유지
- v0.2.0의 자막/프로젝트 서비스 smoke test 유지

## 수동 검수 체크리스트

1. 앱 실행 후 상단이 컴팩트하게 보이는지 확인
2. 하단 Dock이 화면 아래에 고정되어 있는지 확인
3. MP3 또는 MP4 파일 불러오기
4. 파일 로드 후 UI가 아래로 밀리거나 깨지지 않는지 확인
5. 원본 audio/video 컨트롤이 미리보기 카드 아래에 노출되지 않는지 확인
6. 하단 Dock 상태 문구가 파일명으로 바뀌는지 확인
7. 하단 Dock `분석` 버튼으로 추천 생성
8. 추천 생성 후 Dock 상태 문구가 선택 구간/점수로 바뀌는지 확인
9. Dock `추천` 버튼으로 추천 카드 영역 이동
10. Dock `편집` 버튼으로 편집 영역 이동
11. Dock `미리보기`, `썸네일`, `내보내기`가 본문 버튼과 같은 동작을 하는지 확인
12. 모바일 폭에서 Dock 버튼이 가로 스크롤로 접근 가능한지 확인

## 알려진 제한

- 실제 MediaRecorder/다운로드 동작은 브라우저별 수동 검수가 필요하다.
- iOS Safari에서는 captureStream/MediaRecorder 제한이 있을 수 있다.
- 원본 미디어 컨트롤은 의도적으로 숨겼다. 직접 seeking이 필요한 경우 향후 Dock에 재생바를 추가해야 한다.
