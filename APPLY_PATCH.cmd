@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.11.13-focused-creation-surface\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.13 Focused Creation Surface가 적용되었습니다.
node scripts\check-version-sync.mjs || exit /b 1
node scripts\check-one-flow-dubbing-ux.mjs || exit /b 1
node scripts\check-mobile-studio-flow.mjs || exit /b 1
node scripts\check-horizontal-timeline-editor.mjs || exit /b 1
node scripts\check-project-rules.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo dependency-free 검사가 통과했습니다. Web dependency 설치가 가능한 환경에서 npm test/typecheck/build를 최종 확인하세요.
endlocal
