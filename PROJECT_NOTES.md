# PROJECT NOTES v1.6.39

- Local AI model pin은 `v2|provider|endpointToken|modelId` key로 저장합니다.
- legacy `provider:modelId` pin은 저장된 현재 endpoint 범위로 자동 이관합니다.
- 동일 provider·model의 다른 endpoint pin이 있으면 현재 endpoint probe 전 상태를 `stale`로 유지합니다.
- 새 endpoint probe 후에는 해당 endpoint의 digest를 독립 pin할 수 있습니다.
- `pinModel`, `unpinModel`, `getModelPin`은 선택적 endpoint 인자를 받으며 생략 시 현재 설정 endpoint를 사용합니다.
- generation·transcription 성공과 실패 모두 bounded provider history에 기록합니다.
- provider history에는 prompt, schema, endpoint URL, 미디어 내용이 들어가지 않습니다.
- 전사 파일 size는 finite·0 이상이어야 합니다.
- 신규 회귀 `local_ai_endpoint_pin_history_smoke.js`를 등록해 endpoint 분리와 failure diagnostics를 검증합니다.
- 최종 결과 전달은 `DELIVERY_RULES.md`의 3단 구성과 두 ZIP 제공 규칙을 영구 적용합니다.
- 최종 QA는 등록 순서 분할 실행과 순서 의존 검사 독립 재실행으로 317/317 통과했습니다.
- 현재 버전 4-viewport, 5-cycle heap, 8-cycle process-memory, 30-minute Smart Reframe, speaker browser 증빙을 포함합니다.
- asset manifest SHA-256은 `9bbb075f71d8ab75bd67fdcc161e34320d510ebc53ee7f1361725c42e7232d44`입니다.
