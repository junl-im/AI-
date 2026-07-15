# CHANGELOG

## v1.2.0 - Runtime Responsiveness & Menu Bar Terminology

- 사용자에게 보이는 `Dock` 명칭을 `메뉴바`로 통일했습니다.
- 사이트 초기화 직후 메인 스레드가 점유되어 `페이지 응답 없음`이 발생하는 현상을 재현했습니다.
- 추천 개수, 후보 목록, 메뉴 상태를 감시하던 여러 MutationObserver의 피드백 루프를 제거했습니다.
- 텍스트, 속성, 클래스와 활성 메뉴는 실제 값이 달라질 때만 변경하도록 멱등성 가드를 추가했습니다.
- `flow-polish`와 `flow-doctor`에 상태 시그니처 기반 중복 프레임 건너뛰기를 적용했습니다.
- 후보·작업 공간 Observer가 자체 속성 변경을 다시 감지하지 않도록 관찰 범위를 좁혔습니다.
- Update Sentinel의 현재 캐시 식별을 새 빌드 키와 일치시켰습니다.
- 런타임 응답성 회귀 검사 `qa/runtime_responsiveness_smoke.js`를 추가했습니다.
- 전체 QA를 103개로 확장했습니다.

## v1.1.9 - Desktop Prime Workspace & Mobile Flow Landing

- PC 화면을 3열 Prime 작업실로 재구성했습니다.
- PC에서 불러오기, 추천, 미리보기, 후보, 파형을 동시에 확인할 수 있게 했습니다.
- 컷, 정밀 편집, 저장, 프로젝트 영역을 같은 분할 그리드의 다음 행으로 연결했습니다.
- 모바일 첫 화면의 파일 열기/프로젝트 불러오기 중복 카드를 제거했습니다.
- 모바일 본문을 4단계 진행 순서 안내로 단순화하고 파일 선택은 하단 메뉴바에 맡겼습니다.
- 상단 버전과 `Design by 곰같은여우`를 같은 줄 양 끝에 정렬했습니다.
- 제목 아래 제품 설명의 최대 폭과 좌우 안쪽 여백을 조정했습니다.
- `assets/css/desktop-prime-layout.css`와 `qa/desktop_prime_layout_smoke.js`를 추가했습니다.
- 전체 QA를 102개로 확장했습니다.

## v1.1.8 - Foundation UX & Runtime Performance

- 첫 화면을 실제 시작 명령과 4단계 워크플로 중심으로 재구성했습니다.
- 중복된 자동 분석/편집 안내 그룹을 숨기고, 파일을 연 뒤 시작 패널이 접히도록 했습니다.
- 히어로, 카드, 메뉴바의 높이와 여백을 줄여 작업 밀도를 개선했습니다.
- 모바일 상단 호환성 배지를 정리해 브랜드와 시작 버튼이 먼저 보이도록 했습니다.
- `src/ui/ux-controls.js`의 700ms 반복 동기화를 이벤트 기반 프레임 배치 방식으로 교체했습니다.
- `src/ui/range-drag-controls.js`의 500ms DOM 재생성을 제거하고 상태 시그니처 기반 갱신을 적용했습니다.
- `src/ui/startup-performance.js`를 추가해 저사양·데이터 절약·모션 감소 환경에 자동 대응합니다.
- `assets/css/foundation-polish.css`를 추가해 UI 계층, 반응형과 저사양 렌더링을 최종 보정합니다.
- `qa/runtime_performance_smoke.js`를 추가했습니다.
- 전체 QA를 101개로 확장했습니다.

## v1.1.7 - Update Sentinel + Engine Boost Profile

- 정보 모달에 업데이트 적용 상태와 캐시 진단 기능을 추가했습니다.
- 브라우저 성능을 MAX-STABLE / PRO-STABLE / SAFE-STABLE로 감지하는 엔진 프로필을 추가했습니다.
