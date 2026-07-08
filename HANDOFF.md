# HANDOFF - AI 쇼츠 제작 스튜디오 v0.9.7

## 이번 핫픽스 목적

사용자가 지적한 흐름 문제를 우선 수정했습니다. v0.9.6에서는 `data-ui` 값이 바뀌면서 HyperFlow 탭 CSS가 적용되지 않아 각 구간 화면이 아래로 길게 노출될 수 있었습니다. v0.9.7은 탭 모드를 복구하고 후보 선택 단계를 별도 탭으로 분리했습니다.

## 사용자 흐름

1. 파일을 연다.
2. 자동 분석이 끝나면 추천 탭으로 간다.
3. `✨ 추천 생성`을 누르면 `👆 후보` 탭으로 이동한다.
4. 후보 카드를 누르면 스크롤 점프 없이 `📱 미리보기` 탭으로 이동한다.
5. 파형/컷/편집/저장 탭에서 후속 작업을 한다.

## 중요 변경 파일

- `index.html`
- `src/app.js`
- `src/ui/hyperflow-tabs.js`
- `src/ui/flow-polish.js`
- `src/ui/flow-hotfix.js`
- `assets/css/hyperflow-tabs.css`
- `assets/css/flow-hotfix.css`
- `qa/flow_hotfix_smoke.js`

## 주의

- 하단 Dock은 8개 유지: 파일/추천/후보/미리보기/파형/컷/편집/저장.
- 자막은 별도 Dock 탭이 아니라 편집 탭 안에서 접근합니다.
- 탭 전환 시 `scrollIntoView`를 쓰지 않습니다.

## QA

Run `npm run check` before release. v0.9.7 adds `qa/flow_hotfix_smoke.js` for candidates tab, no-scroll tab switching, and compact action buttons.

## Known limitations

- Export format still depends on browser MediaRecorder support.
- Mobile Safari may ignore haptic vibration.
- Original media files are not embedded in project JSON.

## 검수 순서

1. `npm run check`를 실행합니다.
2. 파일 열기 후 자동 분석이 시작되는지 확인합니다.
3. 추천 생성 후 👆 후보 탭으로 이동하는지 확인합니다.
4. 후보 선택 후 최상단 점프 없이 📱 미리보기 탭으로 이동하는지 확인합니다.

## 알려진 제한

- 저장 파일 형식은 브라우저 MediaRecorder 지원 범위에 따릅니다.
- 일부 모바일 브라우저는 진동 피드백을 무시할 수 있습니다.
- 프로젝트 JSON에는 원본 미디어 파일이 포함되지 않습니다.
