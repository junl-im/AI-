# SoriON AI 0.11.15 - PC Voice Core redesign hotfix

Target: current `main` 0.11.15 PC Voice Core surface.

## What changes
- Forces the decorative Voice Core panel to a compact 88px control-bar height instead of stretching with the hero grid.
- Reduces the brand icon to 48px and centers it vertically.
- Rebuilds hierarchy: VOICE CORE label -> headline -> engine caption.
- Converts AUTO from loose green text into a restrained live-status pill.
- Replaces the bright white waveform slab with a dark glass waveform surface that matches the masthead.
- Adds a subtle baseline glow and a responsive 760-920px compact breakpoint.
- Leaves mobile behavior, voice picker behavior, React markup, generation logic, and workflow logic unchanged.

## Apply
Copy the included `src/styles/pc-voice-polish.css` over the same path in the repository.

## Validation performed
- Compared against the current GitHub `main` 0.11.15 stylesheet before editing.
- CSS braces balanced: PASS.
- `tinycss2` parse errors: 0.
