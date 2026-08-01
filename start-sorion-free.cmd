@echo off
setlocal
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
if not exist node_modules (
  echo [SoriON] Web 의존성을 처음 설치합니다.
  call npm install || exit /b 1
)
node scripts\start-free-runtime.mjs %*
endlocal
