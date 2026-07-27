# Project Notes v1.6.15

## 시스템 구조

- 정적 PWA: `index.html`, `sw.js`, `asset-integrity.json`
- 앱 상태·상위 오케스트레이션: `src/app.js`, `src/state/app-state.js`
- 가져오기: `src/app/media-import-controller.js`
- 미리보기: `src/app/preview-controller.js`
- 렌더 흐름: `src/app/render-workflow-controller.js`
- 설정: `src/app/settings-controller.js`
- staged hydration: `src/boot/staged-ui-loader.js`
- 엔진: `src/engine/*`
- 분석: `src/analysis/*`, `src/workers/highlight-analysis.worker.js`
- 비전: `src/vision/*`
- 저장·복구: `src/storage/*`, `src/ui/session-continuity.js`
- Local AI: `src/ai/*`, localhost/loopback 전용

## v1.6.15 소유권

- `src/app/preview-controller.js`
  - still/playback RAF, completion interval, operation token, dispose
- `src/app.js`
  - preview controller dependency injection and compatibility bridges
- `src/vision/vision-model-pack-manager.js`
  - orphan dry-run inspection, explicit cleanup, combined storage diagnostics
- `src/ui/vision-model-pack-panel.js`
  - storage summary and user-triggered orphan cleanup
- `src/boot/staged-ui-loader.js`
  - feedback UX shell hydration; editing/export/local AI lazy phases
- `assets/css/smart-reframe.css`
  - responsive model storage diagnostics card
- `DELIVERY_RULES.md`
  - 최종 결과 보고 형식

## 안전 규칙

- preview controller만 preview RAF와 interval을 생성·해제합니다.
- dispose 이후 새 preview 작업을 예약하지 않습니다.
- 고아 캐시 검사는 삭제하지 않습니다.
- 수동 정리는 모델 팩 전용 캐시와 synthetic URL prefix 안에서만 실행합니다.
- 설치 메타데이터에 등록된 모든 모델 자산은 정리 대상에서 제외합니다.
- quota preflight가 불확실하면 실제 Cache Storage 오류를 비파괴 처리합니다.
- 직접 시작 스크립트는 49개 예산을 초과하지 않습니다.
- 서비스워커 배포 전 최종 파일 기준 무결성 매니페스트를 다시 생성합니다.
- 외부 AI endpoint는 허용하지 않으며 loopback 주소만 사용합니다.
