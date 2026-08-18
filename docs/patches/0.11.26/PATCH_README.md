# 0.11.26 PATCH README

Base: `0.11.25 R1 - Mobile WebView Playback & Exit Guard`
Target: `0.11.26 - Chromium Multi-Scene Evidence & Real MY VOICE Recovery`

## Apply

Extract the PATCH ZIP directly over the repository root of the 0.11.25 R1 baseline. The patch contains no `.git` data and deletes no files.

## Main changes

- Add Chromium multi-scene evidence for desktop 1024/1280/1440 and mobile 360/390/430, capturing `workspace`, `voice-surface`, and `recovery-impact` as separate PNG scenes.
- Record PNG SHA-256, layout assertions, and interaction evidence, including the Voice Drawer/Picker `preview = selection` contract.
- Seed a UI-only recovery fixture with three selected clips where exactly two stale MY VOICE clips are recoverable, and verify the recovery-impact dialog scopes the change to those two clips.
- Mark Chromium recovery fixture evidence with `realWorkerClaimed=false`; it is not proof of a real Voice Clone Worker success.
- Add a privacy-safe `my-voice-recovery-runtime/1` verifier. Real success requires observed runtime evidence, consent verification, Worker/model readiness, SHA-256 profile fingerprint, completed first-audio, and playback evidence without raw profile/sample data.
- Run the desktop/mobile multi-scene runners in GitHub Actions and upload them with the existing Web quality artifact before the final failure gate.

## Validation

- Product version sync: 0.11.26 PASS
- Repository preflight: 50/50 PASS
- API pytest: 220/220 PASS (one existing FastAPI deprecated status alias warning)
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- New Node `.mjs` syntax and valid MY VOICE runtime-evidence verifier fixture: PASS
- Local dependency-based Web/Chromium execution: not run because `npm ci` did not finish within the available environment and `vite`/`vitest` were not installed. GitHub Actions is the final runtime gate.
- Real consented MY VOICE Worker/model evidence: not collected in this environment and not claimed as successful.

## After apply

Run `npm run quality:preflight`, commit and push, then verify the GitHub Actions Web quality artifact contains the desktop/mobile multi-scene manifests and expected 18 PNG scenes. Only promote real MY VOICE recovery to certified when an actual consented profile and ready Worker/model produce valid observed-runtime evidence.

## Deleted files

None.
