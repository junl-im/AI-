# HANDOFF - AI Shorts Studio v1.0.2

## Focus

This patch stabilizes the hyperconnected workflow after the responsive layout and cinematic hero updates.

## Main changes

- `src/ui/flow-quality-gate.js` is the new final runtime guard loaded after the existing flow modules.
- It checks the current app state and keeps only the correct active panel visible.
- It blocks or redirects invalid tab states.
- It hides legacy duplicate controls at runtime.
- It captures window errors and unhandled promise rejections into diagnostics.

## User workflow to test

1. Open a media file.
2. Confirm auto-analysis starts.
3. Confirm the app moves to the recommend step after analysis.
4. Press the single recommend generation button.
5. Confirm the candidates tab is shown.
6. Select a candidate.
7. Confirm the preview tab is shown.
8. Move through waveform, cut, edit, and export tabs without jumping to the page top.

## QA

Run:

```bash
npm run check
```

Expected result: 71/71 passed.

## 검수 순서

1. `npm run check`를 실행합니다.
2. 파일 열기 후 자동 분석 흐름을 확인합니다.
3. 추천 생성 후 후보 탭 이동을 확인합니다.
4. 후보 선택 후 미리보기 탭 이동을 확인합니다.
5. 저장 탭에서 렌더 큐 상태를 확인합니다.

## 알려진 제한

- 브라우저와 기기 정책에 따라 진동 피드백은 동작하지 않을 수 있습니다.
- 일부 iOS 또는 인앱 브라우저에서는 미디어 저장과 자동 재생이 제한될 수 있습니다.
- 프로젝트 JSON은 원본 미디어 파일을 포함하지 않습니다.
