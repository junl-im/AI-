import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { TtsSynthesisRequest, VoiceEmotion } from '../ai/contracts'
import { requestAutomaticApiReconnect } from '../api/httpClient'
import { DubbingStudioHeader } from '../components/workspace/DubbingStudioHeader'
import { DubbingVoiceControls } from '../components/workspace/DubbingVoiceControls'
import { LongformComposer } from '../components/workspace/LongformComposer'
import { TimelineEditor } from '../components/workspace/TimelineEditor'
import { useEngineCatalog } from '../hooks/useEngineCatalog'
import {
  useTimelineGeneration,
  type TimelineGenerationOptions,
} from '../hooks/useTimelineGeneration'
import { useSelectiveSttRegeneration } from '../hooks/useSelectiveSttRegeneration'
import { useWorkspaceSessionPersistence } from '../hooks/useWorkspaceSessionPersistence'
import { saveProject } from '../projects/projectRepository'
import { useAppStore } from '../store/useAppStore'
import { getCurrentTrack, usePlayerStore } from '../store/usePlayerStore'
import { buildAudioFilename } from '../tts/audioFile'
import {
  BROWSER_SPEECH_ENGINE_ID,
  createBrowserSpeechPlayback,
} from '../tts/browserSpeech'
import type { GeneratedAudio } from '../tts/generationTypes'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import { synthesizeSpeech } from '../tts/voiceApi'
import { getVoicePreset, voicePresets } from '../tts/voicePresets'
import { createRandomId } from '../utils/randomId'
import type { WorkspaceSession } from '../workspace/sessionTypes'
import { clearWorkspaceSession } from '../workspace/workspaceSessionRepository'
import type { ComposerDirective, WorkspaceMessage } from '../workspace/workspaceTypes'
import { LandingHome } from './LandingHome'

