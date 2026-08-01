import { useEffect, useMemo, useState } from 'react'
import type { TtsSynthesisRequest } from '../ai/contracts'
import {
  getApiConnectionContext,
  requestAutomaticApiReconnect,
} from '../api/httpClient'
import { ChatComposer } from '../components/workspace/ChatComposer'
import { ConversationPanel } from '../components/workspace/ConversationPanel'
import { TimelineEditor } from '../components/workspace/TimelineEditor'
import { VoiceLibrary } from '../components/workspace/VoiceLibrary'
import { useEngineCatalog } from '../hooks/useEngineCatalog'
import { createRandomId } from '../utils/randomId'
import {
  useTimelineGeneration,
  type TimelineGenerationOptions,
} from '../hooks/useTimelineGeneration'
import { saveProject } from '../projects/projectRepository'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { buildAudioFilename } from '../tts/audioFile'
import type { GeneratedAudio } from '../tts/generationTypes'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import { synthesizeSpeech } from '../tts/voiceApi'
import { getVoicePreset, voicePresets } from '../tts/voicePresets'
import { interpretComposerPrompt } from '../workspace/promptParser'
import type { ComposerDirective, WorkspaceMessage } from '../workspace/workspaceTypes'
import { LandingHome } from './LandingHome'

const initialMessages: WorkspaceMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    badge: 'SoriON AI',
    text: '문장을 입력하거나 “봄날 피크닉 브이로그 대본을 30초 밝은 톤으로 만들어줘”처럼 요청해 보세요.',
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

