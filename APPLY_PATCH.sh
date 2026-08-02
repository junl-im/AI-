#!/bin/sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-ci-hardening-3/DELETE_LIST.txt
npm run cleanup:stale-brand
npm run locks:sync-metadata
npm run hooks:install
npm run quality:preflight
printf '%s\n' 'beta.3 CI Hardening 3 패치 적용 완료. GitHub Desktop에서 변경과 삭제를 Commit/Push하세요.'
git status --short 2>/dev/null || true
