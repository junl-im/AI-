# 0.11.27 Field Device & MY VOICE Runtime Certification Patch

Base: `0.11.26 R1 - Web Lint Stabilization`
Target: `0.11.27 - Field Device & MY VOICE Runtime Certification`

## Apply

Extract the PATCH ZIP directly over the repository root of the exact 0.11.26 R1 baseline and allow overwrites. This patch deletes no files.

If the repository is still plain 0.11.26, apply the 0.11.26 R1 Web Lint Stabilization patch first. Do not apply this 0.11.27 patch directly over plain 0.11.26 because that would drop the lint stabilization changes.

## Main changes

- Record privacy-safe Kakao Android/iOS field events for preset preview attempts, actual speech start or failure, external-browser fallback requests, exit-dialog opening, and successful `continue editing` closure.
- Add a Quality Lab field-device certification card. Automatic observations remain pending until the operator explicitly confirms they were performed on a real Kakao device.
- Add `field-device-certification/1` validation with READY limited to Kakao Android/iOS evidence that contains a valid preview path and exit-dialog path.
- Add a field/runtime aggregate verifier that combines both Kakao device certificates, desktop/mobile Chromium multi-scene manifests, and real MY VOICE observed-runtime evidence.
- Keep Chromium fixtures and synthetic UI state separate from real MY VOICE success. Full certification requires actual consented runtime evidence.
- Extend critical Web regression and dependency-free preflight contracts to cover the certification path.
- Incorporate the R1 Actions run `32117983645` exit-history test correction: the test now moves history state from guard to base before dispatching `popstate`, matching real browser Back ordering. Production `useExitConfirmation.ts` is not changed by this correction.

## Validation

- Product version sync: 0.11.27 PASS.
- Repository preflight: 51/51 PASS.
- API pytest: 220/220 PASS (one existing FastAPI deprecated status alias warning).
- Worker pytest: 14/14 PASS.
- Python compileall: PASS.
- TypeScript/TSX dependency-free transpile parse: 249/249 PASS.
- Field-device and aggregate runtime verifier fixtures: PASS.
- GitHub Actions R1 lint: PASS; critical regression: 64/65 PASS before the exit-history test harness correction; rerun required.
- Real Kakao Android/iOS evidence: not collected in this environment and not claimed as certified.
- Real consented MY VOICE Worker/model evidence: not collected in this environment and not claimed as certified.
- Dependency-based ESLint/Vitest/typecheck/build/Chromium: local npm install did not complete; GitHub Actions remains the final Web runtime gate.

## Deleted files

None.
