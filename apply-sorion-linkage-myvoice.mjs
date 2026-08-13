import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function file(relative) {
  return path.join(root, relative)
}

function patch(relative, search, replacement, marker) {
  const target = file(relative)
  if (!fs.existsSync(target)) throw new Error(`Missing ${relative}`)
  const source = fs.readFileSync(target, 'utf8')
  if (marker && source.includes(marker)) {
    console.log(`skip ${relative} (already patched)`)
    return
  }
  if (!source.includes(search)) {
    throw new Error(`Patch context not found in ${relative}`)
  }
  fs.writeFileSync(target, source.replace(search, replacement))
  console.log(`patch ${relative}`)
}

// 1) Timeline selection becomes visible to HomePage and Voice Library selection applies to it.
patch(
  'src/components/workspace/TimelineEditor.tsx',
  `  onRedo?: () => boolean | void\n}`,
  `  onRedo?: () => boolean | void\n  onSelectionChange?: (voiceBlockIds: string[]) => void\n  activeVoiceName?: string\n}`,
  'onSelectionChange?: (voiceBlockIds: string[]) => void',
)

patch(
  'src/components/workspace/TimelineEditor.tsx',
  `  onUndo,\n  onRedo,\n}: TimelineEditorProps) {`,
  `  onUndo,\n  onRedo,\n  onSelectionChange,\n  activeVoiceName,\n}: TimelineEditorProps) {`,
  '  onSelectionChange,\n  activeVoiceName,',
)

patch(
  'src/components/workspace/TimelineEditor.tsx',
  `  const selectedVoiceIdKey = selectedVoiceIds.join('|')\n  const selectedIdKey = selectedIds.join('|')`,
  `  const selectedVoiceIdKey = selectedVoiceIds.join('|')\n  const selectedIdKey = selectedIds.join('|')\n  useEffect(() => {\n    onSelectionChange?.(selectedVoiceIdKey ? selectedVoiceIdKey.split('|') : [])\n  }, [onSelectionChange, selectedVoiceIdKey])`,
  'onSelectionChange?.(selectedVoiceIdKey',
)

patch(
  'src/components/workspace/TimelineEditor.tsx',
  `          {selectedVoiceBlock ? (\n            <>\n              <textarea`,
  `          {selectedVoiceBlock ? (\n            <>\n              <label className="soa-timeline-voice-link">\n                <span>클립 목소리</span>\n                <select\n                  aria-label="선택 클립 목소리"\n                  value={selectedVoiceBlock.voiceId}\n                  disabled={selectedVoiceBlock.status === 'generating' || !onBatchVoiceChange}\n                  onChange={(event) => void onBatchVoiceChange?.([selectedVoiceBlock.id], event.target.value, false)}\n                >\n                  {voicePresets.map((voice) => (\n                    <option key={voice.id} value={voice.id}>{voice.name}</option>\n                  ))}\n                </select>\n                <small>목소리를 바꾸면 기존 완성 음원은 안전하게 해제되고 재생성 대기 상태가 됩니다.</small>\n              </label>\n              <textarea`,
  'className="soa-timeline-voice-link"',
)

patch(
  'src/components/workspace/TimelineEditor.tsx',
  `          <div className="soa-capcut-track-label">\n            <strong>VOICE 1</strong>\n            <small>대사 트랙</small>\n            <span>{playbackActive ? '재생 중' : '편집 준비'}</span>\n            <em>시간 →</em>\n          </div>`,
  `          <div className="soa-capcut-track-label">\n            <strong>{selectedVoiceBlock?.voiceName ?? (selectedVoiceBlocks.length > 1 ? \`${'${new Set(selectedVoiceBlocks.map((block) => block.voiceId)).size}'} VOICES\` : activeVoiceName ?? 'VOICE 1')}</strong>\n            <small>{selectedVoiceBlocks.length > 1 ? \`${'${selectedVoiceBlocks.length}'}개 선택 · 대사 트랙\` : '현재 목소리 · 대사 트랙'}</small>\n            <span>{playbackActive ? '재생 중' : selectedVoiceBlock ? '선택 클립 연결' : '라이브러리 연결'}</span>\n            <em>시간 →</em>\n          </div>`,
  "'라이브러리 연결'",
)

// 2) HomePage keeps the current timeline voice selection and applies library changes to it.
patch(
  'src/pages/HomePage.tsx',
  `  const explicitWorkspaceActionRef = useRef(false)\n  const previewRunIdRef = useRef(0)`,
  `  const explicitWorkspaceActionRef = useRef(false)\n  const previewRunIdRef = useRef(0)\n  const timelineSelectionIdsRef = useRef<string[]>([])`,
  'timelineSelectionIdsRef = useRef<string[]>([])',
)

