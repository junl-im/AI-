# Selection Continuity & Convenience · 0.11.21

## 문제

0.11.20은 Player/Dock이 다른 Timeline clip으로 이동할 때 미저장 quick draft를 먼저 저장하도록 보강했습니다. 하지만 사용자가 Timeline clip 자체를 직접 클릭하거나 범위/토글 선택을 바꾸는 경로는 같은 보호를 사용하지 않아, quick editor의 draft가 새 선택의 원문으로 교체될 수 있었습니다.

또한 0.11.20의 Timeline → 현재 Voice 동기화는 전역 `voiceId`를 바꿉니다. Multi-Speaker Assist의 추천 effect가 이 `voiceId` 변화도 새 추천 의도로 해석하면서, 사용자가 이미 확인한 화자 배정이 Timeline 탐색만으로 다시 미확인 상태가 될 수 있었습니다.

## 0.11.21 계약

- 단일 선택, 범위 선택, Ctrl/Cmd 토글 선택 전에 dirty quick draft를 먼저 저장합니다.
- 빈 draft는 대사 삭제로 해석하지 않고 기존 문장으로 복원하는 기존 안전 규칙을 유지합니다.
- Player/Dock 이동 autosave와 수동 Timeline 선택 autosave는 같은 `saveQuickDraft()` 경로를 사용합니다.
- Timeline clip 선택 때문에 바뀐 전역 Voice는 Multi-Speaker 추천 seed를 갱신하지 않습니다.
- Timeline 적용 대상이 없는 상태에서 사용자가 Voice Picker/Drawer로 기본 목소리를 직접 선택한 경우에만 추천 seed revision을 올립니다.
- 기존 확인된 speaker assignment, Timeline clip voice, generated audio를 탐색 동작만으로 수정하지 않습니다.

## 회귀 테스트

- `TimelineEditor.test.tsx`: 수동 clip 선택 전에 dirty draft가 이전 clip ID로 저장되는지 확인합니다.
- `HomePage.test.tsx`: Multi-Speaker 배정 확인 → Timeline 생성 → 다른 성우 clip 선택 뒤에도 전체 생성 CTA가 계속 활성 상태인지 확인합니다.

## 다음 단계

stale `MY VOICE`가 Timeline clip에 남는 경우에는 자동 파괴적 치환 대신 상태 표시와 명시적 복구 액션이 필요합니다. 이 작업은 0.11.22 후보로 넘깁니다.
