# HANDOFF - AI 쇼츠 제작 스튜디오 v0.8.0 파형 컷 마커 편집 패치

## 목적

v0.7.0은 쇼츠 결과물 자체의 품질을 올리는 패치입니다. 자막 이후 단계에서 실제 출력 영상에 영향을 주는 밝기/대비/채도, 페이드, 워터마크, 인트로/아웃트로, 안전영역 가이드를 추가했습니다.

## 주요 변경 파일

- `index.html` : 결과물 품질 패널과 카피 다시 추천 버튼 추가
- `assets/css/quality-tools.css` : 품질 패널 UI 스타일
- `src/state/app-state.js` : `qualityOptions` 기본값 저장
- `src/app.js` : 품질 UI 동기화, 프로젝트 저장 연동, 카피 재추천
- `src/render/quality-effects.js` : 품질 보정/워터마크/페이드/안전영역 유틸
- `src/render/vertical-renderer.js` : 미리보기/내보내기에 품질 옵션 적용
- `qa/output_quality_smoke.js` : 품질 패치 앵커 검수

## 기능 메모

- 안전영역 가이드는 미리보기에서 확인하기 위한 기능입니다. 썸네일 저장과 실제 내보내기에는 기본적으로 태워 넣지 않습니다.
- 오디오 페이드는 HTMLMediaElement 볼륨 제어를 통해 적용합니다. 브라우저의 captureStream 구현에 따라 녹음 반영 정도가 다를 수 있습니다.
- 워터마크와 인트로/아웃트로 텍스트는 캔버스에 직접 렌더링되어 결과물에 포함됩니다.

## 다음 추천 패치

- v0.7.0 : 자동 자막/무음 컷/비트 컷 타임라인
- v0.8.0 : 템플릿 저장, 프리셋 공유, 브랜드 키트

## 검수 순서

1. `npm run check` 실행
2. `npm run serve` 실행 후 브라우저에서 파일 불러오기
3. 추천 구간 생성, 자막 적용, 품질 패널 조절 확인
4. 미리보기 안전영역 가이드 확인
5. 썸네일 저장과 단일 내보내기 확인
6. 후보 일괄 내보내기 확인

## 알려진 제한

- 브라우저 MediaRecorder 정책에 따라 MP4 대신 WebM으로 저장될 수 있습니다.
- 일부 브라우저에서는 captureStream 오디오 볼륨이 페이드 인/아웃을 완전히 반영하지 않을 수 있습니다.
- 긴 영상과 고해상도 원본은 모바일에서 렌더링 메모리 부담이 큽니다.


## v0.7.0 인수인계 메모

자동 컷 편집은 `src/analysis/auto-cut-detector.js`가 담당합니다. 앱은 오디오/영상 분석이 끝난 뒤 `buildAutoCutTimeline()`을 호출하고, 추천 생성 후 `enhanceRecommendations()`로 점수와 이유를 보강합니다. 컷 보정 버튼은 선택 후보 또는 전체 후보의 start/end/duration/rangeText를 직접 갱신합니다.

브라우저 성능 이슈를 줄이기 위해 새 분석은 기존 오디오 프레임과 영상 모션 프레임을 재사용합니다. 별도 모델, 외부 API, 서버 업로드는 없습니다.


## v0.8.0 인수인계

이번 패치는 `src/ui/cut-marker-overlay.js`와 `assets/css/cut-markers.css`를 추가했습니다. 자동 컷 데이터는 기존 `state.autoCuts.timeline`과 `state.autoCuts.silenceSegments`를 그대로 사용합니다. 따라서 분석 엔진을 바꾸지 않아도 파형 위 마커 UI는 동작합니다.

주의사항:

- 컷 마커 레이어는 `waveform-drag-shell` 내부의 별도 DOM 오버레이입니다.
- 기존 드래그 구간 오버레이와 겹치지만 `pointer-events`는 마커 버튼만 받도록 설계했습니다.
- 마커 클릭은 재생 위치 이동을 기본으로 하고, 선택 구간 밖을 클릭하면 시작/끝 경계 보정까지 수행합니다.
- `snapStartCutBtn`, `snapEndCutBtn`은 선택 구간 경계와 가장 가까운 컷 포인트를 찾습니다.
