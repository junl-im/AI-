# 0.11.25 R1 PATCH README

Base: `0.11.25 - Web Quality CI Stabilization & Critical Recovery Gate`
Target: `0.11.25 R1 - Mobile WebView Playback & Exit Guard`

## Apply

Extract the PATCH ZIP directly over the repository root of the 0.11.25 baseline. The patch contains no `.git` data and deletes no files.

## Main changes

- Start Kakao in-app Browser Speech preview synchronously inside the original user tap instead of after React effect/timer deferral.
- Add a 1.8-second Browser Speech start watchdog so a WebView that never emits `onstart` cannot leave playback stuck forever.
- Mount the Kakao-only external-browser recovery notice and keep external navigation inside the original tap gesture.
- Simplify the mobile exit history guard: first Back opens the dialog, `계속 만들기` explicitly rearms the guard, and exit uses one `history.back()` instead of `history.go(-2)`.
- Expand `test:web-critical` and dependency-free preflight contracts to cover mobile player watchdog, Kakao direct preview, in-app recovery notice, and exit-guard behavior.
- Keep product semver at `0.11.25`; this delivery is an R1 revision only.

## After apply

Run `npm run quality:preflight`, then commit and push. GitHub Actions remains the final dependency-based gate for Web Vitest, ESLint, semantic typecheck, Vite build, and Chromium. Re-test actual KakaoTalk in-app browser on Android/iOS before starting 0.11.26 feature work.
