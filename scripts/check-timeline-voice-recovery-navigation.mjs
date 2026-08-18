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

const selection = await source('src/timeline/timelineSelection.ts')
requireTokens('src/timeline/timelineSelection.ts', selection, [
  'findAdjacentVoiceBlockId',
  "blocks[index]?.kind === 'voice'",
  'summarizeTimelineVoiceSelection',
  'mixed: labels.length > 1',
])

const quickEditor = await source('src/components/workspace/TimelineQuickEditor.tsx')
requireTokens('src/components/workspace/TimelineQuickEditor.tsx', quickEditor, [
  '사용 불가 목소리 복구',
  '현재 완성 음원은 그대로 유지됩니다.',
  '교체를 적용하면 기존 완성 음원은 제거되고',
  '이전 대사로 이동',
  '다음 대사로 이동',
  "event.altKey && event.key === 'ArrowUp'",
  "event.altKey && event.key === 'ArrowDown'",
])

const editor = await source('src/components/workspace/TimelineEditor.tsx')
requireTokens('src/components/workspace/TimelineEditor.tsx', editor, [
  'selectedVoiceUnavailable',
  'recoveryReplacementChoices',
  'recoverSelectedVoice',
  'voiceSelectionSummary.mixed',
  '현재 작업 목소리',
  'TimelineQuickEditor',
  'voiceUnavailable=',
])

const card = await source('src/components/workspace/TimelineVoiceBlockCard.tsx')
requireTokens('src/components/workspace/TimelineVoiceBlockCard.tsx', card, [
  'voiceUnavailable',
  '사용 불가 목소리',
  'soa-dubbing-block__voice-warning',
  '목소리 복구 필요',
])

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'currentVoiceId={voiceId}',
  "onBatchVoiceChange={async (ids, nextVoiceId, regenerate, reason = 'batch') => {",
])

const tests = await source('src/components/workspace/TimelineEditor.test.tsx')
requireTokens('src/components/workspace/TimelineEditor.test.tsx', tests, [
  '유실 MY VOICE는 기존 ready 음원을 자동 폐기하지 않고 명시적 복구 선택을 요구한다',
  '빠른 편집 이전·다음 대사 이동은 쉼을 건너뛰고 현재 draft를 먼저 저장한다',
  '혼합 성우 다중 선택은 구성과 현재 작업 목소리를 분리해 보여준다',
])

if (failures.length) {
  console.error('Timeline voice recovery / quick navigation 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Timeline voice recovery / quick navigation 계약 검사 통과 · stale MY VOICE 보존 / quick nav / mixed voice summary')
