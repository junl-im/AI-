#!/usr/bin/env bash
set -euo pipefail
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-engine-heartbeat-6.5.2-stream-handoff-ci-hotfix/DELETE_LIST.txt
node scripts/run-preflight.mjs
python -m compileall -q services/api/app services/api/tests services/worker/app services/worker/tests
python -m pytest services/api/tests -q
python -m pytest services/worker/tests -q
printf '%s\n' 'Engine Heartbeat 6.5.2 Stream Handoff CI Hotfix 적용 완료. GitHub Desktop에서 변경을 Commit/Push하고 Web quality를 재실행하세요.'
