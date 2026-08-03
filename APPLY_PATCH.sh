#!/usr/bin/env bash
set -euo pipefail
node scripts/apply-delete-list.mjs docs/patches/0.9.3-beta.3-engine-heartbeat-6.7-field-evidence-intake-local-export/DELETE_LIST.txt
node scripts/run-preflight.mjs
python -m compileall -q services/api/app services/api/tests services/worker/app services/worker/tests
python -m pytest services/api/tests -q
python -m pytest services/worker/tests -q
printf '%s\n' 'Engine Heartbeat 6.7 Field Evidence Intake & Local Export Bundle 적용 완료. 제품 버전은 0.9.3-beta.3입니다. GitHub Desktop에서 변경을 Commit/Push하고 Web quality를 확인하세요.'
