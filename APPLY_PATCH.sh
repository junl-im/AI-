#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.11.33-voice-engine-major-hardening/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.33 Voice Engine Major Hardening 삭제 목록을 적용했습니다.'
node scripts/check-version-sync.mjs
node VERIFY_LIVE_VOICE_MYVOICE.mjs
node scripts/check-voice-preset-contracts.mjs
node scripts/check-voice-preset-evidence.mjs
node scripts/check-project-rules.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. Web dependency 설치가 가능한 환경에서 lint/Vitest/typecheck/build를 최종 확인하세요.'
