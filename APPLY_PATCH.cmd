@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.11.12-editing-history-speaker-memory-engine-routing\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.12 Editing History, Speaker Memory ^& Engine Routing Trace가 적용되었습니다.
node scripts\check-version-sync.mjs || exit /b 1
node scripts\check-edit-history-speaker-routing.mjs || exit /b 1
node scripts\check-mobile-studio-flow.mjs || exit /b 1
node scripts\check-horizontal-timeline-editor.mjs || exit /b 1
node scripts\check-one-flow-dubbing-ux.mjs || exit /b 1
node scripts\check-multi-speaker-resume.mjs || exit /b 1
node scripts\check-visual-layout-regression.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo dependency-free 검사가 통과했습니다. Commit/Push 후 GitHub Actions API quality와 Web quality를 최종 확인하세요.
endlocal
