@echo off
setlocal
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.3-engine-heartbeat-6.5.1-ci-regression-hotfix\DELETE_LIST.txt || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
python -m compileall -q services\api\app services\api\tests services\worker\app services\worker\tests || exit /b 1
python -m pytest services\api\tests -q || exit /b 1
python -m pytest services\worker\tests -q || exit /b 1
echo Engine Heartbeat 6.5.1 CI Regression Hotfix 적용 완료. GitHub Desktop에서 변경을 Commit/Push하고 Web quality를 재실행하세요.
endlocal
