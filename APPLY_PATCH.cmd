@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.11.9-multi-speaker-resume\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.9 Multi-Speaker Assist ^& Resume Generation applied.
echo Checking explicit speaker mapping approval, clip-level voice restore, queued-only resume, and existing bounded generation contracts.
node scripts\check-version-sync.mjs || exit /b 1
node scripts\check-one-flow-dubbing-ux.mjs || exit /b 1
node scripts\check-multi-speaker-resume.mjs || exit /b 1
node scripts\check-batch-recovery-adaptive-routing.mjs || exit /b 1
node scripts\check-recovery-evidence-session-safety.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo Dependency-free checks passed. Commit/push and use GitHub Actions API quality and Web quality as the final gate.
endlocal
