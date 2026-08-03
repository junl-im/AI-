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

await requireText('src/tts/generationTypes.ts', [
  'export interface PlaybackSeamMetric',
  'waitedForSegment: boolean',
  'seams?: PlaybackSeamMetric[]',
])
await requireText('src/store/usePlayerStore.ts', [
  'recordSeamMetric',
  'updateResumePosition',
  'restoreSession',
  "slice(-20)",
])
await requireText('src/components/navigation/LinkedPlayerDock.tsx', [
  'segmentEndedAtRef',
  'recordProgressiveSeam',
  "performance.now() - endedAt",
  'resumePositionSeconds',
  '전환 ${latestSeam.gapMs}ms',
])
await requireText('src/player/playerSession.ts', [
  'MAX_SESSION_AGE_MS = 25 * 60 * 1_000',
  "audio.partial || audio.progressive || audio.revokeOnRemove",
  "audio.source === 'api' && hasSafeRemoteUrl(audio.url)",
  'window.localStorage.setItem',
])
await requireText('src/hooks/usePlayerSessionPersistence.ts', [
  'loadPlayerSession',
  'createPlayerSessionSnapshot',
  "window.addEventListener('pagehide', checkpoint)",
])
await requireText('src/app/App.tsx', [
  'usePlayerSessionPersistence',
  'usePlayerSessionPersistence()',
])
await requireText('src/quality/browserPlaybackEvidence.ts', [
  'export interface BrowserSoakObservation',
  'networkTransitions',
  'backgroundReturnCount',
  'startBrowserPlaybackEvidenceMonitor',
  "window.addEventListener('offline', handleNetwork)",
])
await requireText('src/components/evaluation/PlaybackSeamEvidenceCard.tsx', [
  '구간 전환 실측',
  'previous-ended to next-playing',
  '구간 전환 증거 JSON 저장',
])
await requireText('src/pages/QualityPage.tsx', [
  'PlaybackSeamEvidenceCard',
  '<PlaybackSeamEvidenceCard />',
])
await requireText('src/components/navigation/LinkedPlayerDock.test.tsx', [
  '전환 140ms',
  '새로고침 복원 음원은 자동 재생하지 않고 저장된 위치만 복원한다',
])
await requireText('src/player/playerSession.test.ts', [
  '원격 최종 음원만 저장하고 Blob·부분 음원은 제외한다',
  '25분이 지난 재생 세션은 복원하지 않는다',
])
await requireText('src/quality/browserPlaybackEvidence.test.ts', [
  '탭 숨김·복귀와 네트워크 전환을 관찰 세션에 누적한다',
  'totalHiddenMs: 3_500',
])
await requireText('docs/SEAM_METRICS_AND_SESSION_RESTORE.md', [
  'ended → playing',
  '25분',
  '부분 음원',
  'gapless',
])
await requireText('docs/BROWSER_DEVICE_EVIDENCE.md', [
  '네트워크 전환',
  'visibility',
  'BFCache',
  '실기기 인증',
])

if (failures.length > 0) {
  console.error('Seam metrics / session restore 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Seam metrics / session restore 계약 검사 통과')
