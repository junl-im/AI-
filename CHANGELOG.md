# Changelog - AI Shorts Studio v1.0.2

## v1.0.2 - Flow Quality Gate / Stability Audit

- Added `assets/css/flow-quality-gate.css`.
- Added `src/ui/flow-quality-gate.js`.
- Added `qa/flow_quality_gate_smoke.js`.
- Added a canonical 8-step flow guard: file open, recommend, candidates, preview, waveform, cut, edit, export.
- Added a state-aware fallback resolver so invalid tab states return to the correct step.
- Added single active panel enforcement using `hidden`, `is-flow-active`, and `is-flow-standby`.
- Added runtime error and unhandled promise rejection capture for diagnostics.
- Added duplicate legacy UI hiding at runtime for the old action dock and legacy mobile action bar.
- Updated service worker cache to `v1.0.2-flow-audit`.
- Updated package metadata and QA list.
- QA expanded to 71 checks.
