#!/bin/sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.2-ci-hardening-1/DELETE_LIST.txt
npm run cleanup:stale-brand
npm run hooks:install
npm run quality:stale-files
npm run quality:ci-architecture
printf '%s\n' 'CI hardening 패치 적용 완료. GitHub Desktop에서 삭제와 변경을 모두 Commit/Push하세요.'
git status --short 2>/dev/null || true
