# CHANGELOG

## v1.0.6 - Motion Stability / No-Shake Tab Reveal

### Fixed

- Dock 탭 클릭 시 화면이 미세하게 떨리는 문제를 수정했습니다.
- 여러 flow 모듈이 동시에 `smooth scroll`을 실행하던 구조를 정리했습니다.
- 탭 전환 시 작업 패널이 두 번 이상 다시 잡히며 흔들려 보일 수 있던 현상을 방지했습니다.
- 작업 패널 reveal 하이라이트가 과하게 번쩍이거나 흔들려 보이지 않도록 완화했습니다.
- 추천/후보 안내 영역의 반짝임과 모션 충돌을 추가로 차단했습니다.

### Added

- `src/ui/motion-stability.js`
  - 탭 이동 스크롤을 한 곳에서만 처리하는 단일 모션 가드.
  - 중복 스크롤 요청 병합.
  - 가까운 시간 안의 동일 위치 재스크롤 차단.
  - `auto` 기반 안정 reveal 적용.
- `assets/css/motion-stability.css`
  - 전역 `smooth scroll` 충돌 방지.
  - 흔들림 없는 패널 하이라이트.
  - 작업 패널 transform/animation 충돌 차단.
- `qa/motion_stability_smoke.js`
  - 모션 안정화 모듈 연결, 서비스워커 캐시, 중복 smooth scroll 제거 검수.

### Changed

- `hyperflow-tabs.js`, `workspace-comfort.js`, `flow-quality-gate.js`의 reveal 동작을 `AIShortsMotionStability` 중심으로 정리했습니다.
- `workspace-comfort.js`는 탭 이동 스크롤을 직접 실행하지 않고 카드 장식/안내 안정화 중심으로 동작합니다.
- 서비스워커 캐시를 `v1.0.6-motion-stability`로 갱신했습니다.

### Guardrails

- Dock 탭 클릭 시 `smooth scroll`을 여러 모듈에서 동시에 실행하지 않습니다.
- 패널 이동은 한 프레임 안에서 한 번만 처리합니다.
- 작업 화면 강조는 위치를 흔드는 transform이 아니라 outline/box-shadow 중심으로 처리합니다.
