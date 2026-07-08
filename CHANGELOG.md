# Changelog - AI Shorts Studio v1.0.3

## v1.0.3 - PC Dock / Workspace Reveal Hotfix

- Fixed the PC bottom Dock getting squeezed so labels became unreadable.
- Removed the hidden status-column layout from the desktop Dock and restored a full-width 8-tab navigation bar.
- Kept tablet/mobile Dock as a readable 4+4 layout.
- Changed manual Dock tab navigation to reveal the selected workspace panel near the top of the viewport.
- Added forced panel reveal so clicking 추천/후보/미리보기/파형/컷/편집/저장 does not merely change state; it moves the user to that work area.
- Stabilized the 후보 안내 문구 so competing flow modules do not make the text blink.
- Re-guarded action button sizing so 구간 선택, 미리보기, 내보내기 buttons remain compact.
- Added `assets/css/pc-dock-reveal-hotfix.css`.
- Added `qa/pc_dock_reveal_smoke.js`.
- Updated service worker cache to `v1.0.3-dock-reveal`.
- QA expanded to 72 checks.
