# CHANGELOG

## v1.0.5 - Workspace Comfort / Flow Polish

### Added

- `assets/css/workspace-comfort.css`
  - 현재 작업 패널 reveal 하이라이트.
  - PC Dock 8탭 가독성 보강.
  - 후보 카드 선택 가능 상태, 선택 배지, CTA 정리.
  - 추천 안내 문구 반짝임 방지 보강.
  - 글라스 UI 대비 개선.
- `src/ui/workspace-comfort.js`
  - Dock 탭 클릭 후 해당 패널로 부드럽게 스크롤.
  - 후보 카드 선택 후 미리보기 패널 reveal 보강.
  - 후보 카드 접근성 라벨과 선택 가능 상태 자동 부여.
  - 추천 안내 문구 안정화.
- `qa/workspace_comfort_smoke.js`
  - 새 CSS/JS 링크, 서비스워커 캐시, 후보 카드 UI 가드, v1.0.5 버전 검수.

### Changed

- 서비스워커 캐시를 `v1.0.5-workspace-comfort`로 갱신했습니다.
- `package.json` QA를 75개로 확장했습니다.
- 기존 Glass Pro UI는 유지하되, 실제 편집 화면의 가독성을 우선으로 보정했습니다.

### Guardrails

- 후보 안내 문구에는 애니메이션을 다시 넣지 않습니다.
- Dock 탭은 반드시 작업 패널 reveal 동작과 연결되어야 합니다.
- PC Dock은 8개 탭이 한 줄로 보여도 글자가 잘려서는 안 됩니다.
- 후보 카드는 선택 가능한 버튼처럼 보여야 하며, 선택 후 미리보기로 연결되어야 합니다.
