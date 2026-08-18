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

const editor = await source('src/components/workspace/TimelineEditor.tsx')
requireTokens('src/components/workspace/TimelineEditor.tsx', editor, [
  'useTimelineEditorSelection',
  'useTimelineEditorBatch',
  '선택 사용 불가 목소리 복구',
  '사용 불가 목소리 일괄 복구 영향 확인',
  '현재 완성 음원',
  'Undo는 목소리 배정을 되돌리지만 과거 음원 파일을 부활시키지 않고',
])
const editorLines = editor.split(/\r?\n/).length
if (editorLines >= 1000) {
  failures.push(`src/components/workspace/TimelineEditor.tsx: 책임 분리 후 1000줄 미만이어야 합니다. 현재 ${editorLines}줄`)
}

const selection = await source('src/hooks/useTimelineEditorSelection.ts')
requireTokens('src/hooks/useTimelineEditorSelection.ts', selection, [
  'export type TimelineSelectionMode',
  'replaceSelection',
  'selectVoiceBlocks',
  'clearSelection',
  'multiSelectionActive',
  'onSelectionChange?.',
])

const batch = await source('src/hooks/useTimelineEditorBatch.ts')
requireTokens('src/hooks/useTimelineEditorBatch.ts', batch, [
  "export type TimelineVoiceChangeReason = 'batch' | 'recovery'",
  'selectedUnavailableVoiceBlocks',
  'unavailableVoiceSummary',
  'recoveryReplacementChoices',
  "onBatchVoiceChange(ids, recoveryVoice.id, regenerate, 'recovery')",
  'TIMELINE_BATCH_RETRY_LIMIT = 3',
  'TIMELINE_BATCH_HISTORY_LIMIT = 6',
])

const generation = await source('src/hooks/useTimelineGeneration.ts')
requireTokens('src/hooks/useTimelineGeneration.ts', generation, [
  "historyLabel = '선택 클립 목소리 변경'",
  'commitEdit(historyLabel',
])

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  "onBatchVoiceChange={async (ids, nextVoiceId, regenerate, reason = 'batch') => {",
  "reason === 'recovery'",
  "'사용 불가 목소리 일괄 복구'",
])

const editorTests = await source('src/components/workspace/TimelineEditor.test.tsx')
requireTokens('src/components/workspace/TimelineEditor.test.tsx', editorTests, [
  '여러 stale MY VOICE는 원래 구성과 ready 음원 영향을 확인한 뒤 사용 불가 클립만 일괄 복구한다',
  "expect(impact).toHaveTextContent('선택 3개 중 사용 불가 MY VOICE 2개만 변경합니다')",
  "['voice-1', 'voice-2']",
  "'recovery'",
])

const generationTests = await source('src/hooks/useTimelineGeneration.test.ts')
requireTokens('src/hooks/useTimelineGeneration.test.ts', generationTests, [
  "updateVoiceMany(ids, 'on-clear', '도윤', '사용 불가 목소리 일괄 복구')",
  "expect(result.current.undoLabel).toBe('사용 불가 목소리 일괄 복구')",
  "expect(result.current.redoLabel).toBe('사용 불가 목소리 일괄 복구')",
])

if (failures.length) {
  console.error('Recovery batch / editor responsibility split 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log(`Recovery batch / editor responsibility split 계약 검사 통과 · stale-only recovery / editor ${editorLines} lines / semantic Undo history`)
