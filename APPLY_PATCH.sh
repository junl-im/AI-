#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
node scripts/apply-delete-list.mjs docs/patches/0.11.13-focused-creation-surface/DELETE_LIST.txt
printf '%s\n' 'SoriON AI v0.11.13 Focused Creation Surface가 적용되었습니다.'
printf '%s\n' '목소리 → 텍스트 → 생성 및 재생 기본 흐름과 기존 장문 편집 계약을 확인합니다.'
node scripts/check-version-sync.mjs
node scripts/check-one-flow-dubbing-ux.mjs
node scripts/check-mobile-studio-flow.mjs
node scripts/check-horizontal-timeline-editor.mjs
node scripts/check-project-rules.mjs
node scripts/run-preflight.mjs
printf '%s\n' 'dependency-free 검사가 통과했습니다. Web dependency 설치가 가능한 환경에서 npm test/typecheck/build를 최종 확인하세요.'
