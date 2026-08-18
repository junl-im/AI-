# Web Quality CI Stabilization - 0.11.25

## Incident

GitHub Actions run `32096206966` failed in `src/tts/browserSpeech.test.ts` after the 0.11.24 R1 pace calibration. Hyerin now uses `rateMultiplier=1.00`, so `request.speed=1.10` correctly produces `playback.rate=1.10`. The old test still required playback to be strictly slower than the request.

## Fix

- Replace the obsolete strictly-slower assertion with equality-at-current-precision for the Hyerin 1.00 baseline.
- Make `check-voice-preset-contracts.mjs` reject reintroduction of the old assertion.
- Add `npm run test:web-critical` before the full Vitest phase.
- Keep the critical set focused on Browser Speech pace, Voice Drawer preview-selection linkage, Timeline stale MY VOICE subset recovery, and generation/recovery history.
- Write `.sorion/web-quality/failure-summary.txt` for the first failed phase while preserving the existing report schema and heartbeat.
- Synchronize the API evidence intake contract to the new eight-phase Web-quality order.

## Non-goals

This stabilization release does not change preset pace multipliers, Timeline recovery implementation, MY VOICE routing, or project data schema. It also does not claim real Chromium or MY VOICE runtime success without an environment that can execute those checks.

## Release gate

The local dependency-free and Python gates can verify the contract shape, but the release is not considered Web-quality green until the updated commit passes GitHub Actions with the dependency-based critical/full Vitest, lint, semantic typecheck, Vite build, and browser evidence stages.
