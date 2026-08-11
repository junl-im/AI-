import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { TtsSynthesisRequest, VoiceEmotion } from '../ai/contracts'
import { requestAutomaticApiReconnect } from '../api/httpClient'
import { DesktopVoiceDrawer } from '../components/workspace/DesktopVoiceDrawer'
import { DubbingStudioHeader } from '../components/workspace/DubbingStudioHeader'
import { DubbingVoiceControls } from '../components/workspace/DubbingVoiceControls'
import { LongformComposer } from '../components/workspace/LongformComposer'
import { SpeakerVoiceAssignmentPanel } from '../components/workspace/SpeakerVoiceAssignment'
import { TimelineEditor } from '../components/workspace/TimelineEditor'
import { WorkspaceConversation } from '../components/workspace/WorkspaceConversation'
import { WorkspaceProjectRail } from '../components/workspace/WorkspaceProjectRail'
import { useDesktopStudioLayout } from '../hooks/useDesktopStudioLayout'
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
import {
  analyzeMultiSpeakerScript,
  buildMultiSpeakerTimelineSegments,
  suggestSpeakerVoiceAssignments,
  type SpeakerVoiceAssignment,
} from '../workspace/multiSpeaker'
import type { WorkspaceBatchRetrySnapshot, WorkspaceSession } from '../workspace/sessionTypes'
import { clearWorkspaceSession } from '../workspace/workspaceSessionRepository'
import type { ComposerDirective, WorkspaceMessage } from '../workspace/workspaceTypes'
import { normalizeVoicePitch, normalizeVoiceSpeed } from '../voice/voiceControlOptions'
import { LandingHome } from './LandingHome'

