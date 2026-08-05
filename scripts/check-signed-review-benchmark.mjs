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

await requireMarkers('services/api/app/services/voice_preset_approval.py', [
  '현재 WAV 승인',
  'expected_audio_sha256',
  'preview_id',
  '_atomic_write',
  'before_manifest',
  'rolled-back',
  'hmac.new',
])
await requireMarkers('services/api/app/services/voice_preset_evidence.py', [
  'signature_status = "valid"',
  '운영자 HMAC 서명',
  'approval_id',
])
await requireMarkers('services/api/app/api/routes/voice_preset_approvals.py', [
  '/voice-preset-approvals/preview',
  '/voice-preset-approvals/apply',
  '/rollback',
])
await requireMarkers('services/api/app/engines/tts/cosyvoice_worker_tts.py', [
  '_record_telemetry',
  'model_digest',
  'first_audio_ms',
  'final_handoff_error_ms',
])
await requireMarkers('services/api/app/api/routes/verification.py', [
  '/worker-telemetry/summary',
  'p50_first_audio_ms',
  'p95_realtime_factor',
])
await requireMarkers('src/components/evaluation/VoicePresetApprovalCard.tsx', [
  '승인 diff 미리보기',
  '현재 WAV 승인 적용',
  '승인 롤백',
])
await requireMarkers('src/components/evaluation/BenchmarkDashboardCard.tsx', [
  '모델·GPU·프리셋 성능 분리표',
  'p50FirstAudioMs',
  'p95RealtimeFactor',
])

if (failures.length) {
  console.error('Signed review approval / benchmark dashboard 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Signed review approval / benchmark dashboard 계약 검사 통과')
