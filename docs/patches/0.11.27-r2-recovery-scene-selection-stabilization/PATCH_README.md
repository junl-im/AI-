# 0.11.27 R2 Recovery Scene Selection Stabilization Patch

Base: `0.11.27 R1 · Chromium Multi-Scene Runner Stabilization`
Target: `0.11.27 R2 · Recovery Scene Selection Stabilization`
Product semver remains `0.11.27`.

## Why

GitHub Actions run `32206091853`, Web quality job `95929627362`, passed reproducible Web quality/report verification and the existing desktop/mobile Chromium layout regressions. Both multi-scene runners failed only at the same recovery fixture predicate while waiting for the selected unavailable MY VOICE 2/3 state.

## Fix

- select the three recovery Voice clips through the product `대사 전체` command instead of sequential synthetic card clicks;
- verify selected Voice count 3, unavailable count 2, and selected+unavailable count 2 before opening the recovery impact dialog;
- preserve a privacy-safe `recovery-fixture-diagnostics.json` when the recovery scene cannot reach its expected state;
- keep production Timeline recovery, Voice/TTS, Kakao WebView, MY VOICE runtime, API/Worker behavior, and project schema unchanged.

## Apply

Extract this patch at the repository root only when the current baseline is `0.11.27 R1 · Chromium Multi-Scene Runner Stabilization`, then review, commit, and push.

## Verification

- Repository preflight: 51/51 PASS.
- Chromium multi-scene static contract: PASS.
- Changed Node `.mjs` syntax: PASS.
- API pytest: 220/220 PASS.
- Worker pytest: 14/14 PASS.
- Python compileall: PASS.
- Corrected desktop/mobile 18-scene runtime: next GitHub Actions final gate.