interface PendingLongformGeneration {
  text: string
  options: TimelineGenerationOptions
  blockIds: string[]
}
const initialMessages: WorkspaceMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    badge: '장문 제작 준비',
    text: '원고를 입력하면 문장별 대사 블록으로 나누고 순서대로 음성을 생성합니다.',
  },
]
function generatedPreview(
  result: Awaited<ReturnType<typeof synthesizeSpeech>>,
  request: TtsSynthesisRequest,
  voiceName: string,
): GeneratedAudio {
  if (result.audioUrl) {
    return {
      url: result.audioUrl,
      filename: buildAudioFilename(request.text, voiceName, 'wav'),
      source: 'api',
      durationSeconds: result.estimatedDurationSeconds,
      result,
    }
  }
  if (result.engineId === BROWSER_SPEECH_ENGINE_ID) {
    return {
      url: null,
      filename: buildAudioFilename(request.text, voiceName, 'wav'),
      source: 'browser-speech',
      durationSeconds: result.estimatedDurationSeconds,
      browserSpeech: createBrowserSpeechPlayback(request),
      result,
    }
  }
  const blob = createMockWave(request.text, request.voiceId)
  return {
    url: URL.createObjectURL(blob),
    filename: buildAudioFilename(request.text, voiceName, 'wav'),
    source: 'browser-demo',
    durationSeconds: getMockWaveDuration(request.text),
    revokeOnRemove: true,
    result: {
      ...result,
      message: 'Mock 엔진 프리뷰입니다. 실제 AI 음성이 아닙니다.',
      fileSizeBytes: blob.size,
    },
  }
}
function formatSavedLabel(savedAt: string | null, hydrated: boolean, memoryOnly: boolean): string {
  if (!hydrated) return '작업공간 불러오는 중'
  if (!savedAt) return memoryOnly ? '이 탭에 임시 저장됨' : '자동 저장 준비됨'
  const date = new Date(savedAt)
  if (!Number.isFinite(date.getTime())) return '자동 저장됨'
  const time = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return `${time} ${memoryOnly ? '임시 저장됨' : '자동 저장됨'}`
}
export function HomePage() {
  const workspaceEntered = useAppStore((state) => state.workspaceEntered)
  const page = useAppStore((state) => state.page)
  const backendStatus = useAppStore((state) => state.backendStatus)
  const backendMessage = useAppStore((state) => state.backendMessage)
  const showNotice = useAppStore((state) => state.showNotice)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const activeProject = useAppStore((state) => state.activeProject)
  const workspaceResetToken = useAppStore((state) => state.workspaceResetToken)
  const clearActiveProject = useAppStore((state) => state.clearActiveProject)
  const startNewWorkspace = useAppStore((state) => state.startNewWorkspace)
  const enqueue = usePlayerStore((state) => state.enqueue)
  const clearQueue = usePlayerStore((state) => state.clearQueue)
  const currentTrack = usePlayerStore(getCurrentTrack)
  const [projectTitle, setProjectTitle] = useState('새 프로젝트')
  const [messages, setMessages] = useState<WorkspaceMessage[]>(initialMessages)
  const [voiceId, setVoiceId] = useState(voicePresets[0].id)
  const [speechSpeed, setSpeechSpeed] = useState(1)
  const [speechPitch, setSpeechPitch] = useState(0)
  const [speechEmotion, setSpeechEmotion] = useState<VoiceEmotion>('neutral')
  const [composerDraft, setComposerDraft] = useState('')
  const [directiveIds, setDirectiveIds] = useState<ComposerDirective['id'][]>(['numbers'])
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [pendingRecoveryIds, setPendingRecoveryIds] = useState<string[]>([])
  const [pendingGeneration, setPendingGeneration] = useState<PendingLongformGeneration | null>(null)
  const observedResetTokenRef = useRef(workspaceResetToken)
  const pendingResetSaveRef = useRef<number | null>(null)
  const explicitWorkspaceActionRef = useRef(false)
  const engineCatalog = useEngineCatalog()
  const timeline = useTimelineGeneration()
  const generateAllTimelineBlocks = timeline.generateAll
  const recoverBlocks = timeline.recoverBlocks
  const restoreProject = timeline.restoreProject
  const restoreSession = timeline.restoreSession
  const clearTimeline = timeline.clear
  const selectedVoice = useMemo(() => getVoicePreset(voiceId), [voiceId])
  const activity = useMemo(() => (
    [...messages].reverse().find((message) => message.role !== 'user') ?? initialMessages[0]
  ), [messages])
  const busy = timeline.blocks.some((block) => (
    block.kind === 'voice' && block.status === 'generating'
  ))
  const engineAvailable = (
    (backendStatus === 'online' || backendStatus === 'degraded')
    && engineCatalog.selected !== null
  )
  const normalizeText = directiveIds.includes('numbers')
  const restoreWorkspaceSession = useCallback((session: WorkspaceSession) => {
    if (explicitWorkspaceActionRef.current || useAppStore.getState().activeProject) return
    setProjectTitle(session.projectTitle || '새 프로젝트')
    setVoiceId(getVoicePreset(session.voiceId).id)
    setSpeechSpeed(session.speechSpeed)
    setSpeechPitch(session.speechPitch)
    setSpeechEmotion(
      session.speechEmotion !== 'neutral'
        ? session.speechEmotion
        : session.directiveIds.includes('commercial')
          ? 'commercial'
          : session.directiveIds.includes('bright')
            ? 'happy'
            : 'neutral',
    )
    setComposerDraft(session.composerDraft)
    setDirectiveIds(session.directiveIds.includes('numbers') ? ['numbers'] : [])
    setMessages(session.messages.length > 0 ? session.messages : initialMessages)
    setPendingRecoveryIds(restoreSession(session.blocks))
    if (session.workspaceEntered) enterWorkspace(session.page)
  }, [enterWorkspace, restoreSession])
  const notifyPersistenceUnavailable = useCallback(() => {
    showNotice('이 브라우저에서는 작업공간 자동 저장을 유지할 수 없습니다.')
  }, [showNotice])
  const {
    hydrated,
    storageMode,
    lastSavedAt,
    saveNow: saveWorkspaceNow,
  } = useWorkspaceSessionPersistence({
    workspaceEntered,
    page,
    projectTitle,
    voiceId,
    speechSpeed,
    speechPitch,
    speechEmotion,
    composerDraft,
    directiveIds,
    messages,
    blocks: timeline.blocks,
    onRestore: restoreWorkspaceSession,
    onPersistenceUnavailable: notifyPersistenceUnavailable,
  })
  useLayoutEffect(() => {
    if (activeProject || observedResetTokenRef.current !== workspaceResetToken) {
      explicitWorkspaceActionRef.current = true
    }
  }, [activeProject, workspaceResetToken])
  useLayoutEffect(() => {
    if (observedResetTokenRef.current === workspaceResetToken) return
    observedResetTokenRef.current = workspaceResetToken
    pendingResetSaveRef.current = workspaceResetToken
    clearTimeline()
    clearQueue()
    setProjectTitle('새 프로젝트')
    setMessages(initialMessages)
    setVoiceId(voicePresets[0].id)
    setSpeechSpeed(1)
    setSpeechPitch(0)
    setSpeechEmotion('neutral')
    setComposerDraft('')
    setDirectiveIds(['numbers'])
    setPendingRecoveryIds([])
    setPendingGeneration(null)
  }, [clearQueue, clearTimeline, workspaceResetToken])
  useEffect(() => {
    if (pendingResetSaveRef.current !== workspaceResetToken) return
    pendingResetSaveRef.current = null
    void clearWorkspaceSession().then(saveWorkspaceNow)
  }, [saveWorkspaceNow, workspaceResetToken])
  useEffect(() => {
    if (!activeProject) return
    setPendingGeneration(null)
    const voice = getVoicePreset(activeProject.voiceId)
    setProjectTitle(activeProject.title || '새 프로젝트')
    setVoiceId(activeProject.voiceId)
    setSpeechSpeed(activeProject.speed ?? 1)
    setSpeechPitch(activeProject.pitch ?? 0)
    setSpeechEmotion(activeProject.emotion)
    setComposerDraft(activeProject.text)
    setDirectiveIds(activeProject.normalizeText === false ? [] : ['numbers'])
    setMessages([
      initialMessages[0],
      {
        id: createRandomId(),
        role: 'assistant',
        badge: '프로젝트 불러옴',
        text: `${activeProject.title} 원고와 음성 블록을 복원했습니다.`,
      },
    ])
    const recoverableIds = restoreProject(activeProject, {
      voiceId: activeProject.voiceId,
      voiceName: voice.name,
      emotion: activeProject.emotion,
      speed: activeProject.speed ?? 1,
      pitch: activeProject.pitch ?? 0,
      engineId: 'auto',
      normalizeText: activeProject.normalizeText ?? true,
    })
    setPendingRecoveryIds(recoverableIds)
    clearActiveProject()
  }, [activeProject, clearActiveProject, restoreProject])
  useEffect(() => {
    if (!engineAvailable || pendingRecoveryIds.length === 0) return
    const ids = pendingRecoveryIds
    setPendingRecoveryIds([])
    void recoverBlocks(ids)
  }, [engineAvailable, pendingRecoveryIds, recoverBlocks])
  const appendMessage = useCallback((message: Omit<WorkspaceMessage, 'id'>) => {
    setMessages((current) => [...current, { ...message, id: createRandomId() }])
  }, [])
  const sttVerification = useSelectiveSttRegeneration({ timeline, appendMessage, showNotice })
  const buildOptions = useCallback((): TimelineGenerationOptions => ({
    voiceId,
    voiceName: selectedVoice.name,
    emotion: speechEmotion,
    speed: speechSpeed,
    pitch: speechPitch,
    engineId: 'auto',
    normalizeText,
  }), [
    normalizeText,
    selectedVoice.name,
    speechEmotion,
    speechPitch,
    speechSpeed,
    voiceId,
  ])
  const saveLongformProject = useCallback(async (
    text: string,
    options: TimelineGenerationOptions,
    blockIds: string[],
    generated: Array<{ blockId: string; audio: GeneratedAudio }>,
  ) => {
    const first = generated[0]?.audio
    if (!first) return
    const completedByBlock = new Map(
      generated.map((item) => [
        item.blockId,
        item.audio.source === 'api' ? item.audio.result.jobId : null,
      ]),
    )
    const now = new Date().toISOString()
    await saveProject({
      id: createRandomId(),
      title: projectTitle.trim() || text.replace(/\s+/g, ' ').slice(0, 36) || '새 프로젝트',
      text,
      voiceId: options.voiceId,
      emotion: options.emotion,
      createdAt: now,
      updatedAt: now,
      status: 'generated',
      lastJobId: first.source === 'api' ? first.result.jobId : undefined,
      engineId: first.result.engineId,
      engineMode: first.result.engineMode,
      audioSource: first.source,
      ...(first.source === 'browser-speech' ? {} : { outputFormat: 'wav' as const }),
      speed: options.speed,
      pitch: options.pitch,
      normalizeText: options.normalizeText,
      jobIds: blockIds.map((blockId) => completedByBlock.get(blockId) ?? null),
    })
  }, [projectTitle])
  const generateLongform = useCallback(async (pending: PendingLongformGeneration) => {
    appendMessage({
      role: 'assistant',
      badge: backendStatus === 'degraded' ? '대체 엔진' : '순차 생성',
      text: `${pending.blockIds.length}개 대사 블록을 앞에서부터 생성합니다.`,
    })
    const generated = await generateAllTimelineBlocks(pending.blockIds)
    if (generated.length === 0) {
      appendMessage({
        role: 'system',
        badge: '생성 실패',
        text: '완성된 음성이 없습니다. 실패한 대사 블록에서 다시 생성해 주세요.',
      })
      return
    }
    appendMessage({
      role: 'assistant',
      badge: '제작 완료',
      text: `${generated.length}개 음성 블록을 하단 플레이어와 프로젝트에 연결했습니다.`,
    })
    try {
      await saveLongformProject(pending.text, pending.options, pending.blockIds, generated)
      await saveWorkspaceNow()
    } catch {
      showNotice('음성은 완성됐지만 프로젝트 저장에는 실패했습니다.')
    }
  }, [
    appendMessage,
    backendStatus,
    generateAllTimelineBlocks,
    saveLongformProject,
    saveWorkspaceNow,
    showNotice,
  ])
  useEffect(() => {
    if (!engineAvailable || !pendingGeneration || busy) return
    const pending = pendingGeneration
    setPendingGeneration(null)
    void generateLongform(pending)
  }, [busy, engineAvailable, generateLongform, pendingGeneration])
  async function handleLongformSubmit(value: string) {
    const options = buildOptions()
    setPendingGeneration(null)
    clearTimeline()
    clearQueue()
    const blockIds = timeline.stageText(value, options)
    appendMessage({
      role: 'assistant',
      badge: '원고 분할 완료',
      text: `${blockIds.length}개 대사 블록으로 정리했습니다. 원문은 위 편집기에 유지됩니다.`,
    })
    const pending = { text: value, options, blockIds }
    if (!engineAvailable) {
      setPendingGeneration(pending)
      appendMessage({
        role: 'system',
        badge: '음성 시스템 준비 중',
        text: '대사 블록을 준비했습니다. 사용할 수 있는 음성이 준비되면 자동으로 이어서 생성합니다.',
      })
      requestAutomaticApiReconnect()
      return
    }
    await generateLongform(pending)
  }
  async function previewVoice(nextVoiceId: string) {
    const voice = getVoicePreset(nextVoiceId)
    if (!engineAvailable || !engineCatalog.selected) {
      appendMessage({
        role: 'assistant',
        badge: '목소리 선택',
        text: `${voice.name} 목소리를 선택했습니다. 음성 서버 연결을 자동으로 확인하고 있습니다.`,
      })
      requestAutomaticApiReconnect()
      return
    }
    setPreviewingId(nextVoiceId)
    const text = `안녕하세요. 소리온의 ${voice.name} 목소리입니다.`
    try {
      const request: TtsSynthesisRequest = {
        text,
        voiceId: nextVoiceId,
        emotion: speechEmotion,
        speed: speechSpeed,
        pitch: speechPitch,
        format: 'wav',
        engineId: 'auto',
        normalizeText,
      }
      const result = await synthesizeSpeech(request, createRandomId())
      const audio = generatedPreview(result, request, voice.name)
      enqueue(audio, `${voice.name} 프리뷰`)
      appendMessage({
        role: 'assistant',
        badge: audio.source === 'browser-speech'
          ? '브라우저 음성'
          : audio.source === 'browser-demo'
            ? 'Demo 프리뷰'
            : audio.result.fallbackUsed
              ? '자동 엔진 전환'
              : '목소리 프리뷰',
        text: audio.source === 'browser-speech'
          ? `${voice.name} 설정으로 브라우저 음성을 바로 재생할 수 있습니다.`
          : audio.result.fallbackUsed
            ? `${voice.name} 프리뷰를 사용 가능한 대체 엔진으로 완성했습니다.`
            : `${voice.name} 목소리를 하단 플레이어에 연결했습니다.`,
      })
    } catch {
      appendMessage({
        role: 'system',
        badge: '프리뷰 대기',
        text: '현재 음성 서버가 준비되지 않았습니다. 연결이 복구되면 다시 시도해 주세요.',
      })
    } finally {
      setPreviewingId(null)
    }
  }
  async function retryBlock(id: string) {
    if (!engineAvailable) {
      requestAutomaticApiReconnect()
      showNotice('음성 서버 연결을 자동으로 다시 확인하고 있습니다.')
      return
    }
    await timeline.retryBlock(id)
  }
  function clearCurrentWork() {
    setPendingGeneration(null)
    startNewWorkspace()
  }
  if (!workspaceEntered) return <LandingHome />
  const savedLabel = formatSavedLabel(lastSavedAt, hydrated, storageMode === 'memory')
  const engineLabel = engineCatalog.selected?.name ?? '자동 연결 확인 중'
  return (
    <div className="soa-dubbing-workspace">
      <DubbingStudioHeader
        title={projectTitle}
        savedLabel={savedLabel}
        backendStatus={backendStatus}
        engineLabel={engineLabel}
        downloadHref={currentTrack?.audio.url ?? null}
        downloadName={currentTrack?.audio.filename ?? 'sorion-voice.wav'}
        onTitleChange={setProjectTitle}
        onOpenClone={() => enterWorkspace('clone')}
        onOpenQuality={() => enterWorkspace('quality')}
        onOpenProjects={() => enterWorkspace('projects')}
        onOpenSettings={() => enterWorkspace('settings')}
        onClear={clearCurrentWork}
      />
      <main className="soa-dubbing-main">
        <DubbingVoiceControls
          voiceId={voiceId}
          previewingId={previewingId}
          speed={speechSpeed}
          pitch={speechPitch}
          emotion={speechEmotion}
          normalizeText={normalizeText}
          engine={engineCatalog.selected}
          onVoiceChange={setVoiceId}
          onPreview={(id) => void previewVoice(id)}
          onSpeedChange={setSpeechSpeed}
          onPitchChange={setSpeechPitch}
          onEmotionChange={setSpeechEmotion}
          onNormalizeTextChange={(value) => setDirectiveIds(value ? ['numbers'] : [])}
          onCreateVoice={() => enterWorkspace('clone')}
        />
        <LongformComposer
          disabled={busy}
          value={composerDraft}
          backendStatus={backendStatus}
          backendMessage={backendMessage}
          activity={activity}
          onValueChange={setComposerDraft}
          onSubmit={(value) => void handleLongformSubmit(value)}
        />
        <TimelineEditor
          blocks={timeline.blocks}
          onMove={timeline.moveBlock}
          onReorder={timeline.reorderBlock}
          onSplit={timeline.splitBlock}
          onUpdateText={timeline.updateText}
          onRetry={(id) => void retryBlock(id)}
          onAddVoice={() => timeline.addVoiceBlock(buildOptions())}
          onAddPause={timeline.addPause}
          onRemove={timeline.removeBlock}
          onClear={() => {
            setPendingGeneration(null)
            timeline.clear()
          }}
          onVerifyAndRegenerate={() => void sttVerification.run()}
          sttBusy={sttVerification.busy}
        />
      </main>
    </div>
  )
}
