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

await requireMarkers('services/api/app/services/worker_benchmark_baseline.py', [
  'BENCHMARK_MINIMUM_RECORDS',
  'automatic_assessment',
  '비중첩 기준선',
  'p95_final_handoff_error_ms',
])
await requireMarkers('services/api/app/services/privacy_audit_bundle.py', [
  'PRIVACY_AUDIT_SCHEMA_VERSION',
  'redact_approval_history',
  'hardware_fingerprint_sha256',
  'verify_privacy_audit_bundle',
])
await requireMarkers('services/api/app/api/routes/evidence.py', [
  '/privacy-audit-bundle',
  '/privacy-audit-bundle/verify',
  '/privacy-audit-bundle.zip',
])
await requireMarkers('src/components/evaluation/BenchmarkDashboardCard.tsx', [
  '기준선 안정',
  '성능 회귀',
  'group.regression.reasons',
])
await requireMarkers('src/components/evaluation/VerificationEvidenceCard.tsx', [
  '개인정보 제외 감사 ZIP',
])
await requireMarkers('docs/BENCHMARK_BASELINE_AND_PRIVACY_AUDIT.md', [
  '비중첩',
  '실제 WAV',
  'GPU 원문',
  'SHA-256',
])

if (failures.length) {
  console.error('Benchmark baseline / privacy audit 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Benchmark baseline / privacy audit 계약 검사 통과')