interface PendingLongformGeneration {
  text: string
  options: TimelineGenerationOptions
  blockIds: string[]
  allBlockIds: string[]
  resume?: boolean
}
const initialMessages: WorkspaceMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    badge: '장문 제작 준비',
    text: '내용을 입력하면 문장별 대사 블록으로 나누고 순서대로 음성을 생성합니다.',
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
      rehydration: { kind: 'tts-final', jobId: result.jobId },
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
      message: '샘플 미리듣기입니다. 실제 AI 음성이 아닙니다.',
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
  const showNotice = useAppStore((state) => state.showNotice)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const activeProject = useAppStore((state) => state.activeProject)
  const openProject = useAppStore((state) => state.openProject)
  const workspaceResetToken = useAppStore((state) => state.workspaceResetToken)
  const clearActiveProject = useAppStore((state) => state.clearActiveProject)
  const startNewWorkspace = useAppStore((state) => state.startNewWorkspace)
  const enqueueAndPlay = usePlayerStore((state) => state.enqueueAndPlay)
  const toggleTrack = usePlayerStore((state) => state.toggleTrack)
  const clearQueue = usePlayerStore((state) => state.clearQueue)
  const playerQueue = usePlayerStore((state) => state.queue)
  const playbackTrackId = usePlayerStore((state) => state.playbackTrackId)
  const playbackActive = usePlayerStore((state) => state.playbackActive)
  const currentTrack = usePlayerStore(getCurrentTrack)
  const desktopLayout = useDesktopStudioLayout()
  const [projectTitle, setProjectTitle] = useState('새 프로젝트')
  const [messages, setMessages] = useState<WorkspaceMessage[]>(initialMessages)
  const [voiceId, setVoiceId] = useState(voicePresets[0].id)
  const [speechSpeed, setSpeechSpeed] = useState(1)
  const [speechPitch, setSpeechPitch] = useState(0)
  const [speechEmotion, setSpeechEmotion] = useState<VoiceEmotion>('neutral')
  const [composerDraft, setComposerDraft] = useState('')
  const [directiveIds, setDirectiveIds] = useState<ComposerDirective['id'][]>(['numbers'])
  const [batchRetrySnapshot, setBatchRetrySnapshot] = useState<WorkspaceBatchRetrySnapshot>({ retryCount: 0, history: [] })
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [activePreview, setActivePreview] = useState<{ voiceId: string; trackId: string } | null>(null)
  const [pendingPreview, setPendingPreview] = useState<{
    voiceId: string
    attempt: number
    failed: boolean
    text?: string
    preserveSelection?: boolean
  } | null>(null)
  const [pendingRecoveryIds, setPendingRecoveryIds] = useState<string[]>([])
  const [pendingGeneration, setPendingGeneration] = useState<PendingLongformGeneration | null>(null)
  const [resumeGeneration, setResumeGeneration] = useState<PendingLongformGeneration | null>(null)
  const [speakerAssignments, setSpeakerAssignments] = useState<SpeakerVoiceAssignment[]>([])
  const [speakerAssignmentsConfirmed, setSpeakerAssignmentsConfirmed] = useState(false)
  const observedResetTokenRef = useRef(workspaceResetToken)
  const pendingResetSaveRef = useRef<number | null>(null)
  const explicitWorkspaceActionRef = useRef(false)
  const previewRunIdRef = useRef(0)
  const engineCatalog = useEngineCatalog()
  const timeline = useTimelineGeneration()
  const generateAllTimelineBlocks = timeline.generateAll
  const recoverBlocks = timeline.recoverBlocks
  const restoreProject = timeline.restoreProject
  const restoreSession = timeline.restoreSession
  const clearTimeline = timeline.clear
  const getQueuedVoiceBlockIds = timeline.getQueuedVoiceBlockIds
  const getVoiceBlockSnapshots = timeline.getVoiceBlockSnapshots
  const selectedVoice = useMemo(() => getVoicePreset(voiceId), [voiceId])
  const activePreviewExists = Boolean(
    activePreview && playerQueue.some((track) => track.id === activePreview.trackId),
  )
  const activePreviewId = activePreviewExists ? activePreview?.voiceId ?? null : null
  const previewPlaying = Boolean(
    activePreviewExists
    && activePreview?.trackId === playbackTrackId
    && playbackActive,
  )
  const activity = useMemo(() => (
    [...messages].reverse().find((message) => message.role !== 'user') ?? initialMessages[0]
  ), [messages])
  const generationProgress = useMemo(() => {
    const voiceBlocks = timeline.blocks.filter((block) => block.kind === 'voice')
    return {
      total: voiceBlocks.length,
      ready: voiceBlocks.filter((block) => block.status === 'ready').length,
      failed: voiceBlocks.filter((block) => block.status === 'failed').length,
      generating: voiceBlocks.filter((block) => block.status === 'generating').length,
      queued: voiceBlocks.filter((block) => block.status === 'queued').length,
    }
  }, [timeline.blocks])
  const resumeQueuedCount = useMemo(() => {
    if (!resumeGeneration) return 0
    const allowed = new Set(resumeGeneration.allBlockIds)
    return timeline.blocks.filter((block) => (
      block.kind === 'voice' && block.status === 'queued' && allowed.has(block.id)
    )).length
  }, [resumeGeneration, timeline.blocks])
  const busy = generationProgress.generating > 0
  const engineAvailable = (
    (backendStatus === 'online' || backendStatus === 'degraded')
    && engineCatalog.selected !== null
  )
  const selectedEngineId = engineCatalog.selected?.mode === 'browser'
    ? engineCatalog.selected.id
    : 'auto'
  const normalizeText = directiveIds.includes('numbers')
  const multiSpeakerAnalysis = useMemo(
    () => analyzeMultiSpeakerScript(composerDraft),
    [composerDraft],
  )
  const speakerSignature = multiSpeakerAnalysis.speakers.join('\u001f')

  useEffect(() => {
    if (!multiSpeakerAnalysis.eligible) {
      setSpeakerAssignments([])
      setSpeakerAssignmentsConfirmed(false)
      return
    }
    setSpeakerAssignments((current) => {
      const currentMap = new Map(current.map((item) => [item.speaker, item.voiceId]))
      const suggested = suggestSpeakerVoiceAssignments(
        multiSpeakerAnalysis.speakers,
        voiceId,
        voicePresets,
      )
      return suggested.map((item) => ({
        ...item,
        voiceId: currentMap.get(item.speaker) ?? item.voiceId,
      }))
    })
    setSpeakerAssignmentsConfirmed(false)
  }, [speakerSignature, multiSpeakerAnalysis.eligible, multiSpeakerAnalysis.speakers, voiceId])
  const restoreWorkspaceSession = useCallback((session: WorkspaceSession) => {
    if (explicitWorkspaceActionRef.current || useAppStore.getState().activeProject) return
    setProjectTitle(session.projectTitle || '새 프로젝트')
    setVoiceId(getVoicePreset(session.voiceId).id)
    setSpeechSpeed(normalizeVoiceSpeed(session.speechSpeed))
    setSpeechPitch(normalizeVoicePitch(session.speechPitch))
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
    setBatchRetrySnapshot(session.batchRetrySnapshot)
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
    batchRetrySnapshot,
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
    setBatchRetrySnapshot({ retryCount: 0, history: [] })
    setPendingRecoveryIds([])
    setPendingGeneration(null)
    setResumeGeneration(null)
    setPendingPreview(null)
    setPreviewingId(null)
    previewRunIdRef.current += 1
  }, [clearQueue, clearTimeline, workspaceResetToken])
  useEffect(() => {
    if (pendingResetSaveRef.current !== workspaceResetToken) return
    pendingResetSaveRef.current = null
    void clearWorkspaceSession().then(saveWorkspaceNow)
  }, [saveWorkspaceNow, workspaceResetToken])
  useEffect(() => {
    if (workspaceEntered && page === 'home') return
    previewRunIdRef.current += 1
    setPendingPreview(null)
    setPreviewingId(null)
  }, [page, workspaceEntered])
  useEffect(() => {
    if (!activeProject) return
    setPendingGeneration(null)
    setResumeGeneration(null)
    const voice = getVoicePreset(activeProject.voiceId)
    setProjectTitle(activeProject.title || '새 프로젝트')
    setVoiceId(activeProject.voiceId)
    const restoredSpeed = normalizeVoiceSpeed(activeProject.speed ?? 1)
    const restoredPitch = normalizeVoicePitch(activeProject.pitch ?? 0)
    setSpeechSpeed(restoredSpeed)
    setSpeechPitch(restoredPitch)
    setSpeechEmotion(activeProject.emotion)
    setComposerDraft(activeProject.text)
    setDirectiveIds(activeProject.normalizeText === false ? [] : ['numbers'])
    setBatchRetrySnapshot({ retryCount: 0, history: [] })
    setMessages([
      initialMessages[0],
      {
        id: createRandomId(),
        role: 'assistant',
        badge: '프로젝트 불러옴',
        text: `${activeProject.title} 내용과 음성 블록을 복원했습니다.`,
      },
    ])
    setPendingPreview(null)
    setPreviewingId(null)
    previewRunIdRef.current += 1
    const recoverableIds = restoreProject(activeProject, {
      voiceId: activeProject.voiceId,
      voiceName: voice.name,
      emotion: activeProject.emotion,
      speed: restoredSpeed,
      pitch: restoredPitch,
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
    speed: normalizeVoiceSpeed(speechSpeed),
    pitch: normalizeVoicePitch(speechPitch),
    engineId: selectedEngineId,
    normalizeText,
  }), [normalizeText, selectedEngineId, selectedVoice.name, speechEmotion, speechPitch, speechSpeed, voiceId])
  const saveLongformProject = useCallback(async (
    text: string,
    options: TimelineGenerationOptions,
    blockIds: string[],
    generated: Array<{ blockId: string; audio: GeneratedAudio }>,
  ) => {
    const first = generated[0]?.audio
    if (!first) return
    const now = new Date().toISOString()
    const blockSnapshots = getVoiceBlockSnapshots(blockIds)
    const timelineClips = blockSnapshots.map((block) => ({
      text: block.text,
      voiceId: block.voiceId,
      voiceName: block.voiceName,
    }))
    await saveProject({
      id: createRandomId(),
      title: projectTitle.trim() && projectTitle.trim() !== '새 프로젝트'
        ? projectTitle.trim()
        : text.replace(/\s+/g, ' ').trim().slice(0, 36) || '새 프로젝트',
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
      jobIds: blockSnapshots.map((block) => block.jobId),
      timelineClips,
    })
  }, [getVoiceBlockSnapshots, projectTitle])
  const generateLongform = useCallback(async (pending: PendingLongformGeneration) => {
    appendMessage({
      role: 'assistant',
      badge: pending.resume ? '이어서 생성' : '빠른 생성',
      text: pending.resume
        ? `남은 ${pending.blockIds.length}개 대사만 이어서 안전하게 생성합니다.`
        : `${pending.blockIds.length}개 대사를 첫 음성부터 들려주고, 나머지는 안전하게 동시 처리합니다.`,
    })
    const batch = await generateAllTimelineBlocks(pending.blockIds, !pending.resume)
    const generated = batch.results
    if (batch.cancelled) {
      const queuedIds = getQueuedVoiceBlockIds(pending.allBlockIds)
      setResumeGeneration(queuedIds.length > 0
        ? { ...pending, blockIds: queuedIds, resume: true }
        : null)
      appendMessage({
        role: 'assistant',
        badge: '생성 중지',
        text: queuedIds.length > 0
          ? `${generated.length}개까지 완성된 상태로 멈췄습니다. 남은 ${queuedIds.length}개는 한 번에 이어서 만들 수 있습니다.`
          : `${generated.length}개까지 완성된 상태로 멈췄습니다. 준비된 음성은 그대로 들을 수 있습니다.`,
      })
      await saveWorkspaceNow()
      return
    }
    setResumeGeneration(null)
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
      text: `${generated.length}개 음성 블록을 원문 순서로 정리해 플레이어와 프로젝트에 연결했습니다.`,
    })
    try {
      await saveLongformProject(pending.text, pending.options, pending.allBlockIds, generated)
      await saveWorkspaceNow()
    } catch {
      showNotice('음성은 완성됐지만 프로젝트 저장에는 실패했습니다.')
    }
  }, [
    appendMessage,
    backendStatus,
    generateAllTimelineBlocks,
    getQueuedVoiceBlockIds,
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
    if (projectTitle.trim() === '새 프로젝트') {
      const suggestedTitle = value.replace(/\s+/g, ' ').trim().slice(0, 36)
      if (suggestedTitle) setProjectTitle(suggestedTitle)
    }
    setPendingGeneration(null)
    setResumeGeneration(null)
    clearTimeline()
    clearQueue()
    const multiSpeakerSegments = speakerAssignmentsConfirmed
      ? buildMultiSpeakerTimelineSegments(
          multiSpeakerAnalysis,
          speakerAssignments,
          options,
          voicePresets,
        )
      : []
    const blockIds = multiSpeakerSegments.length > 0
      ? timeline.stageSegments(multiSpeakerSegments.map((segment) => ({
          text: segment.text,
          options: segment.options,
        })))
      : timeline.stageText(value, options)
    appendMessage({
      role: 'assistant',
      badge: multiSpeakerSegments.length > 0 ? '화자 배정 완료' : '내용 분할 완료',
      text: multiSpeakerSegments.length > 0
        ? `${multiSpeakerAnalysis.speakers.length}명 화자를 ${blockIds.length}개 대사 블록에 적용했습니다.`
        : `${blockIds.length}개 대사 블록으로 정리했습니다. 내용은 위 편집기에 유지됩니다.`,
    })
    const pending = { text: value, options, blockIds, allBlockIds: blockIds }
    if (!engineAvailable) {
      setPendingGeneration(pending)
      appendMessage({
        role: 'assistant',
        badge: '자동 진행',
        text: '대사 블록을 준비했습니다. 다음 단계는 자동으로 이어집니다.',
      })
      requestAutomaticApiReconnect()
      return
    }
    await generateLongform(pending)
  }

  async function resumeLongformGeneration() {
    if (!resumeGeneration || busy) return
    if (!engineAvailable) {
      setPendingGeneration(resumeGeneration)
      requestAutomaticApiReconnect()
      return
    }
    const queuedIds = getQueuedVoiceBlockIds(resumeGeneration.allBlockIds)
    if (queuedIds.length === 0) {
      setResumeGeneration(null)
      return
    }
    await generateLongform({ ...resumeGeneration, blockIds: queuedIds, resume: true })
  }
  const selectVoice = useCallback((nextVoiceId: string) => {
    previewRunIdRef.current += 1
    setPendingPreview(null)
    setPreviewingId(null)
    setVoiceId(getVoicePreset(nextVoiceId).id)
  }, [])

  const previewVoice = useCallback(async (
    nextVoiceId: string,
    sampleText?: string,
    preserveSelection = false,
  ) => {
    const voice = getVoicePreset(nextVoiceId)
    const runId = previewRunIdRef.current + 1
    previewRunIdRef.current = runId
    if (!preserveSelection) setVoiceId(voice.id)
    setPreviewingId(nextVoiceId)

    if (!engineAvailable || !engineCatalog.selected) {
      setPendingPreview((current) => ({
        voiceId: nextVoiceId,
        attempt: current?.voiceId === nextVoiceId ? current.attempt : 0,
        failed: false,
        text: sampleText?.trim().slice(0, 600),
        preserveSelection,
      }))
      requestAutomaticApiReconnect()
      return
    }

    const text = sampleText?.trim().slice(0, 600) || `안녕하세요. 소리온의 ${voice.name} 목소리입니다.`
    try {
      const request: TtsSynthesisRequest = {
        text,
        voiceId: nextVoiceId,
        emotion: speechEmotion,
        speed: normalizeVoiceSpeed(speechSpeed),
        pitch: normalizeVoicePitch(speechPitch),
        format: 'wav',
        engineId: selectedEngineId,
        normalizeText,
      }
      const result = await synthesizeSpeech(request, createRandomId())
      if (previewRunIdRef.current !== runId) return
      const audio = generatedPreview(result, request, voice.name)
      setPendingPreview(null)
      const previewTrackId = enqueueAndPlay(audio, `${voice.name} 프리뷰`)
      setActivePreview({ voiceId: voice.id, trackId: previewTrackId })
      appendMessage({
        role: 'assistant',
        badge: audio.source === 'browser-speech'
          ? '바로 듣기'
          : audio.source === 'browser-demo'
            ? '미리 듣기'
            : audio.result.fallbackUsed
              ? '자동 완성'
              : '목소리 프리뷰',
        text: sampleText
          ? `${voice.name} 설정으로 대본 첫 문장을 미리 들려드립니다.`
          : audio.source === 'browser-speech'
            ? `${voice.name} 설정으로 바로 재생했습니다.`
            : audio.result.fallbackUsed
              ? `${voice.name} 프리뷰를 자동으로 완성했습니다.`
              : `${voice.name} 목소리를 하단 플레이어에 연결했습니다.`,
      })
      setPreviewingId(null)
    } catch {
      if (previewRunIdRef.current !== runId) return
      setPendingPreview((current) => ({
        voiceId: nextVoiceId,
        attempt: current?.voiceId === nextVoiceId ? current.attempt + 1 : 1,
        failed: true,
        text: sampleText?.trim().slice(0, 600),
        preserveSelection,
      }))
      requestAutomaticApiReconnect()
    }
  }, [
    appendMessage,
    engineAvailable,
    engineCatalog.selected,
    enqueueAndPlay,
    normalizeText,
    selectedEngineId,
    speechEmotion,
    speechPitch,
    speechSpeed,
  ])

  function handlePreview(nextVoiceId: string) {
    if (previewingId === nextVoiceId) {
      previewRunIdRef.current += 1
      setPendingPreview(null)
      setPreviewingId(null)
      return
    }
    if (
      activePreview?.voiceId === nextVoiceId
      && playerQueue.some((track) => track.id === activePreview.trackId)
    ) {
      toggleTrack(activePreview.trackId)
      return
    }
    void previewVoice(nextVoiceId)
  }

  function changeSpeakerAssignment(speaker: string, nextVoiceId: string) {
    setSpeakerAssignments((current) => current.map((item) => (
      item.speaker === speaker ? { ...item, voiceId: nextVoiceId } : item
    )))
    setSpeakerAssignmentsConfirmed(false)
  }

  function confirmSpeakerAssignments() {
    if (!multiSpeakerAnalysis.eligible || speakerAssignments.length !== multiSpeakerAnalysis.speakers.length) return
    setSpeakerAssignmentsConfirmed(true)
    appendMessage({
      role: 'assistant',
      badge: '화자 목소리 확인',
      text: `${multiSpeakerAnalysis.speakers.length}명 화자의 목소리 배정을 적용했습니다. 이제 바로 더빙을 만들 수 있습니다.`,
    })
  }

  useEffect(() => {
    if (!activePreview) return
    if (playerQueue.some((track) => track.id === activePreview.trackId)) return
    setActivePreview(null)
  }, [activePreview, playerQueue])

  useEffect(() => {
    if (!pendingPreview) return
    const ready = Boolean(
      engineAvailable
      && engineCatalog.selected
      && previewingId === pendingPreview.voiceId
    )
    const retryDelay = Math.min(1_000 * (2 ** Math.min(pendingPreview.attempt, 4)), 15_000)
    const timer = window.setTimeout(() => {
      if (ready) {
        const voiceIdToRetry = pendingPreview.voiceId
        setPendingPreview(null)
        void previewVoice(voiceIdToRetry, pendingPreview.text, pendingPreview.preserveSelection)
        return
      }
      requestAutomaticApiReconnect()
      setPendingPreview((current) => current ? { ...current, attempt: current.attempt + 1 } : current)
    }, ready && !pendingPreview.failed ? 0 : retryDelay)
    return () => window.clearTimeout(timer)
  }, [engineAvailable, engineCatalog.selected, pendingPreview, previewVoice, previewingId])

  function cancelLongformGeneration() {
    timeline.cancelAllGeneration()
  }

  async function retryBlock(id: string) {
    if (!engineAvailable) {
      requestAutomaticApiReconnect()
      return
    }
    await timeline.retryBlock(id)
  }
  function clearCurrentWork() {
    setPendingGeneration(null)
    setResumeGeneration(null)
    startNewWorkspace()
  }
  if (!workspaceEntered) return <LandingHome />
  const savedLabel = formatSavedLabel(lastSavedAt, hydrated, storageMode === 'memory')
  return (
    <div className="soa-dubbing-workspace">
      <div className="soa-desktop-studio" style={desktopLayout.style}>
        <WorkspaceProjectRail
          currentTitle={projectTitle}
          refreshKey={messages.length + timeline.blocks.length}
          onOpenProject={openProject}
          onNewProject={clearCurrentWork}
          onOpenProjects={() => enterWorkspace('projects')}
          onOpenSettings={() => enterWorkspace('settings')}
          collapsed={desktopLayout.leftCollapsed}
          onToggleCollapsed={desktopLayout.toggleLeft}
        />
        <button
          type="button"
          className="soa-studio-resizer"
          role="separator"
          aria-label="프로젝트 패널 너비 조절"
          aria-orientation="vertical"
          aria-valuemin={188}
          aria-valuemax={360}
          aria-valuenow={desktopLayout.leftWidth}
          aria-valuetext={desktopLayout.leftCollapsed ? '접힘' : `${desktopLayout.leftWidth}픽셀`}
          aria-controls="soa-project-rail"
          disabled={desktopLayout.leftCollapsed}
          onPointerDown={desktopLayout.startLeftResize}
          onKeyDown={desktopLayout.onLeftSeparatorKeyDown}
        />

        <section className="soa-desktop-studio__center" aria-label="채팅 작업공간">
          <DubbingStudioHeader
            title={projectTitle}
            savedLabel={savedLabel}
            downloadHref={currentTrack?.audio.url ?? null}
            downloadName={currentTrack?.audio.filename ?? 'sorion-voice.wav'}
            onTitleChange={setProjectTitle}
            onOpenClone={() => enterWorkspace('clone')}
            onOpenQuality={() => enterWorkspace('quality')}
            onOpenProjects={() => enterWorkspace('projects')}
            onOpenSettings={() => enterWorkspace('settings')}
            sidePanelsCollapsed={desktopLayout.sidePanelsCollapsed}
            onToggleSidePanels={desktopLayout.toggleSidePanels}
            onClear={clearCurrentWork}
          />
          <main className="soa-dubbing-main">
            <LongformComposer
              disabled={busy}
              value={composerDraft}
              activity={activity}
              generationProgress={generationProgress}
              resumeCount={resumeQueuedCount}
              submitBlockedReason={multiSpeakerAnalysis.eligible && !speakerAssignmentsConfirmed
                ? `${multiSpeakerAnalysis.speakers.length}명 화자 목소리를 먼저 확인해 주세요.`
                : null}
              voiceControls={(
                <DubbingVoiceControls
                  voiceId={voiceId}
                  previewingId={previewingId}
                  activePreviewId={activePreviewId}
                  previewPlaying={previewPlaying}
                  speed={speechSpeed}
                  pitch={speechPitch}
                  emotion={speechEmotion}
                  normalizeText={normalizeText}
                  engine={engineCatalog.selected}
                  onVoiceChange={selectVoice}
                  onPreview={handlePreview}
                  onSpeedChange={setSpeechSpeed}
                  onPitchChange={setSpeechPitch}
                  onEmotionChange={setSpeechEmotion}
                  onNormalizeTextChange={(value) => setDirectiveIds(value ? ['numbers'] : [])}
                  onCreateVoice={() => enterWorkspace('clone')}
                />
              )}
              speakerAssist={multiSpeakerAnalysis.eligible ? (
                <SpeakerVoiceAssignmentPanel
                  speakers={multiSpeakerAnalysis.speakers}
                  assignments={speakerAssignments}
                  confirmed={speakerAssignmentsConfirmed}
                  sampleBySpeaker={multiSpeakerAnalysis.sampleBySpeaker}
                  onAssignmentChange={changeSpeakerAssignment}
                  onConfirm={confirmSpeakerAssignments}
                  onPreview={(nextVoiceId, text) => void previewVoice(nextVoiceId, text, true)}
                />
              ) : undefined}
              onAddBlank={() => timeline.addVoiceBlock(buildOptions())}
              onPreviewText={(text) => void previewVoice(voiceId, text)}
              onCancelGeneration={cancelLongformGeneration}
              onResumeGeneration={() => void resumeLongformGeneration()}
              onValueChange={(value) => {
                setResumeGeneration(null)
                setComposerDraft(value)
              }}
              onSubmit={(value) => void handleLongformSubmit(value)}
            />
            <WorkspaceConversation messages={messages} />
            {timeline.blocks.length > 0 ? (
            <TimelineEditor
              blocks={timeline.blocks}
              onMove={timeline.moveBlock}
              onMoveMany={timeline.moveBlocks}
              onReorder={timeline.reorderBlock}
              onSplit={timeline.splitBlock}
              onUpdateText={timeline.updateText}
              onRetry={(id) => void retryBlock(id)}
              onAddVoice={() => timeline.addVoiceBlock(buildOptions())}
              onAddPause={timeline.addPause}
              onRemove={timeline.removeBlock}
              onRemoveMany={timeline.removeBlocks}
              onBatchVoiceChange={async (ids, nextVoiceId, regenerate) => {
                const voice = getVoicePreset(nextVoiceId)
                timeline.updateVoiceMany(ids, voice.id, voice.name)
                return regenerate ? timeline.regenerateMany(ids) : null
              }}
              onRegenerateMany={timeline.regenerateMany}
              onClear={() => {
                setPendingGeneration(null)
                setResumeGeneration(null)
                timeline.clear()
              }}
              onVerifyAndRegenerate={() => void sttVerification.run()}
              sttBusy={sttVerification.busy}
              batchRetrySnapshot={batchRetrySnapshot}
              onBatchRetrySnapshotChange={setBatchRetrySnapshot}
            />
            ) : null}
          </main>
        </section>

        <button
          type="button"
          className="soa-studio-resizer"
          role="separator"
          aria-label="보이스 패널 너비 조절"
          aria-orientation="vertical"
          aria-valuemin={248}
          aria-valuemax={420}
          aria-valuenow={desktopLayout.rightWidth}
          aria-valuetext={desktopLayout.rightCollapsed ? '접힘' : `${desktopLayout.rightWidth}픽셀`}
          aria-controls="soa-voice-drawer"
          disabled={desktopLayout.rightCollapsed}
          onPointerDown={desktopLayout.startRightResize}
          onKeyDown={desktopLayout.onRightSeparatorKeyDown}
        />
        <DesktopVoiceDrawer
          voiceId={voiceId}
          previewingId={previewingId}
          activePreviewId={activePreviewId}
          previewPlaying={previewPlaying}
          speed={speechSpeed}
          pitch={speechPitch}
          emotion={speechEmotion}
          normalizeText={normalizeText}
          onVoiceChange={selectVoice}
          onPreview={handlePreview}
          onSpeedChange={setSpeechSpeed}
          onPitchChange={setSpeechPitch}
          onEmotionChange={setSpeechEmotion}
          onNormalizeTextChange={(value) => setDirectiveIds(value ? ['numbers'] : [])}
          onCreateVoice={() => enterWorkspace('clone')}
          collapsed={desktopLayout.rightCollapsed}
          onToggleCollapsed={desktopLayout.toggleRight}
        />
      </div>
    </div>
  )
}
