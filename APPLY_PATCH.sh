#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-ci-hardening-3/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.5 Editor Command UX & Adaptive Engine Load Awareness 패치가 적용되었습니다.'
printf '%s\n' '키보드 command bar, 안전 일괄 실행, 병렬 엔진 부하 분산, performance observation 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-engine-resilience.mjs
node scripts/check-batch-recovery-adaptive-routing.mjs
node scripts/check-editor-command-engine-observation.mjs
node scripts/check-studio-playback-timeline-ux.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. GitHub Actions에서 전체 Web quality를 최종 확인하세요.'
