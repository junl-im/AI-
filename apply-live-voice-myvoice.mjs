import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function target(relative) {
  return path.join(root, relative)
}

function patch(relative, search, replacement, marker) {
  const file = target(relative)
  if (!fs.existsSync(file)) throw new Error(`Missing ${relative}`)
  const source = fs.readFileSync(file, 'utf8')
  if (marker && source.includes(marker)) {
    console.log(`skip ${relative} (already patched: ${marker})`)
    return
  }
  if (!source.includes(search)) {
    throw new Error(`Patch context not found in ${relative}: ${search.slice(0, 90).replaceAll('\n', ' ')}`)
  }
  fs.writeFileSync(file, source.replace(search, replacement))
  console.log(`patch ${relative}`)
}

function insertAfter(relative, anchor, addition, marker) {
  patch(relative, anchor, `${anchor}${addition}`, marker)
}

// VoicePickerSheet: preserve the current 0.11.15 picker chrome while adding MY VOICE.
patch(
  'src/components/workspace/VoicePickerSheet.tsx',
  `import { recommendVoiceForScript } from '../../tts/voiceRecommendation'\nimport { VoicePreviewButton } from '../voice/VoicePreviewButton'`,
  `import { recommendVoiceForScript } from '../../tts/voiceRecommendation'\nimport type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'\nimport { buildVoiceChoices } from '../../voice/voiceChoices'\nimport { VoicePreviewButton } from '../voice/VoicePreviewButton'`,
  "import type { VoiceCloneProfile }",
)
patch(
  'src/components/workspace/VoicePickerSheet.tsx',
  `  previewPlaying: boolean\n  onClose: () => void`,
  `  previewPlaying: boolean\n  myVoiceProfiles?: VoiceCloneProfile[]\n  onClose: () => void`,
  'myVoiceProfiles?: VoiceCloneProfile[]',
)
patch(
  'src/components/workspace/VoicePickerSheet.tsx',
  `  activePreviewId,\n  previewPlaying,\n  onClose,`,
  `  activePreviewId,\n  previewPlaying,\n  myVoiceProfiles = [],\n  onClose,`,
  '  myVoiceProfiles = [],',
)
patch(
  'src/components/workspace/VoicePickerSheet.tsx',
  `  const [filter, setFilter] = useState<VoiceFilter>('all')\n  const recommendation = useMemo(`,
  `  const [filter, setFilter] = useState<VoiceFilter>('all')\n  const myVoices = useMemo(\n    () => buildVoiceChoices(myVoiceProfiles).filter((voice) => voice.kind === 'my-voice'),\n    [myVoiceProfiles],\n  )\n  const recommendation = useMemo(`,
  'const myVoices = useMemo(',
)
patch(
  'src/components/workspace/VoicePickerSheet.tsx',
  `        </header>\n        <div className="soa-sheet-tags" role="group" aria-label="목소리 성별 필터">`,
  `        </header>\n\n        {myVoices.length ? (\n          <section className="soa-voice-sheet-myvoices" aria-label="내 목소리">\n            <div className="soa-voice-sheet-section-title"><strong>MY VOICE</strong><span>내가 만든 {myVoices.length}개</span></div>\n            <div className="soa-voice-sheet-list is-my-voice" role="radiogroup" aria-label="내 목소리 선택">\n              {myVoices.map((voice) => {\n                const selected = voice.id === selectedId\n                return (\n                  <div key={voice.id} className={\`${'${selected ? \'is-selected\' : \'\'}'} is-my-voice\`.trim()}>\n                    <button\n                      type="button"\n                      role="radio"\n                      aria-checked={selected}\n                      className="soa-voice-sheet-choice"\n                      onClick={() => { onSelect(voice.id); onClose() }}\n                    >\n                      <span className="soa-voice-avatar soa-my-voice-tone" aria-hidden="true">{voice.shortName}</span>\n                      <span>\n                        <strong>{voice.name}<em>MY VOICE</em></strong>\n                        <small>{voice.description}</small>\n                        <span className="soa-voice-fit">{voice.meta}</span>\n                      </span>\n                    </button>\n                    <VoicePreviewButton\n                      className="soa-voice-sheet-preview"\n                      voiceId={voice.id}\n                      voiceName={voice.name}\n                      previewingId={previewingId}\n                      activePreviewId={activePreviewId}\n                      previewPlaying={previewPlaying}\n                      onPreview={onPreview}\n                      labelContext="내 목소리"\n                    />\n                    <span className="soa-voice-sheet-check" aria-hidden="true">{selected ? '✓' : ''}</span>\n                  </div>\n                )\n              })}\n            </div>\n          </section>\n        ) : (\n          <button type="button" className="soa-voice-sheet-empty-myvoice" onClick={() => { onClose(); onCreateVoice() }}>\n            <strong>MY VOICE</strong><span>내 목소리를 만들면 여기에 바로 나타납니다.</span><b>＋ 만들기</b>\n          </button>\n        )}\n\n        <div className="soa-voice-sheet-section-title"><strong>SoriON VOICES</strong><span>기본 성우</span></div>\n        <div className="soa-sheet-tags" role="group" aria-label="목소리 성별 필터">`,
  'soa-voice-sheet-myvoices',
)
patch(
  'src/components/workspace/VoicePickerSheet.tsx',
  `<div className="soa-voice-sheet-list" role="radiogroup" aria-label="목소리 선택">`,
  `<div className="soa-voice-sheet-list" role="radiogroup" aria-label="SoriON 목소리 선택">`,
  'aria-label="SoriON 목소리 선택"',
)

