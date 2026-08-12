import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures = []

async function source(relativePath) {
  try {
    return await readFile(join(root, relativePath), 'utf8')
  } catch {
    failures.push(`${relativePath}: 필수 파일이 없습니다.`)
    return ''
  }
}

function requireTokens(relativePath, content, tokens) {
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${relativePath}: 계약 누락 ${token}`)
  }
}

const history = await source('src/timeline/editHistory.ts')
requireTokens('src/timeline/editHistory.ts', history, [
  'TIMELINE_EDIT_HISTORY_LIMIT = 20',
  'captureTimelineEditSnapshot',
  'snapshotVoiceToQueuedBlock',
  "status: 'queued'",
  'trackId: null',
  'jobId: null',
])

const timeline = await source('src/hooks/useTimelineGeneration.ts')
requireTokens('src/hooks/useTimelineGeneration.ts', timeline, [
  "commitEdit('대사 수정'",
  "commitEdit('클립 삭제'",
  "commitEdit('클립 분할'",
  "commitEdit('선택 클립 목소리 변경'",
  'undoEdit',
  'redoEdit',
  'canUndo:',
  'canRedo:',
  'buildEngineRoutingTrace(results)',
])

const editor = await source('src/components/workspace/TimelineEditor.tsx')
requireTokens('src/components/workspace/TimelineEditor.tsx', editor, [
  'soa-timeline-history-controls',
  'Ctrl/Cmd+Shift+Z',
  'onUndo?.()',
  'onRedo?.()',
])

const memory = await source('src/workspace/speakerVoiceMemory.ts')
requireTokens('src/workspace/speakerVoiceMemory.ts', memory, [
  'sorion-speaker-voice-memory-v1',
  'speakerMemoryKey',
  'MAX_ENTRIES = 24',
  'rememberSpeakerVoiceAssignments',
  'getRememberedSpeakerVoiceMap',
])
if (memory.includes('speaker: item.speaker')) {
  failures.push('src/workspace/speakerVoiceMemory.ts: 화자 원문을 저장하지 않아야 합니다.')
}

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'getRememberedSpeakerVoiceMap',
  'rememberSpeakerVoiceAssignments(speakerAssignments)',
  'rememberedVoiceBySpeaker={rememberedSpeakerVoices}',
  'formatEngineRoutingTrace(batch.routing)',
])

const routing = await source('src/workspace/engineRoutingTrace.ts')
requireTokens('src/workspace/engineRoutingTrace.ts', routing, [
  'engineSwitchCount',
  'fallbackCount',
  'engineUsage',
  'attemptedEngineCount',
  'buildEngineRoutingTrace',
])

const tests = await source('src/hooks/useTimelineGeneration.test.ts')
requireTokens('src/hooks/useTimelineGeneration.test.ts', tests, [
  'useTimelineGeneration bounded edit history',
  "expect(result.current.redoLabel).toBe('대사 수정')",
])

if (failures.length) {
  console.error('Editing history / speaker memory / engine routing trace 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Editing history / speaker memory / engine routing trace 계약 검사 통과 · history 20 / hashed speaker memory / routing trace')
