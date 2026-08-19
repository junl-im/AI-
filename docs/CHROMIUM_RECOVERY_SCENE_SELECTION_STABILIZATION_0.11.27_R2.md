# 0.11.27 R2 · Recovery Scene Selection Stabilization

## Incident

GitHub Actions run `32206091853`, Web quality job `95929627362`, passed reproducible Web quality/report verification and the existing desktop/mobile Chromium layout jobs. Both new multi-scene runners then failed at the same recovery-fixture predicate: the UI never reached the expected `사용 불가 MY VOICE 2개` selected recovery status within the timeout.

## Root cause

The recovery fixture created three Voice clips correctly, but the runner selected them by dispatching individual card clicks (`click`, Ctrl-click, or mobile touch-toggle). That browser orchestration depended on React selection state being committed between sequential synthetic events. The product already exposes a tested `대사 전체` command that replaces selection with every Voice clip in one state transition.

## Fix

- Use the Timeline `대사 전체` UI command for the recovery fixture.
- Require three selected Voice blocks before checking recovery.
- Require exactly two `.is-voice-unavailable` blocks and two selected+unavailable blocks.
- Only then assert the `사용 불가 MY VOICE 2개` status and exact 2/3 recovery impact dialog.
- On failure, write `recovery-fixture-diagnostics.json` with privacy-safe fixture DOM counts/labels/classes.

## Boundary

This is a runner-only correction. Production Timeline recovery, Voice routing, Kakao playback/exit behavior, MY VOICE runtime semantics, API/Worker synthesis, and project schema are unchanged. Product semver remains `0.11.27`.

## Gate

R2 is not considered Chromium-certified until the next GitHub Actions run produces both desktop and mobile multi-scene manifests with all 9 scenes each.

## Local verification

- Repository preflight: 51/51 PASS.
- Multi-scene static contract and changed Node syntax: PASS.
- API pytest: 220/220 PASS.
- Worker pytest: 14/14 PASS.
- Python compileall: PASS.
- Corrected desktop/mobile 18-scene runtime remains the next GitHub Actions gate.
