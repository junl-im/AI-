# Multi-Speaker Assist & Resume Generation

기준 버전: `0.11.9`

## 목적

One-Flow의 기본 단순함을 유지하면서, 명확하게 작성된 다인 대본은 화자별 목소리로 빠르게 변환하고 장문 생성 중 중지한 작업은 완성분을 버리지 않고 이어서 진행합니다.

## Multi-Speaker Assist

- 자동 감지는 모든 비어 있지 않은 줄이 `화자: 대사` 또는 `화자：대사` 형식일 때만 활성화합니다.
- 최소 2명의 서로 다른 화자가 있어야 합니다.
- 설명문, 제목, 타임코드 등 형식이 섞이면 자동 배정을 하지 않습니다.
- 이름만 보고 성별이나 연령을 추정하지 않습니다.
- 첫 화자는 현재 선택된 기본 voice를 제안하고, 나머지는 현재 preset 목록을 순환해 제안합니다.
- 제안은 사용자 승인 전 실제 생성에 사용하지 않습니다.
- 화자별 `▶ 듣기`는 해당 화자의 첫 대사를 사용하지만 현재 전역 voice 선택은 변경하지 않습니다.

## 생성과 순서

승인된 화자 mapping은 각 대사를 clip별 generation option으로 변환합니다. 이후 생성은 기존 0.11.8 안전 계약을 그대로 사용합니다.

1. 첫 clip 우선 생성 및 자동 재생
2. 이후 최대 2개 bounded parallel
3. 완료 순서와 관계없이 원문 timeline 순서로 player queue 정렬
4. circuit breaker, soft-degrade, active-request load awareness 유지

## 프로젝트 저장과 복원

생성 프로젝트에는 대표 voice 외에 `timelineClips`를 저장합니다.

- `text`
- `voiceId`
- `voiceName`

`jobIds`는 같은 clip 순서를 사용합니다. 프로젝트를 다시 열 때 `timelineClips`가 있으면 이 정보를 우선 사용해 다중 화자 voice를 복원하고, 구버전 프로젝트는 기존 대표 voice 방식으로 계속 복원합니다.

## Resume Generation

`생성 중지`는 batch token을 무효화하고 실행 중 요청을 abort합니다.

- 이미 `ready`인 음원은 유지합니다.
- 아직 시작하지 않았거나 취소된 block은 `queued`로 유지합니다.
- queued block이 남아 있으면 One-Flow에 `남은 N개 이어서 만들기`를 표시합니다.
- 재개 시 queued ID만 새 batch에 넣습니다.
- 재개 완료 후 프로젝트 저장은 남은 batch만 저장하지 않고 전체 original block ID의 현재 snapshot을 읽어 clip voice/job 순서를 보존합니다.

## 안전 경계

- 혼합 형식 대본을 억지로 화자 분류하지 않습니다.
- 자동 제안을 사용자 선택으로 가장하지 않습니다.
- 화자 이름에서 성별을 추정하지 않습니다.
- 이미 완성된 clip을 resume 때문에 다시 생성하지 않습니다.
- 승인 Chromium baseline 파일이 없는 상태에서는 visual baseline required gate를 강제로 켜지 않습니다.
