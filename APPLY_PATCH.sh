#!/bin/sh
set -eu
cd "$(dirname "$0")"
npm run locks:sync-metadata
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.1/DELETE_LIST.txt
npm run cleanup:stale-brand
npm run hooks:install
npm run quality:stale-files
printf '%s\n' '패치 적용 완료. 아래 Git 변경에서 public/sorion-icon.svg 삭제를 반드시 커밋하세요.'
git status --short 2>/dev/null || true
