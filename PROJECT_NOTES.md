# Project Notes - v1.0.3

## Focus

v1.0.3 focuses on real usability issues found during PC testing:

- Desktop Dock readability.
- Manual tab click reveal behavior.
- Candidate guide text flicker.
- Compact action button density.

## Design decision

The Dock is not a second command panel. It is a persistent navigation surface. On PC it should use the screen width and show all labels clearly. On mobile and tablet it should remain 4+4 for touch comfort.

## Flow rule

Every manual Dock click should reveal the corresponding workspace panel. State-only tab switching is not enough.

## Guarded files

- `assets/css/pc-dock-reveal-hotfix.css`
- `src/ui/hyperflow-tabs.js`
- `src/ui/flow-polish.js`
- `src/ui/flow-doctor.js`
- `qa/pc_dock_reveal_smoke.js`
