# 0.11.30 R1 · Web Lint Type-Only Import Stabilization Patch

Base: `0.11.30 · Neural Voice Reference Intake & Preview Promotion`
Target: `0.11.30 R1 · Web Lint Type-Only Import Stabilization`

## 적용

이 PATCH ZIP의 내용을 SoriON 0.11.30 프로젝트 루트에 그대로 덮어씁니다. 삭제 파일은 없습니다. 제품 semver는 0.11.30을 유지합니다.

## 핵심 변경

- `src/workspace/homeWorkspaceHelpers.ts`의 `synthesizeSpeech` import를 type-only import로 교정합니다.
- runtime behavior, neural preview routing, Browser Speech fallback, API/Worker는 변경하지 않습니다.
- 0.11.31 진행 전 R1 GitHub Actions green을 요구하도록 인수인계/다음 계획을 갱신합니다.

## 검증

- Repository preflight: 53/53 PASS
- API pytest: 223/223 PASS
- Worker pytest: 14/14 PASS
- Python compileall: PASS
- Changed TypeScript syntax: 1/1 PASS
- Local npm ci: 120초 timeout, local ESLint 미실행
- GitHub Actions: Push 후 final gate
