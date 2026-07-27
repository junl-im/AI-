# Project Notes v1.6.13

## 시스템 구조

- 정적 PWA: `index.html`, `sw.js`, `asset-integrity.json`
- 앱 상태·오케스트레이션: `src/app.js`, `src/state/app-state.js`
- 엔진: `src/engine/*`
- 분석: `src/analysis/*`, `src/workers/highlight-analysis.worker.js`
- 비전: `src/vision/*`
- 렌더: `src/render/*`
- 저장·복구: `src/storage/*`, `src/ui/session-continuity.js`
- Local AI: `src/ai/*`, localhost/loopback 전용

## v1.6.13 소유권

- `src/vision/vision-model-pack-manager.js`
  - 파일 선택 allowlist와 크기 제한
  - SHA-256 검사
  - 트랜잭션 설치와 부분 캐시 정리
  - 활성화·벤치마크·추천
  - 모델 롤백과 backend 복구
- `qa/vision_model_pack_transaction_smoke.js`
  - Cache Storage 중간 실패 시 기존 inventory, 활성 선택, 캐시 원상 보존
- `qa/vision_model_pack_performance_rollback_smoke.js`
  - 모델 교체 롤백과 동일 모델 backend 복구 구분
- `qa/run_all_checks.js`
  - 장시간 QA의 범위·샤드·타임아웃·보고서 제어
- `src/download/download-service.js`
  - 반복 내보내기의 단일 활성 Object URL 소유권과 pagehide/beforeunload 정리
- `qa/download_object_url_lifecycle_smoke.js`, `qa/heap_stability_smoke.js`
  - superseded export URL 해제와 실미디어 반복 작업 후 URL/힙 정리
- `DELIVERY_RULES.md`
  - 최종 결과 보고 형식

## 안전 규칙

- 벤치마크는 로컬 합성 프레임만 사용합니다.
- 모델 팩은 사용자가 선택한 로컬 파일만 설치합니다.
- 모델 팩 활성화·복구 전 SHA-256을 다시 확인합니다.
- 실패한 설치는 기존 팩을 선제 삭제하지 않습니다.
- backend 전환 실패는 현재 모델의 마지막 정상 backend를 우선 복구합니다.
- 이전 모델 롤백 슬롯과 backend 복구 후보를 혼용하지 않습니다.
- 외부 AI endpoint는 허용하지 않으며 loopback 주소만 사용합니다.
