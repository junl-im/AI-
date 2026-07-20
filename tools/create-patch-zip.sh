#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -e "const p=require('${ROOT_DIR}/package.json'); console.log(p.version || 'dev')")"
BASE_REF="${PATCH_BASE_REF:-HEAD}"
BASE_ARCHIVE="${PATCH_BASE_ARCHIVE:-}"
BASE_DIR="${PATCH_BASE_DIR:-}"
OUTPUT_DIR="${ROOT_DIR}/dist"
TEMP_DIR=""

cleanup() {
  if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
    rm -rf "${TEMP_DIR}"
  fi
}
trap cleanup EXIT

create_archive_diff_patch() {
  local compare_dir="$1"
  local patch_from="$2"
  local output_file="${OUTPUT_DIR}/ai-shorts-studio-v${VERSION}-patch-from-v${patch_from}.zip"

  mkdir -p "${OUTPUT_DIR}"
  rm -f "${output_file}"

  python3 - "${ROOT_DIR}" "${compare_dir}" "${output_file}" <<'PY'
from __future__ import annotations

import hashlib
import os
import sys
import zipfile
from pathlib import Path

root = Path(sys.argv[1]).resolve()
base = Path(sys.argv[2]).resolve()
output = Path(sys.argv[3]).resolve()

EXCLUDED_NAMES = {
    'PATCH_MANIFEST.txt',
    '.DS_Store',
    'check.log',
}
EXCLUDED_PARTS = {
    '.git',
    '.firebase',
    'node_modules',
    '__pycache__',
    'dist',
}


def allowed(path: Path, anchor: Path) -> bool:
    rel = path.relative_to(anchor)
    if any(part in EXCLUDED_PARTS for part in rel.parts):
        return False
    if path.name in EXCLUDED_NAMES:
        return False
    if path.suffix in {'.pyc', '.zip'}:
        return False
    return path.is_file()


def collect(anchor: Path) -> dict[str, Path]:
    return {
        path.relative_to(anchor).as_posix(): path
        for path in anchor.rglob('*')
        if allowed(path, anchor)
    }


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            hasher.update(chunk)
    return hasher.hexdigest()

current = collect(root)
previous = collect(base)
deleted = sorted(set(previous) - set(current))
if deleted:
    for item in deleted:
        print(f'Patch ZIP cannot remove deleted file: {item}. Create a full release or restore the file.', file=sys.stderr)
    raise SystemExit(2)

changed = sorted(
    item for item, path in current.items()
    if item not in previous or digest(path) != digest(previous[item])
)
if not changed:
    print('No changed files found against the supplied base archive or directory.', file=sys.stderr)
    raise SystemExit(3)

with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for item in changed:
        archive.write(current[item], item)

print(f'Created {output} with {len(changed)} changed files')
PY
}

if [[ -n "${BASE_ARCHIVE}" || -n "${BASE_DIR}" ]]; then
  if [[ -n "${BASE_ARCHIVE}" ]]; then
    if [[ ! -f "${BASE_ARCHIVE}" ]]; then
      echo "Unknown patch base archive: ${BASE_ARCHIVE}" >&2
      exit 1
    fi
    TEMP_DIR="$(mktemp -d)"
    unzip -q "${BASE_ARCHIVE}" -d "${TEMP_DIR}"
    BASE_DIR="${TEMP_DIR}"
  elif [[ ! -d "${BASE_DIR}" ]]; then
    echo "Unknown patch base directory: ${BASE_DIR}" >&2
    exit 1
  fi

  PATCH_FROM="${PATCH_FROM_VERSION:-$(node -e "const p=require('${BASE_DIR}/package.json'); console.log(p.version || 'unknown')")}" 
  create_archive_diff_patch "${BASE_DIR}" "${PATCH_FROM}"
  exit 0
fi

if ! git -C "${ROOT_DIR}" rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
  echo "No Git patch base is available. Set PATCH_BASE_ARCHIVE=/path/to/previous-release.zip or PATCH_BASE_DIR=/path/to/previous-release." >&2
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
