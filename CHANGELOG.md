# CHANGELOG

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
