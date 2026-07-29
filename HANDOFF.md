# HANDOFF v1.6.39

## 인수인계 요약

v1.6.38의 abortable probe와 shared deadline 계약을 유지하면서 Local AI 모델 무결성과 장애 진단을 endpoint 단위로 보강했습니다.

1. 모델 digest pin key를 `provider + endpoint token + model id` 범위로 분리
2. 같은 모델명을 쓰는 여러 localhost 서버의 pin 충돌 제거
3. 기존 `provider:model` pin을 저장된 현재 endpoint 범위로 자동 이관
4. 다른 endpoint pin이 존재하는 상태에서 새 endpoint 연결 확인 전 generation 차단
5. generation·transcription 실패를 privacy-safe provider history에 기록
6. prompt·endpoint·schema·미디어 내용은 failure history에 저장하지 않음
7. 비정상 file size(`NaN`, `Infinity`, 음수) 전사 입력 차단
8. 신규 endpoint pin/history 회귀 등록, 전체 QA 317개로 확장

## 시스템·성능·기술 구조

- Local AI endpoint·pin·probe·deadline·진단 이력: `src/ai/local-ai-provider-registry.js`
- Local AI endpoint-aware pin UI: `src/ui/local-ai-studio.js`
- serial queue·cancel·timeout: `src/ai/ai-job-coordinator.js`
- 버전·build key: `src/config/app-runtime-config.js`, `src/boot/staged-ui-loader.js`, `index.html`
- 앱 셸 캐시·무결성: `sw.js`, `asset-integrity.json`
- Update Sentinel 업데이트 감지·이전 shell cache 정리·진단 복사: `src/boot/update-sentinel.js`, `assets/css/update-sentinel.css`
- 신규 회귀: `qa/local_ai_endpoint_pin_history_smoke.js`
- 강화 회귀: `qa/local_ai_endpoint_integrity_smoke.js`
- 최종 QA 집계: `qa/qa-run-final-summary.json` (`qa/qa-run-v1.6.39-final.json` 원본)

## 주요 계약

- endpoint pin key는 원문 endpoint 대신 비가역 endpoint token을 사용합니다.
- legacy pin은 로드 시 현재 저장 endpoint 범위의 v2 pin으로 이관됩니다.
- 현재 endpoint에 pin이 없지만 같은 provider·model의 다른 endpoint pin이 있으면 probe 전 상태는 `stale`입니다.
- 현재 endpoint probe가 완료되면 해당 서버 모델은 `unpinned`, `verified`, `mismatch`, `unsupported` 중 하나로 평가됩니다.
- 생성·전사 실패 이력은 type, providerId, capability, modelToken, errorCode, bounded error, elapsedMs만 보존합니다.
- prompt, endpoint URL, schema, 파일명·내용은 provider history에 보존하지 않습니다.
- 결과 전달 형식은 `DELIVERY_RULES.md`를 영구 기준으로 사용합니다.

## 검수 순서

1. `node qa/local_ai_endpoint_pin_history_smoke.js`
2. `node qa/local_ai_endpoint_integrity_smoke.js`
3. `node qa/local_ai_state_race_smoke.js`
4. `node qa/local_ai_transport_integration_smoke.js`
5. `node qa/local_ai_operation_deadline_smoke.js`
6. `node qa/local_ai_provider_resilience_smoke.js`
7. `node qa/local_ai_studio_smoke.js`
8. `node qa/app_version_sync_smoke.js`와 `node qa/runtime_version_consistency_smoke.js`
9. `node qa/service_worker_content_integrity_smoke.js`
10. `node qa/docs_handoff_smoke.js`
11. `node qa/run_all_checks.js` 또는 등록 순서 분할 실행과 현재 버전 감사 산출물 재생성
12. clean v1.6.38에 patch를 덮어쓴 결과와 full release를 SHA-256 파일 단위 비교

## 현재 검증 결과

- 등록 QA 317개
- endpoint별 독립 pin·legacy 이관·다른 endpoint pin 비유출 통과
- 다른 endpoint로 변경 후 재확인 전 stale generation 차단 통과
- generation HTTP 503·transcription HTTP 500 실패 이력과 prompt·endpoint 비보존 통과
- 실제 loopback probe cancellation·redirect 차단·shared deadline 기존 회귀 재통과
- 서비스워커 앱 셸 135개 SHA-256 무결성 통과
- 전체 QA 317/317 통과, 실패 0건
- 4-viewport browser·5-cycle heap·8-cycle process-memory·30분 Smart Reframe·speaker timing/live preview/paging 현재 버전 감사 통과
- 실미디어 dispose 후 active Object URL·operation·render queue 0개
- 서비스워커 manifest SHA-256 `9bbb075f71d8ab75bd67fdcc161e34320d510ebc53ee7f1361725c42e7232d44`

## 알려진 제한

- endpoint별 pin은 분리되지만 endpoint profile 이름·목록을 관리하는 별도 UI는 아직 없습니다.
- endpoint 원문은 저장 pin key에 포함하지 않지만 기존 Local AI 설정에는 사용자가 입력한 localhost 주소가 저장됩니다.
- 실제 Ollama·llama.cpp·whisper.cpp 바이너리와 모델 추론까지는 실행하지 않았습니다. 실제 Node loopback HTTP transport와 provider payload·상태·deadline 계약까지 검증합니다.
- fetch transport 취소는 보장하지만 서버 프로세스가 이미 시작한 내부 모델 계산의 즉시 중단 여부는 각 서버 구현에 달려 있습니다.
- 현재 컨테이너에서는 물리 GPU 가속과 iOS Safari·Samsung Internet 실제 touch/drag를 검증하지 못했습니다.
- 15→30→15분 전체 장시간 시퀀스는 변경되지 않은 IndexedDB analysis persistence·render cleanup·Object URL ownership 경로의 기존 완주 증빙을 승계하고, 현재 변경 경로와 30분 Smart Reframe·heap·process-memory 감사를 별도 재검증합니다.
- 여러 Playwright 감사를 한 프로세스에서 연속 실행하면 Chromium pipe가 대기할 수 있어 각 브라우저 감사를 독립 프로세스로 실행합니다.

## 다음 담당자 우선순위

1. endpoint profile 이름·모델 목록·pin·probe 상태를 독립 저장하는 UI 구조 도입
2. Local AI provider history를 진단 bundle에서 성공·실패 유형별로 요약 표시
3. 실제 Ollama·llama.cpp·whisper.cpp에서 endpoint 전환과 pin migration 통합 검증
4. Chromium RSS를 browser·renderer·GPU·media utility별 20회 이상 장시간 추적
5. iPhone Safari와 Samsung Internet touch reorder·버튼 fallback 실기기 검증
6. 물리 GPU 환경에서 WebGL·video decode·canvas render·전력 계측

## 결과 전달 계약

모든 후속 릴리스는 `DELIVERY_RULES.md`에 따라 반드시 다음 순서를 유지합니다.

1. 작업한 내역
2. 다운로드 가능한 통파일 ZIP과 붙여넣기 패치 ZIP
3. 다음 예정 내역
