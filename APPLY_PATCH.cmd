@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.9.3-beta.3-ci-hardening-3\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.5 Editor Command UX ^& Adaptive Engine Load Awareness patch applied.
echo Checking keyboard command bar, guarded batch actions, parallel engine load spreading, and performance observation contracts.
node scripts\check-version-sync.mjs || exit /b 1
node scripts\check-engine-resilience.mjs || exit /b 1
node scripts\check-batch-recovery-adaptive-routing.mjs || exit /b 1
node scripts\check-editor-command-engine-observation.mjs || exit /b 1
node scripts\check-studio-playback-timeline-ux.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo Dependency-free checks passed. GitHub Actions remains the final Web quality gate.
endlocal
