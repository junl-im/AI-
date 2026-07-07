# CHANGELOG

## v0.9.0 - Modular Engine Reinforcement

### Added

- `src/engine/module-registry.js`
- `src/engine/performance-budget.js`
- `src/engine/analysis-pipeline.js`
- `src/engine/scoring-pipeline.js`
- `src/engine/engine-kernel.js`
- `assets/css/engine-panel.css`
- `qa/modular_engine_smoke.js`

### Changed

- 앱 분석 흐름을 `AIShortsEngineKernel.analyzeMedia()` 중심으로 연결
- 추천 흐름을 `AIShortsEngineKernel.createRecommendations()` 중심으로 연결
- 추천 후보에 품질 게이트와 엔진 배지 추가
- 상태 저장소에 `engineMeta`, `engineOptions` 추가
- 서비스워커 캐시를 v0.9.0으로 갱신
- index 빌드/메타/스크립트 쿼리 v0.9.0으로 갱신

### Preserved

- Design by 곰같은여우 브랜딩
- 📂 파일 열기 / ⚡ 분석하기 2버튼 하단 Dock
- 햅틱 피드백/토스트 알림
- 자막 스타일, 컷 마커, 품질 패널, 일괄 내보내기
- 무료 로컬 브라우저 기반 처리 원칙

### QA

- 모듈형 엔진 가드레일 체크 추가
- 전체 QA는 `npm run check`로 실행