// Desktop voice drawer: keep current collapse/expand DOM and add a MY VOICE group.
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `import type { VoiceEmotion } from '../../ai/contracts'\nimport { VoicePreviewButton } from '../voice/VoicePreviewButton'\nimport { voicePresets } from '../../tts/voicePresets'`,
  `import { useMemo } from 'react'\nimport type { VoiceEmotion } from '../../ai/contracts'\nimport { VoicePreviewButton } from '../voice/VoicePreviewButton'\nimport { voicePresets } from '../../tts/voicePresets'\nimport type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'\nimport { buildVoiceChoices } from '../../voice/voiceChoices'`,
  "import { useMemo } from 'react'",
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `  normalizeText: boolean\n  onVoiceChange: (voiceId: string) => void`,
  `  normalizeText: boolean\n  myVoiceProfiles?: VoiceCloneProfile[]\n  onVoiceChange: (voiceId: string) => void`,
  'myVoiceProfiles?: VoiceCloneProfile[]',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `  emotion,\n  normalizeText,\n  onVoiceChange,`,
  `  emotion,\n  normalizeText,\n  myVoiceProfiles = [],\n  onVoiceChange,`,
  '  myVoiceProfiles = [],',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `  collapsed,\n  onToggleCollapsed,\n}: DesktopVoiceDrawerProps) {\n  return (`,
  `  collapsed,\n  onToggleCollapsed,\n}: DesktopVoiceDrawerProps) {\n  const myVoices = useMemo(\n    () => buildVoiceChoices(myVoiceProfiles).filter((voice) => voice.kind === 'my-voice'),\n    [myVoiceProfiles],\n  )\n  const myVoiceSelected = voiceId.startsWith('myvoice:')\n\n  return (`,
  'const myVoices = useMemo(',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `<p>목소리를 고르면 현재 선택한 타임라인 대사에도 바로 연결됩니다. ▶로 현재 설정을 미리듣습니다.</p>`,
  `<p>MY VOICE와 기본 성우를 고르면 현재 선택한 타임라인 대사에도 바로 연결됩니다.</p>`,
  'MY VOICE와 기본 성우를 고르면',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `          <div className="soa-voice-drawer__presets" role="radiogroup" aria-label="프리셋 목소리">`,
  `          {myVoices.length ? (\n            <section className="soa-voice-drawer__myvoices" aria-label="내 목소리">\n              <div className="soa-voice-drawer__section-title"><strong>MY VOICE</strong><span>{myVoices.length}</span></div>\n              <div className="soa-voice-drawer__presets" role="radiogroup" aria-label="내 목소리">\n                {myVoices.map((voice) => {\n                  const selected = voice.id === voiceId\n                  return (\n                    <article key={voice.id} className={\`${'${selected ? \'is-selected\' : \'\'}'} is-my-voice\`.trim()}>\n                      <button type="button" className="soa-voice-drawer__select" role="radio" aria-checked={selected} onClick={() => onVoiceChange(voice.id)}>\n                        <span className="soa-voice-avatar soa-my-voice-tone" aria-hidden="true">{voice.shortName}</span>\n                        <span><strong>{voice.name}<em>MY</em></strong><small>{voice.meta}</small></span>\n                      </button>\n                      <VoicePreviewButton\n                        className="soa-voice-drawer__play"\n                        voiceId={voice.id}\n                        voiceName={voice.name}\n                        previewingId={previewingId}\n                        activePreviewId={activePreviewId}\n                        previewPlaying={previewPlaying}\n                        onPreview={onPreview}\n                        labelContext="내 목소리"\n                      />\n                    </article>\n                  )\n                })}\n              </div>\n            </section>\n          ) : null}\n          <div className="soa-voice-drawer__section-title"><strong>SoriON VOICES</strong><span>{voicePresets.length}</span></div>\n          <div className="soa-voice-drawer__presets" role="radiogroup" aria-label="프리셋 목소리">`,
  'soa-voice-drawer__myvoices',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `<section className="soa-voice-drawer__settings" aria-label="음성 세부 설정">`,
  `<section className={\`soa-voice-drawer__settings ${'${myVoiceSelected ? \'is-my-voice\' : \'\'}'}\`} aria-label="음성 세부 설정">\n            {myVoiceSelected ? <p className="soa-myvoice-setting-note"><strong>MY VOICE 원본 톤 우선</strong><span>현재 내 목소리 생성은 녹음된 음색과 말투를 우선 사용합니다.</span></p> : null}`,
  'soa-myvoice-setting-note',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `                value={speed}\n                onChange={(event) => onSpeedChange(Number(event.target.value))}`,
  `                value={speed}\n                disabled={myVoiceSelected}\n                onChange={(event) => onSpeedChange(Number(event.target.value))}`,
  'disabled={myVoiceSelected}\n                onChange={(event) => onSpeedChange',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `                value={pitch}\n                onChange={(event) => onPitchChange(Number(event.target.value))}`,
  `                value={pitch}\n                disabled={myVoiceSelected}\n                onChange={(event) => onPitchChange(Number(event.target.value))}`,
  'disabled={myVoiceSelected}\n                onChange={(event) => onPitchChange',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `                    type="button"\n                    role="radio"\n                    aria-checked={emotion === item.id}`,
  `                    type="button"\n                    role="radio"\n                    disabled={myVoiceSelected}\n                    aria-checked={emotion === item.id}`,
  'role="radio"\n                    disabled={myVoiceSelected}',
)
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `＋ 새 보이스 만들기`,
  `＋ 내 목소리 만들기`,
  '＋ 내 목소리 만들기',
)

