# HANDOVER

## 2026-07-31 · v0.5.8

- 작업: Compact banner, PC two-frame workspace, fixed linked-player dock.
- 요청 이유: 상단 설명을 작게 묶고 10초 전환, PC 2프레임, 모바일 1프레임, 설정 이동, Dock 플레이어 이식.
- 이식 근거: foxbear-mastering-studio v1.6.47의 playback-link-service, dock-controller, dock waveform 구조를 검토함.
- 이식 원칙: 전역 window 서비스와 누적 CSS는 복사하지 않고 React/Zustand/CSS로 재작성함.
- 변경 영향: AppShell, BrandMasthead, HomePage, navigation, player store, global styles.
- 플레이어: 생성된 음성이 자동으로 Dock에 연결되며 단일 audio element가 재생·탐색·시간 표시를 담당함.
- 반응형: 980px 이상 PC 2프레임, 그 미만 모바일/태블릿 1프레임.
- 설정: Dock에서 제거하고 상단 DESIGNED BY 옆 톱니 버튼으로 이동.
- 제한: 업로드 원본의 A/B 비교·다중 플레이어 orchestration 전체는 아직 이식하지 않음.
- 다음: player queue, previous/next, download shortcut, voice clone capture.

## 다음 예상 업데이트

v0.6.0 Voice Clone + Linked Player.
