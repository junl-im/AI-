# 0.11.26 R1 Web Lint Stabilization

## Incident

GitHub Actions run `32109791257`, job `95626676052`, passed repository lock/preflight/API/Worker jobs and failed in Web quality at `npm run lint`. The lint output contained one error and six warnings, so later Web quality phases were skipped.

## Fixes

1. Remove the unused `TimelineVoiceBlock` import from TimelineEditor.
2. Destructure `replaceSelection` so the playback-selection effect has an explicit stable dependency.
3. Make recovery memo/effect dependencies use the actual unavailable Voice ID array and selected-unavailable count.
4. Remove the unused `backendStatus` dependency from the longform generation callback.
5. Keep the latest Voice Clone job in a ref while watcher lifecycle remains keyed by job ID/status; do not add the mutable `job` object to the watcher dependency array.
6. Stop re-exporting `normalizeImportedScript` from a React component file; import it from `workspace/scriptPreparation` in tests.

## Release boundary

Product semver stays `0.11.26`. This R1 does not change Voice pace, MY VOICE recovery scope, mobile WebView playback/exit behavior, Chromium scene evidence semantics, or API/Worker synthesis.

## Verification

- Repository preflight: 50/50 PASS.
- API pytest: 220/220 PASS.
- Worker pytest: 14/14 PASS.
- Python compileall: PASS.
- Targeted TypeScript transpile parse: 6/6 PASS.
- Local npm dependency installation timed out, so ESLint/Vitest/typecheck/build/Chromium require GitHub Actions confirmation.
- 0.11.27 work starts only after the R1 Web quality rerun is green.
