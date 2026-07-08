# QA Report - AI 쇼츠 제작 스튜디오 v1.1.7

## Summary

- Passed: 99/99
- Failed: 0/99
- Result: PASS

## v1.1.7 Focus

- Update Sentinel: information modal now exposes current version, build key, service worker state, cache state, engine profile, and diagnostic actions.
- Cache diagnostics: old shell caches can be inspected and cleared without touching user project/session data.
- Engine Boost Profile: browser capability is classified as `MAX-STABLE`, `PRO-STABLE`, or `SAFE-STABLE` for future analysis/render tuning.
- Version sync guard: `package.json`, `src/config/app-runtime-config.js`, `index.html`, `sw.js`, and the visible header version are aligned.
- Dock polish: candidate icon is `🎯` and save icon is `📦` while the 8-tab PC and 4+4 mobile layout remains guarded.
- Existing no-shake Dock flow, shutter glass hero, PC/mobile compatibility line, and Final Flow Director remain active.

## Added / Updated Checks

- `node --check src/boot/update-sentinel.js`
- `node qa/update_sentinel_smoke.js`
- `node --check src/engine/engine-boost-profile.js`
- `node qa/engine_boost_profile_smoke.js`
- `node qa/app_version_sync_smoke.js` updated to derive expected version from `package.json`.
- `node qa/layout_dock_smoke.js` updated for the v1.1.7 Dock icon set.

## Command

```bash
npm run check
```

## Notes

v1.1.7 keeps the main screen simple and places update/cache diagnostics inside the program information modal. This avoids cluttering the editing workflow while still making version mismatch and stale cache issues easy to confirm during handoff or user support.
