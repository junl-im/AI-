#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-ci-hardening-3/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.4 Visual Baseline Approval & Recovery Provenance 패치가 적용되었습니다.'
printf '%s\n' '승인형 Chromium baseline, soak provenance, batch retry history, engine observation reset 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-engine-resilience.mjs
node scripts/check-batch-recovery-adaptive-routing.mjs
node scripts/check-recovery-soak-managed-lock.mjs
node scripts/check-visual-layout-regression.mjs
node scripts/check-studio-playback-timeline-ux.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. GitHub Actions에서 전체 Web quality와 production visual capture를 최종 확인하세요.'
