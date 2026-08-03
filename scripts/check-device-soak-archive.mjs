import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

async function requireText(relativePath, needles) {
  const text = await readFile(join(root, relativePath), 'utf8')
  const missing = needles.filter((needle) => !text.includes(needle))
  if (missing.length) throw new Error(`${relativePath}: missing ${missing.join(', ')}`)
}

await requireText('services/api/app/schemas/verification.py', [
  'soak_elapsed_seconds',
  'sse_reconnect_ms',
  'audio_fetch_recovery_ms',
  'playback_interruption_ms',
  'seam_p95_waited_ms',
  'seam_p95_decode_ms',
  'DeviceMetricAggregate',
])
await requireText('services/api/app/api/routes/verification.py', [
  '_percentile95',
  'metric_groups',
  'recovery_timing_unverified',
  'soak_duration_incomplete',
  'soak_duration_unverified',
])
await requireText('src/components/evaluation/DeviceSoakRecorderCard.tsx', [
  'DEVICE SOAK RECORDER',
  '측정 시작',
  'SSE 재연결 ms',
  '재생 중단 ms',
  'API 측정표에 저장',
])
await requireText('src/quality/deviceSoakRecorder.ts', [
  'sorion.device-soak-session.v1',
  'summarizeSeams',
  'downloadDeviceSoakRecord',
])
await requireText('src/components/evaluation/PlaybackSeamEvidenceCard.tsx', [
  'generationWaitP95Ms',
  'decodeTransitionP95Ms',
  '생성 대기 P95',
  '순수 전환 P95',
])
await requireText('services/api/app/schemas/export.py', [
  'server_expires_at',
  'server_retention_minutes',
  'download-only',
])
await requireText('src/export/exportArchive.ts', [
  'sorion.export-archive-receipts.v1',
  'preserveExportByDownload',
  'filenames',
])
await requireText('src/components/workspace/FinalExportControls.tsx', [
  '서버 임시 보관',
  '음원·SRT·VTT를 내 기기에 보존',
  '기록 삭제',
])
await requireText('src/export/exportArchive.test.ts', [
  'records only local download metadata',
  'not.toContain',
])

console.log('Device soak recorder / audio archive policy contract 통과')
