# SoriON Web quality hotfix

Target commit: `205c29bdb5831e4e105a5f276bcd02dd323f98d7`

Fixes the TypeScript error in `TimelineLinkedPlayer.test.tsx` by bringing the `GeneratedAudio` test fixture up to the current contract. `GeneratedAudio.result` is required and now receives a minimal completed `TtsSynthesisResult`.

No production component or workflow behavior is changed.
