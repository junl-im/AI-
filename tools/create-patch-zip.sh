#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -e "const p=require('${ROOT_DIR}/package.json'); console.log(p.version || 'dev')")"
BASE_REF="${PATCH_BASE_REF:-HEAD}"
OUTPUT_DIR="${ROOT_DIR}/dist"

if ! git -C "${ROOT_DIR}" rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
  echo "Unknown patch base ref: ${BASE_REF}" >&2
  exit 1
fi

PATCH_FROM="${PATCH_FROM_VERSION:-$(git -C "${ROOT_DIR}" show "${BASE_REF}:package.json" 2>/dev/null | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{console.log(JSON.parse(s).version||'unknown')}catch(_){console.log('unknown')}})")}" 
OUTPUT_FILE="${OUTPUT_DIR}/ai-shorts-studio-v${VERSION}-patch-from-v${PATCH_FROM}.zip"

mapfile -d '' DELETED_FILES < <(git -C "${ROOT_DIR}" diff --name-only -z --diff-filter=D "${BASE_REF}" --)
for file in "${DELETED_FILES[@]}"; do
  case "${file}" in
    PATCH_MANIFEST.txt|*/__pycache__/*|*.pyc) continue ;;
  esac
  echo "Patch ZIP cannot remove deleted file: ${file}. Create a full release or restore the file." >&2
  exit 1
done

mapfile -d '' CANDIDATES < <(
  {
    git -C "${ROOT_DIR}" diff --name-only -z --diff-filter=ACMRT "${BASE_REF}" --
    git -C "${ROOT_DIR}" ls-files --others --exclude-standard -z
  } | sort -zu
)

FILES=()
for file in "${CANDIDATES[@]}"; do
  case "${file}" in
    ''|PATCH_MANIFEST.txt|dist/*|node_modules/*|*/__pycache__/*|*.pyc|.git/*|.firebase/*|*.zip|check.log|.DS_Store) continue ;;
  esac
  [[ -f "${ROOT_DIR}/${file}" ]] || continue
  FILES+=("${file}")
done

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No changed files found for patch base ${BASE_REF}" >&2
  exit 1
fi

mkdir -p "${OUTPUT_DIR}"
rm -f "${OUTPUT_FILE}"
(
  cd "${ROOT_DIR}"
  zip -q "${OUTPUT_FILE}" "${FILES[@]}"
)

echo "Created ${OUTPUT_FILE} with ${#FILES[@]} changed files (base ${BASE_REF}, v${PATCH_FROM})"
