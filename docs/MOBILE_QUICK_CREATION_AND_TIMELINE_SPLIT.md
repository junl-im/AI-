# Mobile Quick Creation & Timeline Split · 0.11.16

## 목적

모바일에서 목소리 선택과 Timeline 선택이 같은 작업 대상을 공유하도록 만들고, 1,200줄 안전 상한에 근접한 Timeline Editor의 렌더링 책임을 분리합니다.

## 변경

- `TimelineVoiceBlockCard.tsx`: voice clip 렌더링, 재생/재시도, 직접 편집, split/delete/menu, 터치 다중 선택을 담당합니다.
- `TimelineEditor.tsx`: selection/history/batch/timeline axis orchestration에 집중합니다.
- 모바일 `＋ / ✓`: modifier key 없이 voice/pause clip을 toggle selection 합니다.
- Voice Picker는 실제 선택된 voice clip 개수를 보여주며 성우 탭의 적용 범위를 명확히 알립니다.
- 긴 대본 모바일 작업에서는 voice control과 primary generation CTA를 sticky 처리합니다.

## 안전 원칙

- pause block은 voice 적용 대상 수에 포함하지 않습니다.
- 기존 Ctrl/Cmd/Shift 데스크톱 selection은 유지합니다.
- 기존 bounded parallel, audio recovery, player queue 계약은 변경하지 않습니다.
