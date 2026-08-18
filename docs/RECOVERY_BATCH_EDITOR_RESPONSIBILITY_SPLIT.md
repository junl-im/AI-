# Recovery Batch & Editor Responsibility Split

버전: **0.11.24**  
기준: **0.11.23 · Focused Voice Surface & Picker Polish**

## 목적

0.11.22에서 단일 stale/unavailable MY VOICE 복구를 비파괴 방식으로 추가한 뒤 남아 있던 두 문제를 정리합니다.

1. 여러 stale MY VOICE가 섞인 선택에서 실제 복구 대상과 기존 완성 음원 영향을 실행 전에 명확히 확인합니다.
2. `TimelineEditor.tsx`가 직접 소유하던 selection과 batch/recovery 상태를 별도 hook으로 분리해 편집기 회귀 범위를 줄입니다.

## 다중 stale MY VOICE 복구 계약

- 사용자가 여러 대사를 선택하면 전체 선택과 별개로 **현재 사용할 수 없는 MY VOICE 클립만** 복구 대상으로 계산합니다.
- 정상 SoriON Voice나 준비된 MY VOICE 클립은 같은 선택에 포함되어 있어도 자동 교체하지 않습니다.
- 복구 영역은 사용 불가 클립 수, 원래 목소리별 구성, ready/generating 상태, 프로필 자체가 사라진 개수를 표시합니다.
- 기존 ready audio/track은 `복구 영향 확인` 전과 확인 dialog를 여는 동안 유지합니다.
- 실제 `교체만 적용` 또는 `교체 후 재생성`을 실행하는 순간에만 기존 `updateVoiceMany` 계약에 따라 대상 클립을 queued 상태로 전환합니다.
- generating 상태인 stale 대상이 있으면 복구 실행을 막아 진행 중 job과 교체 작업이 충돌하지 않게 합니다.
- 대체 Voice는 ready 상태이면서 현재 unavailable 원본 Voice 집합에 포함되지 않는 항목만 제안합니다.

## 영향 확인

실행 전 별도 impact dialog에서 다음을 다시 확인합니다.

- 전체 선택 개수와 실제 stale 복구 대상 개수
- 원래 MY VOICE 구성
- 실행 시 폐기되는 현재 완성 음원 개수
- 재생성 여부
- Undo의 의미: Voice 배정은 되돌릴 수 있지만 과거 audio 파일 자체를 부활시키지 않고 queued 상태로 안전 복원

이 계약은 “ready stale audio를 자동 삭제하지 않는다”는 0.11.22 결정을 유지합니다.

## Editor 책임 분리

### `useTimelineEditorSelection.ts`

- 단일/토글/범위 선택
- 선택 anchor
- 선택 voice block/ID/duration 파생값
- 전체 Voice 선택 shortcut
- 외부 `onSelectionChange` 동기화
- 삭제 등으로 block이 사라졌을 때 selection 정합성 복구

### `useTimelineEditorBatch.ts`

- batch Voice 적용/재생성
- 실패 분류와 실패 클립 재선택
- bounded retry 3회와 최근 6건 session history
- command preview
- stale MY VOICE 대상 계산과 replacement 선택
- 복구 impact dialog 상태와 실행

### `TimelineEditor.tsx`

- 화면 composition과 quick editor draft 저장 경계
- player-follow와 selection controller 연결
- command/recovery UI를 각 controller의 상태·행동에 연결

이번 분리 뒤 `TimelineEditor.tsx`는 약 1,038줄에서 **942줄**로 줄었으며, 후속 분리는 기능과 함께 무리하게 진행하지 않고 Web quality가 녹색인 상태에서 이어갑니다.

## Undo / History 계약

`updateVoiceMany`는 선택적 `historyLabel`을 받습니다.

- 일반 일괄 Voice 변경: `선택 클립 목소리 변경`
- 단일 stale 복구: `사용 불가 목소리 복구`
- 다중 stale 복구: `사용 불가 목소리 일괄 복구`

Undo/Redo snapshot은 기존 정책대로 semantic 편집 상태를 복원하되 폐기된 audio/job/track을 다시 연결하지 않습니다. 따라서 stale Voice 배정을 Undo해도 상태는 queued이고 과거 완성 음원을 부활시키지 않습니다.

## 회귀 방지

- `TimelineEditor.test.tsx`: 선택 3개 중 stale 2개만 복구되는지, 원래 구성과 ready audio 영향 안내가 보이는지 검증
- `useTimelineGeneration.test.ts`: 다중 복구 history label과 Undo/Redo의 queued/no-audio 복원을 검증
- `check-recovery-batch-editor-split.mjs`: 새 책임 파일, stale-only scope, impact 문구, semantic history, `TimelineEditor` 1,000줄 미만 계약을 dependency-free preflight에서 확인
- 기존 batch/studio/recovery 정적 검사는 책임이 이동한 hook을 직접 읽도록 갱신

## 변경하지 않은 것

- Voice engine routing과 API/Worker 생성 계약
- 프로젝트 저장 schema
- 최대 2-way bounded parallel 생성 상한
- 0.11.23 Voice Drawer/Picker의 `재생=선택` 계약
- 상단 지정 보조 영역 디자인
- WAV backend/API 지원

## 남은 검증

현재 전달 환경에는 완전한 Web `node_modules`와 연결된 GitHub 저장소 컨텍스트가 없습니다. 따라서 실제 Vitest, ESLint, semantic TypeScript typecheck, Vite production build, desktop/mobile Chromium 실행 증거는 0.11.24를 GitHub에 반영한 뒤 GitHub Actions에서 최종 확인합니다. 실제 MY VOICE Worker 복구 성공과 first-audio latency는 모델/Worker가 준비된 환경에서만 운영 증거로 승격합니다.
