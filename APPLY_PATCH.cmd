@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.2-ci-hardening-1\DELETE_LIST.txt || exit /b 1
call npm run cleanup:stale-brand || exit /b 1
call npm run hooks:install || exit /b 1
call npm run quality:stale-files || exit /b 1
call npm run quality:ci-architecture || exit /b 1
echo CI hardening 패치 적용 완료. GitHub Desktop에서 삭제와 변경을 모두 Commit/Push하세요.
git status --short
endlocal
