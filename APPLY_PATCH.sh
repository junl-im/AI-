#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-ci-hardening-3/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.0 Adaptive Engine Resilience & Recovery 패치가 적용되었습니다.'
printf '%s\n' 'half-open 단일 probe, bounded cooldown, 엔진 재탐지와 runtime 진단 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-engine-resilience.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 엔진 검사가 통과했습니다. GitHub Actions에서 Ruff와 전체 Web quality를 최종 확인하세요.'
