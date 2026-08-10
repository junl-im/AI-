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

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'voiceControls={(',
  '<DubbingVoiceControls',
  '<WorkspaceConversation messages={messages} />',
  'timeline.blocks.length > 0 ? (',
  'onAddBlank={() => timeline.addVoiceBlock(buildOptions())}',
  'generateAllTimelineBlocks(pending.blockIds, true)',
  'sidePanelsCollapsed={desktopLayout.sidePanelsCollapsed}',
  'onToggleSidePanels={desktopLayout.toggleSidePanels}',
])

const composer = await source('src/components/workspace/LongformComposer.tsx')
requireTokens('src/components/workspace/LongformComposer.tsx', composer, [
  'ONE-FLOW DUBBING',
  '대본만 넣으면 바로 더빙',
  '자동 문장 분할',
  '전체 내용 음성 제작 · 더빙 만들기',
  '첫 음성 자동 재생',
  '⌘/Ctrl + Enter',
  'normalizeImportedScript',
  '대본 파일 불러오기',
  '.srt,.vtt',
])

const voiceControls = await source('src/components/workspace/DubbingVoiceControls.tsx')
requireTokens('src/components/workspace/DubbingVoiceControls.tsx', voiceControls, [
  'soa-dubbing-voice-quick',
  '빠른 목소리 선택',
  'voicePresets.slice(0, 5)',
  '빠른 선택',
])

const conversation = await source('src/components/workspace/WorkspaceConversation.tsx')
requireTokens('src/components/workspace/WorkspaceConversation.tsx', conversation, [
  '<details className="soa-workspace-conversation">',
  '<summary>',
  '제작 기록',
])

const layout = await source('src/hooks/useDesktopStudioLayout.ts')
requireTokens('src/hooks/useDesktopStudioLayout.ts', layout, [
  'sorion.desktop-studio-layout.v3',
  'leftCollapsed: true',
  'rightCollapsed: true',
  'toggleSidePanels',
  'sidePanelsCollapsed: layout.leftCollapsed && layout.rightCollapsed',
])

const timeline = await source('src/hooks/useTimelineGeneration.ts')
requireTokens('src/hooks/useTimelineGeneration.ts', timeline, [
  'async (ids: string[], autoplayFirst = false)',
  'runBlock(id, true, autoplayFirst && index === 0)',
])

const header = await source('src/components/workspace/DubbingStudioHeader.tsx')
requireTokens('src/components/workspace/DubbingStudioHeader.tsx', header, [
  'soa-dubbing-pro-toggle',
  '프로 패널 펼치기',
  '간편 모드로 전환',
])

const css = await source('src/styles/one-flow-dubbing.css')
requireTokens('src/styles/one-flow-dubbing.css', css, [
  '.soa-one-flow-composer {',
  '.soa-dubbing-voice-quick {',
  '.soa-one-flow-composer__generate {',
  '.soa-workspace-conversation > summary {',
  '@media (min-width: 1024px)',
  '@media (max-width: 620px)',
])

const composerTests = await source('src/components/workspace/LongformComposer.test.tsx')
requireTokens('src/components/workspace/LongformComposer.test.tsx', composerTests, [
  'Ctrl+Enter로 현재 장문 내용을 제작 요청한다',
])
const layoutTests = await source('src/hooks/useDesktopStudioLayout.test.ts')
requireTokens('src/hooks/useDesktopStudioLayout.test.ts', layoutTests, [
  'starts PC workspaces in focused one-flow mode',
  '[1024, 900]',
])

if (failures.length) {
  console.error('One-flow dubbing UX 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('One-flow dubbing UX 계약 검사 통과 · simple-by-default / pro-on-demand')
