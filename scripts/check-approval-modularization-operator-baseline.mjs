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
  return text
}

const approval = await requireMarkers(
  'services/api/app/services/voice_preset_approval.py',
  [
    'VoicePresetApprovalStorage',
    'VoicePresetRenewalService',
    'self.storage.write_manifest',
    'self.storage.append_history',
  ],
)
if (approval.split(/\r?\n/).length > 750) {
  failures.push('voice_preset_approval.py: 750줄 이하 모듈화 기준을 초과했습니다.')
}

await requireMarkers('services/api/app/services/voice_preset_approval_primitives.py', [
  'canonical_json',
  'manifest_digest',
  'manifest_diff',
  'signature_payload',
])
await requireMarkers('services/api/app/services/voice_preset_approval_storage.py', [
  'write_manifest',
  'append_history',
  'temporary.replace(path)',
  'os.fsync(output.fileno())',
])
await requireMarkers('services/api/app/services/voice_preset_renewal.py', [
  'VoicePresetRenewalService',
  '_append_expiry_reason',
  'can_resign',
])
await requireMarkers('services/api/app/services/worker_benchmark_baseline.py', [
  'create_operator_baseline',
  'source_records_sha256',
  'operator_assessment',
  'BENCHMARK_WINDOW_SIZE = 5',
])
await requireMarkers('services/api/app/services/operator_baseline_store.py', [
  'event": "created"',
  'event": "retired"',
  '_active_by_group_unlocked',
])
await requireMarkers('services/api/app/api/routes/verification.py', [
  '/worker-telemetry/operator-baselines',
  '현재 성능 기준선 확정',
  '운영자 기준선 폐기',
])
await requireMarkers('src/components/evaluation/BenchmarkDashboardCard.tsx', [
  '운영자 확정 기준선',
  '현재 5건 기준선 확정',
  '기준선 폐기',
])
await requireMarkers('services/api/tests/test_verification.py', [
  'test_operator_baseline_can_be_confirmed_compared_and_retired',
])
await requireMarkers('docs/APPROVAL_MODULARIZATION_AND_OPERATOR_BASELINES.md', [
  '0.10.1',
  '운영자 확정 기준선',
  'SHA-256',
])

if (failures.length) {
  console.error('Approval modularization / operator baseline 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Approval modularization / operator baseline 계약 검사 통과')
