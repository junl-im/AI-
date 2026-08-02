@echo off
setlocal
cd /d "%~dp0"
call npm run locks:sync-metadata || exit /b 1
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.1\DELETE_LIST.txt || exit /b 1
call npm run cleanup:stale-brand || exit /b 1
call npm run hooks:install || exit /b 1
call npm run quality:stale-files || exit /b 1
echo 패치 적용 완료. Git 변경에서 public/sorion-icon.svg 삭제를 반드시 커밋하세요.
git status --short
endlocal
