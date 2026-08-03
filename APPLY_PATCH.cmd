@echo off
setlocal
node scripts\apply-delete-list.mjs docs\patches$slug\DELETE_LIST.txt || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
python -m compileall -q services\api\app services\api\tests services\worker\app services\worker\tests || exit /b 1
python -m pytest services\api\tests -q || exit /b 1
python -m pytest services\worker\tests -q || exit /b 1
echo Engine Heartbeat 6.7 Field Evidence Intake ^& Local Export Bundle 적용 완료. 제품 버전은 0.9.3-beta.3입니다. GitHub Desktop에서 변경을 Commit/Push하고 Web quality를 확인하세요.
endlocal
