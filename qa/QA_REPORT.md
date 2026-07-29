# QA REPORT v1.6.39

## 등록 결과

- 전체 등록 검사: **317개**
- 통과: **317/317**
- 실패: **0개**
- 합산 실행 시간: **88.495초**
- 최종 원본: `qa/qa-run-v1.6.39-final.json`

## 신규·갱신 검사

- 신규 `local_ai_endpoint_pin_history_smoke.js`
- 갱신 `local_ai_endpoint_integrity_smoke.js`
- 강화 `local_ai_studio_smoke.js`
- 기존 Local AI race·transport·deadline·resilience·queue 회귀 재검증

## 핵심 증빙

- legacy pin이 현재 endpoint 범위 v2 pin으로 이관됨
- endpoint A/B가 동일 모델명에 서로 다른 digest를 독립 pin함
- 한 endpoint의 unpin이 다른 endpoint pin을 삭제하지 않음
- 다른 endpoint pin이 있으면 probe 전 generation이 stale 상태로 차단됨
- generation·transcription 실패가 bounded history에 기록됨
- failure history에 prompt·schema·endpoint·미디어 내용이 포함되지 않음
- 4-viewport·heap·process-memory·30분 Smart Reframe·speaker browser 감사 통과
- 서비스워커 135개 앱 셸 무결성 통과

## 실행 방식과 한계

- Chromium 감사 산출물을 먼저 생성해야 하는 검사는 생성 후 독립 재실행했습니다.
- 최종 원본은 분할 실행과 성공 재실행 기록을 package.json 등록 순서로 통합한 결과입니다.
- 실제 모델 바이너리 추론, 물리 GPU, iOS Safari·Samsung Internet 실기기 검증은 포함하지 않습니다.
