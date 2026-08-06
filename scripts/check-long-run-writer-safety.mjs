import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function requireMarkers(relativePath, markers) {
  const text = await readFile(join(root, relativePath), 'utf8')
  for (const marker of markers) {
    if (!text.includes(marker)) failures.push(`${relativePath}: 필수 계약 누락 · ${marker}`)
  }
}

await requireMarkers('services/api/app/services/writer_lease.py', [
  'SQLiteWriterLeaseCoordinator',
  'fencing_token',
  'BEGIN IMMEDIATE',
  'assert_current',
])
await requireMarkers('services/api/app/services/voice_preset_approval.py', [
  '_assert_writer_lease',
  '승인 writer 권한이 만료되어',
])
await requireMarkers('services/api/app/services/runtime_soak.py', [
  'runtime-soak/1',
  'p95_recovery_seconds',
  'memory_growth_mb',
  'open_file_descriptors_growth',
])
await requireMarkers('.github/workflows/ci.yml', [
  "options: ['off', '5', '30', '60']",
  'run_runtime_soak.py',
  'runtime-soak.json',
])
await requireMarkers('services/api/app/services/privacy_audit_bundle.py', [
  'privacy-audit-zip/1',
  'MANIFEST.json',
  'build_privacy_audit_zip',
])
await requireMarkers('src/components/evaluation/VerificationEvidenceCard.tsx', [
  '개인정보 제외 감사 ZIP',
])

if (failures.length) {
  console.error('Long-run reliability / writer safety 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Long-run reliability / writer safety 계약 검사 통과')
