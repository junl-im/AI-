# CHANGELOG

## v0.6.0 - 결과물 품질 패치

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
