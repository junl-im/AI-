@echo off
setlocal
pushd "%~dp0\..\..\.."
if errorlevel 1 (
  echo 저장소 루트로 이동하지 못했습니다.
  pause
  exit /b 1
)

echo [1/2] 이전 SVG 브랜드 파일을 삭제합니다.
node scripts\remove-stale-brand-assets.mjs
if errorlevel 1 goto :fail

echo [2/2] 프로젝트 규칙을 확인합니다.
call npm run quality:rules
if errorlevel 1 goto :fail

echo.
echo 핫픽스 적용 완료. GitHub Desktop Changes에서 public/sorion-icon.svg 삭제를 확인하세요.
popd
pause
exit /b 0

:fail
echo.
echo 핫픽스 적용에 실패했습니다. 위 오류를 확인하세요.
popd
pause
exit /b 1