export function HomePage() {
  const workspaceEntered = useAppStore((state) => state.workspaceEntered)
  const backendStatus = useAppStore((state) => state.backendStatus)
  const backendMessage = useAppStore((state) => state.backendMessage)
  const showNotice = useAppStore((state) => state.showNotice)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const activeProject = useAppStore((state) => state.activeProject)
  const clearActiveProject = useAppStore((state) => state.clearActiveProject)
  const enqueue = usePlayerStore((state) => state.enqueue)
  const [messages, setMessages] = useState<WorkspaceMessage[]>(initialMessages)
  const [voiceId, setVoiceId] = useState(voicePresets[0].id)
  const [previewingId, setPreviewingId] = useState<string | null>(null)
  const [pendingRecoveryIds, setPendingRecoveryIds] = useState<string[]>([])
  const engineCatalog = useEngineCatalog()
  const timeline = useTimelineGeneration()
  const selectedVoice = useMemo(() => getVoicePreset(voiceId), [voiceId])
  const busy = timeline.blocks.some((block) => (
    block.kind === 'voice' && block.status === 'generating'
  ))
  const engineAvailable = (
    (backendStatus === 'online' || backendStatus === 'degraded')
    && engineCatalog.selected !== null
  )

  useEffect(() => {
    if (!activeProject) return
    const voice = getVoicePreset(activeProject.voiceId)
    setVoiceId(activeProject.voiceId)
    setMessages([
      initialMessages[0],
      {
        id: createRandomId(),
        role: 'user',
        text: activeProject.text,
      },
      {
        id: createRandomId(),
        role: 'assistant',
        badge: '프로젝트 불러옴',
        text: `${activeProject.title} 작업을 타임라인에 복원했습니다.`,
      },
    ])
    const recoverableIds = timeline.restoreProject(activeProject, {
      voiceId: activeProject.voiceId,
      voiceName: voice.name,
      emotion: activeProject.emotion,
      speed: activeProject.speed ?? 1,
      engineId: 'auto',
      normalizeText: activeProject.normalizeText ?? true,
    })
    setPendingRecoveryIds(recoverableIds)
    clearActiveProject()
  }, [activeProject, clearActiveProject, timeline.restoreProject])

  useEffect(() => {
    if (!engineAvailable || pendingRecoveryIds.length === 0) return
    const ids = pendingRecoveryIds
    setPendingRecoveryIds([])
    void timeline.recoverBlocks(ids)
  }, [engineAvailable, pendingRecoveryIds, timeline.recoverBlocks])

  if (!workspaceEntered) return <LandingHome />

  function appendMessage(message: Omit<WorkspaceMessage, 'id'>) {
    setMessages((current) => [...current, { ...message, id: createRandomId() }])
  }

  function buildOptions(
    directives: ComposerDirective[],
    value: string,
  ): {
    prompt: ReturnType<typeof interpretComposerPrompt>
    options: TimelineGenerationOptions
  } {
    const prompt = interpretComposerPrompt(value, directives)
    return {
      prompt,
      options: {
        voiceId,
        voiceName: selectedVoice.name,
        emotion: engineCatalog.selected?.supportsEmotion ? prompt.emotion : 'neutral',
        speed: engineCatalog.selected?.supportsSpeed ? prompt.speed : 1,
        engineId: engineCatalog.selected ? 'auto' : undefined,
        normalizeText: prompt.normalizeText,
      },
    }
  }

  async function saveConversationProject(
    text: string,
    options: TimelineGenerationOptions,
    blockIds: string[],
    generated: Awaited<ReturnType<typeof timeline.generateAll>>,
  ) {
    const first = generated[0]?.audio
    if (!first) return
    const completedByBlock = new Map(
      generated.map((item) => [item.blockId, item.audio.result.jobId]),
    )
    const now = new Date().toISOString()
    await saveProject({
      id: createRandomId(),
      title: text.slice(0, 24),
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
  }

  async function handleComposerSubmit(value: string, directives: ComposerDirective[]) {
    const { prompt, options } = buildOptions(directives, value)
    appendMessage({ role: 'user', text: prompt.displayText })
    appendMessage({
      role: 'assistant',
      badge: prompt.draftMode === 'local-draft'
        ? '로컬 초안 · LLM 미연결'
        : '한국어 발음 최적화 ✓',
      text: prompt.spokenText,
    })

    const ids = timeline.stageText(prompt.spokenText, options)
    if (!getApiConnectionContext().configured || !engineAvailable) {
      appendMessage({
        role: 'system',
        badge: '자동 연결 중',
        text: '타임라인 블록은 준비했습니다. 음성 시스템이 준비되면 다시 생성할 수 있습니다.',
      })
      requestAutomaticApiReconnect()
      return
    }

    appendMessage({
      role: 'assistant',
      badge: backendStatus === 'degraded' ? 'Demo 엔진 · 실제 AI 아님' : 'Progressive Playback',
      text: `${ids.length}개 문장을 앞에서부터 생성합니다. 첫 블록이 끝나는 즉시 Dock에서 들을 수 있어요.`,
    })
    const generated = await timeline.generateAll(ids)
    if (generated.length === 0) {
      appendMessage({
        role: 'system',
        badge: '생성 실패',
        text: '생성된 음성이 없습니다. 빨간 타임라인 블록의 재시도를 눌러 주세요.',
      })
      return
    }
    appendMessage({
      role: 'assistant',
      badge: '완료',
      text: `${generated.length}개 음성 블록을 Dock 재생 대기열에 연결했습니다.`,
    })
    try {
      await saveConversationProject(prompt.spokenText, options, ids, generated)
    } catch {
      showNotice('음성은 완성됐지만 프로젝트 저장에는 실패했습니다.')
    }
  }

  async function previewVoice(nextVoiceId: string) {
    setVoiceId(nextVoiceId)
    const voice = getVoicePreset(nextVoiceId)
    if (!engineAvailable || !engineCatalog.selected) {
      appendMessage({
        role: 'assistant',
        badge: '목소리 선택',
        text: `${voice.name} 목소리를 선택했습니다. 음성 시스템을 자동으로 준비하고 있어요.`,
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
    } catch (error) {
      appendMessage({
        role: 'system',
        badge: '프리뷰 실패',
        text: error instanceof Error ? error.message : '목소리 프리뷰를 만들지 못했습니다.',
      })
    } finally {
      setPreviewingId(null)
    }
  }

  async function retryBlock(id: string) {
    if (!engineAvailable) {
      requestAutomaticApiReconnect()
      showNotice('음성 시스템을 자동으로 다시 확인하고 있습니다.')
      return
    }
    await timeline.retryBlock(id)
  }

  return (
    <div className="soa-editor-workspace">
      <VoiceLibrary
        value={voiceId}
        previewingId={previewingId}
        onChange={(id) => void previewVoice(id)}
        onCreateVoice={() => enterWorkspace('clone')}
      />
      <main className="soa-chat-stage">
        <ConversationPanel
          messages={messages}
          backendStatus={backendStatus}
          backendMessage={backendMessage}
        />
        <ChatComposer
          disabled={busy}
          onSubmit={(value, directives) => void handleComposerSubmit(value, directives)}
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
        onClear={timeline.clear}
      />
    </div>
  )
}
