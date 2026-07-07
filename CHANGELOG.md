# CHANGELOG

## v0.8.2 - Brand Feedback UX Patch

### Added

- `Design by 곰같은여우` 브랜드 시그니처
- 햅틱 피드백 배지
- 버튼/라벨/카드 클릭 리플 피드백
- 버튼 클릭 시 가벼운 햅틱 진동
- 파일/분석/내보내기/복사/성공/경고/오류별 햅틱 패턴
- 토스트 알림 유형별 아이콘과 색상
- `assets/css/feedback-ux.css`
- `src/ui/feedback-ux.js`
- `qa/feedback_ux_smoke.js`

### Changed

- 하단 Dock 2버튼 정책 유지 및 색감 보강
- `toast(message, kind)` 형태로 앱 토스트 확장
- 정보 모달 설명을 브랜드/피드백 UX 기준으로 갱신
- 문서/패키지/서비스워커 버전 v0.8.2로 갱신

### Notes

- 햅틱은 `navigator.vibrate` 지원 환경에서만 동작합니다.
- 햅틱 미지원 환경에서도 토스트 아이콘/색상 피드백은 유지됩니다.

---

# Changelog

## v0.8.2 - Brand Feedback UI/UX Performance Pass

- Simplified the fixed bottom Dock from seven actions to two core actions.
- Added large 50:50 Dock buttons: 📂 파일 열기 and ⚡ 분석하기.
- Removed legacy Dock shortcut buttons for recommendation, edit, preview, thumbnail and export.
- Removed polling-based Dock synchronization.
- Added requestAnimationFrame-batched Dock synchronization.
- Added requestAnimationFrame-batched still preview rendering.
- Added CSS containment/content-visibility performance guardrails.
- Updated layout Dock QA for the lean two-button design.
- Added `qa/lean_dock_performance_smoke.js`.

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
