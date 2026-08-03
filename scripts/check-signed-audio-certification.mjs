import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))

async function requireText(relativePath, needles) {
  const text = await readFile(join(root, relativePath), 'utf8')
  const missing = needles.filter((needle) => !text.includes(needle))
  if (missing.length) {
    throw new Error(`${relativePath}: missing ${missing.join(', ')}`)
  }
}

await requireText('services/api/app/services/segment_audio.py', [
  'issue_final',
  'verify_final',
  '"final"',
])
await requireText('services/api/app/api/routes/tts.py', [
  '_signed_final_result',
  '@router.get("/jobs/{job_id}/audio")',
  'X-SoriON-Audio-Rehydratable',
  'SOA-4021',
])
await requireText('src/tts/generationTypes.ts', [
  "kind: 'tts-final'",
  'finalHandoffErrorMs',
])
await requireText('src/player/playerSession.ts', [
  'rehydratePlayerSession',
  'renewFinalAudio',
  'renewedAt',
])
await requireText('src/hooks/usePlayerSessionPersistence.ts', [
  'refreshSpeechFinalAudio',
  'rehydratePlayerSession',
])
await requireText('src/components/navigation/LinkedPlayerDock.tsx', [
  'recoverFinalAudio',
  'renewedFinalAudio',
  'renewedFinalPosition',
  'finalHandoffErrorMs',
  'onError={() => { void recoverFinalAudio() }}',
])
await requireText('src/components/navigation/LinkedPlayerDock.test.tsx', [
  '만료된 최종 음원 URL을 갱신해 같은 트랙과 재생 위치를 유지한다',
  'refreshSpeechFinalAudio',
])
await requireText('src/components/evaluation/PlaybackSeamEvidenceCard.tsx', [
  'percentile95',
  'p95GapMs',
  'finalHandoff',
])
await requireText('services/api/app/schemas/verification.py', [
  'DeviceScenario',
  'certification_coverage',
  'missing_certifications',
])
await requireText('src/components/evaluation/DeviceEvidenceCard.tsx', [
  'network-switch',
  'background-resume',
  'installed-pwa',
  '모바일 시나리오 인증',
])

console.log('Signed audio rehydration / device certification contract 통과')
