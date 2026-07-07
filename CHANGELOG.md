# CHANGELOG

## v0.4.0 - Draggable Range, Thumbnail Templates and Batch Export

- Added draggable range selection overlay on top of the waveform.
- Added start/end handles for selected recommendation range editing.
- Added whole-range move interaction for shifting the selected segment.
- Added current playback position snap button for setting the range start.
- Added thumbnail template selector with neon, clean, cinematic and headline styles.
- Applied thumbnail templates to preview canvas, PNG thumbnail export and video export overlay.
- Added recommendation batch export for top 3, top 5 or all candidates.
- Added batch export progress status and per-candidate file naming.
- Added `assets/css/advanced-editor.css`.
- Added `src/ui/range-drag-controls.js`.
- Added `qa/advanced_editor_smoke.js`.
- Updated service worker cache list for new advanced editor assets.
- QA result: 29/29 passed.

## v0.3.0 - UI/UX Button Convenience and Visual Polish

- Added hero quick-start actions for file open, analyze and project load.
- Added 4-step workflow rail: import, recommend, edit and export.
- Added quick duration chips for auto, 15s, 30s, 60s and 90s recommendations.
- Added sticky action dock for selected recommendation preview/export.
- Added mobile bottom action bar for file, analyze, preview and export.
- Added 1-second nudge buttons for selected range start/end.
- Added selected recommendation dock summary with range and score.
- Added keyboard shortcuts: Space for preview and E for export when available.
- Added focus rings and larger touch targets for better accessibility.
- Added hover/selected polish for recommendation cards.
- Added `assets/css/ux.css`.
- Added `src/ui/ux-controls.js`.
- Updated service worker cache list for new UI assets.
- Added UI/UX anchor smoke test.
- QA result: 27/27 passed.

## v0.2.0 - Editor, Captions and Project Save

- Added manual range editor for selected recommendation start/end.
- Added SRT/VTT caption parser.
- Added pasted caption text support.
- Added quick caption splitting fallback when raw text is pasted without timecodes.
- Added caption style options: bold, clean and box.
- Added caption sync offset setting.
- Added captions to preview canvas and exported vertical video render loop.
- Added thumbnail PNG export from the current 9:16 canvas.
- Added project JSON save/load for recommendations, custom ranges, captions, settings and copy text.
- Added `src/caption/caption-service.js`.
- Added `src/project/project-service.js`.
- Updated service worker cache list for new modules.
- Added caption/project smoke tests.
- QA result: 25/25 passed.

## v0.1.0 - Local Highlight MVP

- Added first AI Shorts Studio static web app package.
- Added local audio feature extraction worker.
- Added video motion sampling analyzer.
- Added shorts recommendation engine with explainable score cards.
- Added waveform and timeline views.
- Added 9:16 vertical preview canvas.
- Added MediaRecorder based vertical export.
- Added download/share diagnostics.
- Added PWA manifest and service worker.
- Added QA smoke tests and release packaging script.
