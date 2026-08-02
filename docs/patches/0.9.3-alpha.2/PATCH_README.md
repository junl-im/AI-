# SoriON AI 0.9.3-alpha.2 Patch

기준 버전: `0.9.3-alpha.1 Verified Local Model Readiness Foundation`
목표 버전: `0.9.3-alpha.2 Web Quality Toolchain Stabilization`

## 적용

1. 현재 저장소가 0.9.3-alpha.1인지 확인한다.
2. 작업 중 변경을 커밋하거나 백업한다.
3. 패치 ZIP을 저장소 루트에 풀어 덮어쓴다.
4. 기존 `node_modules`와 생성된 `package-lock.json`이 있다면 삭제한다.
5. `npm run quality:web-manifest`를 실행한다.
6. `npm install --no-audit --no-fund`를 실행한다.
7. `npm run quality:web-toolchain`과 `npm ls vite vitest typescript typescript-eslint --all`을 실행한다.
8. lint, typecheck, test:ci, build와 GitHub Actions Web quality를 확인한다.

삭제 파일은 없다. `.git`, 모델, Secret, 사용자 음성은 포함하지 않는다.
