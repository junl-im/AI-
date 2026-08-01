# SoriON AI 0.7.1 → 0.7.2 Patch

1. 현재 `package.json` 버전이 정확히 `0.7.1`인지 확인한다.
2. 기존 `.git` 폴더와 로컬 Secret은 유지한다.
3. `SoriON-AI-0.7.1-to-0.7.2-patch.zip`을 저장소 루트에 푼다.
4. 같은 이름의 파일을 모두 덮어쓴다.
5. 이번 패치에는 삭제 파일이 없다.
6. `npm run quality:rules`를 실행한다.
7. GitHub Actions에서 Web, API, Worker quality가 모두 통과하는지 확인한다.

권장 브랜치: `fix/ci-zero-error`

권장 커밋: `fix: clear Web API and Worker quality errors`
