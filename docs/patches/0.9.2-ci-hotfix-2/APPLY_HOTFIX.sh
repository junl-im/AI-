#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/../../.."
node scripts/remove-stale-brand-assets.mjs
npm run quality:rules
printf '%s\n' '핫픽스 적용 완료. Git 변경사항에서 public/sorion-icon.svg 삭제를 확인하세요.'