// Timeline editor: MY VOICE must be selectable for batch and single-clip editing.
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `import { getVoicePreset, voicePresets } from '../../tts/voicePresets'`,
  `import { voicePresets } from '../../tts/voicePresets'`,
  "import { voicePresets } from '../../tts/voicePresets'",
)
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `import { voicePresets } from '../../tts/voicePresets'`,
  `import { voicePresets } from '../../tts/voicePresets'\nimport { TimelineVoiceSelect, type TimelineVoiceOption } from './TimelineVoiceSelect'`,
  "import { TimelineVoiceSelect",
)
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `  activeVoiceName?: string\n}`,
  `  activeVoiceName?: string\n  voiceOptions?: TimelineVoiceOption[]\n}`,
  'voiceOptions?: TimelineVoiceOption[]',
)
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `  onSelectionChange,\n  activeVoiceName,\n}: TimelineEditorProps) {`,
  `  onSelectionChange,\n  activeVoiceName,\n  voiceOptions = voicePresets.map((voice) => ({ id: voice.id, name: voice.name, group: 'preset' as const })),\n}: TimelineEditorProps) {`,
  "voiceOptions = voicePresets.map",
)
insertAfter(
  'src/components/workspace/TimelineEditor.tsx',
  `  const batchRetryLimitReached = batchRetryCount >= BATCH_RETRY_LIMIT\n`,
  `\n  useEffect(() => {\n    if (voiceOptions.some((voice) => voice.id === batchVoiceId)) return\n    setBatchVoiceId(voiceOptions[0]?.id ?? voicePresets[0].id)\n  }, [batchVoiceId, voiceOptions])\n`,
  'if (voiceOptions.some((voice) => voice.id === batchVoiceId))',
)
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `  const batchVoice = getVoicePreset(batchVoiceId)`,
  `  const batchVoice = voiceOptions.find((voice) => voice.id === batchVoiceId) ?? voiceOptions[0] ?? { id: voicePresets[0].id, name: voicePresets[0].name }`,
  'const batchVoice = voiceOptions.find',
)
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `            <label>\n              <span>일괄 목소리</span>\n              <select\n                aria-label="선택 클립 일괄 목소리"\n                value={batchVoiceId}\n                disabled={!selectedVoiceBlocks.length || selectedGeneratingVoiceCount > 0}\n                onChange={(event) => {\n                  setBatchVoiceId(event.target.value)\n                  setBatchPreviewOpen(false)\n                }}\n              >\n                {voicePresets.map((voice) => (\n                  <option key={voice.id} value={voice.id}>{voice.name}</option>\n                ))}\n              </select>\n            </label>`,
  `            <TimelineVoiceSelect\n              label="일괄 목소리"\n              ariaLabel="선택 클립 일괄 목소리"\n              value={batchVoiceId}\n              options={voiceOptions}\n              disabled={!selectedVoiceBlocks.length || selectedGeneratingVoiceCount > 0}\n              onChange={(nextVoiceId) => {\n                setBatchVoiceId(nextVoiceId)\n                setBatchPreviewOpen(false)\n              }}\n            />`,
  '<TimelineVoiceSelect\n              label="일괄 목소리"',
)
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `              <label className="soa-timeline-voice-link">\n                <span>클립 목소리</span>\n                <select\n                  aria-label="선택 클립 목소리"\n                  value={selectedVoiceBlock.voiceId}\n                  disabled={selectedVoiceBlock.status === 'generating' || !onBatchVoiceChange}\n                  onChange={(event) => void onBatchVoiceChange?.([selectedVoiceBlock.id], event.target.value, false)}\n                >\n                  {voicePresets.map((voice) => (\n                    <option key={voice.id} value={voice.id}>{voice.name}</option>\n                  ))}\n                </select>\n                <small>목소리를 바꾸면 기존 완성 음원은 안전하게 해제되고 재생성 대기 상태가 됩니다.</small>\n              </label>`,
  `              <TimelineVoiceSelect\n                className="soa-timeline-voice-link"\n                label="클립 목소리"\n                ariaLabel="선택 클립 목소리"\n                value={selectedVoiceBlock.voiceId}\n                options={voiceOptions}\n                disabled={selectedVoiceBlock.status === 'generating' || !onBatchVoiceChange}\n                help="목소리를 바꾸면 기존 완성 음원은 안전하게 해제되고 재생성 대기 상태가 됩니다."\n                onChange={(nextVoiceId) => void onBatchVoiceChange?.([selectedVoiceBlock.id], nextVoiceId, false)}\n              />`,
  '<TimelineVoiceSelect\n                className="soa-timeline-voice-link"',
)

