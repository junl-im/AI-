# Project Notes v1.6.24

## 시스템 구조
- 앱 브리지·화자 편집 UI: `src/app.js`
- speaker cue·dual focus 엔진: `src/vision/smart-reframe-engine.js`
- 자동 화자↔얼굴 연결: `src/vision/speaker-face-linker.js`
- dual pane 렌더: `src/render/vertical-renderer.js`
- 프로젝트 보존: `src/project/project-service.js`
- 스타일: `assets/css/smart-reframe.css`

## v1.6.24 cue 계약
- `start >= 0`
- `end >= start + 0.05`
- cue 시간 겹침 허용
- 시간순 정렬, 최대 2000개
- 화자 라벨 최대 40자
- subject ID는 `auto` 또는 `subject-N`
- priority는 `auto`, `primary`, `secondary`
- confidence history는 최대 12건
- 수동 고정 cue와 역할은 자동 재연결 후에도 보존

## dual focus 계약
- 같은 시각에 서로 다른 subject cue가 두 개 이상 있어야 활성화
- primary > auto > secondary, 이후 연결 신뢰도 순
- 상위 두 subject만 renderer에 전달
- 수동 keyframe과 전역 subject pin이 dual focus보다 우선
- 단일 subject만 유효하면 기존 `speaker-face` crop 사용

## 수명주기 원칙
- cue 편집과 dual focus 계산은 별도 비동기 작업을 생성하지 않습니다.
- 변경마다 `persistSmartReframeEdits()`로 프로젝트 상태를 갱신합니다.
- 미리보기는 기존 Preview Controller를 재사용합니다.
- 다운로드·Object URL·render queue 소유권은 변경하지 않습니다.

## 다음 기술 부채
- 3명 이상 동시 화자 레이아웃
- dual pane 방향·비율 사용자 편집
- timeline 다중 선택·undo/redo
- 추천·편집 UI Controller 분리
- Safari/Samsung Internet 실기기 회귀

## QA 증빙
- 전체 281/281 통과
- 스마트 리프레임 실제 브라우저 dual flow 통과
- 5회 실미디어 heap 5.103→5.618MiB
- process RSS 769.519→846.660MiB, 런타임 오류 0건
- 30분 1080p 집중 감사 통과
- 서비스워커 manifest 135개 자산
