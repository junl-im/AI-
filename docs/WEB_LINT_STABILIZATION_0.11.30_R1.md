# 0.11.30 R1 · Web Lint Type-Only Import Stabilization

## Incident

GitHub `main` head `a6dcc7e6c9a8008f3e629b52b78380adabb855cd`의 Web quality annotation은 `src/workspace/homeWorkspaceHelpers.ts`에서 모든 사용이 타입 위치인 import를 value import로 선언했다고 보고했습니다.

문제 선언은 다음과 같았습니다.

```ts
import { synthesizeSpeech } from '../tts/voiceApi'
```

`generatedWorkspacePreview`는 이를 runtime에서 호출하지 않고 `Awaited<ReturnType<typeof synthesizeSpeech>>` 타입 계산에만 사용합니다.

## Fix

```ts
import type { synthesizeSpeech } from '../tts/voiceApi'
```

이 변경은 emitted runtime JavaScript에 새 동작을 추가하지 않으며 0.11.30 neural preview routing, fallback, API/Worker 계약을 그대로 유지합니다.

## Validation

- Repository preflight: 53/53 PASS
- API pytest: 223/223 PASS
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- Changed TypeScript syntax: 1/1 PASS
- Local `npm ci --no-audit --no-fund`: 120초 timeout, local ESLint 실행 파일 미생성
- Actual ESLint/Vitest/typecheck/build/Chromium: next GitHub Actions final gate

## Gate

0.11.31 feature work must not proceed until the R1 GitHub Actions Web quality job is green.
