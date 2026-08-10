#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.11.7-ci-chain-hotfix/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.7 CI Chain Integrity hotfix가 적용되었습니다.'
printf '%s\n' '누락된 0.11.6 recovery/session 누적 파일과 API evidence schema를 복구하고 전체 preflight를 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-recovery-evidence-session-safety.mjs
node scripts/check-one-flow-dubbing-ux.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. GitHub Actions에서 API Python 3.10과 전체 Web quality를 최종 확인하세요.'