// Timeline generation: route myvoice:<profileId> through the existing voice-clone job API.
patch(
  'src/hooks/useTimelineGeneration.ts',
  `} from '../tts/voiceApi'\nimport type { PersistedTimelineBlock } from '../workspace/sessionTypes'`,
  `} from '../tts/voiceApi'\nimport { getMyVoiceProfileId } from '../voiceclone/voiceIdentity'\nimport { synthesizeVoiceCloneProfile } from '../voiceclone/voiceCloneSynthesis'\nimport type { PersistedTimelineBlock } from '../workspace/sessionTypes'`,
  "import { getMyVoiceProfileId }",
)
patch(
  'src/hooks/useTimelineGeneration.ts',
  `      let jobId = block.jobId\n      let result: TtsSynthesisResult | null = null\n      if (jobId) {`,
  `      let jobId = block.jobId\n      let result: TtsSynthesisResult | null = null\n      const myVoiceProfileId = getMyVoiceProfileId(block.voiceId)\n\n      if (myVoiceProfileId) {\n        acceptingProgressiveSegments = false\n        result = await synthesizeVoiceCloneProfile({\n          profileId: myVoiceProfileId,\n          text: block.text,\n          existingJobId: jobId,\n          allowStart: allowSynthesis,\n          signal: controller.signal,\n          onJobId: (nextJobId) => {\n            jobId = nextJobId\n            activeJobId = nextJobId\n            updateVoiceBlock(blockId, { jobId: nextJobId }, revision)\n          },\n          onProgress: (progress) => {\n            activeJobId = progress.jobId\n            updateVoiceBlock(blockId, {\n              jobId: progress.jobId,\n              progress: Math.max(8, progress.progress),\n            }, revision)\n          },\n        })\n        if (!result) {\n          updateVoiceBlock(blockId, {\n            status: 'queued',\n            progress: 0,\n            error: '내 목소리 생성 결과를 복원하지 못했습니다. 다시 생성을 눌러 주세요.',\n          }, revision)\n          return null\n        }\n        jobId = result.jobId\n        activeJobId = result.jobId\n      } else if (jobId) {`,
  'const myVoiceProfileId = getMyVoiceProfileId(block.voiceId)',
)
// Close the generic-only branch before the synthesis fallback.
patch(
  'src/hooks/useTimelineGeneration.ts',
  `      if (!result && !allowSynthesis) {\n        updateVoiceBlock(blockId, {\n          status: 'queued',\n          progress: 0,\n          error: '저장된 음원 결과를 찾지 못했습니다. 다시 생성을 눌러 주세요.',\n        }, revision)\n        return null\n      }\n      if (!result) {`,
  `      if (!myVoiceProfileId && !result && !allowSynthesis) {\n        updateVoiceBlock(blockId, {\n          status: 'queued',\n          progress: 0,\n          error: '저장된 음원 결과를 찾지 못했습니다. 다시 생성을 눌러 주세요.',\n        }, revision)\n        return null\n      }\n      if (!myVoiceProfileId && !result) {`,
  'if (!myVoiceProfileId && !result && !allowSynthesis)',
)
patch(
  'src/hooks/useTimelineGeneration.ts',
  `      acceptingProgressiveSegments = false\n      const latestBlock = blocksRef.current.find((item) => item.id === blockId)`,
  `      if (!result) throw new Error('음성 생성 결과가 없습니다.')\n      acceptingProgressiveSegments = false\n      const latestBlock = blocksRef.current.find((item) => item.id === blockId)`,
  "if (!result) throw new Error('음성 생성 결과가 없습니다.')",
)
patch(
  'src/hooks/useTimelineGeneration.ts',
  `          rehydration: { kind: 'tts-final', jobId: result.jobId },`,
  `          ...(myVoiceProfileId ? {} : { rehydration: { kind: 'tts-final' as const, jobId: result.jobId } }),`,
  '...(myVoiceProfileId ? {} : { rehydration:',
)

