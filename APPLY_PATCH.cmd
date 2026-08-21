@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.11.33-voice-engine-major-hardening\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.33 Voice Engine Major Hardening deletion list applied.
node scripts\check-version-sync.mjs || exit /b 1
node VERIFY_LIVE_VOICE_MYVOICE.mjs || exit /b 1
node scripts\check-voice-preset-contracts.mjs || exit /b 1
node scripts\check-voice-preset-evidence.mjs || exit /b 1
node scripts\check-project-rules.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo Dependency-free checks passed. Run lint, Vitest, typecheck, and build where Web dependencies are installed.
endlocal
