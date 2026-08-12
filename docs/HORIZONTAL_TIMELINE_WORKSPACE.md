# Horizontal Timeline Workspace

## 목적

PC Timeline Editor에서 시간 진행은 좌→우인데 클립 자체는 세로 카드처럼 느껴지던 불일치를 제거합니다. `0.11.10`부터 ruler, clip, playhead가 하나의 시간→픽셀 X축을 공유합니다.

## 좌표 계약

- 기본 배율은 `72px / second`입니다.
- zoom은 초당 픽셀 값에 직접 곱해집니다.
- 각 클립의 시작 offset은 이전 클립 duration 폭의 누적값입니다.
- ruler tick과 playhead는 같은 inset/content width를 사용합니다.
- 길이가 긴 클립은 실제로 더 길게, 짧은 클립은 더 짧게 표시합니다.

## PC UX

- 1024px 이상에서는 클립을 얇은 가로 strip으로 표시합니다.
- 타임라인은 순서·길이·화자·상태·재생 위치 확인에 집중합니다.
- 상세 대사 수정은 선택 클립 빠른 편집기에서 수행합니다.
- 트랙 배경/눈금은 click/drag seek를 담당합니다.
- 클립 click은 선택, drag는 reorder를 담당해 seek와 역할을 분리합니다.
- 좁은 클립은 container query로 avatar/menu/status를 단계적으로 줄여 겹침을 방지합니다.

## 모바일

1024px 미만에서는 기존 세로형 카드 UX를 유지합니다. 모바일에서 억지로 긴 가로 타임라인을 강제하지 않습니다.

## 확장 원칙

향후 BGM/SFX/영상 트랙을 추가해도 X축 geometry는 공유하고 트랙별 Y축만 늘립니다. 새로운 트랙이 독자적인 시간 계산을 만들지 않습니다.
