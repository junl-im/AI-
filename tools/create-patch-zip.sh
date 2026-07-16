#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -e "const p=require('${ROOT_DIR}/package.json'); console.log(p.version || 'dev')")"
MANIFEST="${ROOT_DIR}/PATCH_MANIFEST.txt"
OUTPUT_DIR="${ROOT_DIR}/dist"

if [[ ! -f "${MANIFEST}" ]]; then
  echo "Missing PATCH_MANIFEST.txt" >&2
  exit 1
fi

PATCH_FROM="$(sed -n 's/^# from=//p' "${MANIFEST}" | head -n 1)"
PATCH_FROM="${PATCH_FROM:-unknown}"
OUTPUT_FILE="${OUTPUT_DIR}/ai-shorts-studio-v${VERSION}-patch-from-v${PATCH_FROM}.zip"

mkdir -p "${OUTPUT_DIR}"
rm -f "${OUTPUT_FILE}"
cd "${ROOT_DIR}"

mapfile -t FILES < <(grep -vE '^\s*(#|$)' "${MANIFEST}")
if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "Patch manifest has no files" >&2
  exit 1
fi
for file in "${FILES[@]}"; do
  [[ -f "${file}" ]] || { echo "Patch file missing: ${file}" >&2; exit 1; }
done
printf '%s\n' "${FILES[@]}" | zip -q "${OUTPUT_FILE}" -@
echo "Created ${OUTPUT_FILE}"
