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

await requireMarkers('src/quality/voicePresetReviewBundle.ts', [
  "sorion.voice-preset-review-bundle.v1",
  "proposedStatus: 'pending'",
  'payloadSha256',
  'parseAndImportVoicePresetReviewBundle',
  '검수 묶음 SHA-256가 맞지 않습니다',
])
await requireMarkers('src/quality/qualityReviewTypes.ts', [
  "export type QualityReviewDecision = 'approved' | 'rejected' | 'needs-review'",
])
await requireMarkers('services/api/app/schemas/voice_preset_evidence.py', [
  'audio_sha256',
  'source_review_bundle_sha256',
])
await requireMarkers('services/api/app/services/voice_preset_evidence.py', [
  'review_status = "stale"',
  'review_checksum_matches',
  'days_remaining',
])
await requireMarkers('services/api/app/schemas/setup.py', [
  'voice_selection_diagnostics',
  'VoiceSelectionDiagnostic',
])
await requireMarkers('services/api/app/engines/tts/system_tts.py', [
  'def voice_selection_diagnostics',
])
await requireMarkers('services/api/app/engines/tts/melo_tts.py', [
  'def voice_selection_diagnostics',
])
await requireMarkers('services/api/app/schemas/verification.py', [
  'model_digest',
  'gpu_name',
  'p95_final_handoff_error_ms',
])

if (failures.length) {
  console.error('Voice review sync / telemetry 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}
console.log('Voice review sync / telemetry 계약 검사 통과')
