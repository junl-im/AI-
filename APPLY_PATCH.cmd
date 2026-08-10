@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.11.7-ci-chain-hotfix\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.7 CI Chain Integrity hotfix applied.
echo Restoring missing 0.11.6 recovery/session cumulative files and API evidence schema, then running repository preflight.
node scripts\check-version-sync.mjs || exit /b 1
node scripts\check-recovery-evidence-session-safety.mjs || exit /b 1
node scripts\check-one-flow-dubbing-ux.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo Dependency-free checks passed. GitHub Actions remains the final Python 3.10 API and Web quality gate.
endlocal
