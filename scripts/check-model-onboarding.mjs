import { readFile } from 'node:fs/promises'
import process from 'node:process'

const files = new Map([
  ['services/worker/app/model_manifest.py', [
    'verify_model_manifest',
    'SHA-256 불일치',
    'license_requires_acceptance',
    'is_relative_to',
  ]],
  ['services/worker/app/runtime.py', [
    'model_manifest_path',
    'model_checksum_verified',
    'hardware_profile',
    'mps_available',
  ]],
  ['services/worker/scripts/model_manifest.py', [
    'create_manifest',
    'verify_manifest',
    '--accept-license',
  ]],
  ['services/worker/tests/test_model_manifest.py', [
    'license-required',
    'checksum-failed',
    'manifest-required',
  ]],
  ['services/api/app/api/routes/connectivity.py', [
    'worker-model-integrity',
    'model_checksum_verified',
  ]],
  ['.env.example', [
    'SORION_WORKER_MODEL_MANIFEST_PATH',
    'SORION_WORKER_REQUIRE_MODEL_MANIFEST=true',
    'SORION_WORKER_MODEL_LICENSE_ACCEPTED=false',
  ]],
])

const failures = []
for (const [path, snippets] of files) {
  let content = ''
  try {
    content = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
  } catch {
    failures.push(`${path}: 필수 파일이 없습니다.`)
    continue
  }
  for (const snippet of snippets) {
    if (!content.includes(snippet)) failures.push(`${path}: ${snippet}`)
  }
}

if (failures.length) {
  console.error('Model onboarding check failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Model onboarding check passed.')
