#!/bin/sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-engine-heartbeat-3/DELETE_LIST.txt
npm run cleanup:stale-brand
npm run locks:sync-metadata
npm run hooks:install
npm run quality:preflight
if [ ! -f package-lock.json ]; then printf '%s\n' '[NEXT] package-lock.json이 없습니다. ./GENERATE_WEB_LOCK.sh 실행 뒤 Commit/Push하세요.'; fi
printf '%s\n' 'Engine Heartbeat 3 패치 적용 완료. GitHub Desktop에서 변경과 삭제를 Commit/Push하세요.'
git status --short 2>/dev/null || true
