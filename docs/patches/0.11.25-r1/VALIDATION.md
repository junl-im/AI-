# 0.11.25 R1 Validation

## Completed in the delivery environment

- Repository preflight: **49/49 PASS**
- API pytest: **220/220 PASS**
- Worker pytest: **14/14 PASS**
- Python compileall: **PASS**
- Changed Node `.mjs` syntax checks: **PASS**

## Not claimed locally

The delivery environment does not contain a complete Web `node_modules` toolchain, so dependency-based Web Vitest, ESLint, semantic TypeScript, Vite build, and real Chromium/Kakao device playback are not claimed as local passes.

## Required final gates

1. Push 0.11.25 R1 and confirm GitHub Actions Web quality is green.
2. In KakaoTalk in-app browser, verify preset preview either starts speaking or exits the loading/playing state within the watchdog window and shows the external-browser recovery path.
3. Verify first hardware Back opens the exit dialog, `계속 만들기` closes it and preserves the page, and explicit exit leaves without a stale dialog.
4. Recheck the same flow in a normal mobile browser to ensure the Kakao-only recovery path does not alter ordinary browser behavior.
