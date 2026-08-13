# SoriON Timeline Linkage + My Voice Lab patch

## What this patch changes

- Voice Library selection applies to the currently selected Timeline voice clips.
- Timeline selection is reported back to HomePage so the library and editor share the same voice context.
- Single selected Timeline clips get an inline voice selector.
- The static `VOICE 1` track label now reflects the selected/current voice context.
- Workspace label `AI 음성 스튜디오` becomes `텍스트를 음성으로`.
- Dock/page label `복제` / `목소리 복제` becomes `내 목소리`.
- My Voice becomes a profile library + guided capture + device-side quality coach + Voice Test Lab.
- Saved voice profiles can be selected and previewed instead of exposing only the latest profile.
- User-facing clone jargon is reduced while consent-first behavior remains intact.

## Apply

From the repository root, overlay this patch folder and run:

```bash
node apply-sorion-linkage-myvoice.mjs
node verify-sorion-linkage-myvoice.mjs
```

Then run the repository's normal Web quality workflow / local quality commands.

## Safety behavior

Changing the voice of an existing Timeline clip uses the existing `updateVoiceMany` path. Existing generated audio for that clip is detached and the clip returns to queued state, preventing a stale audio/voice mismatch.

The device-side voice sample score is a capture-quality guide only. It does not claim or guarantee synthesis/model quality.

## Local validation performed

- Patch script syntax: PASS
- Patch application against a clean local repository checkout: PASS
- Patch idempotency: PASS
- TypeScript/TSX parser diagnostics for all touched TS/TSX files: PASS
- CSS brace balance: PASS
- Linkage + My Voice static contract check: 14/14 PASS

A full `npm run typecheck` could not be completed in the available local checkout because its dependency tree is incomplete (`vite/client`, `vitest/globals`, Node/Vite packages missing). Final build/test status should be decided by the repository's GitHub Web quality workflow.
