# PROJECT NOTES - AI Shorts Studio v1.0.2

## Stability direction

The app now has several UI flow modules. v1.0.2 adds a final quality gate instead of replacing the earlier modules. This keeps compatibility while preventing broken states from leaking into the user experience.

## New module

`src/ui/flow-quality-gate.js`

Responsibilities:

- canonical 8-tab order
- state-aware fallback tab selection
- one active panel at a time
- legacy duplicate UI hiding
- runtime error diagnostics
- scroll-safe panel reveal support

## Do not regress

- The hero must remain an introduction area only.
- Patch details should stay in docs, not in the hero.
- The bottom Dock first tab must read `파일 열기`.
- Recommendation generation must stay in the recommendation tab only.
- Candidate selection must happen in the candidates tab.
- Candidate selection must connect to the preview tab.
