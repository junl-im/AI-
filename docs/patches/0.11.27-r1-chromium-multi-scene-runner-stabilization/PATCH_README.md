# 0.11.27 R1 Chromium Multi-Scene Runner Stabilization Patch

Base: `0.11.27 - Field Device & MY VOICE Runtime Certification` corrected release on GitHub main (`6c1fc70fbfe848f533af5822603929a29f1d3b84` in Actions run `32120737467`).
Target: `0.11.27 R1 - Chromium Multi-Scene Runner Stabilization`.
Product semver remains `0.11.27`.

## Apply

Extract this PATCH ZIP directly over the exact corrected 0.11.27 repository root and allow overwrites. This patch deletes no files.

Do not apply it directly over 0.11.26 or 0.11.26 R1. Those baselines do not contain the corrected 0.11.27 field/runtime certification and exit-history test changes.

## Incident

Actions run `32120737467`, Web quality job `95660523958`, passed:

- reproducible Web lint/critical/full Vitest/typecheck/build;
- Web quality report verification;
- desktop 1024/1280/1440 Chromium layout;
- mobile 360/390/430 Chromium layout.

Only the new multi-scene runners failed:

- desktop `voice-surface-1024`: `Desktop Voice Drawer 미리듣기 대상을 찾지 못했습니다.`
- mobile `recovery-fixture`: `장문 음성 스튜디오 시작 버튼 준비 대기 시간이 초과되었습니다.`

## Fix

- Expand the product-default collapsed Desktop Voice Drawer before querying preview controls, then collapse it again after the voice scene if the runner opened it.
- Make `openStudio()` accept an already-restored `.soa-dubbing-workspace` instead of requiring LandingHome every time.
- Expand the default-collapsed project rail before selecting the seeded recovery project, then restore compact state.
- Extend the dependency-free multi-scene contract check to require these hidden-panel/session-restore guards.

Production Voice/TTS/Timeline/Kakao/MY VOICE behavior is unchanged.

## Validation

- Repository preflight: **51/51 PASS**.
- Chromium multi-scene static contract: **PASS**.
- Changed Node `.mjs` syntax: **PASS**.
- API pytest: **220/220 PASS** (one existing FastAPI deprecation warning).
- Worker pytest: **14/14 PASS**.
- Python compileall: **PASS**.
- 0.11.27 PATCH overlay: **1052/1052 files · missing 0 / extra 0 / changed 0**.
- Corrected 18-scene runtime: **next GitHub Actions final gate**; this delivery environment has no installed Web toolchain/dist build.

## Deleted files

None.
