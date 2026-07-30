# PROJECT NOTES v1.6.40

- Local AI endpoint profile은 기존 settings envelope의 `endpointProfiles`와 `activeEndpointProfileIds`에 저장합니다.
- profile은 provider별 최대 8개, cached model은 최대 40개입니다.
- 기존 endpoint-only 설정은 provider별 deterministic default profile로 자동 migration합니다.
- profile은 endpoint, 선호 creative/speech model, 최근 probe 요약, bounded model list를 독립 보존합니다.
- profile 전환은 endpoint와 모델을 복원하지만 runtime trust는 초기화하므로 새 probe가 필요합니다.
- 동일 provider에 동일 normalized endpoint profile을 중복 저장할 수 없습니다.
- final provider profile은 삭제할 수 없고, profile 삭제 시 해당 endpoint token 범위의 model pin을 제거합니다.
- snapshot에는 profile count와 active profile token만 포함하며 endpoint/profile 원문은 내보내지 않습니다.
- 신규 회귀 `local_ai_endpoint_profiles_smoke.js`를 등록해 migration, isolation, activation, deletion, privacy를 검증합니다.
- 정적 `<body data-build>`를 v1.6.40으로 동기화해 build marker 품질 게이트를 복구했습니다.
- 최종 결과 전달은 `DELIVERY_RULES.md`의 3단 구성과 두 ZIP 제공 규칙을 영구 적용합니다.
- 최종 QA는 등록 순서 분할 실행과 현재 버전 감사 생성으로 318/318 통과했습니다.
- 현재 버전 4-viewport, 5-cycle heap, 8-cycle process-memory, 30-minute Smart Reframe, speaker browser 증빙을 포함합니다.
- asset manifest SHA-256은 `0edcb298f0484ab806af510f28326cbfc7e94cd1159f77418dcc759e0e0569a7`입니다.
