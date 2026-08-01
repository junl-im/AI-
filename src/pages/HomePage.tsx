import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { TtsSynthesisRequest, VoiceEmotion } from '../ai/contracts'
import {
  getApiConnectionContext,
  requestAutomaticApiReconnect,
} from '../api/httpClient'
import { LongformComposer } from '../components/workspace/LongformComposer'
import { TimelineEditor } from '../components/workspace/TimelineEditor'
import { VoiceLibrary } from '../components/workspace/VoiceLibrary'
import { useEngineCatalog } from '../hooks/useEngineCatalog'
import {
  useTimelineGeneration,
  type TimelineGenerationOptions,
} from '../hooks/useTimelineGeneration'
import { useWorkspaceSessionPersistence } from '../hooks/useWorkspaceSessionPersistence'
import { saveProject } from '../projects/projectRepository'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { buildAudioFilename } from '../tts/audioFile'
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
    text: '대본·오디오북·강의 원고를 붙여 넣으세요. 원문은 유지한 채 문장별 음성 블록으로 나눕니다.',
  },
]

function generatedPreview(
  result: Awaited<ReturnType<typeof synthesizeSpeech>>,
  text: string,
  voiceId: string,
  voiceName: string,
): GeneratedAudio {
  if (result.audioUrl) {
    return {
      url: result.audioUrl,
      filename: buildAudioFilename(text, voiceName, 'wav'),
      source: 'api',
      durationSeconds: result.estimatedDurationSeconds,
      result,
    }
  }
  const blob = createMockWave(text, voiceId)
  return {
    url: URL.createObjectURL(blob),
    filename: buildAudioFilename(text, voiceName, 'wav'),
    source: 'browser-demo',
    durationSeconds: getMockWaveDuration(text),
    revokeOnRemove: true,
    result: {
      ...result,
      message: 'Mock 엔진 프리뷰입니다. 실제 AI 음성이 아닙니다.',
      fileSizeBytes: blob.size,
    },
  }
}

