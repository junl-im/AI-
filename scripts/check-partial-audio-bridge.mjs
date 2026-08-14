import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function requireText(relativePath, expected) {
  const content = await readFile(join(root, relativePath), 'utf8')
  for (const value of expected) {
    if (!content.includes(value)) failures.push(`${relativePath}: ${value} 누락`)
  }
  return content
}

await requireText('services/api/app/main.py', [
  'rate_limit_key = client_key(request)',
  'actor = request_actor(request)',
])
await requireText('services/api/app/core/config.py', [
  'segment_url_ttl_seconds',
  'segment_url_signing_secret',
  'trusted_proxy_cidrs',
])
await requireText('services/api/app/services/segment_audio.py', [
  'hmac.compare_digest',
  'expires > now + self.ttl_seconds + 30',
  '/segments/{index}/audio',
])
await requireText('services/api/app/services/proxy_headers.py', [
  'is_trusted_proxy',
  'x-forwarded-proto',
  'x-forwarded-host',
  'x-forwarded-for',
])
await requireText('services/api/app/api/routes/tts.py', [
  'event: segment-ready',
  'signer.verify',
  'Cache-Control": "private, no-store, max-age=0',
  '_absolute_audio_url',
  'Referrer-Policy',
])
await requireText('services/api/app/schemas/tts.py', [
  'class JobSegmentAudio',
  'ready_segments: list[JobSegmentAudio]',
])
await requireText('src/tts/jobProgressStream.ts', [
  "event === 'segment-ready'",
  'onSegmentReady(mapSegment',
])
const timelineGenerationSource = await requireText('src/timeline/generationRuntime.ts', [
  'previewReadySegment',
  'const targetTrackId = partialTrackId',
  'appendProgressiveSegment(targetTrackId, prepared)',
  'replaceTrack(partialTrackId',
  'serverSegmentReadyMs',
  'refreshSpeechReadySegment',
  'const probeCancellation = probe.cancel()',
  'await probeCancellation',
])
if (timelineGenerationSource.includes('await probe.cancel()')) {
  failures.push('src/timeline/generationRuntime.ts: tee 분기 소비 전에 probe.cancel()을 await하면 교착될 수 있음')
}
await requireText('src/components/navigation/LinkedPlayerDock.tsx', [
  "recordPlaybackMetric('firstByteMs')",
  "recordPlaybackMetric('playingMs')",
  "recordPlaybackMetric('browserSpeechStartMs')",
  'finalReplacedProgressive',
  'progressiveOffsetRef',
  'handoffPosition',
])
await requireText('src/tts/jobProgressStream.test.ts', [
  'publishes signed segment-ready events separately from progress',
  'readyAfterMs: 640',
  'resolveApiAssetUrl:',
])
await requireText('src/hooks/useTimelineGeneration.test.ts', [
  '첫 구간을 즉시 큐에 넣고 최종 WAV를 같은 트랙으로 교체한다',
  'function audioResponse(value: string): Response',
  "mockReturnValue('blob:partial-segment')",
  'serverSegmentReadyMs: 650',
  '만료된 첫 구간 URL은 작업 상태에서 새 서명을 받아 한 번 다시 요청한다',
])
await requireText('src/store/usePlayerStore.test.ts', [
  '첫 구간 트랙을 같은 ID의 최종 음원으로 교체하고 지연 지표를 보존한다',
  'firstByteMs: 510',
])
await requireText('src/components/navigation/LinkedPlayerDock.test.tsx', [
  '브라우저 음성의 실제 시작 지연을 재생 이벤트에서 기록한다',
  'browserSpeechStartMs: 780',
  '첫 구간이 최종 WAV로 교체되어도 재생 위치와 재생 상태를 이어간다',
  "expect(element).toHaveAttribute('src', finalUrl)",
])
await requireText('services/api/tests/test_partial_audio.py', [
  'test_long_tts_publishes_signed_segment_audio',
  'test_final_audio_url_uses_only_trusted_forwarded_origin',
])
await requireText('services/api/tests/test_segment_audio.py', [
  'test_untrusted_proxy_headers_are_ignored',
  'test_trusted_proxy_headers_are_normalized',
])
await requireText('docs/PARTIAL_AUDIO_DELIVERY.md', [
  'segment-ready',
  'SORION_SEGMENT_URL_SIGNING_SECRET',
  '첫 바이트',
  '실제 재생',
])
await requireText('docs/SECURE_MOBILE_BRIDGE.md', [
  'SORION_TRUSTED_PROXY_CIDRS',
  'X-Forwarded-For $remote_addr',
  'header_up -X-Forwarded-For',
])

if (failures.length > 0) {
  console.error('Partial audio / Bridge 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Partial audio / Bridge 계약 검사 통과')
