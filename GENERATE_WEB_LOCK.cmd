@echo off
setlocal
cd /d "%~dp0"
echo [SoriON] package-lock.json one-time bootstrap
where node >nul 2>nul || goto :missing_node
where npm >nul 2>nul || goto :missing_npm
for /f "delims=" %%v in ('node --version') do set NODE_VERSION=%%v
for /f "delims=" %%v in ('npm --version') do set NPM_VERSION=%%v
echo Node %NODE_VERSION% / npm %NPM_VERSION%
call npm run locks:bootstrap:web
if errorlevel 1 goto :failed
echo.
echo [OK] package-lock.json was generated and verified.
echo Open GitHub Desktop, confirm package-lock.json is listed, then Commit and Push.
git status --short -- package-lock.json 2>nul
pause
exit /b 0
:missing_node
echo [ERROR] Node.js is not installed. Install Node.js 22.18.0 and run this file again.
pause
exit /b 1
:missing_npm
echo [ERROR] npm is not available. Install Node.js 22.18.0 and run this file again.
pause
exit /b 1
:failed
echo.
echo [ERROR] Web lock bootstrap failed.
echo See .sorion\lock-audit\npm logs. Do not commit a partial package-lock.json.
pause
exit /b 1