patch(
  'src/pages/HomePage.tsx',
  `  const selectVoice = useCallback((nextVoiceId: string) => {\n    previewRunIdRef.current += 1\n    setPendingPreview(null)\n    setPreviewingId(null)\n    const voice = getVoicePreset(nextVoiceId)\n    setVoiceId(voice.id)\n    setSpeechSpeed((current) => clampVoiceSettingsToNaturalRange(voice, current, speechPitch).speed)\n    setSpeechPitch((current) => clampVoiceSettingsToNaturalRange(voice, speechSpeed, current).pitch)\n  }, [speechPitch, speechSpeed])`,
  `  const selectVoice = useCallback((nextVoiceId: string) => {\n    previewRunIdRef.current += 1\n    setPendingPreview(null)\n    setPreviewingId(null)\n    const voice = getVoicePreset(nextVoiceId)\n    setVoiceId(voice.id)\n    setSpeechSpeed((current) => clampVoiceSettingsToNaturalRange(voice, current, speechPitch).speed)\n    setSpeechPitch((current) => clampVoiceSettingsToNaturalRange(voice, speechSpeed, current).pitch)\n    const selectedTimelineIds = timelineSelectionIdsRef.current\n    if (selectedTimelineIds.length > 0) {\n      timeline.updateVoiceMany(selectedTimelineIds, voice.id, voice.name)\n      showNotice(\`선택한 ${'${selectedTimelineIds.length}'}개 대사에 ${'${voice.name}'} 목소리를 연결했습니다.\`)\n    }\n  }, [showNotice, speechPitch, speechSpeed, timeline.updateVoiceMany])`,
  '선택한 ${selectedTimelineIds.length}개 대사에',
)

patch(
  'src/pages/HomePage.tsx',
  `              onRedo={timeline.redoEdit}\n            />`,
  `              onRedo={timeline.redoEdit}\n              activeVoiceName={selectedVoice.name}\n              onSelectionChange={(ids) => {\n                timelineSelectionIdsRef.current = ids\n              }}\n            />`,
  'activeVoiceName={selectedVoice.name}',
)

// Clarify that the desktop drawer is linked to the selected timeline clip.
patch(
  'src/components/workspace/DesktopVoiceDrawer.tsx',
  `<p>목소리와 말투를 고른 뒤 ▶를 누르면 현재 설정으로 미리듣습니다.</p>`,
  `<p>목소리를 고르면 현재 선택한 타임라인 대사에도 바로 연결됩니다. ▶로 현재 설정을 미리듣습니다.</p>`,
  '현재 선택한 타임라인 대사에도 바로 연결됩니다',
)

patch(
  'src/components/workspace/VoiceLibrary.tsx',
  `<p>선택하면 짧은 프리뷰를 만들고 다음 블록부터 적용합니다.</p>`,
  `<p>선택한 타임라인 대사가 있으면 즉시 연결하고, 없으면 다음 대사의 기본 목소리로 사용합니다.</p>`,
  '선택한 타임라인 대사가 있으면 즉시 연결',
)

// User-facing product language: keep implementation jargon out of the My Voice experience.
patch(
  'src/pages/VoiceClonePage.tsx',
  "message: '샘플과 동의 기록을 이 기기에 저장했습니다. 준비가 완료되면 실제 복제를 바로 시작할 수 있습니다.'",
  "message: '샘플과 동의 기록을 이 기기에 저장했습니다. 생성 엔진이 준비되면 이 목소리로 바로 테스트할 수 있습니다.'",
  '생성 엔진이 준비되면 이 목소리로',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  "return error instanceof Error ? error.message : '음성 복제 요청을 처리하지 못했습니다.'",
  "return error instanceof Error ? error.message : '내 목소리 생성 요청을 처리하지 못했습니다.'",
  '내 목소리 생성 요청을 처리하지 못했습니다',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  "}, `${profile?.displayName ?? 'SoriON 복제 목소리'} · 생성 결과`)\n    showNotice('복제 음성을 완성해 하단 플레이어에 연결했습니다.')",
  "}, `${profile?.displayName ?? 'SoriON 내 목소리'} · 생성 결과`)\n    showNotice('내 목소리 테스트 음원을 완성해 하단 플레이어에 연결했습니다.')",
  'SoriON 내 목소리',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  "message: '복제 전 원본 샘플입니다.'",
  "message: '내 목소리 원본 샘플입니다.'",
  '내 목소리 원본 샘플입니다',
)

