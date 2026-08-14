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

const playerCss = await source('src/styles/player-dock.css')
requireTokens('src/styles/player-dock.css', playerCss, [
  '0.10.5 compact transport',
  '.soa-player-scrub',
  'grid-template-columns: 36px minmax(130px, 1fr) auto minmax(90px, 220px) auto;',
  'padding-bottom: 66px;',
])

const overlayCss = await source('src/styles/dubbing-overlays.css')
requireTokens('src/styles/dubbing-overlays.css', overlayCss, [
  '0.10.5 compact creation player',
  '.soa-dubbing-player-compact',
  '.soa-timeline-quick-editor',
  '.soa-dubbing-block__script-preview',
  '.soa-timeline-toolbar',
  '.soa-capcut-playhead span',
  '.soa-dubbing-block.is-selected',
  '0.10.6 multi-clip practical editing',
  '.soa-timeline-batch-summary',
  '0.11.1 safe batch voice editing',
  '.soa-timeline-batch-controls',
  '.soa-timeline-batch-preview',
])

const previewButton = await source('src/components/voice/VoicePreviewButton.tsx')
requireTokens('src/components/voice/VoicePreviewButton.tsx', previewButton, [
  "data-preview-state={loading ? 'loading' : playing ? 'playing' : active ? 'paused' : 'idle'}",
  '미리듣기 준비 취소',
  '미리듣기 일시정지',
  '미리듣기 계속 재생',
])

const home = await source('src/pages/HomePage.tsx')
requireTokens('src/pages/HomePage.tsx', home, [
  'activePreviewId',
  'previewPlaying',
  'toggleTrack(activePreview.trackId)',
  'setActivePreview({ voiceId: voice.id, trackId: previewTrackId })',
])

const store = await source('src/store/usePlayerStore.ts')
requireTokens('src/store/usePlayerStore.ts', store, [
  'toggleRequestId',
  'seekRequestId',
  'seekTrack: (trackId, seconds)',
  'setPlaybackSnapshot',
])

const dock = await source('src/components/navigation/LinkedPlayerDock.tsx')
requireTokens('src/components/navigation/LinkedPlayerDock.tsx', dock, [
  'applyRequestedSeek()',
  'element.ended',
  'setPlaybackSnapshot(currentTrackId, current, playing)',
  'handledToggleRequestRef',
  'className="soa-player-scrub"',
  'className="soa-dubbing-player-compact"',
])

const timelineBlockCard = await source('src/components/workspace/TimelineVoiceBlockCard.tsx')
requireTokens('src/components/workspace/TimelineVoiceBlockCard.tsx', timelineBlockCard, [
  "event.key === ' ' && block.status === 'ready'",
  "event.altKey && event.key === 'ArrowLeft'",
  'onDoubleClick={(event) => {',
  'soa-timeline-touch-select',
])

const timeline = await source('src/components/workspace/TimelineEditor.tsx')
requireTokens('src/components/workspace/TimelineEditor.tsx', timeline, [
  'seekFromTimeline',
  '트랙 클릭 위치 이동',
  "event.key === 'Delete'",
  "event.key === 'Enter'",
  'soa-capcut-playhead',
  'soa-timeline-zoom',
  'soa-timeline-quick-editor',
  '선택 대사 빠른 수정',
  'onEdit={editBlock}',
  'Ctrl/Cmd 클릭 다중 선택',
  "mode === 'range'",
  'onMoveMany',
  'onRemoveMany',
  '선택 클립 일괄 작업',
  '선택 클립 일괄 목소리',
  '변경 미리보기',
  '적용 후 재생성',
  '실패만 재시도',
  'onBatchVoiceChange',
  'onRegenerateMany',
])

const playerTests = await source('src/components/navigation/LinkedPlayerDock.test.tsx')
requireTokens('src/components/navigation/LinkedPlayerDock.test.tsx', playerTests, [
  '작업공간 Dock은 재생 버튼 다음에 진행바를 배치한다',
])

const timelineTests = await source('src/components/workspace/TimelineEditor.test.tsx')
requireTokens('src/components/workspace/TimelineEditor.test.tsx', timelineTests, [
  '선택 클립을 빠른 편집 패널에서 수정하고 저장한다',
  '클립의 편집 버튼은 선택 클립 빠른 편집기로 연결된다',
  'Ctrl/Cmd 다중 선택 뒤 선택 클립을 일괄 이동·삭제할 수 있다',
  '목소리만 적용',
  '실패만 재시도 1',
])

const browser = await source('src/tts/browserSpeech.ts')
requireTokens('src/tts/browserSpeech.ts', browser, [
  "'compatible-cycle'",
  'preset.voiceVariantIndex % compatible.length',
  '반대 성별은 사용하지 않습니다',
])

const systemTts = await source('services/api/app/engines/tts/system_tts.py')
requireTokens('services/api/app/engines/tts/system_tts.py', systemTts, [
  'preset.variant_index % len(candidates)',
  'same-gender-cycle',
])

const windowsSpeech = await source('services/api/app/engines/tts/scripts/windows_speech.ps1')
requireTokens('services/api/app/engines/tts/scripts/windows_speech.ps1', windowsSpeech, [
  '$voiceIndex % $compatibleVoices.Count',
  '다른 성별 음성으로 자동 대체하지 않습니다',
])

const melo = await source('services/api/app/engines/tts/melo_tts.py')
requireTokens('services/api/app/engines/tts/melo_tts.py', melo, [
  'preset.variant_index % len(compatible)',
  'same-gender-cycle',
])

const docs = await source('docs/STUDIO_PLAYBACK_TIMELINE_UX.md')
requireTokens('docs/STUDIO_PLAYBACK_TIMELINE_UX.md', docs, [
  'PC Dock',
  '준호·민준',
  '프리셋 버튼 상태',
  '타임라인 직접 조작',
])

if (failures.length > 0) {
  console.error('Studio playback / timeline UX 계약 검사 실패')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Studio playback / timeline UX 계약 검사 통과')
