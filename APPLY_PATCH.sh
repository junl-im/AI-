#!/bin/sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-engine-heartbeat-6.4-signed-audio-device-certification/DELETE_LIST.txt
npm run cleanup:stale-brand
npm run locks:sync-metadata
npm run hooks:install
npm run quality:preflight
if [ ! -f package-lock.json ]; then printf '%s
' '[INFO] package-lock.json이 없습니다. CI 자동 bootstrap 또는 선택적 ./GENERATE_WEB_LOCK.sh를 사용할 수 있습니다.'; fi
printf '%s
' 'Engine Heartbeat 6.4 Signed Audio Rehydration & Device Certification 적용 완료. GitHub Desktop에서 변경을 Commit/Push하세요.'
git status --short 2>/dev/null || true