// 3) My Voice page: profile library + creation mode + saved-profile workbench.
patch(
  'src/pages/VoiceClonePage.tsx',
  `import { CloneStepIndicator } from '../components/clone/CloneStepIndicator'\nimport { SampleQualityCard } from '../components/clone/SampleQualityCard'`,
  `import { CloneStepIndicator } from '../components/clone/CloneStepIndicator'\nimport { MyVoiceLibrary } from '../components/clone/MyVoiceLibrary'\nimport { SampleQualityCard } from '../components/clone/SampleQualityCard'`,
  "import { MyVoiceLibrary }",
)

patch(
  'src/pages/VoiceClonePage.tsx',
  `import { deleteVoiceProfile, saveVoiceProfile } from '../voiceclone/profileRepository'`,
  `import { deleteVoiceProfile, listVoiceProfiles, saveVoiceProfile } from '../voiceclone/profileRepository'`,
  'listVoiceProfiles',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  `  const [profile, setProfile] = useState<VoiceCloneProfile | null>(null)\n  const [capability, setCapability] = useState<VoiceCloneCapability | null>(null)`,
  `  const [profile, setProfile] = useState<VoiceCloneProfile | null>(null)\n  const [profiles, setProfiles] = useState<VoiceCloneProfile[]>([])\n  const [profilesLoading, setProfilesLoading] = useState(true)\n  const [creatingNew, setCreatingNew] = useState(true)\n  const [capability, setCapability] = useState<VoiceCloneCapability | null>(null)`,
  'const [profilesLoading, setProfilesLoading]',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  `  useEffect(() => {\n    void getVoiceCloneCapability()\n      .then((result) => {\n        setCapability(result)\n      })\n      .catch(() => setCapability(null))\n  }, [])`,
  `  useEffect(() => {\n    void getVoiceCloneCapability()\n      .then((result) => {\n        setCapability(result)\n      })\n      .catch(() => setCapability(null))\n  }, [])\n  useEffect(() => {\n    let active = true\n    void listVoiceProfiles()\n      .then((items) => {\n        if (!active) return\n        setProfiles(items)\n        if (items.length > 0) {\n          const latest = items[0]\n          setProfile(latest)\n          setDisplayName(latest.displayName)\n          setConsent(latest.consent)\n          setCreatingNew(false)\n        } else {\n          setCreatingNew(true)\n        }\n      })\n      .catch(() => {\n        if (active) setCreatingNew(true)\n      })\n      .finally(() => {\n        if (active) setProfilesLoading(false)\n      })\n    return () => { active = false }\n  }, [])`,
  'void listVoiceProfiles()',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  `  async function handlePrepare() {`,
  `  function selectSavedProfile(nextProfile: VoiceCloneProfile) {\n    setProfile(nextProfile)\n    setDisplayName(nextProfile.displayName)\n    setConsent(nextProfile.consent)\n    setAnalysis(nextProfile.analysis)\n    setJob(null)\n    setJobError(null)\n    setCreatingNew(false)\n    recorder.reset()\n  }\n  function startNewVoice() {\n    setProfile(null)\n    setDisplayName('내 SoriON 목소리')\n    setConsent(initialConsent)\n    setAnalysis(null)\n    setJob(null)\n    setJobError(null)\n    setCreatingNew(true)\n    recorder.reset()\n  }\n  async function handlePrepare() {`,
  'function selectSavedProfile(nextProfile',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  `      await saveVoiceProfile(nextProfile)\n      setProfile(nextProfile)`,
  `      await saveVoiceProfile(nextProfile)\n      setProfile(nextProfile)\n      setProfiles((current) => [nextProfile, ...current.filter((item) => item.id !== nextProfile.id)])\n      setCreatingNew(false)`,
  'setProfiles((current) => [nextProfile',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  `  async function handleDelete() {\n    if (!profile) return\n    await deleteVoiceProfile(profile.id).catch(() => undefined)\n    await deleteRemoteVoiceCloneProfile(profile.id).catch(() => undefined)\n    setProfile(null)\n    setJob(null)\n    setJobError(null)\n    recorder.reset()\n    setAnalysis(null)\n    setConsent(initialConsent)\n    showNotice('동의를 철회하고 저장된 음성 샘플을 삭제했습니다.')\n  }`,
  `  async function handleDelete() {\n    if (!profile) return\n    const deletingId = profile.id\n    await deleteVoiceProfile(deletingId).catch(() => undefined)\n    await deleteRemoteVoiceCloneProfile(deletingId).catch(() => undefined)\n    const remaining = profiles.filter((item) => item.id !== deletingId)\n    setProfiles(remaining)\n    setJob(null)\n    setJobError(null)\n    if (remaining[0]) selectSavedProfile(remaining[0])\n    else startNewVoice()\n    showNotice('동의를 철회하고 저장된 내 목소리 샘플을 삭제했습니다.')\n  }`,
  'const deletingId = profile.id',
)

