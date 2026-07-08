# Handoff - AI Shorts Studio v1.0.3

## What changed

This patch fixes PC Dock readability and workspace reveal behavior. It also stabilizes candidate guide copy to prevent flickering between flow modules.

## Files touched

- `index.html`
- `sw.js`
- `package.json`
- `assets/css/pc-dock-reveal-hotfix.css`
- `src/ui/hyperflow-tabs.js`
- `src/ui/flow-polish.js`
- `src/ui/flow-doctor.js`
- `qa/pc_dock_reveal_smoke.js`

## 검수 순서

아래 항목은 v1.0.3의 수동 검수 순서입니다.

## Manual QA checklist

1. Open on desktop width above 1180px.
2. Confirm bottom Dock shows 8 readable labels in one row.
3. Click each Dock tab and confirm the corresponding panel is revealed near the top of the viewport.
4. Generate recommendations and move to 후보. Confirm guide text does not blink.
5. Select a candidate. Confirm 미리보기 reveals and action buttons remain compact.
6. Resize to tablet/mobile. Confirm Dock becomes readable 4+4.

## 알려진 제한

브라우저 미디어 저장 제한은 유지됩니다.

## Known limitation

Browser media export behavior still depends on MediaRecorder support. Chrome-based browsers remain the safest target for export testing.
