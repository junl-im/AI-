#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.11.12-editing-history-speaker-memory-engine-routing/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.12 Editing History, Speaker Memory & Engine Routing Trace가 적용되었습니다.'
printf '%s\n' 'Timeline Undo/Redo, hashed speaker memory, engine routing trace 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-edit-history-speaker-routing.mjs
node scripts/check-mobile-studio-flow.mjs
node scripts/check-horizontal-timeline-editor.mjs
node scripts/check-one-flow-dubbing-ux.mjs
node scripts/check-multi-speaker-resume.mjs
node scripts/check-visual-layout-regression.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. Commit/Push 후 GitHub Actions API quality와 Web quality를 최종 확인하세요.'
