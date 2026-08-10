@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.11.7-one-flow-dubbing-ux\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.7 One-Flow Dubbing UX patch applied.
echo Checking focused mode, quick voices, script intake, first-result autoplay, and existing advanced editing contracts.
node scripts\check-version-sync.mjs || exit /b 1
node scripts\check-one-flow-dubbing-ux.mjs || exit /b 1
node scripts\check-recovery-evidence-session-safety.mjs || exit /b 1
node scripts\check-engine-resilience.mjs || exit /b 1
node scripts\check-batch-recovery-adaptive-routing.mjs || exit /b 1
node scripts\check-editor-command-engine-observation.mjs || exit /b 1
node scripts\check-studio-playback-timeline-ux.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo Dependency-free checks passed. GitHub Actions remains the final Web quality gate.
endlocal
