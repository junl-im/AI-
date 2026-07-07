# Changelog

## v0.8.0 - Waveform Cut Marker Editing

- Added waveform-level cut marker overlay.
- Added beat, scene-change and silence-exit marker colors.
- Added silence segment shading directly on the waveform.
- Added selected range band inside the cut marker overlay.
- Added marker click seeking and boundary adjustment.
- Added start/end snap-to-nearest-cut buttons.
- Added `src/ui/cut-marker-overlay.js`.
- Added `assets/css/cut-markers.css`.
- Added `qa/cut_marker_smoke.js`.
- Fixed caption apply/clear runtime references to use the current selected recommendation.


## v0.7.0 - 자동 컷 편집 패치

- 무음 구간 자동 감지 추가
- 비트 컷 포인트 추천 추가
- 영상 장면 전환 컷 후보 추가
- 컷 후보 타임라인 패널 추가
- 템포 점수/무음 위험/컷 후보 수 표시 추가
- 선택 구간 자동 보정 추가
- 모든 후보 일괄 컷 보정 추가
- 자동 컷 설정 저장/복원 추가
- 자동 컷 QA smoke test 추가

# CHANGELOG

## v0.7.0 - 결과물 품질 패치

### Added

- 밝기/대비/채도 조절
- 비네팅 강도 조절
- 오디오 페이드 인/아웃
- 인트로/아웃트로 텍스트 오버레이
- 워터마크/로고 텍스트와 위치 설정
- 미리보기 안전영역 가이드 토글
- 제목/해시태그 다시 추천 버튼
- `src/render/quality-effects.js` 추가
- `assets/css/quality-tools.css` 추가
- `qa/output_quality_smoke.js` 추가

### Changed

- 미리보기/썸네일/단일 내보내기/일괄 내보내기에 품질 옵션 전달
- 프로젝트 JSON에 품질 설정 저장
- 서비스워커 캐시 버전 갱신

### QA

- `npm run check` 기준 전체 통과
