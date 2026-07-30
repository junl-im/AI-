# HANDOFF v1.6.40

## 인수인계 요약

v1.6.39의 endpoint-scoped pin과 failure history 계약을 유지하면서 Local AI endpoint를 이름 있는 프로필로 운영할 수 있게 확장했습니다.

1. 제공자별 named endpoint profile 저장·전환·삭제 API 추가
2. 기존 단일 endpoint 설정을 제공자별 기본 프로필로 자동 migration
3. endpoint·선호 모델·최근 probe·bounded 모델 cache를 프로필별 독립 보존
4. 프로필 전환 시 런타임 ready 상태를 무효화하고 새 probe 전 생성 차단
5. 프로필 삭제 시 해당 endpoint의 digest pin 정리
6. 동일 제공자·동일 endpoint 중복 프로필 차단, 마지막 프로필 삭제 차단
7. desktop/mobile Local AI 패널에 프로필 관리와 상태 요약 UI 추가
8. 진단 snapshot에는 endpoint/profile 원문 없이 bounded count와 token만 노출
9. 신규 endpoint profile 회귀 등록, 전체 QA 318개로 확장

## 시스템·성능·기술 구조

- Local AI profile·endpoint·pin·probe·deadline·history: `src/ai/local-ai-provider-registry.js`
- Local AI profile 관리 UI: `src/ui/local-ai-studio.js`, `assets/css/local-ai-studio.css`, `index.html`
- serial queue·cancel·timeout: `src/ai/ai-job-coordinator.js`
- 버전·build key: `src/config/app-runtime-config.js`, `src/boot/staged-ui-loader.js`, `index.html`
- 앱 셸 캐시·무결성: `sw.js`, `asset-integrity.json`
- Update Sentinel 업데이트 감지·이전 shell cache 정리·진단 복사: `src/boot/update-sentinel.js`, `assets/css/update-sentinel.css`
- 신규 회귀: `qa/local_ai_endpoint_profiles_smoke.js`
- 강화 회귀: `qa/local_ai_studio_smoke.js`
- 최종 QA 집계: `qa/qa-run-final-summary.json` (`qa/qa-run-v1.6.40-final.json` 원본)

## 주요 계약

- `endpointProfiles`와 `activeEndpointProfileIds`는 기존 Local AI settings envelope 안에 저장됩니다.
- 각 profile은 id, name, normalized endpoint, creative/speech model, 최근 모델 목록, 최근 probe 요약만 보존합니다.
- provider별 profile은 최대 8개, cached model은 최대 40개입니다.
- 기존 저장 설정에 profile이 없으면 현재 provider endpoint로 deterministic default profile을 생성합니다.
- profile activation은 endpoint와 선호 모델을 복원하지만 이전 endpoint runtime status는 신뢰하지 않습니다.
- model pin은 endpoint token 범위를 유지하며 profile 삭제 시 해당 endpoint pin만 제거합니다.
- snapshot은 profile count와 active profile token만 내보내며 profile name·endpoint·모델 원문을 노출하지 않습니다.
- 결과 전달 형식은 `DELIVERY_RULES.md`를 영구 기준으로 사용합니다.

## 검수 순서

1. `node qa/local_ai_endpoint_profiles_smoke.js`
2. `node qa/local_ai_endpoint_pin_history_smoke.js`
3. `node qa/local_ai_endpoint_integrity_smoke.js`
4. `node qa/local_ai_state_race_smoke.js`
5. `node qa/local_ai_transport_integration_smoke.js`
6. `node qa/local_ai_operation_deadline_smoke.js`
7. `node qa/local_ai_provider_resilience_smoke.js`
8. `node qa/local_ai_studio_smoke.js`
9. `node qa/app_version_sync_smoke.js`와 `node qa/runtime_version_consistency_smoke.js`
10. `node qa/service_worker_content_integrity_smoke.js`
11. `node qa/docs_handoff_smoke.js`
12. `node qa/run_all_checks.js` 등록 순서 분할 실행과 현재 버전 감사 산출물 생성
13. clean v1.6.39에 patch를 덮어쓴 결과와 full release를 SHA-256 파일 단위 비교

## 현재 검증 결과

- 등록 QA 318개, **318/318 통과**, 실패 0건
- legacy endpoint 설정의 default profile migration 통과
- endpoint별 모델 cache·최근 probe·pin count 격리 통과
- profile 전환 후 새 probe 전 generation 차단 통과
- duplicate profile·final profile 삭제 방어와 삭제 endpoint pin cleanup 통과
- 실제 loopback probe cancellation·redirect 차단·shared deadline 기존 회귀 재통과
- 서비스워커 앱 셸 135개 SHA-256 무결성 통과
- 4-viewport browser·5-cycle heap·8-cycle process-memory·30분 Smart Reframe·speaker timing/live preview/paging 현재 버전 감사 통과
- 실미디어 dispose 후 active Object URL·operation·render queue 0개
- 서비스워커 manifest SHA-256 `0edcb298f0484ab806af510f28326cbfc7e94cd1159f77418dcc759e0e0569a7`

## 알려진 제한

- profile은 현재 브라우저의 Local AI settings에만 저장되며 별도 profile import/export UI는 없습니다.
- endpoint 원문은 pin key나 diagnostics snapshot에 포함하지 않지만 사용자가 저장한 profile 설정에는 localhost 주소가 필요합니다.
- 실제 Ollama·llama.cpp·whisper.cpp 바이너리와 모델 추론까지는 실행하지 않았습니다. 실제 Node loopback HTTP transport와 provider payload·상태·deadline 계약까지 검증합니다.
- fetch transport 취소는 보장하지만 서버 프로세스가 이미 시작한 내부 모델 계산의 즉시 중단 여부는 각 서버 구현에 달려 있습니다.
- 현재 컨테이너에서는 물리 GPU 가속과 iOS Safari·Samsung Internet 실제 touch/drag를 검증하지 못했습니다.
- 15→30→15분 전체 장시간 시퀀스는 변경되지 않은 persistence·render cleanup·Object URL ownership 경로의 기존 완주 증빙을 승계하고, 현재 30분 Smart Reframe·heap·process-memory 감사를 별도 재검증했습니다.

## 다음 담당자 우선순위

1. provider history를 성공·실패·timeout·cancel 유형별로 요약하는 Local AI 진단 UI와 support bundle 연동
2. endpoint profile export/import 및 충돌 처리 정책
3. 실제 Ollama·llama.cpp·whisper.cpp에서 profile 전환·model migration·pin mismatch 통합 검증
4. Chromium RSS를 browser·renderer·GPU·media utility별 20회 이상 장시간 추적
5. iPhone Safari와 Samsung Internet touch reorder·버튼 fallback 실기기 검증
6. 물리 GPU 환경에서 WebGL·video decode·canvas render·전력 계측

## 결과 전달 계약

모든 후속 릴리스는 `DELIVERY_RULES.md`에 따라 반드시 다음 순서를 유지합니다.

1. 작업한 내역
2. 다운로드 가능한 통파일 ZIP과 붙여넣기 패치 ZIP
3. 다음 예정 내역
