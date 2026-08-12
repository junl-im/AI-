@echo off
setlocal
cd /d "%~dp0"
node scripts\apply-delete-list.mjs docs\patches\0.11.11-mobile-studio-flow-natural-voice-playback\DELETE_LIST.txt || exit /b 1
echo SoriON AI v0.11.11 Mobile Studio Flow and Natural Voice Playback applied.
echo Checking mobile Dock/Player, voice chooser, composer navigation, horizontal timeline and playback link contracts.
node scripts\check-version-sync.mjs || exit /b 1
node scripts\check-mobile-studio-flow.mjs || exit /b 1
node scripts\check-one-flow-dubbing-ux.mjs || exit /b 1
node scripts\check-horizontal-timeline-editor.mjs || exit /b 1
node scripts\check-studio-playback-timeline-ux.mjs || exit /b 1
node scripts\check-visual-layout-regression.mjs || exit /b 1
node scripts\check-multi-speaker-resume.mjs || exit /b 1
node scripts\check-batch-recovery-adaptive-routing.mjs || exit /b 1
node scripts\check-recovery-evidence-session-safety.mjs || exit /b 1
node scripts\run-preflight.mjs || exit /b 1
echo Dependency-free checks passed. Commit/push and use GitHub Actions API quality and Web quality as the final gate.
endlocal
