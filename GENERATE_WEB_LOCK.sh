#!/bin/sh
set -eu
cd "$(dirname "$0")"
printf '%s\n' '[SoriON] package-lock.json one-time bootstrap'
command -v node >/dev/null 2>&1 || { printf '%s\n' '[ERROR] Install Node.js 22.18.0.' >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { printf '%s\n' '[ERROR] npm is unavailable.' >&2; exit 1; }
printf 'Node %s / npm %s\n' "$(node --version)" "$(npm --version)"
npm run locks:bootstrap:web
printf '%s\n' '[OK] package-lock.json was generated and verified. Commit it before pushing.'
git status --short -- package-lock.json 2>/dev/null || true
