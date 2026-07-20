#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const file of ['tools/create-release-zip.sh', 'tools/create-patch-zip.sh', 'tools/create-distribution-zips.sh']) {
  assert(fs.existsSync(path.join(root, file)), `missing distribution asset: ${file}`);
}
assert(!fs.existsSync(path.join(root, 'PATCH_MANIFEST.txt')), 'PATCH_MANIFEST.txt must not be generated or shipped');
assert(pkg.scripts['package:full'] && pkg.scripts['package:patch'] && pkg.scripts.package, 'dual package scripts missing');

const patchScript = fs.readFileSync(path.join(root, 'tools/create-patch-zip.sh'), 'utf8');
assert(patchScript.includes('PATCH_BASE_REF'), 'patch script must support an explicit git base ref');
assert(patchScript.includes('git -C "${ROOT_DIR}" diff --name-only'), 'patch file list must be derived from git changes');
assert(patchScript.includes('git -C "${ROOT_DIR}" ls-files --others'), 'patch must include new untracked release files');
assert(!patchScript.includes('MANIFEST=') && !patchScript.includes('readFileSync') && !patchScript.includes('grep -vE'), 'patch script must not depend on or generate a manifest file');
assert(patchScript.includes('diff-filter=D'), 'patch script must guard unsupported file deletions');

const releaseScript = fs.readFileSync(path.join(root, 'tools/create-release-zip.sh'), 'utf8');
assert(releaseScript.includes("-x 'dist/*'"), 'full release must exclude nested distribution files');
assert(releaseScript.includes("-x 'PATCH_MANIFEST.txt'"), 'full release must explicitly exclude legacy patch manifests');
assert(releaseScript.includes("-x '*/__pycache__/*'") && releaseScript.includes("-x '*.pyc'"), 'full release must exclude Python cache artifacts');
assert(patchScript.includes('*/__pycache__/*') && patchScript.includes('*.pyc'), 'patch release must ignore legacy Python cache artifacts');

console.log(`PASS manifest-free full and dynamic overwrite-patch distribution contract for v${pkg.version}`);