// HomePage: one selected voice state now drives library, Timeline, preview, generation and Live Voice Bar.
patch(
  'src/pages/HomePage.tsx',
  `import { useEngineCatalog } from '../hooks/useEngineCatalog'`,
  `import { useEngineCatalog } from '../hooks/useEngineCatalog'\nimport { useMyVoiceProfiles } from '../hooks/useMyVoiceProfiles'`,
  "import { useMyVoiceProfiles }",
)
patch(
  'src/pages/HomePage.tsx',
  `import { getVoicePreset, voicePresets } from '../tts/voicePresets'\nimport { clampVoiceSettingsToNaturalRange } from '../tts/voiceRecommendation'`,
  `import { getVoicePreset, voicePresets } from '../tts/voicePresets'\nimport { buildVoiceChoices, resolveVoiceChoice } from '../voice/voiceChoices'\nimport { getMyVoiceProfileId, isMyVoiceId } from '../voiceclone/voiceIdentity'\nimport { synthesizeVoiceCloneProfile } from '../voiceclone/voiceCloneSynthesis'\nimport { clampVoiceSettingsToNaturalRange } from '../tts/voiceRecommendation'`,
  "import { buildVoiceChoices, resolveVoiceChoice }",
)
patch(
  'src/pages/HomePage.tsx',
  `  voiceName: string,\n): GeneratedAudio {`,
  `  voiceName: string,\n  rehydratable = true,\n): GeneratedAudio {`,
  'rehydratable = true',
)
patch(
  'src/pages/HomePage.tsx',
  `      rehydration: { kind: 'tts-final', jobId: result.jobId },`,
  `      ...(rehydratable ? { rehydration: { kind: 'tts-final' as const, jobId: result.jobId } } : {}),`,
  '...(rehydratable ? { rehydration:',
)
patch(
  'src/pages/HomePage.tsx',
  `  const startNewWorkspace = useAppStore((state) => state.startNewWorkspace)\n  const enqueueAndPlay`,
  `  const startNewWorkspace = useAppStore((state) => state.startNewWorkspace)\n  const setLiveVoice = useAppStore((state) => state.setLiveVoice)\n  const enqueueAndPlay`,
  'const setLiveVoice = useAppStore',
)
patch(
  'src/pages/HomePage.tsx',
  `  const timelineSelectionIdsRef = useRef<string[]>([])\n  const engineCatalog = useEngineCatalog()\n  const timeline = useTimelineGeneration()`,
  `  const timelineSelectionIdsRef = useRef<string[]>([])\n  const engineCatalog = useEngineCatalog()\n  const { profiles: myVoiceProfiles, loading: myVoiceProfilesLoading } = useMyVoiceProfiles()\n  const timeline = useTimelineGeneration()`,
  'profiles: myVoiceProfiles',
)
patch(
  'src/pages/HomePage.tsx',
  `  const selectedVoice = useMemo(() => getVoicePreset(voiceId), [voiceId])`,
  `  const selectedVoice = useMemo(() => resolveVoiceChoice(myVoiceProfiles, voiceId), [myVoiceProfiles, voiceId])\n  const selectedPreset = useMemo(() => getVoicePreset(isMyVoiceId(voiceId) ? voicePresets[0].id : voiceId), [voiceId])\n  const timelineVoiceOptions = useMemo(() => buildVoiceChoices(myVoiceProfiles).map((voice) => ({\n    id: voice.id,\n    name: voice.name,\n    group: voice.kind,\n  })), [myVoiceProfiles])`,
  'const timelineVoiceOptions = useMemo',
)
patch(
  'src/pages/HomePage.tsx',
  `  const engineAvailable = (\n    (backendStatus === 'online' || backendStatus === 'degraded')\n    && engineCatalog.selected !== null\n  )\n  const selectedEngineId = engineCatalog.selected?.mode === 'browser'`,
  `  const engineAvailable = (\n    (backendStatus === 'online' || backendStatus === 'degraded')\n    && engineCatalog.selected !== null\n  )\n  const generationAvailable = selectedVoice.kind === 'my-voice'\n    ? selectedVoice.ready && (backendStatus === 'online' || backendStatus === 'degraded')\n    : engineAvailable\n  const selectedEngineId = engineCatalog.selected?.mode === 'browser'`,
  'const generationAvailable = selectedVoice.kind',
)
insertAfter(
  'src/pages/HomePage.tsx',
  `  const selectedEngineId = engineCatalog.selected?.mode === 'browser'\n    ? engineCatalog.selected.id\n    : 'auto'\n`,
  `  useEffect(() => {\n    const selectedMyVoice = selectedVoice.kind === 'my-voice'\n    const readiness = busy\n      ? 'generating'\n      : selectedMyVoice\n        ? selectedVoice.profile?.status !== 'engine-ready'\n          ? 'limited'\n          : backendStatus === 'checking' || backendStatus === 'unknown'\n            ? 'checking'\n            : backendStatus === 'online'\n              ? 'ready'\n              : backendStatus === 'degraded'\n                ? 'limited'\n                : 'offline'\n        : engineCatalog.loading || backendStatus === 'checking' || backendStatus === 'unknown'\n          ? 'checking'\n          : backendStatus === 'degraded'\n            ? 'limited'\n            : engineAvailable\n              ? 'ready'\n              : 'offline'\n    const engineName = selectedMyVoice\n      ? (selectedVoice.profile?.engineId === 'cosyvoice3-worker' ? 'CosyVoice 3' : selectedVoice.profile?.engineId ?? 'My Voice Engine')\n      : engineCatalog.selected?.name ?? '자동 엔진'\n    const detail = busy\n      ? '타임라인 음성을 생성하고 있습니다.'\n      : selectedMyVoice\n        ? selectedVoice.profile?.status === 'engine-ready'\n          ? '내 샘플과 TTS/Timeline이 연결됨'\n          : '샘플 저장됨 · 생성 엔진 연결 필요'\n        : \`${'${selectedPreset.badge}'} · ${'${selectedPreset.tags.slice(0, 2).join(\' · \')}'}\`\n    setLiveVoice({\n      voiceId: selectedVoice.id,\n      voiceName: selectedVoice.name,\n      voiceKind: selectedVoice.kind,\n      engineId: selectedMyVoice ? selectedVoice.profile?.engineId ?? null : engineCatalog.selected?.id ?? null,\n      engineName,\n      readiness,\n      detail,\n    })\n  }, [backendStatus, busy, engineAvailable, engineCatalog.loading, engineCatalog.selected, selectedPreset.badge, selectedPreset.tags, selectedVoice, setLiveVoice])\n`,
  'voiceKind: selectedVoice.kind',
)
insertAfter(
  'src/pages/HomePage.tsx',
  `  const multiSpeakerAnalysis = useMemo(\n    () => analyzeMultiSpeakerScript(composerDraft),\n    [composerDraft],\n  )\n`,
  `  useEffect(() => {\n    if (myVoiceProfilesLoading || !isMyVoiceId(voiceId)) return\n    if (getMyVoiceProfileId(voiceId) && selectedVoice.kind === 'my-voice') return\n    setVoiceId(voicePresets[0].id)\n    showNotice('선택했던 내 목소리를 찾지 못해 기본 목소리로 전환했습니다.')\n  }, [myVoiceProfilesLoading, selectedVoice.kind, showNotice, voiceId])\n`,
  '선택했던 내 목소리를 찾지 못해',
)
patch(
  'src/pages/HomePage.tsx',
  `        multiSpeakerAnalysis.speakers,\n        voiceId,\n        voicePresets,`,
  `        multiSpeakerAnalysis.speakers,\n        isMyVoiceId(voiceId) ? voicePresets[0].id : voiceId,\n        voicePresets,`,
  `multiSpeakerAnalysis.speakers,\n        isMyVoiceId(voiceId) ? voicePresets[0].id : voiceId`,
)
patch(
  'src/pages/HomePage.tsx',
  `    setVoiceId(getVoicePreset(session.voiceId).id)`,
  `    setVoiceId(isMyVoiceId(session.voiceId) ? session.voiceId : getVoicePreset(session.voiceId).id)`,
  'setVoiceId(isMyVoiceId(session.voiceId)',
)
patch(
  'src/pages/HomePage.tsx',
  `  useEffect(() => {\n    if (!activeProject) return\n    setPendingGeneration(null)`,
  `  useEffect(() => {\n    if (!activeProject || (isMyVoiceId(activeProject.voiceId) && myVoiceProfilesLoading)) return\n    setPendingGeneration(null)`,
  'isMyVoiceId(activeProject.voiceId) && myVoiceProfilesLoading',
)
patch(
  'src/pages/HomePage.tsx',
  `    const voice = getVoicePreset(activeProject.voiceId)`,
  `    const voice = resolveVoiceChoice(myVoiceProfiles, activeProject.voiceId)`,
  'resolveVoiceChoice(myVoiceProfiles, activeProject.voiceId)',
)
patch(
  'src/pages/HomePage.tsx',
  `  }, [activeProject, clearActiveProject, restoreProject])`,
  `  }, [activeProject, clearActiveProject, myVoiceProfiles, myVoiceProfilesLoading, restoreProject])`,
  'myVoiceProfilesLoading, restoreProject',
)
patch(
  'src/pages/HomePage.tsx',
  `    if (!engineAvailable || pendingRecoveryIds.length === 0) return`,
  `    if (!generationAvailable || pendingRecoveryIds.length === 0) return`,
  'if (!generationAvailable || pendingRecoveryIds.length === 0)',
)
patch(
  'src/pages/HomePage.tsx',
  `  }, [engineAvailable, pendingRecoveryIds, recoverBlocks])`,
  `  }, [generationAvailable, pendingRecoveryIds, recoverBlocks])`,
  '[generationAvailable, pendingRecoveryIds, recoverBlocks]',
)
patch(
  'src/pages/HomePage.tsx',
  `    engineId: selectedEngineId,`,
  `    engineId: selectedVoice.kind === 'my-voice' ? (selectedVoice.profile?.engineId ?? 'cosyvoice3-worker') : selectedEngineId,`,
  "engineId: selectedVoice.kind === 'my-voice'",
)
patch(
  'src/pages/HomePage.tsx',
  `  }), [normalizeText, selectedEngineId, selectedVoice.name, speechEmotion, speechPitch, speechSpeed, voiceId])`,
  `  }), [normalizeText, selectedEngineId, selectedVoice.kind, selectedVoice.name, selectedVoice.profile?.engineId, speechEmotion, speechPitch, speechSpeed, voiceId])`,
  'selectedVoice.profile?.engineId, speechEmotion',
)
patch(
  'src/pages/HomePage.tsx',
  `    if (!engineAvailable || !pendingGeneration || busy) return`,
  `    if (!generationAvailable || !pendingGeneration || busy) return`,
  'if (!generationAvailable || !pendingGeneration || busy)',
)
patch(
  'src/pages/HomePage.tsx',
  `  }, [busy, engineAvailable, generateLongform, pendingGeneration])`,
  `  }, [busy, generateLongform, generationAvailable, pendingGeneration])`,
  '[busy, generateLongform, generationAvailable, pendingGeneration]',
)
patch(
  'src/pages/HomePage.tsx',
  `  async function handleLongformSubmit(value: string) {\n    const options = buildOptions()`,
  `  async function handleLongformSubmit(value: string) {\n    if (selectedVoice.kind === 'my-voice' && !selectedVoice.ready) {\n      showNotice('이 MY VOICE는 아직 생성 엔진 준비가 필요합니다. 내 목소리에서 준비 상태를 확인해 주세요.')\n      return\n    }\n    const options = buildOptions()`,
  "async function handleLongformSubmit(value: string) {\n    if (selectedVoice.kind === 'my-voice'",
)
patch(
  'src/pages/HomePage.tsx',
  `    if (!engineAvailable) {\n      setPendingGeneration(pending)`,
  `    if (!generationAvailable) {\n      if (selectedVoice.kind === 'my-voice' && !selectedVoice.ready) {\n        showNotice('이 MY VOICE는 아직 생성 엔진 준비가 필요합니다. 내 목소리에서 준비 상태를 확인해 주세요.')\n        return\n      }\n      setPendingGeneration(pending)`,
  "if (!generationAvailable) {\n      if (selectedVoice.kind === 'my-voice'",
)
patch(
  'src/pages/HomePage.tsx',
  `    if (!engineAvailable) {\n      setPendingGeneration(resumeGeneration)`,
  `    if (!generationAvailable) {\n      setPendingGeneration(resumeGeneration)`,
  'if (!generationAvailable) {\n      setPendingGeneration(resumeGeneration)',
)
// Replace selectVoice after the phase-1 timeline linkage patch.
patch(
  'src/pages/HomePage.tsx',
  `  const selectVoice = useCallback((nextVoiceId: string) => {\n    previewRunIdRef.current += 1\n    setPendingPreview(null)\n    setPreviewingId(null)\n    const voice = getVoicePreset(nextVoiceId)\n    setVoiceId(voice.id)\n    setSpeechSpeed((current) => clampVoiceSettingsToNaturalRange(voice, current, speechPitch).speed)\n    setSpeechPitch((current) => clampVoiceSettingsToNaturalRange(voice, speechSpeed, current).pitch)\n    const selectedTimelineIds = timelineSelectionIdsRef.current\n    if (selectedTimelineIds.length > 0) {\n      timeline.updateVoiceMany(selectedTimelineIds, voice.id, voice.name)\n      showNotice(\`선택한 ${'${selectedTimelineIds.length}'}개 대사에 ${'${voice.name}'} 목소리를 연결했습니다.\`)\n    }\n  }, [showNotice, speechPitch, speechSpeed, timeline.updateVoiceMany])`,
  `  const selectVoice = useCallback((nextVoiceId: string) => {\n    previewRunIdRef.current += 1\n    setPendingPreview(null)\n    setPreviewingId(null)\n    const voice = resolveVoiceChoice(myVoiceProfiles, nextVoiceId)\n    setVoiceId(voice.id)\n    if (voice.kind === 'preset') {\n      const preset = getVoicePreset(voice.id)\n      setSpeechSpeed((current) => clampVoiceSettingsToNaturalRange(preset, current, speechPitch).speed)\n      setSpeechPitch((current) => clampVoiceSettingsToNaturalRange(preset, speechSpeed, current).pitch)\n    } else {\n      setSpeechSpeed(1)\n      setSpeechPitch(0)\n      setSpeechEmotion('neutral')\n    }\n    const selectedTimelineIds = timelineSelectionIdsRef.current\n    if (selectedTimelineIds.length > 0) {\n      timeline.updateVoiceMany(selectedTimelineIds, voice.id, voice.name)\n      showNotice(\`선택한 ${'${selectedTimelineIds.length}'}개 대사에 ${'${voice.name}'} 목소리를 연결했습니다.\`)\n    } else if (voice.kind === 'my-voice') {\n      showNotice(\`${'${voice.name}'}을(를) 다음 대사의 기본 MY VOICE로 연결했습니다.\`)\n    }\n  }, [myVoiceProfiles, showNotice, speechPitch, speechSpeed, timeline.updateVoiceMany])`,
  'resolveVoiceChoice(myVoiceProfiles, nextVoiceId)',
)
patch(
  'src/pages/HomePage.tsx',
  `    const voice = getVoicePreset(nextVoiceId)\n    const runId = previewRunIdRef.current + 1`,
  `    const voice = resolveVoiceChoice(myVoiceProfiles, nextVoiceId)\n    const myVoiceProfileId = getMyVoiceProfileId(nextVoiceId)\n    const runId = previewRunIdRef.current + 1`,
  'const myVoiceProfileId = getMyVoiceProfileId(nextVoiceId)',
)
insertAfter(
  'src/pages/HomePage.tsx',
  `    setPreviewingId(nextVoiceId)\n`,
  `    if (myVoiceProfileId && !voice.ready) {\n      setPreviewingId(null)\n      showNotice('이 MY VOICE는 아직 엔진 준비가 필요합니다. 내 목소리 페이지에서 상태를 확인해 주세요.')\n      return\n    }\n`,
  '이 MY VOICE는 아직 엔진 준비가 필요합니다',
)
patch(
  'src/pages/HomePage.tsx',
  `    if (!engineAvailable || !engineCatalog.selected) {`,
  `    if (!myVoiceProfileId && (!engineAvailable || !engineCatalog.selected)) {`,
  '!myVoiceProfileId && (!engineAvailable || !engineCatalog.selected)',
)
patch(
  'src/pages/HomePage.tsx',
  `        engineId: selectedEngineId,`,
  `        engineId: myVoiceProfileId ? (voice.profile?.engineId ?? 'cosyvoice3-worker') : selectedEngineId,`,
  'engineId: myVoiceProfileId ? (voice.profile?.engineId',
)
patch(
  'src/pages/HomePage.tsx',
  `      const result = await synthesizeSpeech(request, createRandomId())\n      if (previewRunIdRef.current !== runId) return\n      const audio = generatedPreview(result, request, voice.name)`,
  `      const result = myVoiceProfileId\n        ? await synthesizeVoiceCloneProfile({ profileId: myVoiceProfileId, text })\n        : await synthesizeSpeech(request, createRandomId())\n      if (!result) throw new Error('내 목소리 생성 결과가 없습니다.')\n      if (previewRunIdRef.current !== runId) return\n      const audio = generatedPreview(result, request, voice.name, !myVoiceProfileId)`,
  'await synthesizeVoiceCloneProfile({ profileId: myVoiceProfileId, text })',
)
patch(
  'src/pages/HomePage.tsx',
  `        badge: audio.source === 'browser-speech'`,
  `        badge: myVoiceProfileId ? 'MY VOICE' : audio.source === 'browser-speech'`,
  "badge: myVoiceProfileId ? 'MY VOICE'",
)
patch(
  'src/pages/HomePage.tsx',
  `    engineCatalog.selected,\n    enqueueAndPlay,`,
  `    engineCatalog.selected,\n    myVoiceProfiles,\n    showNotice,\n    enqueueAndPlay,`,
  'engineCatalog.selected,\n    myVoiceProfiles,\n    showNotice,\n    enqueueAndPlay',
)
patch(
  'src/pages/HomePage.tsx',
  `    const ready = Boolean(\n      engineAvailable\n      && engineCatalog.selected\n      && previewingId === pendingPreview.voiceId\n    )`,
  `    const pendingIsMyVoice = isMyVoiceId(pendingPreview.voiceId)\n    const ready = Boolean(\n      previewingId === pendingPreview.voiceId\n      && (pendingIsMyVoice ? backendStatus !== 'offline' : engineAvailable && engineCatalog.selected)\n    )`,
  'const pendingIsMyVoice = isMyVoiceId',
)
patch(
  'src/pages/HomePage.tsx',
  `  }, [engineAvailable, engineCatalog.selected, pendingPreview, previewVoice, previewingId])`,
  `  }, [backendStatus, engineAvailable, engineCatalog.selected, pendingPreview, previewVoice, previewingId])`,
  '[backendStatus, engineAvailable, engineCatalog.selected, pendingPreview',
)
patch(
  'src/pages/HomePage.tsx',
  `  async function retryBlock(id: string) {\n    if (!engineAvailable) {`,
  `  async function retryBlock(id: string) {\n    const block = timeline.blocks.find((item) => item.id === id)\n    const customVoice = block?.kind === 'voice' && isMyVoiceId(block.voiceId)\n    if ((!customVoice && !engineAvailable) || (customVoice && backendStatus === 'offline')) {`,
  'const customVoice = block?.kind',
)
patch(
  'src/pages/HomePage.tsx',
  `                  engine={engineCatalog.selected}\n                  onVoiceChange={selectVoice}`,
  `                  engine={engineCatalog.selected}\n                  myVoiceProfiles={myVoiceProfiles}\n                  onVoiceChange={selectVoice}`,
  'engine={engineCatalog.selected}\n                  myVoiceProfiles={myVoiceProfiles}',
)
patch(
  'src/pages/HomePage.tsx',
  `                const voice = getVoicePreset(nextVoiceId)\n                timeline.updateVoiceMany(ids, voice.id, voice.name)`,
  `                timelineSelectionIdsRef.current = ids\n                selectVoice(nextVoiceId)`,
  'timelineSelectionIdsRef.current = ids\n                selectVoice(nextVoiceId)',
)
patch(
  'src/pages/HomePage.tsx',
  `              activeVoiceName={selectedVoice.name}\n              onSelectionChange=`,
  `              activeVoiceName={selectedVoice.name}\n              voiceOptions={timelineVoiceOptions}\n              onSelectionChange=`,
  'voiceOptions={timelineVoiceOptions}',
)
patch(
  'src/pages/HomePage.tsx',
  `          normalizeText={normalizeText}\n          onVoiceChange={selectVoice}`,
  `          normalizeText={normalizeText}\n          myVoiceProfiles={myVoiceProfiles}\n          onVoiceChange={selectVoice}`,
  'normalizeText={normalizeText}\n          myVoiceProfiles={myVoiceProfiles}',
)

// CSS: import the new layers after current 0.11.15 polish so Live Voice wins the cascade.
const stylesPath = target('src/styles/index.css')
let styles = fs.readFileSync(stylesPath, 'utf8')
if (!styles.includes('@import "./live-voice-bar.css";')) {
  const anchor = '@import "./pc-editor-polish.css";'
  const fallback = '@import "./my-voice-lab.css";'
  if (styles.includes(anchor)) {
    styles = styles.replace(anchor, `${anchor}\n@import "./live-voice-bar.css";\n@import "./my-voice-library-bridge.css";`)
  } else if (styles.includes(fallback)) {
    styles = styles.replace(fallback, `${fallback}\n@import "./live-voice-bar.css";\n@import "./my-voice-library-bridge.css";`)
  } else {
    throw new Error('Style import anchor not found in src/styles/index.css')
  }
  fs.writeFileSync(stylesPath, styles)
  console.log('patch src/styles/index.css')
} else {
  console.log('skip src/styles/index.css (live voice styles already imported)')
}

console.log('\nLive Voice + MY VOICE bridge patches applied successfully.')
