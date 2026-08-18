# 0.11.26 R1 Web Lint Stabilization Patch

Base: `0.11.26 - Chromium Multi-Scene Evidence & Real MY VOICE Recovery`
Target: `0.11.26 R1 - Web Lint Stabilization`
Product semver remains `0.11.26`.

## Why this patch exists

GitHub Actions run `32109791257`, Web quality job `95626676052`, reached the Web quality phase after lock/preflight/API/Worker jobs succeeded. ESLint then reported one error and six warnings, so later Vitest/typecheck/build/Chromium phases were skipped.

## Fix scope

- remove one unused Timeline type import;
- make Timeline playback selection hook dependencies explicit;
- make stale Voice recovery memo/effect dependencies reflect the values actually read;
- remove one unnecessary HomePage callback dependency;
- keep Voice Clone watcher lifecycle stable across mutable progress updates;
- remove a non-component utility re-export from LongformComposer and update its test import.

No Voice pace, recovery semantics, mobile Kakao behavior, API/Worker synthesis, project schema, or evidence classification behavior is changed.

## Verification before delivery

- Repository preflight: 50/50 PASS.
- API tests: 220/220 PASS.
- Worker tests: 14/14 PASS.
- Python compileall: PASS.
- Targeted TypeScript transpile parse: 6/6 PASS.
- Local npm dependency install timed out, so actual ESLint/Vitest/typecheck/build/Chromium must be confirmed by GitHub Actions after applying this patch.

Apply this ZIP at the repository root and overwrite matching files. No files are deleted.
