#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-ci-hardening-3/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.9.8 Quality Gate Compatibility 패치가 적용되었습니다.'
printf '%s\n' '제품 버전과 Ruff·Web 타입 호환 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-quality-gate-compatibility.mjs
printf '%s\n' '검사가 통과했습니다. GitHub Desktop에서 변경사항을 확인한 뒤 Commit 및 Push 하세요.'
