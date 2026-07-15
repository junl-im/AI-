# CHANGELOG

## v1.1.8 - Foundation UX & Runtime Performance

- 첫 화면을 실제 시작 명령과 4단계 워크플로 중심으로 재구성했습니다.
- 중복된 자동 분석/편집 안내 그룹을 숨기고, 파일을 연 뒤 시작 패널이 접히도록 했습니다.
- 히어로, 카드, Dock의 높이와 여백을 줄여 작업 밀도를 개선했습니다.
- 모바일 상단 호환성 배지를 정리해 브랜드와 시작 버튼이 먼저 보이도록 했습니다.
- `src/ui/ux-controls.js`의 700ms 반복 동기화를 이벤트 기반 프레임 배치 방식으로 교체했습니다.
- `src/ui/range-drag-controls.js`의 500ms DOM 재생성을 제거하고 상태 시그니처 기반 갱신을 적용했습니다.
- `src/ui/startup-performance.js`를 추가해 저사양/데이터 절약/모션 감소 환경에 자동 대응합니다.
- `assets/css/foundation-polish.css`를 추가해 UI 계층, 반응형, 저사양 렌더링을 최종 보정합니다.
- `qa/runtime_performance_smoke.js`를 추가했습니다.
- 전체 QA를 101개로 확장했습니다.

## v1.1.7 - Update Sentinel + Engine Boost Profile

- 정보 모달에 업데이트 적용 상태와 캐시 진단 기능을 추가했습니다.
- 브라우저 성능을 MAX-STABLE / PRO-STABLE / SAFE-STABLE로 감지하는 엔진 프로필을 추가했습니다.
