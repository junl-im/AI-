#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.11.9-multi-speaker-resume/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.9 Multi-Speaker Assist & Resume Generation이 적용되었습니다.'
printf '%s\n' '화자 배정 승인, clip-level voice 복원, queued-only resume와 기존 bounded generation 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-one-flow-dubbing-ux.mjs
node scripts/check-multi-speaker-resume.mjs
node scripts/check-batch-recovery-adaptive-routing.mjs
node scripts/check-recovery-evidence-session-safety.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. Commit/Push 후 GitHub Actions API quality와 Web quality를 최종 확인하세요.'
