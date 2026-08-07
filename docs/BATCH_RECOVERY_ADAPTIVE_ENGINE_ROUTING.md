# Batch Recovery UX & Adaptive Engine Routing

SoriON AI 0.11.2는 장문 제작 중 실패가 생겼을 때 **다시 찾고 다시 선택하는 조작 비용**과, circuit이 열리기 전 **같은 불안정 엔진을 연속으로 재선택하는 체감 실패**를 함께 줄입니다.

## Batch recovery UX

`regenerateMany()`는 요청 ID와 함께 성공, 실패, 건너뜀 ID를 모두 반환합니다. UI는 결과를 `성공 N · 실패 N · 건너뜀 N`으로 유지합니다. 실패가 있으면 실패 ID만 선택 집합으로 바꾸고 첫 실패 클립을 빠른 편집 대상으로 지정합니다.

이 자동 선택은 작업 결과를 지우지 않습니다. 사용자는 실패 원인을 확인한 뒤 `실패만 재시도`를 바로 누를 수 있고, 재시도 횟수도 결과 영역에서 확인합니다. `대사 전체`와 `실패만` 빠른 선택은 긴 타임라인의 반복 클릭을 줄입니다.

## Adaptive auto routing

기본 circuit threshold가 2일 때 첫 엔진 실패는 아직 circuit open 조건이 아닙니다. 0.11.2는 이 구간에 `SORION_ENGINE_SOFT_DEGRADE_SECONDS`만큼 soft-degrade를 설정하고 auto 정렬 점수를 일시적으로 낮춥니다. 기본값은 15초입니다.

soft-degrade는 circuit breaker를 대체하지 않습니다.

- 엔진을 명시적으로 선택하면 soft-degrade 상태에서도 probe할 수 있습니다.
- 명시적 또는 auto 성공은 soft-degrade를 즉시 제거합니다.
- circuit이 열린 이력이 있으면 기존 cooldown과 half-open 단일 probe가 우선합니다.
- 프리셋 비호환 `SOA-4022`는 엔진 장애로 기록하지 않으므로 soft-degrade도 만들지 않습니다.

## 운영 진단

Engine API, Quality Lab, Engine Doctor는 `selection_penalty`, `degraded_remaining_seconds`, `selection_reason`을 같은 의미로 표시합니다. 이 값은 음질 점수나 장치 benchmark가 아니라 **최근 실패에 따른 임시 auto 선택 신호**입니다.

## 다음 단계

0.11.3에서는 batch 실패 원인을 엔진/프리셋/연결/취소 등으로 그룹화하고, soak 비교 provenance와 승인된 Chromium pixel baseline을 다룹니다.
