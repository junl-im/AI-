#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.11.7-one-flow-dubbing-ux/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.7 One-Flow Dubbing UX 패치가 적용되었습니다.'
printf '%s\n' '집중 모드, 빠른 목소리, 대본 파일 intake, 첫 결과 자동 재생과 기존 고급 편집 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-one-flow-dubbing-ux.mjs
node scripts/check-recovery-evidence-session-safety.mjs
node scripts/check-engine-resilience.mjs
node scripts/check-batch-recovery-adaptive-routing.mjs
node scripts/check-editor-command-engine-observation.mjs
node scripts/check-studio-playback-timeline-ux.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. GitHub Actions에서 전체 Web quality를 최종 확인하세요.'
