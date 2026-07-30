# QA REPORT v1.6.40

## 등록 결과

- 전체 등록 검사: **318개**
- 통과: **318/318**
- 실패: **0개**
- 합산 실행 시간: **80.814초**
- 최종 원본: `qa/qa-run-v1.6.40-final.json`

## 신규·갱신 검사

- 신규 `local_ai_endpoint_profiles_smoke.js`
- 강화 `local_ai_studio_smoke.js`
- 기존 Local AI pin·race·transport·deadline·resilience·queue 회귀 재검증

## 핵심 증빙

- legacy endpoint-only settings가 provider별 default profile로 migration됨
- profile별 endpoint·preferred model·model cache·last probe·pin count가 독립 보존됨
- profile 전환 후 runtime trust를 재사용하지 않고 새 probe 전 generation이 차단됨
- 동일 endpoint 중복 저장과 final profile 삭제가 차단됨
- profile 삭제가 해당 endpoint의 pin만 정리함
- snapshot에 endpoint/profile name/model 원문이 포함되지 않음
- 4-viewport·heap·process-memory·30분 Smart Reframe·speaker browser 감사 통과
- 서비스워커 135개 앱 셸 무결성 통과

## 실행 방식과 한계

- Chromium 감사 산출물을 먼저 생성해야 하는 검사는 생성 후 등록 순서 검사를 실행했습니다.
- 최종 원본은 분할 실행 결과를 `package.json` 등록 순서로 통합했습니다.
- 실제 모델 바이너리 추론, 물리 GPU, iOS Safari·Samsung Internet 실기기 검증은 포함하지 않습니다.
