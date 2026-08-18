import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { TtsSynthesisRequest, VoiceEmotion } from '../ai/contracts'
import { requestAutomaticApiReconnect } from '../api/httpClient'
import { isKakaoInAppBrowser } from '../browser/inAppBrowser'
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
import { useMyVoiceProfiles } from '../hooks/useMyVoiceProfiles'
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
  createBrowserSpeechUtterance,
  isBrowserSpeechSupported,
} from '../tts/browserSpeech'
import type { GeneratedAudio } from '../tts/generationTypes'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import { synthesizeSpeech } from '../tts/voiceApi'
import { getVoicePreset, voicePresets } from '../tts/voicePresets'
import { clampVoiceSettingsToNaturalRange } from '../tts/voiceRecommendation'
import { createRandomId } from '../utils/randomId'
import { formatEngineRoutingTrace } from '../workspace/engineRoutingTrace'
import {
  analyzeMultiSpeakerScript,
  buildMultiSpeakerTimelineSegments,
  suggestSpeakerVoiceAssignments,
  type SpeakerVoiceAssignment,
} from '../workspace/multiSpeaker'
import type { WorkspaceBatchRetrySnapshot, WorkspaceSession } from '../workspace/sessionTypes'
import {
  getRememberedSpeakerVoiceMap,
  rememberSpeakerVoiceAssignments,
} from '../workspace/speakerVoiceMemory'
import { clearWorkspaceSession } from '../workspace/workspaceSessionRepository'
import type { ComposerDirective, TimelineVoiceBlock, WorkspaceMessage } from '../workspace/workspaceTypes'
import { normalizeVoicePitch, normalizeVoiceSpeed } from '../voice/voiceControlOptions'
import { synthesizeVoiceCloneProfile } from '../voiceclone/voiceCloneSynthesis'
import { isMyVoiceId, toMyVoiceId } from '../voiceclone/voiceIdentity'
import { buildVoiceChoices, resolveVoiceChoice } from '../voice/voiceChoices'
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
      ...(isMyVoiceId(request.voiceId) ? {} : { rehydration: { kind: 'tts-final' as const, jobId: result.jobId } }),
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
  const setLiveVoice = useAppStore((state) => state.setLiveVoice)
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
  const [speakerSeedVoiceId, setSpeakerSeedVoiceId] = useState(voicePresets[0].id)
  const [selectedTimelineIds, setSelectedTimelineIds] = useState<string[]>([])
  const [speechSpeed, setSpeechSpeed] = useState(1)
  const [speechPitch, setSpeechPitch] = useState(0)
  const [speechEmotion, setSpeechEmotion] = useState<VoiceEmotion>('neutral')
  const [composerDraft, setComposerDraft] = useState('')
  const [directiveIds, setDirectiveIds] = useState<ComposerDirective['id'][]>(['numbers'])
  const [batchRetrySnapshot, setBatchRetrySnapshot] = useState<WorkspaceBatchRetrySnapshot>({ retryCount: 0, history: [] })
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [activePreview, setActivePreview] = useState<{ voiceId: string; trackId: string } | null>(null)
  const [directBrowserPreview, setDirectBrowserPreview] = useState<{ voiceId: string; playing: boolean } | null>(null)
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
  const [rememberedSpeakerVoices, setRememberedSpeakerVoices] = useState<Record<string, string>>({})
  const observedResetTokenRef = useRef(workspaceResetToken)
  const pendingResetSaveRef = useRef<number | null>(null)
  const explicitWorkspaceActionRef = useRef(false)
  const previewRunIdRef = useRef(0)
  const previewAbortRef = useRef<AbortController | null>(null)
  const directPreviewRunIdRef = useRef(0)
  const directPreviewWatchdogRef = useRef<number | null>(null)
  const stopDirectBrowserPreview = useCallback((resetState = true) => {
    directPreviewRunIdRef.current += 1
    if (directPreviewWatchdogRef.current !== null) {
      window.clearTimeout(directPreviewWatchdogRef.current)
      directPreviewWatchdogRef.current = null
    }
    if (isBrowserSpeechSupported()) window.speechSynthesis.cancel()
    if (resetState) setDirectBrowserPreview(null)
  }, [])

  const startKakaoBrowserPreview = useCallback((request: TtsSynthesisRequest, nextVoiceId: string) => {
    if (!isKakaoInAppBrowser() || !isBrowserSpeechSupported()) return false
    stopDirectBrowserPreview(false)
    const runId = directPreviewRunIdRef.current + 1
    directPreviewRunIdRef.current = runId
    let utterance: SpeechSynthesisUtterance
    try {
      utterance = createBrowserSpeechUtterance(createBrowserSpeechPlayback(request))
    } catch (error) {
      setPreviewingId(null)
      setDirectBrowserPreview(null)
      showNotice(error instanceof Error
        ? error.message
        : '카카오톡 브라우저에서 사용할 수 있는 한국어 음성을 찾지 못했습니다.')
      return true
    }
    let started = false
    utterance.onstart = () => {
      if (directPreviewRunIdRef.current !== runId) return
      started = true
      if (directPreviewWatchdogRef.current !== null) {
        window.clearTimeout(directPreviewWatchdogRef.current)
        directPreviewWatchdogRef.current = null
      }
      setPreviewingId(null)
      setDirectBrowserPreview({ voiceId: nextVoiceId, playing: true })
    }
    const finish = () => {
      if (directPreviewRunIdRef.current !== runId) return
      if (directPreviewWatchdogRef.current !== null) {
        window.clearTimeout(directPreviewWatchdogRef.current)
        directPreviewWatchdogRef.current = null
      }
      setPreviewingId(null)
      setDirectBrowserPreview(null)
    }
    utterance.onend = finish
    utterance.onerror = () => {
      finish()
      showNotice('카카오톡 브라우저가 음성 재생을 차단했습니다. 외부 브라우저로 열면 안정적으로 들을 수 있습니다.')
    }
    try {
      // Kakao mobile WebView needs speak() to stay inside the original tap gesture.
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch {
      finish()
      showNotice('카카오톡 브라우저가 음성 재생을 시작하지 못했습니다. 외부 브라우저로 열어 주세요.')
      return true
    }
    directPreviewWatchdogRef.current = window.setTimeout(() => {
      if (directPreviewRunIdRef.current !== runId || started) return
      window.speechSynthesis.cancel()
      setPreviewingId(null)
      setDirectBrowserPreview(null)
      showNotice('카카오톡 브라우저에서 음성 시작 응답이 없습니다. 외부 브라우저로 열어 주세요.')
    }, 1_800)
    return true
  }, [showNotice, stopDirectBrowserPreview])

  const engineCatalog = useEngineCatalog()
  const { profiles: myVoiceProfiles, loading: myVoiceProfilesLoading } = useMyVoiceProfiles()
  const voiceChoices = useMemo(() => buildVoiceChoices(myVoiceProfiles), [myVoiceProfiles])
  const timeline = useTimelineGeneration()
  const generateAllTimelineBlocks = timeline.generateAll
  const recoverBlocks = timeline.recoverBlocks
  const restoreProject = timeline.restoreProject
  const restoreSession = timeline.restoreSession
  const clearTimeline = timeline.clear
  const resetTimelineEditHistory = timeline.resetEditHistory
  const getQueuedVoiceBlockIds = timeline.getQueuedVoiceBlockIds
  const getVoiceBlockSnapshots = timeline.getVoiceBlockSnapshots
  const updateTimelineVoices = timeline.updateVoiceMany
  const selectedVoice = useMemo(() => resolveVoiceChoice(voiceChoices, voiceId), [voiceChoices, voiceId])
  const selectedTimelineVoiceBlocks = useMemo(() => {
    if (selectedTimelineIds.length === 0) return []
    const selected = new Set(selectedTimelineIds)
    return timeline.blocks.filter(
      (block): block is TimelineVoiceBlock => block.kind === 'voice' && selected.has(block.id),
    )
  }, [selectedTimelineIds, timeline.blocks])
  const selectedTimelineVoiceIds = useMemo(
    () => selectedTimelineVoiceBlocks.map((block) => block.id),
    [selectedTimelineVoiceBlocks],
  )
  const selectedTimelineVoiceScope = useMemo(() => {
    if (selectedTimelineVoiceBlocks.length === 0) return null
    const names = Array.from(new Set(selectedTimelineVoiceBlocks.map((block) => block.voiceName)))
    return names.length === 1
      ? `${selectedTimelineVoiceBlocks.length}개 · ${names[0]}`
      : `${selectedTimelineVoiceBlocks.length}개 · 여러 목소리`
  }, [selectedTimelineVoiceBlocks])
  const activePreviewExists = Boolean(
    activePreview && playerQueue.some((track) => track.id === activePreview.trackId),
  )
  const activePreviewId = directBrowserPreview?.voiceId
    ?? (activePreviewExists ? activePreview?.voiceId ?? null : null)
  const previewPlaying = directBrowserPreview?.playing
    ?? Boolean(
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
  const generationRouteReady = selectedVoice.kind === 'my-voice'
    ? selectedVoice.ready && backendStatus !== 'offline'
    : engineAvailable

  useEffect(() => {
    if (selectedTimelineVoiceBlocks.length === 0) return
    const selectedVoiceIds = Array.from(new Set<string>(selectedTimelineVoiceBlocks.map((block) => block.voiceId)))
    if (selectedVoiceIds.length !== 1 || selectedVoiceIds[0] === voiceId) return
    const nextVoice = resolveVoiceChoice(voiceChoices, selectedVoiceIds[0])
    if (nextVoice.kind === 'my-voice' && !nextVoice.ready) return
    setVoiceId(nextVoice.id)
  }, [selectedTimelineVoiceBlocks, voiceChoices, voiceId])

  useEffect(() => {
    if (myVoiceProfilesLoading || !isMyVoiceId(voiceId)) return
    const selectedProfileStillExists = myVoiceProfiles.some((profile) => toMyVoiceId(profile.id) === voiceId)
    if (selectedProfileStillExists) return
    setVoiceId(voicePresets[0].id)
    setSpeakerSeedVoiceId(voicePresets[0].id)
    showNotice('선택했던 내 목소리 프로필을 찾지 못해 기본 목소리로 전환했습니다.')
  }, [myVoiceProfiles, myVoiceProfilesLoading, showNotice, voiceId])
  useEffect(() => {
    const engine = engineCatalog.selected
    const customVoice = selectedVoice.kind === 'my-voice'
    const readiness = busy
      ? 'generating'
      : customVoice
        ? backendStatus === 'offline' ? 'offline' : selectedVoice.ready ? 'ready' : 'limited'
        : backendStatus === 'offline'
          ? 'offline'
          : engineCatalog.loading
            ? 'checking'
            : backendStatus === 'degraded'
              ? 'limited'
              : engineAvailable
                ? 'ready'
                : 'checking'
    const detail = readiness === 'generating'
      ? `${selectedVoice.name} 목소리로 생성 중입니다.`
      : customVoice && selectedVoice.ready
        ? '내 목소리 프로필이 실제 생성 엔진에 연결되었습니다.'
        : customVoice
          ? '내 목소리 엔진 준비 상태를 확인해 주세요.'
          : readiness === 'ready'
            ? '음성 생성 준비가 끝났습니다.'
            : readiness === 'limited'
              ? '대체 음성 엔진으로 사용할 수 있습니다.'
              : readiness === 'offline'
                ? '음성 엔진 연결을 복구하고 있습니다.'
                : '사용 가능한 음성 엔진을 확인하고 있습니다.'

    setLiveVoice({
      voiceId,
      voiceName: selectedVoice.name,
      voiceKind: customVoice ? 'my-voice' : 'preset',
      engineId: customVoice ? selectedVoice.profile?.engineId ?? null : engine?.id ?? null,
      engineName: customVoice ? '내 목소리 엔진' : engine?.name ?? '자동 엔진',
      readiness,
      detail,
    })
  }, [backendStatus, busy, engineAvailable, engineCatalog.loading, engineCatalog.selected, selectedVoice, setLiveVoice, voiceId])
  const multiSpeakerAnalysis = useMemo(
    () => analyzeMultiSpeakerScript(composerDraft),
    [composerDraft],
  )
  const speakerSignature = multiSpeakerAnalysis.speakers.join('\u001f')

  useEffect(() => {
    if (!multiSpeakerAnalysis.eligible) {
      setSpeakerAssignments([])
      setSpeakerAssignmentsConfirmed(false)
      setRememberedSpeakerVoices({})
      return
    }
    const remembered = getRememberedSpeakerVoiceMap(multiSpeakerAnalysis.speakers)
    setRememberedSpeakerVoices(Object.fromEntries(remembered))
    setSpeakerAssignments((current) => {
      const currentMap = new Map(current.map((item) => [item.speaker, item.voiceId]))
      const suggested = suggestSpeakerVoiceAssignments(
        multiSpeakerAnalysis.speakers,
        isMyVoiceId(speakerSeedVoiceId) ? voicePresets[0].id : speakerSeedVoiceId,
        voicePresets,
      )
      return suggested.map((item) => ({
        ...item,
        voiceId: currentMap.get(item.speaker) ?? remembered.get(item.speaker) ?? item.voiceId,
      }))
    })
    setSpeakerAssignmentsConfirmed(false)
  }, [speakerSignature, multiSpeakerAnalysis.eligible, multiSpeakerAnalysis.speakers, speakerSeedVoiceId])
  const restoreWorkspaceSession = useCallback((session: WorkspaceSession) => {
    if (explicitWorkspaceActionRef.current || useAppStore.getState().activeProject) return
    setProjectTitle(session.projectTitle || '새 프로젝트')
    const restoredVoiceId = isMyVoiceId(session.voiceId) ? session.voiceId : getVoicePreset(session.voiceId).id
    setVoiceId(restoredVoiceId)
    setSpeakerSeedVoiceId(restoredVoiceId)
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
    resetTimelineEditHistory()
    clearQueue()
    setProjectTitle('새 프로젝트')
    setMessages(initialMessages)
    setVoiceId(voicePresets[0].id)
    setSpeakerSeedVoiceId(voicePresets[0].id)
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
    previewAbortRef.current?.abort()
    stopDirectBrowserPreview()
  }, [clearQueue, clearTimeline, resetTimelineEditHistory, stopDirectBrowserPreview, workspaceResetToken])
  useEffect(() => {
    if (pendingResetSaveRef.current !== workspaceResetToken) return
    pendingResetSaveRef.current = null
    void clearWorkspaceSession().then(saveWorkspaceNow)
  }, [saveWorkspaceNow, workspaceResetToken])
  useEffect(() => {
    if (workspaceEntered && page === 'home') return
    previewRunIdRef.current += 1
    previewAbortRef.current?.abort()
    setPendingPreview(null)
    setPreviewingId(null)
    stopDirectBrowserPreview()
  }, [page, stopDirectBrowserPreview, workspaceEntered])
  useEffect(() => {
    if (!activeProject) return
    setPendingGeneration(null)
    setResumeGeneration(null)
    const voice = resolveVoiceChoice(voiceChoices, activeProject.voiceId)
    setProjectTitle(activeProject.title || '새 프로젝트')
    setVoiceId(activeProject.voiceId)
    setSpeakerSeedVoiceId(activeProject.voiceId)
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
    previewAbortRef.current?.abort()
    stopDirectBrowserPreview()
    const recoverableIds = restoreProject(activeProject, {
      voiceId: activeProject.voiceId,
      voiceName: voice.name,
      emotion: activeProject.emotion,
      speed: restoredSpeed,
      pitch: restoredPitch,
      engineId: voice.kind === 'my-voice' ? voice.profile?.engineId ?? 'cosyvoice3-worker' : 'auto',
      normalizeText: activeProject.normalizeText ?? true,
    })
    setPendingRecoveryIds(recoverableIds)
    clearActiveProject()
  }, [activeProject, clearActiveProject, restoreProject, stopDirectBrowserPreview, voiceChoices])
  useEffect(() => {
    if (!generationRouteReady || pendingRecoveryIds.length === 0) return
    const ids = pendingRecoveryIds
    setPendingRecoveryIds([])
    void recoverBlocks(ids)
  }, [generationRouteReady, pendingRecoveryIds, recoverBlocks])
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
    engineId: selectedVoice.kind === 'my-voice'
      ? selectedVoice.profile?.engineId ?? 'cosyvoice3-worker'
      : selectedEngineId,
    normalizeText,
  }), [normalizeText, selectedEngineId, selectedVoice, speechEmotion, speechPitch, speechSpeed, voiceId])
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
      text: `${generated.length}개 음성 블록을 원문 순서로 정리해 플레이어와 프로젝트에 연결했습니다. 엔진 기록 · ${formatEngineRoutingTrace(batch.routing)}`,
    })
    try {
      await saveLongformProject(pending.text, pending.options, pending.allBlockIds, generated)
      await saveWorkspaceNow()
    } catch {
      showNotice('음성은 완성됐지만 프로젝트 저장에는 실패했습니다.')
    }
  }, [
    appendMessage,
    generateAllTimelineBlocks,
    getQueuedVoiceBlockIds,
    saveLongformProject,
    saveWorkspaceNow,
    showNotice,
  ])
  useEffect(() => {
    if (!generationRouteReady || !pendingGeneration || busy) return
    const pending = pendingGeneration
    setPendingGeneration(null)
    void generateLongform(pending)
  }, [busy, generateLongform, generationRouteReady, pendingGeneration])
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
    if (!generationRouteReady) {
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
    if (!generationRouteReady) {
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
    stopDirectBrowserPreview()
    previewRunIdRef.current += 1
    previewAbortRef.current?.abort()
    setPendingPreview(null)
    setPreviewingId(null)
    const voice = resolveVoiceChoice(voiceChoices, nextVoiceId)
    if (voice.kind === 'my-voice' && !voice.ready) {
      showNotice(`${voice.name}은(는) 아직 내 목소리 엔진 준비가 필요합니다.`)
      return
    }
    setVoiceId(voice.id)
    if (voice.kind === 'preset') {
      const preset = getVoicePreset(voice.id)
      setSpeechSpeed((current) => clampVoiceSettingsToNaturalRange(preset, current, speechPitch).speed)
      setSpeechPitch((current) => clampVoiceSettingsToNaturalRange(preset, speechSpeed, current).pitch)
    } else {
      setSpeechSpeed(1)
      setSpeechPitch(0)
      setSpeechEmotion('neutral')
    }
    if (selectedTimelineVoiceIds.length > 0) {
      updateTimelineVoices(selectedTimelineVoiceIds, voice.id, voice.name)
      showNotice(`선택한 대사 ${selectedTimelineVoiceIds.length}개에 ${voice.name} 목소리를 적용했습니다.`)
    } else {
      setSpeakerSeedVoiceId(voice.id)
    }
  }, [selectedTimelineVoiceIds, showNotice, speechPitch, speechSpeed, stopDirectBrowserPreview, updateTimelineVoices, voiceChoices])

  const previewVoice = useCallback(async (
    nextVoiceId: string,
    sampleText?: string,
    preserveSelection = false,
  ) => {
    const voice = resolveVoiceChoice(voiceChoices, nextVoiceId)
    if (voice.kind === 'my-voice' && !voice.ready) {
      showNotice(`${voice.name}은(는) 아직 생성 준비가 완료되지 않았습니다.`)
      return
    }
    if (voice.kind === 'my-voice' && backendStatus === 'offline') {
      requestAutomaticApiReconnect()
      showNotice('내 목소리 엔진 연결을 복구하고 있습니다. 잠시 후 다시 미리들어 주세요.')
      return
    }
    const runId = previewRunIdRef.current + 1
    previewRunIdRef.current = runId
    previewAbortRef.current?.abort()
    const controller = new AbortController()
    previewAbortRef.current = controller
    if (!preserveSelection) setVoiceId(voice.id)
    setPreviewingId(nextVoiceId)

    if (voice.kind === 'preset' && (!engineAvailable || !engineCatalog.selected)) {
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
        voiceId: voice.id,
        emotion: voice.kind === 'my-voice' ? 'neutral' : speechEmotion,
        speed: voice.kind === 'my-voice' ? 1 : normalizeVoiceSpeed(speechSpeed),
        pitch: voice.kind === 'my-voice' ? 0 : normalizeVoicePitch(speechPitch),
        format: 'wav',
        engineId: voice.kind === 'my-voice'
          ? voice.profile?.engineId ?? 'cosyvoice3-worker'
          : selectedEngineId,
        normalizeText,
      }
      if (
        voice.kind === 'preset'
        && selectedEngineId === BROWSER_SPEECH_ENGINE_ID
        && startKakaoBrowserPreview(request, voice.id)
      ) {
        setPendingPreview(null)
        appendMessage({
          role: 'assistant',
          badge: '모바일 바로 듣기',
          text: `${voice.name} 목소리를 카카오톡 모바일 재생 경로로 바로 시작했습니다.`,
        })
        return
      }
      const result = voice.kind === 'my-voice'
        ? await synthesizeVoiceCloneProfile({
            profileId: voice.profile?.id ?? '',
            text,
            signal: controller.signal,
          })
        : await synthesizeSpeech(request, createRandomId(), controller.signal)
      if (!result || previewRunIdRef.current !== runId || controller.signal.aborted) return
      const audio = generatedPreview(result, request, voice.name)
      setPendingPreview(null)
      const previewTrackId = enqueueAndPlay(audio, `${voice.name} 프리뷰`)
      setActivePreview({ voiceId: voice.id, trackId: previewTrackId })
      appendMessage({
        role: 'assistant',
        badge: voice.kind === 'my-voice'
          ? 'MY VOICE'
          : audio.source === 'browser-speech'
            ? '바로 듣기'
            : audio.source === 'browser-demo'
              ? '미리 듣기'
              : audio.result.fallbackUsed
                ? '자동 완성'
                : '목소리 프리뷰',
        text: voice.kind === 'my-voice'
          ? `${voice.name} 프로필로 실제 내 목소리 테스트 음성을 만들었습니다.`
          : sampleText
            ? `${voice.name} 설정으로 대본 첫 문장을 미리 들려드립니다.`
            : audio.source === 'browser-speech'
              ? `${voice.name} 설정으로 바로 재생했습니다.`
              : audio.result.fallbackUsed
                ? `${voice.name} 프리뷰를 자동으로 완성했습니다.`
                : `${voice.name} 목소리를 하단 플레이어에 연결했습니다.`,
      })
      setPreviewingId(null)
    } catch {
      if (previewRunIdRef.current !== runId || controller.signal.aborted) return
      if (voice.kind === 'my-voice') {
        setPendingPreview(null)
        setPreviewingId(null)
        showNotice(`${voice.name} 내 목소리 생성에 실패했습니다. 엔진 상태를 확인해 주세요.`)
        return
      }
      setPendingPreview((current) => ({
        voiceId: nextVoiceId,
        attempt: current?.voiceId === nextVoiceId ? current.attempt + 1 : 1,
        failed: true,
        text: sampleText?.trim().slice(0, 600),
        preserveSelection,
      }))
      requestAutomaticApiReconnect()
    } finally {
      if (previewAbortRef.current === controller) previewAbortRef.current = null
    }
  }, [
    appendMessage,
    backendStatus,
    engineAvailable,
    engineCatalog.selected,
    enqueueAndPlay,
    normalizeText,
    selectedEngineId,
    showNotice,
    speechEmotion,
    speechPitch,
    speechSpeed,
    startKakaoBrowserPreview,
    voiceChoices,
  ])


  function handlePreview(nextVoiceId: string) {
    if (directBrowserPreview?.voiceId === nextVoiceId) {
      stopDirectBrowserPreview()
      return
    }
    if (previewingId === nextVoiceId) {
      stopDirectBrowserPreview()
      previewRunIdRef.current += 1
      previewAbortRef.current?.abort()
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
    void previewVoice(nextVoiceId, undefined, true)
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
    rememberSpeakerVoiceAssignments(speakerAssignments)
    setRememberedSpeakerVoices(Object.fromEntries(
      speakerAssignments.map((item) => [item.speaker, item.voiceId]),
    ))
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

  useEffect(() => () => {
    stopDirectBrowserPreview(false)
  }, [stopDirectBrowserPreview])

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
    const block = timeline.blocks.find((item) => item.id === id)
    const blockVoice = block?.kind === 'voice' ? resolveVoiceChoice(voiceChoices, block.voiceId) : null
    if (blockVoice?.kind === 'my-voice') {
      if (!blockVoice.ready || backendStatus === 'offline') {
        requestAutomaticApiReconnect()
        showNotice('이 대사의 내 목소리 엔진 준비 상태를 확인해 주세요.')
        return
      }
    } else if (!engineAvailable) {
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
                  voiceChoices={voiceChoices}
                  scriptText={composerDraft}
                  previewingId={previewingId}
                  activePreviewId={activePreviewId}
                  previewPlaying={previewPlaying}
                  speed={speechSpeed}
                  pitch={speechPitch}
                  emotion={speechEmotion}
                  normalizeText={normalizeText}
                  engine={engineCatalog.selected}
                  applyTargetCount={selectedTimelineVoiceIds.length}
                  applyTargetLabel={selectedTimelineVoiceScope}
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
                  rememberedVoiceBySpeaker={rememberedSpeakerVoices}
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
            {timeline.blocks.length > 0 || timeline.canUndo || timeline.canRedo ? (
            <TimelineEditor
              blocks={timeline.blocks}
              voiceChoices={voiceChoices}
              currentVoiceId={voiceId}
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
              onBatchVoiceChange={async (ids, nextVoiceId, regenerate, reason = 'batch') => {
                const voice = resolveVoiceChoice(voiceChoices, nextVoiceId)
                if (voice.kind === 'my-voice' && (!voice.ready || backendStatus === 'offline')) {
                  requestAutomaticApiReconnect()
                  showNotice('선택한 내 목소리 엔진이 아직 준비되지 않았습니다.')
                  return null
                }
                if (voice.kind === 'preset' && regenerate && !engineAvailable) {
                  requestAutomaticApiReconnect()
                  return null
                }
                setVoiceId(voice.id)
                timeline.updateVoiceMany(
                  ids,
                  voice.id,
                  voice.name,
                  reason === 'recovery'
                    ? (ids.length > 1 ? '사용 불가 목소리 일괄 복구' : '사용 불가 목소리 복구')
                    : '선택 클립 목소리 변경',
                )
                return regenerate ? timeline.regenerateMany(ids) : null
              }}
              onSelectionChange={setSelectedTimelineIds}
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
              canUndo={timeline.canUndo}
              canRedo={timeline.canRedo}
              undoLabel={timeline.undoLabel}
              redoLabel={timeline.redoLabel}
              onUndo={timeline.undoEdit}
              onRedo={timeline.redoEdit}
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
          voiceChoices={voiceChoices}
          previewingId={previewingId}
          activePreviewId={activePreviewId}
          previewPlaying={previewPlaying}
          speed={speechSpeed}
          pitch={speechPitch}
          emotion={speechEmotion}
          normalizeText={normalizeText}
          applyTargetCount={selectedTimelineVoiceIds.length}
          applyTargetLabel={selectedTimelineVoiceScope}
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
