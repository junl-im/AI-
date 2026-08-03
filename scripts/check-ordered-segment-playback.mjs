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
  'export interface ProgressiveAudioSegment',
  'export interface ProgressiveAudioSequence',
  'progressive?: ProgressiveAudioSequence',
])
await requireText('src/store/usePlayerStore.ts', [
  'appendProgressiveSegment',
  '.sort((left, right) => left.index - right.index)',
  'audio.progressive?.segments',
])
await requireText('src/hooks/useTimelineGeneration.ts', [
  'const pendingSegments = new Map<number, SpeechReadySegment>()',
  'let nextSegmentIndex = 1',
  'previewReadySegment',
  'drainReadySegments',
  'const targetTrackId = partialTrackId',
  'appendProgressiveSegment(targetTrackId, prepared)',
])
await requireText('src/components/navigation/LinkedPlayerDock.tsx', [
  'progressiveOffsetRef',
  'progressiveNativePosition',
  'waitingForSegment',
  '다음 구간 대기',
  'activeSegment.index + 1',
  'progressiveOffsetRef.current + progressiveNativePosition',
  'const handledPlayRequestRef = useRef(playRequestId)',
  'playingRef.current = true',
])
await requireText('src/hooks/useTimelineGeneration.test.ts', [
  '뒤섞여 도착한 구간을 번호 순서대로 준비해 하나의 트랙에 누적한다',
  "toEqual([1, 2, 3])",
])
await requireText('src/store/usePlayerStore.test.ts', [
  '준비된 후속 구간을 번호 순서로 정렬하고 중복 구간을 무시한다',
  'blob:segment-2-duplicate',
])
await requireText('src/components/navigation/LinkedPlayerDock.test.tsx', [
  '현재 구간 종료 뒤 다음 구간이 늦으면 대기하고 도착 즉시 순서대로 재생한다',
  "toBe('blob:sequence-2')",
])
await requireText('src/quality/browserPlaybackEvidence.ts', [
  'collectBrowserPlaybackEvidence',
  'runGesturePlaybackProbe',
  'eventSourceSupported',
  'backgroundRestore',
])
await requireText('src/components/evaluation/BrowserPlaybackEvidenceCard.tsx', [
  '현재 기기 재생 점검',
  '환경 자동 검사',
  '재생 허용 검사',
  '기기 증거 JSON 저장',
])
await requireText('src/pages/QualityPage.tsx', [
  'BrowserPlaybackEvidenceCard',
  '<BrowserPlaybackEvidenceCard />',
])
await requireText('docs/ORDERED_SEGMENT_PLAYBACK.md', [
  '순서 보장',
  '다음 구간 대기',
  '최종 WAV',
  'gapless',
])
await requireText('docs/BROWSER_DEVICE_EVIDENCE.md', [
  '사용자 제스처',
  'EventSource',
  '백그라운드 복귀',
  '실기기 인증',
])

if (failures.length > 0) {
  console.error('Ordered segment playback / Device evidence 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Ordered segment playback / Device evidence 계약 검사 통과')
