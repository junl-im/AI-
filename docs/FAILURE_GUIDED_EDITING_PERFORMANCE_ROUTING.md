# Failure-Guided Editing & Adaptive Performance Routing

## Batch failure guidance

`TimelineBatchGenerationSummary`는 실패 ID와 함께 가능한 경우 `engine`, `preset`, `network`, `cancelled`, `unknown` 원인을 기록합니다. UI는 결과를 원인별로 묶어 필요한 그룹만 다시 재생성할 수 있습니다. 빠른 실패 재시도는 같은 오류를 무한 반복하지 않도록 3회 상한을 사용하며, 사용자의 명시적인 `선택 재생성`은 별도 행동으로 남깁니다.

## Adaptive performance routing

기존 circuit breaker와 recent-failure soft-degrade는 그대로 유지합니다. 추가 성능 점수는 성공·실패와 지연시간의 EWMA를 사용하며 최소 4개 표본 뒤에만 auto 정렬에 반영합니다. 기본 관찰창은 마지막 시도 뒤 120초이며 시간이 지나면 감점이 자동 소멸합니다.

- 최근 안정도 EWMA가 85% 미만이면 단계별 감점
- 최근 지연 EWMA가 3.5초를 넘으면 단계별 감점
- explicit engine 요청에는 auto 성능 감점을 적용하지 않음
- cooldown 또는 half-open probe가 필요한 엔진에는 기존 circuit 복구 상태 기계가 우선
- 성공한 circuit recovery probe는 최근 성능 표본을 정상 기준으로 다시 시작

환경 설정:

- `SORION_ENGINE_PERFORMANCE_MIN_SAMPLES=4`
- `SORION_ENGINE_PERFORMANCE_WINDOW_SECONDS=120`

이 점수는 음질 평가나 영구 장애 판정이 아니라 현재 프로세스의 auto 선택 보조 신호입니다.
