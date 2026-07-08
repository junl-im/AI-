# CHANGELOG

## v1.1.5 - Shutter Glass Flow + Command Bridge / 떨림 안정화

- 상단 브랜드 라인을 좌측 `v1.1.5`, 가운데 `PC · 모바일 호환`, 우측 `Design by 곰같은여우` 한 줄로 고정했습니다.
- 상단 하단부에 YouTube / Reels / TikTok을 연상시키는 셔터 플래시 무드 스트립을 추가했습니다.
- 본 화면은 복잡한 시작 버튼 묶음 대신 단순 사용 방법 중심으로 정리했습니다.
- Dock 탭 이동과 작업 패널 reveal을 `flow-director-final.js` 단일 소유 구조로 통합하고, `flow-command-bridge.js`로 레거시 클릭 핸들러 중복 실행을 차단했습니다.
- 특정 구간 화면 떨림을 유발하던 중복 스크롤/하이라이트 애니메이션을 최종 차단했습니다.
- 글라스 UI 대비와 Dock 이모지/라벨 배치를 재정리했습니다.
- QA에 `shutter_flow_director_smoke.js`, `no_shake_command_bridge_smoke.js`를 추가했습니다.