patch(
  'src/pages/VoiceClonePage.tsx',
  `  return (\n    <WorkspacePageScaffold\n      eyebrow="VOICE CLONE · CONSENT FIRST"\n      title="내 목소리 복제"\n      description="동의된 샘플만 안전한 음성 제작 과정에 사용합니다. 문장별 생성 상태와 취소·재시도를 실시간으로 관리합니다."\n      className="soa-clone-page"\n    >\n      <CloneStepIndicator current={currentStep} />\n      <div className="soa-clone-grid">\n        <VoiceSampleCapture\n          file={recorder.file}\n          recording={recorder.recording}\n          seconds={recorder.seconds}\n          error={recorder.error}\n          onStart={() => void recorder.start()}\n          onStop={recorder.stop}\n          onReset={recorder.reset}\n          onFile={recorder.setFile}\n        />\n        <SampleQualityCard analysis={analysis} analyzing={analyzing} />\n        <CloneConsentCard\n          displayName={displayName}\n          consent={consent}\n          disabled={!canSubmit}\n          onDisplayName={setDisplayName}\n          onConsent={setConsent}\n          onSubmit={() => void handlePrepare()}\n        />\n        {profile ? <CloneReadyCard profile={profile} onDelete={() => void handleDelete()} /> : null}\n        {profile ? (\n          <CloneExecutionCard\n            profileName={profile.displayName}\n            ready={Boolean(capability?.ready && profile.status === 'engine-ready')}\n            job={job}\n            busy={jobBusy}\n            error={jobError}\n            onStart={(text) => void handleStart(text)}\n            onCancel={() => void handleCancel()}\n            onRetry={() => void handleRetry()}\n          />\n        ) : null}\n      </div>\n    </WorkspacePageScaffold>\n  )`,
  `  return (\n    <WorkspacePageScaffold\n      eyebrow="MY VOICE · CONSENT FIRST"\n      title="내 목소리"\n      description="녹음 품질을 먼저 다듬고, 저장한 목소리를 비교하고, 실제 문장 테스트까지 한 화면에서 완성합니다."\n      className="soa-clone-page"\n    >\n      <MyVoiceLibrary\n        profiles={profiles}\n        selectedId={profile?.id ?? null}\n        loading={profilesLoading}\n        onSelect={selectSavedProfile}\n        onCreate={startNewVoice}\n      />\n\n      {creatingNew ? (\n        <section className="soa-myvoice-create-flow" aria-label="새 내 목소리 만들기">\n          <div className="soa-myvoice-flow-head">\n            <strong>새 목소리 만들기 · 좋은 원본 → 품질 확인 → 권한 확인</strong>\n            {profiles.length ? <button type="button" onClick={() => selectSavedProfile(profiles[0])}>저장된 목소리로 돌아가기</button> : null}\n          </div>\n          <CloneStepIndicator current={currentStep} />\n          <div className="soa-clone-grid">\n            <VoiceSampleCapture\n              file={recorder.file}\n              recording={recorder.recording}\n              seconds={recorder.seconds}\n              error={recorder.error}\n              onStart={() => void recorder.start()}\n              onStop={recorder.stop}\n              onReset={recorder.reset}\n              onFile={recorder.setFile}\n            />\n            <SampleQualityCard analysis={analysis} analyzing={analyzing} />\n            <CloneConsentCard\n              displayName={displayName}\n              consent={consent}\n              disabled={!canSubmit}\n              onDisplayName={setDisplayName}\n              onConsent={setConsent}\n              onSubmit={() => void handlePrepare()}\n            />\n          </div>\n        </section>\n      ) : profile ? (\n        <div className="soa-myvoice-workbench">\n          <CloneReadyCard profile={profile} onDelete={() => void handleDelete()} />\n          <CloneExecutionCard\n            profileName={profile.displayName}\n            ready={Boolean(capability?.ready && profile.status === 'engine-ready')}\n            job={job}\n            busy={jobBusy}\n            error={jobError}\n            onStart={(text) => void handleStart(text)}\n            onCancel={() => void handleCancel()}\n            onRetry={() => void handleRetry()}\n          />\n        </div>\n      ) : null}\n    </WorkspacePageScaffold>\n  )`,
  'MY VOICE · CONSENT FIRST',
)

// 4) Load the new My Voice Lab style layer.
patch(
  'src/styles/index.css',
  `@import "./clone-execution.css";\n@import "./creation-workspace.css";`,
  `@import "./clone-execution.css";\n@import "./my-voice-lab.css";\n@import "./creation-workspace.css";`,
  '@import "./my-voice-lab.css";',
)

console.log('\nSoriON linkage + My Voice patch applied successfully.')
