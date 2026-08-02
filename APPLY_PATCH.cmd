@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.3\DELETE_LIST.txt || exit /b 1
call npm run cleanup:stale-brand || exit /b 1
call npm run locks:sync-metadata || exit /b 1
call npm run hooks:install || exit /b 1
call npm run quality:stale-files || exit /b 1
call npm run quality:ci-architecture || exit /b 1
echo beta.3 패치 적용 완료. GitHub Desktop에서 변경과 삭제를 Commit/Push하세요.
git status --short
endlocal
