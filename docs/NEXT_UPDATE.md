# NEXT UPDATE

현재 기준: `0.11.9 · Multi-Speaker Assist & Resume Generation`

## 목표 버전

`0.11.10 · Editing History & Speaker Workflow Polish`

### 우선순위

1. 다중 화자 mapping을 프로젝트 편집 중 다시 열어 빠르게 수정할 수 있는 `화자 관리` 진입점을 검토합니다.
2. Timeline 이동 1회 Undo를 text/voice 변경까지 포함하는 bounded edit history로 확장하되 audio/job 폐기 규칙을 안전하게 유지합니다.
3. 긴 다중 화자 대본에서 speaker mapping, 2-way parallel, engine switching, 취소/재개가 성공률과 P95 지연을 악화시키지 않는지 soak evidence를 남깁니다.
4. `화자: 대사` 외에 screenplay 스타일 지원은 자동 추론이 아니라 명시적 import option으로만 검토합니다.
5. 승인된 Chromium 1024/1280/1440 baseline PNG와 SHA manifest가 확보된 경우에만 `SORION_VISUAL_BASELINE_REQUIRED=1`을 CI 필수 gate로 전환합니다.
6. 프로젝트 저장 스키마의 `timelineClips`가 구버전 프로젝트와 호환되는지 실제 IndexedDB migration/restore 사례를 추가 검증합니다.

## 0.11.9에서 고정한 결정

- Multi-Speaker Assist는 명확한 `화자: 대사` 전체 라인 형식에서만 자동 활성화합니다.
- 이름에서 성별·연령을 추정하지 않습니다.
- voice suggestion은 사용자 승인 전 실제 생성에 사용하지 않습니다.
- clip-level voice와 job 순서를 프로젝트 저장/복원에서 유지합니다.
- resume은 queued clip만 생성하고 ready clip은 보존합니다.
- 첫 음성 우선 + 이후 최대 2-way bounded parallel + 원문 순서 복원 계약을 유지합니다.
