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

const navigationItems = await source('src/navigation/navigationItems.ts')
requireTokens('src/navigation/navigationItems.ts', navigationItems, [
  "{ page: 'clone', label: '내 목소리'",
  "home: '텍스트를 음성으로'",
  "clone: '내 목소리'",
])

const player = await source('src/components/navigation/LinkedPlayerDock.tsx')
requireTokens('src/components/navigation/LinkedPlayerDock.tsx', player, [
  'soa-dubbing-player-dock__nav',
  'const navigation = <DockNavigation',
  'const DockNavigation = memo',
  'setPlaying(true)',
  "setPlaybackError(error instanceof Error ? error.message : '음성을 재생하지 못했습니다.')",
  'speechStartWatchdogRef',
  '음성 시작 응답이 없습니다. 모바일 인앱 브라우저라면 외부 브라우저로 열어 주세요.',
])

const voiceControls = await source('src/components/workspace/DubbingVoiceControls.tsx')
requireTokens('src/components/workspace/DubbingVoiceControls.tsx', voiceControls, [
  '현재 목소리 ${voice.name} 선택',
  'contextText={scriptText}',
  '<VoicePickerSheet',
  'applyTargetCount={applyTargetCount}',
  '현재 목소리 적용 대상',
])
if (voiceControls.includes('soa-dubbing-voice-quick')) {
  failures.push('src/components/workspace/DubbingVoiceControls.tsx: 빠른 프리셋 나열 UI가 다시 추가되었습니다.')
}

const picker = await source('src/components/workspace/VoicePickerSheet.tsx')
requireTokens('src/components/workspace/VoicePickerSheet.tsx', picker, [
  '대본 맞춤 추천',
  '잘 맞음 · {voice.bestFor.join',
  '장점 · {voice.strengths.join',
  '주의 · {voice.tradeoffs.join',
  'function previewAndSelect(nextVoiceId: string)',
  'if (nextVoiceId !== selectedId) onSelect(nextVoiceId)',
  'onPreview={previewAndSelect}',
  'soa-voice-picker-scroll',
  '타임라인 ${applyTargetCount}개 선택',
  '성우를 탭하면 선택된 대사에 바로 적용됩니다.',
])

const presets = await source('src/tts/voicePresets.ts')
requireTokens('src/tts/voicePresets.ts', presets, [
  'bestFor:',
  'strengths:',
  'tradeoffs:',
  'naturalSpeedRange:',
  'naturalPitchRange:',
])

const recommendation = await source('src/tts/voiceRecommendation.ts')
requireTokens('src/tts/voiceRecommendation.ts', recommendation, [
  'recommendVoiceForScript',
  'clampVoiceSettingsToNaturalRange',
])

const composer = await source('src/components/workspace/LongformComposer.tsx')
requireTokens('src/components/workspace/LongformComposer.tsx', composer, [
  'alignEditorToMobileTop',
  'window.visualViewport',
  'onFocus={alignEditorAfterFocus}',
  'window.scrollTo({ top: targetTop, behavior })',
])

const timeline = await source('src/components/workspace/TimelineEditor.tsx')
requireTokens('src/components/workspace/TimelineEditor.tsx', timeline, [
  'getDefaultTimelineZoom',
  'window.innerWidth <= 760 ? 1.25 : 1',
  'quickDraftDirty && !saveQuickDraft()',
])

const timelineVoiceBlock = await source('src/components/workspace/TimelineVoiceBlockCard.tsx')
requireTokens('src/components/workspace/TimelineVoiceBlockCard.tsx', timelineVoiceBlock, [
  'soa-timeline-touch-select',
  "onSelect(block.id, 'toggle')",
])

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'selectedTimelineVoiceBlocks',
  'selectedTimelineVoiceIds',
  'selectedTimelineVoiceScope',
  'applyTargetCount={selectedTimelineVoiceIds.length}',
  'applyTargetLabel={selectedTimelineVoiceScope}',
  '선택한 대사 ${selectedTimelineVoiceIds.length}개에',
  'isKakaoInAppBrowser()',
  'startKakaoBrowserPreview',
  'selectedEngineId === BROWSER_SPEECH_ENGINE_ID',
  'window.speechSynthesis.speak(utterance)',
])


const appShell = await source('src/components/layout/AppShell.tsx')
requireTokens('src/components/layout/AppShell.tsx', appShell, [
  "import { InAppBrowserEngineNotice } from './InAppBrowserEngineNotice'",
  '<InAppBrowserEngineNotice />',
])

const inAppNotice = await source('src/components/layout/InAppBrowserEngineNotice.tsx')
requireTokens('src/components/layout/InAppBrowserEngineNotice.tsx', inAppNotice, [
  'WebView 정책 때문에 재생 시작이 막힐 수 있습니다.',
  'window.location.assign(buildExternalBrowserUrl(pageUrl))',
])
if (inAppNotice.includes('await navigator.clipboard')) {
  failures.push('src/components/layout/InAppBrowserEngineNotice.tsx: 외부 브라우저 이동 전에 await가 있어 사용자 제스처가 끊길 수 있습니다.')
}

const exitConfirmation = await source('src/hooks/useExitConfirmation.ts')
requireTokens('src/hooks/useExitConfirmation.ts', exitConfirmation, [
  'pushExitGuard()',
  'window.history.back()',
  'Rearm only after the user explicitly stays',
])
if (exitConfirmation.includes('window.history.go(-2)')) {
  failures.push('src/hooks/useExitConfirmation.ts: 인앱브라우저에서 불안정한 history.go(-2)가 다시 추가되었습니다.')
}

const drawer = await source('src/components/workspace/DesktopVoiceDrawer.tsx')
requireTokens('src/components/workspace/DesktopVoiceDrawer.tsx', drawer, [
  'applyTargetCount',
  '보이스 라이브러리 적용 대상',
  'function previewAndSelect(nextVoiceId: string)',
  'if (nextVoiceId !== voiceId) onVoiceChange(nextVoiceId)',
  'onPreview={previewAndSelect}',
])

const mobileCss = await source('src/styles/timeline-horizontal-mobile.css')
requireTokens('src/styles/timeline-horizontal-mobile.css', mobileCss, [
  '@media (max-width: 1023px)',
  'left: var(--soa-clip-offset, 0px);',
  'width: var(--soa-clip-width, 1px);',
  'overflow-x: auto;',
  'touch-action: pan-x;',
  '.soa-timeline-touch-select',
  'touch-action: manipulation;',
])


const mobileFlowCss = await source('src/styles/mobile-studio-flow.css')
requireTokens('src/styles/mobile-studio-flow.css', mobileFlowCss, [
  '.soa-voice-context-recommendation',
  '.soa-dubbing-player-dock__nav',
  '@media (max-width: 760px)',
  '.soa-voice-apply-target',
  '.soa-one-flow-composer__generate',
  'position: sticky;',
  'padding-bottom: calc(118px + env(safe-area-inset-bottom));',
])

const indexCss = await source('src/styles/index.css')
requireTokens('src/styles/index.css', indexCss, [
  '@import "./timeline-horizontal-mobile.css";',
  '@import "./mobile-studio-flow.css";',
  '@import "./linkage-convenience.css";',
  '@import "./voice-surface-refresh.css";',
])

if (failures.length) {
  console.error('Mobile studio flow 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Mobile studio flow 계약 검사 통과 · dock / voice chooser / editor navigation / horizontal track / playback link')
