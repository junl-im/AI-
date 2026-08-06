@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.3-ci-hardening-3\DELETE_LIST.txt
if errorlevel 1 exit /b 1
echo SoriON AI v0.9.9 CI Quality Hotfix 패치가 적용되었습니다.
echo 제품 버전, Ruff import 정렬, 플레이어 테스트 기준을 확인합니다.
node scripts\check-version-sync.mjs
if errorlevel 1 exit /b 1
node scripts\check-quality-gate-compatibility.mjs
if errorlevel 1 exit /b 1
node scripts\check-playback-control-flow.mjs
if errorlevel 1 exit /b 1
echo 검사가 통과했습니다. GitHub Desktop에서 변경사항을 확인한 뒤 Commit 및 Push 하세요.
pause
