@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.3-engine-heartbeat-5.2.1-focus-return-hotfix\DELETE_LIST.txt || exit /b 1
call npm run cleanup:stale-brand || exit /b 1
call npm run locks:sync-metadata || exit /b 1
call npm run hooks:install || exit /b 1
call npm run quality:preflight || exit /b 1
if not exist package-lock.json echo [INFO] package-lock.json이 없습니다. CI 자동 bootstrap 또는 선택적 GENERATE_WEB_LOCK.cmd를 사용할 수 있습니다.
echo Engine Heartbeat 5.2.1 Focus Return Hotfix 적용 완료. GitHub Desktop에서 변경을 Commit/Push하세요.
git status --short
endlocal
