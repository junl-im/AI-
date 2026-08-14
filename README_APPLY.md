# Live Voice Bar + Final Export Web quality hotfix

This patch targets the current project state that has:

- `FinalExportControls` buttons named `최종 WAV + 자막` / `최종 MP3 + 자막`
- the old static `VOICE CORE` masthead

## Apply

From the repository root:

```bash
node APPLY_LIVE_VOICE_EXPORT_HOTFIX.mjs
node VERIFY_LIVE_VOICE_EXPORT_HOTFIX.mjs
node scripts/run-preflight.mjs
```

Then push and rerun **Web quality**.

## Changes

- Fixes stale `FinalExportDialog.test.tsx` accessible-name expectation.
- Replaces the decorative `VOICE CORE` with a real **LIVE VOICE** control bar.
- Displays current voice, engine, and `CHECKING / READY / LIMITED / OFFLINE / LIVE` state.
- Adds a direct **텍스트를 음성으로 →** action.
- Actually imports `live-voice-bar.css` from `src/styles/index.css`.
- Keeps the existing export button copy; production UI is not regressed to satisfy the test.
