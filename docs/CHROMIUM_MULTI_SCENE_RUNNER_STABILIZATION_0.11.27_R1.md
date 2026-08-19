# 0.11.27 R1 · Chromium Multi-Scene Runner Stabilization

## Incident

GitHub Actions run `32120737467`, Web quality job `95660523958`, passed the reproducible Web quality pipeline, report verification, desktop visual layout regression, and mobile visual layout regression. The final gate failed only because both new multi-scene runners returned non-zero.

- Desktop failed at `voice-surface-1024`: the runner searched preset preview controls while the Voice Drawer was still in its product-default collapsed state.
- Mobile failed at `recovery-fixture`: after the recovery seed/reload, the runner assumed it would always return to LandingHome and waited only for `장문 음성 스튜디오 시작`. Workspace-session restoration can instead land directly in `.soa-dubbing-workspace`. The recovery project rail is also collapsed by default, so the runner must explicitly expose it before selecting the seeded project.

The Chromium D-Bus/UPower stderr lines in the job are normal headless-runner noise and were not the failure predicate. The runner's own stage errors above were the actionable failures.

## Fix

1. `openStudio()` is now idempotent. If `.soa-dubbing-workspace` already exists after reload/session restoration, it proceeds without waiting for the LandingHome start button.
2. Desktop voice evidence explicitly expands the collapsed Voice Drawer and waits until preset preview controls are mounted before searching for a preview target.
3. A Voice Drawer opened by the runner is collapsed again after capture so each workspace scene starts from the deterministic compact layout.
4. Recovery fixture preparation explicitly expands the project rail before waiting for `Visual Recovery Evidence 프로젝트 열기`, then restores the compact rail state after opening the fixture.
5. `check-chromium-multi-scene-evidence.mjs` now requires these idempotent/expand/restore contracts so the runner cannot regress to hidden-panel assumptions.

## Product boundary

This R1 changes only browser evidence orchestration. It does not change:

- Voice selection or preview production behavior;
- Kakao direct Speech Synthesis/watchdog behavior;
- Timeline recovery semantics;
- MY VOICE Worker/model behavior;
- Voice pace/pitch values;
- API/Worker synthesis or storage schema.

Product semver remains `0.11.27`.

## Verification

- GitHub Actions incident diagnosis: run `32120737467` narrowed to desktop/mobile multi-scene runner only.
- Repository preflight: **51/51 PASS**.
- Chromium multi-scene static contract: **PASS**.
- Node syntax for changed runner/check scripts: **PASS**.
- API pytest: **220/220 PASS** (existing FastAPI deprecation warning 1).
- Worker pytest: **14/14 PASS**.
- Python compileall: **PASS**.
- 0.11.27 PATCH overlay: **1052/1052 files · missing 0 / extra 0 / changed 0**.
- Actual corrected 18-scene Chromium execution: **requires next GitHub Actions run** because this delivery environment does not contain the installed Web toolchain/dist build.

## Next gate

Do not start the Voice Naturalness feature patch until the corrected 0.11.27 R1 Web quality job reaches green through both multi-scene runners and the final Pages path.