function requestedEmotion(directives: ComposerDirective[]): VoiceEmotion {
  if (directives.some((directive) => directive.id === 'commercial')) return 'commercial'
  if (directives.some((directive) => directive.id === 'bright')) return 'happy'
  return 'neutral'
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
  const enqueue = usePlayerStore((state) => state.enqueue)
  const clearQueue = usePlayerStore((state) => state.clearQueue)
  const [messages, setMessages] = useState<WorkspaceMessage[]>(initialMessages)
  const [voiceId, setVoiceId] = useState(voicePresets[0].id)
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

  const restoreWorkspaceSession = useCallback((session: WorkspaceSession) => {
    if (explicitWorkspaceActionRef.current || useAppStore.getState().activeProject) return
    setVoiceId(getVoicePreset(session.voiceId).id)
    setComposerDraft(session.composerDraft)
    setDirectiveIds(session.directiveIds.length > 0 ? session.directiveIds : ['numbers'])
    setMessages(session.messages.length > 0 ? session.messages : initialMessages)
    setPendingRecoveryIds(restoreSession(session.blocks))
    if (session.workspaceEntered) enterWorkspace(session.page)
  }, [enterWorkspace, restoreSession])

  const notifyPersistenceUnavailable = useCallback(() => {
    showNotice('이 브라우저에서는 작업공간 자동 저장을 유지할 수 없습니다.')
  }, [showNotice])

  const { saveNow: saveWorkspaceNow } = useWorkspaceSessionPersistence({
    workspaceEntered,
    page,
    voiceId,
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
    setMessages(initialMessages)
    setVoiceId(voicePresets[0].id)
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
    setVoiceId(activeProject.voiceId)
    setComposerDraft(activeProject.text)
    setDirectiveIds(activeProject.normalizeText === false ? [] : ['numbers'])
    setMessages([
      initialMessages[0],
      {
        id: createRandomId(),
        role: 'assistant',
        badge: '프로젝트 불러옴',
        text: `${activeProject.title} 원고와 타임라인을 복원했습니다.`,
      },
    ])
    const recoverableIds = restoreProject(activeProject, {
      voiceId: activeProject.voiceId,
      voiceName: voice.name,
      emotion: activeProject.emotion,
      speed: activeProject.speed ?? 1,
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

  const buildOptions = useCallback((directives: ComposerDirective[]): TimelineGenerationOptions => {
    const emotion = requestedEmotion(directives)
    const speed = directives.some((directive) => directive.id === 'slow') ? 0.88 : 1
    return {
      voiceId,
      voiceName: selectedVoice.name,
      emotion: engineCatalog.selected && !engineCatalog.selected.supportsEmotion
        ? 'neutral'
        : emotion,
      speed: engineCatalog.selected && !engineCatalog.selected.supportsSpeed ? 1 : speed,
      engineId: 'auto',
      normalizeText: directives.some((directive) => directive.id === 'numbers'),
    }
  }, [engineCatalog.selected, selectedVoice.name, voiceId])

  const saveLongformProject = useCallback(async (
    text: string,
    options: TimelineGenerationOptions,
    blockIds: string[],
    generated: Awaited<ReturnType<typeof timeline.generateAll>>,
  ) => {
    const first = generated[0]?.audio
    if (!first) return
    const completedByBlock = new Map(
      generated.map((item) => [item.blockId, item.audio.result.jobId]),
    )
    const now = new Date().toISOString()
    await saveProject({
      id: createRandomId(),
      title: text.replace(/\s+/g, ' ').slice(0, 36),
      text,
      voiceId: options.voiceId,
      emotion: options.emotion,
      createdAt: now,
      updatedAt: now,
      status: 'generated',
      lastJobId: first.result.jobId,
      engineId: first.result.engineId,
      engineMode: first.result.engineMode,
      audioSource: first.source,
      outputFormat: 'wav',
      speed: options.speed,
      normalizeText: options.normalizeText,
      jobIds: blockIds.map((blockId) => completedByBlock.get(blockId) ?? null),
    })
  }, [])

  const generateLongform = useCallback(async (pending: PendingLongformGeneration) => {
    appendMessage({
      role: 'assistant',
      badge: backendStatus === 'degraded' ? '대체 엔진' : '순차 생성',
      text: `${pending.blockIds.length}개 블록을 앞에서부터 생성합니다. 완성된 블록은 즉시 Dock에서 재생할 수 있습니다.`,
    })
    const generated = await timeline.generateAll(pending.blockIds)
    if (generated.length === 0) {
      appendMessage({
        role: 'system',
        badge: '생성 실패',
        text: '완성된 음성이 없습니다. 실패한 타임라인 블록에서 재시도해 주세요.',
      })
      return
    }
    appendMessage({
      role: 'assistant',
      badge: '제작 완료',
      text: `${generated.length}개 음성 블록을 재생 대기열과 프로젝트에 연결했습니다.`,
    })
    try {
      await saveLongformProject(
        pending.text,
        pending.options,
        pending.blockIds,
        generated,
      )
    } catch {
      showNotice('음성은 완성됐지만 프로젝트 저장에는 실패했습니다.')
    }
  }, [appendMessage, backendStatus, saveLongformProject, showNotice, timeline.generateAll])

  useEffect(() => {
    if (!engineAvailable || !pendingGeneration || busy) return
    const pending = pendingGeneration
    setPendingGeneration(null)
    void generateLongform(pending)
  }, [busy, engineAvailable, generateLongform, pendingGeneration])

  async function handleLongformSubmit(value: string, directives: ComposerDirective[]) {
    const options = buildOptions(directives)
    setPendingGeneration(null)
    clearTimeline()
    clearQueue()
    const blockIds = timeline.stageText(value, options)
    appendMessage({
      role: 'assistant',
      badge: '원고 분할 완료',
      text: `${blockIds.length}개 문장 블록으로 정리했습니다. 원문은 편집기에 그대로 유지됩니다.`,
    })
    const pending = { text: value, options, blockIds }
    if (!getApiConnectionContext().configured || !engineAvailable) {
      setPendingGeneration(pending)
      appendMessage({
        role: 'system',
        badge: '음성 서버 연결 대기',
        text: '타임라인을 준비했습니다. 서버 연결이 복구되면 이 원고를 자동으로 이어서 생성합니다.',
      })
      requestAutomaticApiReconnect()
      return
    }
    await generateLongform(pending)
  }

  async function previewVoice(nextVoiceId: string) {
    setVoiceId(nextVoiceId)
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
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        format: 'wav',
        engineId: 'auto',
        normalizeText: true,
      }
      const result = await synthesizeSpeech(request, createRandomId())
      const audio = generatedPreview(result, text, nextVoiceId, voice.name)
      enqueue(audio, `${voice.name} 프리뷰`)
      appendMessage({
        role: 'assistant',
        badge: audio.source === 'browser-demo'
          ? 'Demo 프리뷰'
          : audio.result.fallbackUsed
            ? '자동 엔진 전환'
            : '목소리 프리뷰',
        text: audio.result.fallbackUsed
          ? `${voice.name} 프리뷰를 사용 가능한 대체 엔진으로 완성했습니다.`
          : `${voice.name} 목소리를 Dock 플레이어에 연결했습니다.`,
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

  if (!workspaceEntered) return <LandingHome />

  return (
    <div className="soa-editor-workspace soa-editor-workspace--longform">
      <VoiceLibrary
        value={voiceId}
        previewingId={previewingId}
        onChange={(id) => void previewVoice(id)}
        onCreateVoice={() => enterWorkspace('clone')}
      />
      <main className="soa-script-stage">
        <LongformComposer
          disabled={busy}
          value={composerDraft}
          directiveIds={directiveIds}
          backendStatus={backendStatus}
          backendMessage={backendMessage}
          activity={activity}
          onValueChange={setComposerDraft}
          onDirectiveIdsChange={setDirectiveIds}
          onSubmit={(value, directives) => void handleLongformSubmit(value, directives)}
          onVoiceUnavailable={() => showNotice('이 브라우저는 한국어 음성 입력을 지원하지 않습니다.')}
        />
      </main>
      <TimelineEditor
        blocks={timeline.blocks}
        onMove={timeline.moveBlock}
        onReorder={timeline.reorderBlock}
        onSplit={timeline.splitBlock}
        onUpdateText={timeline.updateText}
        onRetry={(id) => void retryBlock(id)}
        onAddPause={timeline.addPause}
        onClear={() => {
          setPendingGeneration(null)
          timeline.clear()
        }}
      />
    </div>
  )
}
