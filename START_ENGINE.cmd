@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (
  echo [SoriON] Node.js 22 이상이 필요합니다.
  pause
  exit /b 1
)
where uv >nul 2>nul || (
  echo [SoriON] uv Python 실행기가 필요합니다: https://docs.astral.sh/uv/
  pause
  exit /b 1
)
node scripts\start-engine.mjs %*
if errorlevel 1 pause
endlocal
