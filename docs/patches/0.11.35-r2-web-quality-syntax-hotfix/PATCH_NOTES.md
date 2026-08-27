# 0.11.35 R2 · Web Quality Syntax Hotfix

GitHub Actions `quality:web-repro`의 ESLint parser failure를 교정합니다.

- 대상: `src/quality/releaseReadiness.test.ts`
- 원인: nested `flatMap(...map(...))` closing parenthesis 1개 누락
- 수정: `})),` → `}))),`
- runtime 동작 변경 없음
- Repository preflight: 55/55 PASS
