# PROJECT NOTES - v1.1.3

이번 패치는 저장 이후 사용자의 다음 행동을 정리하는 데 집중했습니다.

## 설계 의도

렌더 큐가 완료되면 사용자가 다운로드 폴더를 확인해야 하는지, 실패를 재시도해야 하는지, 미리보기로 돌아가야 하는지 헷갈릴 수 있습니다. `export-finish-center`는 렌더 큐 상태를 구독해 완료/실패/부분 완료를 표시하고, 필요한 액션을 저장 탭 안에서 제공합니다.

## 추가 모듈

- `src/ui/export-finish-center.js`
- `assets/css/export-finish-center.css`
- `qa/export_finish_center_smoke.js`

## 유지 원칙

- Dock 이동은 기존 Motion Stability 흐름을 유지합니다.
- 저장 실행은 기존 Render Queue를 그대로 사용합니다.
- 새 모듈은 완료 상태를 읽고 안내만 담당합니다.
