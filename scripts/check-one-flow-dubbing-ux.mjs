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
  'generationProgress={generationProgress}',
  'resumeCount={resumeQueuedCount}',
  'onPreviewText={(text) => void previewVoice(voiceId, text)}',
  'onCancelGeneration={cancelLongformGeneration}',
  'const batch = await generateAllTimelineBlocks(pending.blockIds, !pending.resume)',
  'onResumeGeneration={() => void resumeLongformGeneration()}',
  '<SpeakerVoiceAssignmentPanel',
  'buildMultiSpeakerTimelineSegments(',
  'speakerAssignmentsConfirmed',
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
  '말하기 좋게 정리',
  '첫 문장 미리듣기',
  'role="progressbar"',
  '생성 중지',
  '남은 {resumeCount}개 이어서 만들기',
  '개 대기',
  'submitBlockedReason',
])

const speakerAssist = await source('src/components/workspace/SpeakerVoiceAssignment.tsx')
requireTokens('src/components/workspace/SpeakerVoiceAssignment.tsx', speakerAssist, [
  'MULTI-SPEAKER ASSIST',
  '목소리는 제안만 합니다.',
  '이 화자 배정으로 만들기',
  'aria-label={`${speaker} 목소리`}',
])

const multiSpeaker = await source('src/workspace/multiSpeaker.ts')
requireTokens('src/workspace/multiSpeaker.ts', multiSpeaker, [
  'analyzeMultiSpeakerScript',
  'unmatchedLines.length === 0',
  'suggestSpeakerVoiceAssignments',
  'buildMultiSpeakerTimelineSegments',
])

const voiceControls = await source('src/components/workspace/DubbingVoiceControls.tsx')
requireTokens('src/components/workspace/DubbingVoiceControls.tsx', voiceControls, [
  '현재 목소리 ${voice.name} 선택',
  '<VoicePickerSheet',
  'contextText={scriptText}',
  '<VoicePreviewButton',
])

const conversation = await source('src/components/workspace/WorkspaceConversation.tsx')
requireTokens('src/components/workspace/WorkspaceConversation.tsx', conversation, [
  'className="soa-workspace-conversation"',
  'role="region"',
  'aria-label="작업 메시지"',
  '<summary>',
  '제작 기록',
])

const layout = await source('src/hooks/useDesktopStudioLayout.ts')
requireTokens('src/hooks/useDesktopStudioLayout.ts', layout, [
  'sorion.desktop-studio-layout.v3',
  'leftCollapsed: true',
  'rightCollapsed: true',
  'value.leftCollapsed ?? DEFAULT_LAYOUT.leftCollapsed',
  'value.rightCollapsed ?? DEFAULT_LAYOUT.rightCollapsed',
  'toggleSidePanels',
  'sidePanelsCollapsed: layout.leftCollapsed && layout.rightCollapsed',
])

const scriptPreparation = await source('src/workspace/scriptPreparation.ts')
requireTokens('src/workspace/scriptPreparation.ts', scriptPreparation, [
  'MAX_DUBBING_SCRIPT_LENGTH = 20_000',
  'looksLikeSubtitleScript',
  'polishScriptForSpeech',
  'countDetectedSpeakers',
])

const player = await source('src/store/usePlayerStore.ts')
requireTokens('src/store/usePlayerStore.ts', player, [
  'alignTrackOrder: (trackIds: string[]) => void',
  'alignItemsById(state.queue, trackIds)',
])

const boundedBatch = await source('src/workspace/boundedBatch.ts')
requireTokens('src/workspace/boundedBatch.ts', boundedBatch, [
  'runBoundedOrderedBatch',
  'Math.min(items.length, Math.floor(maxConcurrency) || 1)',
  'while (!isCancelled())',
])

const queueOrder = await source('src/player/queueOrder.ts')
requireTokens('src/player/queueOrder.ts', queueOrder, [
  'alignItemsById',
  'order.has(item.id)',
])

const timeline = await source('src/hooks/useTimelineGeneration.ts')
requireTokens('src/hooks/useTimelineGeneration.ts', timeline, [
  'async (ids: string[], autoplayFirst = false)',
  'TIMELINE_GENERATION_CONCURRENCY = 2',
  'await generateOne(requestedIds[0], true)',
  'runBoundedOrderedBatch(',
  'alignTrackOrder(orderedTrackIds)',
  'cancelAllGeneration',
  'batchGenerationRunRef.current += 1',
  'Array.from(controllers.current.keys()).forEach((id) => cancelActiveGeneration(id))',
  'getQueuedVoiceBlockIds',
  'timelineBlocksFromSegments',
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
  '.soa-one-flow-composer__voice {',
  '.soa-one-flow-composer__generate {',
  '.soa-speaker-assist {',
  '.soa-one-flow-resume {',
  '.soa-workspace-conversation > summary {',
  '@media (min-width: 1024px)',
  '@media (max-width: 620px)',
])

const composerTests = await source('src/components/workspace/LongformComposer.test.tsx')
requireTokens('src/components/workspace/LongformComposer.test.tsx', composerTests, [
  'Ctrl+Enter로 현재 장문 내용을 제작 요청한다',
  '현재 대본의 첫 문장을 별도 생성 없이 미리듣기 요청한다',
  '긴 대본 생성 중에는 완료 수와 중지 동작을 같은 화면에서 제공한다',
  '화자 배정 확인 전에는 생성 단축키와 버튼을 막는다',
  '중지 후 남은 대사를 한 번에 이어서 만들 수 있다',
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
