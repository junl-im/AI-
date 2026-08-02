@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.3-ci-hardening-3\DELETE_LIST.txt || exit /b 1
call npm run cleanup:stale-brand || exit /b 1
call npm run locks:sync-metadata || exit /b 1
call npm run hooks:install || exit /b 1
call npm run quality:preflight || exit /b 1
if not exist package-lock.json echo [NEXT] package-lock.json이 없습니다. GENERATE_WEB_LOCK.cmd를 더블클릭한 뒤 Commit/Push하세요.
echo beta.3 CI Hardening 4 패치 적용 완료. GitHub Desktop에서 변경과 삭제를 Commit/Push하세요.
git status --short
endlocal
