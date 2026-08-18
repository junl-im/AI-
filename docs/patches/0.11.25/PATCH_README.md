# 0.11.25 PATCH README

Base: `0.11.24 R1 - Voice Pace Calibration`
Target: `0.11.25 - Web Quality CI Stabilization & Critical Recovery Gate`

## Apply

Extract the PATCH ZIP directly over the repository root of the 0.11.24 R1 baseline. The patch contains no `.git` data and deletes no files.

## Main changes

- Fix the stale Browser Speech pace assertion exposed by GitHub Actions run `32096206966`.
- Add an early `test:web-critical` phase before the full Vitest suite.
- Protect the Hyerin `rateMultiplier=1.00` Browser Speech contract in dependency-free preflight.
- Add first-failure Web quality evidence in `.sorion/web-quality/failure-summary.txt`.
- Synchronize API Web-quality evidence intake with the eight-phase plan.
- Keep voice pace values and MY VOICE/Timeline recovery runtime behavior unchanged.

## After apply

Run `npm run quality:preflight`, then commit and push the patch. GitHub Actions is the final gate for dependency-based critical/full Vitest, ESLint, semantic typecheck, Vite build, and Chromium evidence.
