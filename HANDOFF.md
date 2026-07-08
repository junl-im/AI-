# HANDOFF v1.1.4

## 요약

v1.1.4는 상단 디자인 정리, 셔터 플래시 무드, 본 화면 단순화, Dock reveal 떨림 안정화를 반영한 패치입니다.

## 주요 파일

- `assets/css/shutter-glass-flow.css`
- `src/ui/flow-director-final.js`
- `qa/shutter_flow_director_smoke.js`

## 중요 변경점

- `flow-director-final.js`가 마지막에 로드되어 `AIShortsMotionStability.reveal`과 `AIShortsHyperFlowTabs.setActiveFlowTab`을 단일 reveal 루트로 통합합니다.
- CSS에서 비활성 `[data-flow-panel]`을 `display:none`으로 강하게 제한합니다.
- 패널 애니메이션은 대부분 제거하고, 상단 셔터 연출만 유지합니다.
- Dock 라벨은 `파일 열기 / 추천 / 후보 / 미리보기 / 파형 / 컷 / 편집 / 저장`으로 정리했습니다.

## 확인 포인트

1. PC에서 상단 좌측은 버전, 우측은 Design by 곰같은여우로 한 줄 정렬되어야 합니다.
2. 상단 아래 YouTube/Reels/TikTok 셔터 타일이 보여야 합니다.
3. Dock 탭을 눌러도 화면이 떨리지 않아야 합니다.
4. Dock 탭 클릭 시 해당 패널이 전면에 가까운 위치로 이동해야 합니다.
5. 한 번에 여러 작업 패널이 아래로 줄줄이 펼쳐지면 안 됩니다.

## QA

- `npm run check`로 전체 스모크 테스트를 실행합니다.
- v1.1.4에서는 `shutter_flow_director_smoke.js`가 상단 셔터 UI와 단일 Flow Director 연결을 확인합니다.

## Known limitations

- 원본 미디어 파일은 브라우저 보안 정책상 세션에 자동 저장하지 않습니다.
- 모바일 Safari 및 일부 인앱 브라우저에서는 MediaRecorder 저장 형식과 진동 피드백이 제한될 수 있습니다.
- 셔터 플래시 연출은 `prefers-reduced-motion` 환경에서 자동으로 비활성화됩니다.

## 검수 순서

1. `npm run check` 실행
2. PC Dock 8탭 가독성 확인
3. Dock 탭 클릭 시 화면 떨림 없이 해당 패널이 전면으로 올라오는지 확인
4. 상단 버전/Design by 한 줄 정렬 확인
5. 셔터 플래시 연출이 작업 패널에 영향을 주지 않는지 확인

## 알려진 제한

- 원본 미디어 파일은 브라우저 보안 정책상 세션에 자동 저장하지 않습니다.
- 모바일 Safari 및 일부 인앱 브라우저에서는 MediaRecorder 저장 형식과 진동 피드백이 제한될 수 있습니다.
- 셔터 플래시 연출은 `prefers-reduced-motion` 환경에서 자동으로 비활성화됩니다.
