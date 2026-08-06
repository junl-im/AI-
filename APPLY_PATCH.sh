#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.10.1-approval-modularization-operator-baselines/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.10.1 Approval Modularization / Operator Baselines 패치가 적용되었습니다.'
printf '%s\n' '제품 버전, 승인 모듈 분리와 운영자 기준선 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-approval-modularization-operator-baseline.mjs
node scripts/run-preflight.mjs
printf '%s\n' '검사가 통과했습니다. GitHub Desktop에서 변경사항을 확인한 뒤 Commit 및 Push 하세요.'
