import { useCallback, useEffect, useRef, useState } from 'react'
import type { TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { ApiError } from '../api/httpClient'
import type { VoiceProject } from '../projects/projectTypes'
import { usePlayerStore } from '../store/usePlayerStore'
import { buildAudioFilename } from '../tts/audioFile'
import type { GeneratedAudio } from '../tts/generationTypes'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import { splitTextForUi } from '../tts/segmentText'
import {
  getSpeechProgress,
  getSpeechResult,
  recoverSpeechResult,
  synthesizeSpeech,
} from '../tts/voiceApi'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'
import { createRandomId } from '../utils/randomId'

export interface TimelineGenerationOptions {
  voiceId: string
  voiceName: string
  emotion: TtsSynthesisRequest['emotion']
  speed: number
  engineId?: string
  normalizeText: boolean
}

export interface TimelineGenerationResult {
  blockId: string
  audio: GeneratedAudio
}

type BlocksUpdater = (current: TimelineBlock[]) => TimelineBlock[]

function estimateDuration(text: string): number {
  return Math.max(1.2, Math.round((text.length / 4.4) * 10) / 10)
}

function createVoiceBlock(
  text: string,
  options: TimelineGenerationOptions,
): TimelineVoiceBlock {
  return {
    id: createRandomId(),
    kind: 'voice',
    text,
    voiceId: options.voiceId,
    voiceName: options.voiceName,
    emotion: options.emotion,
    speed: options.speed,
    engineId: options.engineId,
    normalizeText: options.normalizeText,
    jobId: null,
    durationSeconds: estimateDuration(text),
    status: 'queued',
    progress: 0,
    audio: null,
    trackId: null,
    error: null,
  }
}

function optionsFromBlock(block: TimelineVoiceBlock): TimelineGenerationOptions {
  return {
    voiceId: block.voiceId,
    voiceName: block.voiceName,
    emotion: block.emotion,
    speed: block.speed,
    engineId: block.engineId,
    normalizeText: block.normalizeText,
  }
}

function blocksFromText(
  text: string,
  options: TimelineGenerationOptions,
): TimelineBlock[] {
  const segments = splitTextForUi(text)
  return segments.flatMap((segment, index) => {
    const block = createVoiceBlock(segment, options)
    if (index === segments.length - 1) return [block]
    return [
      block,
      { id: createRandomId(), kind: 'pause' as const, durationSeconds: 0.5 },
    ]
  })
}

function midpoint(text: string): number {
  const center = Math.floor(text.length / 2)
  const right = text.indexOf(' ', center)
  const left = text.lastIndexOf(' ', center)
  if (right >= 0 && (left < 0 || right - center < center - left)) return right
  return left > 0 ? left : center
}

export function useTimelineGeneration() {
  const [blocks, setBlocks] = useState<TimelineBlock[]>([])
  const blocksRef = useRef<TimelineBlock[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const timers = useRef(new Map<string, number>())
  const enqueue = usePlayerStore((state) => state.enqueue)
  const removeTrack = usePlayerStore((state) => state.remove)

  const commit = useCallback((updater: BlocksUpdater) => {
    const next = updater(blocksRef.current)
    blocksRef.current = next
    setBlocks(next)
  }, [])

  const stopPolling = useCallback((blockId: string) => {
    const timer = timers.current.get(blockId)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(blockId)
  }, [])

  const cancelActiveGeneration = useCallback((blockId: string) => {
    controllers.current.get(blockId)?.abort()
    controllers.current.delete(blockId)
    stopPolling(blockId)
  }, [stopPolling])

  useEffect(() => () => {
    controllers.current.forEach((controller) => controller.abort())
    timers.current.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const updateVoiceBlock = useCallback((id: string, patch: Partial<TimelineVoiceBlock>) => {
    commit((current) => current.map((block) => (
      block.id === id && block.kind === 'voice' ? { ...block, ...patch } : block
    )))
  }, [commit])

  const stageText = useCallback((
    text: string,
    options: TimelineGenerationOptions,
  ): string[] => {
    const staged = blocksFromText(text, options)
    commit((current) => current.length === 0
      ? staged
      : [
          ...current,
          { id: createRandomId(), kind: 'pause', durationSeconds: 0.8 },
          ...staged,
        ])
    return staged.filter((block) => block.kind === 'voice').map((block) => block.id)
  }, [commit])

  const pollProgress = useCallback((blockId: string, jobId: string, signal: AbortSignal) => {
    const poll = async () => {
      if (signal.aborted) return
      try {
        const progress = await getSpeechProgress(jobId, signal)
        updateVoiceBlock(blockId, { progress: Math.max(8, progress.progress) })
        if (['completed', 'failed', 'cancelled'].includes(progress.phase)) return
      } catch {
        // 생성 POST보다 진행 상태가 늦게 만들어지는 짧은 구간은 다음 주기에 다시 확인한다.
      }
      timers.current.set(blockId, window.setTimeout(() => void poll(), 450))
    }
    timers.current.set(blockId, window.setTimeout(() => void poll(), 250))
  }, [updateVoiceBlock])

  const runBlock = useCallback(async (
    blockId: string,
    allowSynthesis = true,
  ): Promise<GeneratedAudio | null> => {
    if (controllers.current.has(blockId)) return null
    const block = blocksRef.current.find((item) => item.id === blockId)
    if (!block || block.kind !== 'voice') return null

    const controller = new AbortController()
    controllers.current.set(blockId, controller)
    updateVoiceBlock(blockId, { status: 'generating', progress: 6, error: null })

    const request: TtsSynthesisRequest = {
      text: block.text,
      voiceId: block.voiceId,
      emotion: block.emotion,
      speed: block.speed,
      pitch: 0,
      format: 'wav',
      engineId: block.engineId,
      normalizeText: block.normalizeText,
    }

    try {
      let jobId = block.jobId
      let result: TtsSynthesisResult | null = null

      if (jobId) {
        try {
          const progress = await getSpeechProgress(jobId, controller.signal)
          if (progress.phase === 'completed') {
            result = await getSpeechResult(jobId, controller.signal)
          } else if (progress.phase === 'failed' || progress.phase === 'cancelled') {
            jobId = null
          } else {
            pollProgress(blockId, jobId, controller.signal)
            result = await recoverSpeechResult(jobId, controller.signal)
          }
        } catch (error) {
          const expired = error instanceof ApiError && [404, 410].includes(error.status)
          if (expired && !allowSynthesis) {
            updateVoiceBlock(blockId, {
              status: 'queued',
              progress: 0,
              jobId: null,
              error: '저장된 음원 보관 기간이 끝났습니다. 다시 생성을 눌러 주세요.',
            })
            return null
          }
          if (expired) jobId = null
          else throw error
        }
      }

      if (!result && !allowSynthesis) {
        updateVoiceBlock(blockId, {
          status: 'queued',
          progress: 0,
          error: '저장된 음원 결과를 찾지 못했습니다. 다시 생성을 눌러 주세요.',
        })
        return null
      }

      if (!result) {
        jobId = createRandomId()
        updateVoiceBlock(blockId, { jobId })
        pollProgress(blockId, jobId, controller.signal)
        result = await synthesizeSpeech(request, jobId, controller.signal)
      }

      let audio: GeneratedAudio
      if (result.audioUrl) {
        audio = {
          url: result.audioUrl,
          filename: buildAudioFilename(block.text, block.voiceName, 'wav'),
          source: 'api',
          durationSeconds: result.estimatedDurationSeconds,
          result,
        }
      } else {
        const blob = createMockWave(block.text, block.voiceId)
        audio = {
          url: URL.createObjectURL(blob),
          filename: buildAudioFilename(block.text, block.voiceName, 'wav'),
          source: 'browser-demo',
          durationSeconds: getMockWaveDuration(block.text),
          revokeOnRemove: true,
          result: {
            ...result,
            message: 'Mock 엔진 결과입니다. 실제 AI 음성이 아닙니다.',
            fileSizeBytes: blob.size,
          },
        }
      }
      const trackId = enqueue(audio, `${block.voiceName} · ${block.text.slice(0, 22)}`)
      updateVoiceBlock(blockId, {
        status: 'ready',
        progress: 100,
        durationSeconds: audio.durationSeconds,
        audio,
        trackId,
        error: null,
      })
      return audio
    } catch (error) {
      if (controller.signal.aborted) return null
      const message = error instanceof ApiError
        ? `${error.code} · ${error.message}`
        : error instanceof Error
          ? error.message
          : '이 문장을 생성하지 못했습니다.'
      updateVoiceBlock(blockId, { status: 'failed', progress: 0, error: message })
      return null
    } finally {
      controllers.current.delete(blockId)
      stopPolling(blockId)
    }
  }, [enqueue, pollProgress, stopPolling, updateVoiceBlock])

  const generateBlock = useCallback(
    (blockId: string) => runBlock(blockId, true),
    [runBlock],
  )

  const recoverBlocks = useCallback(async (ids: string[]) => {
    const results: GeneratedAudio[] = []
    for (const id of ids) {
      const audio = await runBlock(id, false)
      if (audio) results.push(audio)
    }
    return results
  }, [runBlock])

  const generateAll = useCallback(async (ids: string[]) => {
    const results: TimelineGenerationResult[] = []
    for (const id of ids) {
      const audio = await generateBlock(id)
      if (audio) results.push({ blockId: id, audio })
    }
    return results
  }, [generateBlock])

  const restoreProject = useCallback((
    project: VoiceProject,
    options: TimelineGenerationOptions,
  ): string[] => {
    controllers.current.forEach((controller) => controller.abort())
    timers.current.forEach((timer) => window.clearTimeout(timer))
    controllers.current.clear()
    timers.current.clear()
    blocksRef.current.forEach((block) => {
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
    })

    const jobIds = project.jobIds?.length
      ? project.jobIds
      : project.lastJobId
        ? [project.lastJobId]
        : []
    let voiceIndex = 0
    const restored = blocksFromText(project.text, options).map((block) => {
      if (block.kind !== 'voice') return block
      const jobId = jobIds[voiceIndex] ?? null
      voiceIndex += 1
      return {
        ...block,
        jobId,
        error: jobId ? '저장된 음원 결과를 확인하고 있습니다.' : null,
      }
    })
    commit(() => restored)
    return restored
      .filter((block): block is TimelineVoiceBlock => block.kind === 'voice' && Boolean(block.jobId))
      .map((block) => block.id)
  }, [commit, removeTrack])

  const moveBlock = useCallback((id: string, direction: -1 | 1) => {
    commit((current) => {
      const index = current.findIndex((block) => block.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= current.length) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }, [commit])

  const reorderBlock = useCallback((sourceId: string, targetId: string) => {
    commit((current) => {
      const sourceIndex = current.findIndex((block) => block.id === sourceId)
      const targetIndex = current.findIndex((block) => block.id === targetId)
      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return current
      const next = [...current]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }, [commit])

  const updateText = useCallback((id: string, text: string) => {
    cancelActiveGeneration(id)
    commit((current) => current.map((block) => {
      if (block.id !== id || block.kind !== 'voice') return block
      if (block.trackId) removeTrack(block.trackId)
      return {
        ...block,
        text,
        durationSeconds: estimateDuration(text),
        status: 'queued' as const,
        progress: 0,
        audio: null,
        trackId: null,
        jobId: null,
        error: null,
      }
    }))
  }, [cancelActiveGeneration, commit, removeTrack])

  const splitBlock = useCallback((id: string) => {
    cancelActiveGeneration(id)
    commit((current) => {
      const index = current.findIndex((block) => block.id === id)
      const block = current[index]
      if (!block || block.kind !== 'voice' || block.text.length < 8) return current
      if (block.trackId) removeTrack(block.trackId)
      const splitAt = midpoint(block.text)
      const options = optionsFromBlock(block)
      const left = createVoiceBlock(block.text.slice(0, splitAt).trim(), options)
      const right = createVoiceBlock(block.text.slice(splitAt).trim(), options)
      return [
        ...current.slice(0, index),
        left,
        { id: createRandomId(), kind: 'pause', durationSeconds: 0.5 },
        right,
        ...current.slice(index + 1),
      ]
    })
  }, [cancelActiveGeneration, commit, removeTrack])

  const addPause = useCallback(() => {
    commit((current) => [
      ...current,
      { id: createRandomId(), kind: 'pause', durationSeconds: 0.5 },
    ])
  }, [commit])

  const clear = useCallback(() => {
    controllers.current.forEach((controller) => controller.abort())
    blocksRef.current.forEach((block) => {
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
    })
    commit(() => [])
  }, [commit, removeTrack])

  return {
    blocks,
    stageText,
    restoreProject,
    recoverBlocks,
    generateAll,
    retryBlock: generateBlock,
    moveBlock,
    reorderBlock,
    updateText,
    splitBlock,
    addPause,
    clear,
  }
}
