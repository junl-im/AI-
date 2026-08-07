#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.10.3-compact-playback-timeline/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.10.3 Compact Playback / Timeline UX 패치가 적용되었습니다.'
printf '%s\n' 'PC Dock, 준호·민준 프리셋, 미리듣기 버튼 상태와 타임라인 직접 조작을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-voice-preset-contracts.mjs
node scripts/check-studio-playback-timeline-ux.mjs
node scripts/run-preflight.mjs
printf '%s\n' '검사가 통과했습니다. GitHub Desktop에서 변경사항을 확인한 뒤 Commit 및 Push 하세요.'
