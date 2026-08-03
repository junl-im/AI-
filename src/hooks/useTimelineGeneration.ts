import { useCallback, useEffect, useRef, useState } from 'react'
import type { TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { ApiError } from '../api/httpClient'
import type { VoiceProject } from '../projects/projectTypes'
import { usePlayerStore } from '../store/usePlayerStore'
import { buildAudioFilename } from '../tts/audioFile'
import {
  BROWSER_SPEECH_ENGINE_ID,
  createBrowserSpeechPlayback,
  isBrowserSpeechSupported,
} from '../tts/browserSpeech'
import type { GeneratedAudio, ProgressiveAudioSegment } from '../tts/generationTypes'
import { streamSpeechProgress } from '../tts/jobProgressStream'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import {
  getSpeechProgress,
  getSpeechResult,
  recoverSpeechResult,
  refreshSpeechReadySegment,
  synthesizeSpeech,
  type SpeechReadySegment,
} from '../tts/voiceApi'
import type { PersistedTimelineBlock } from '../workspace/sessionTypes'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'
import {
  createTimelineVoiceBlock,
  estimateTimelineDuration,
  timelineBlocksFromText,
  timelineOptionsFromBlock,
  timelineSplitPoint,
  type TimelineGenerationOptions,
} from '../workspace/timelineBlocks'
import { createRandomId } from '../utils/randomId'
import type { SttSegmentVerificationResult } from '../stt/verificationApi'
import {
  applySttResultsToBlocks,
  regenerateSttBlocks,
} from '../workspace/sttTimeline'
export type { TimelineGenerationOptions } from '../workspace/timelineBlocks'
export interface TimelineGenerationResult {
  blockId: string
  audio: GeneratedAudio
}
type BlocksUpdater = (current: TimelineBlock[]) => TimelineBlock[]
export function useTimelineGeneration() {
  const [blocks, setBlocks] = useState<TimelineBlock[]>([])
  const blocksRef = useRef<TimelineBlock[]>([])
  const controllers = useRef(new Map<string, AbortController>())
  const timers = useRef(new Map<string, number>())
  const enqueue = usePlayerStore((state) => state.enqueue)
  const enqueueAndPlay = usePlayerStore((state) => state.enqueueAndPlay)
  const replaceTrack = usePlayerStore((state) => state.replace)
  const appendProgressiveSegment = usePlayerStore((state) => state.appendProgressiveSegment)
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
  const updateVoiceBlock = useCallback((
    id: string,
    patch: Partial<TimelineVoiceBlock>,
    expectedRevision?: number,
  ) => {
    commit((current) => current.map((block) => {
      if (block.id !== id || block.kind !== 'voice') return block
      if (expectedRevision !== undefined && block.revision !== expectedRevision) return block
      return { ...block, ...patch }
    }))
  }, [commit])
  const stageText = useCallback((
    text: string,
    options: TimelineGenerationOptions,
  ): string[] => {
    const staged = timelineBlocksFromText(text, options)
    commit((current) => current.length === 0
      ? staged
      : [
          ...current,
          { id: createRandomId(), kind: 'pause', durationSeconds: 0.8 },
          ...staged,
        ])
    return staged.filter((block) => block.kind === 'voice').map((block) => block.id)
  }, [commit])
  const addVoiceBlock = useCallback((
    options: TimelineGenerationOptions,
    text = '',
  ): string => {
    const block = createTimelineVoiceBlock(text, options)
    commit((current) => [...current, block])
    return block.id
  }, [commit])
  const pollProgress = useCallback((
    blockId: string,
    jobId: string,
    revision: number,
    signal: AbortSignal,
    onSegmentReady?: (segment: SpeechReadySegment) => void,
  ) => {
    const deliveredSegments = new Set<number>()
    const applySegment = (segment: SpeechReadySegment) => {
      if (deliveredSegments.has(segment.index)) return
      deliveredSegments.add(segment.index)
      onSegmentReady?.(segment)
    }
    const applyProgress = (progress: Awaited<ReturnType<typeof getSpeechProgress>>) => {
      for (const segment of progress.readySegments ?? []) applySegment(segment)
      updateVoiceBlock(
        blockId,
        { progress: Math.max(8, progress.progress) },
        revision,
      )
    }
    const poll = async () => {
      if (signal.aborted) return
      try {
        const progress = await getSpeechProgress(jobId, signal)
        applyProgress(progress)
        if (['completed', 'failed', 'cancelled'].includes(progress.phase)) return
      } catch {
        // SSE를 지원하지 않는 서버와 생성 직전의 짧은 404 구간은 폴링으로 복구한다.
      }
      timers.current.set(blockId, window.setTimeout(() => void poll(), 650))
    }
    void streamSpeechProgress(
      jobId,
      applyProgress,
      signal,
      applySegment,
    ).then((streamed) => {
      if (!streamed && !signal.aborted) void poll()
    })
  }, [updateVoiceBlock])
  const runBlock = useCallback(async (
    blockId: string,
    allowSynthesis = true,
    autoplay = false,
  ): Promise<GeneratedAudio | null> => {
    if (controllers.current.has(blockId)) return null
    const block = blocksRef.current.find((item) => item.id === blockId)
    if (!block || block.kind !== 'voice') return null
    const revision = block.revision
    const controller = new AbortController()
    controllers.current.set(blockId, controller)
    updateVoiceBlock(
      blockId,
      { status: 'generating', progress: 6, error: null },
      revision,
    )
    const request: TtsSynthesisRequest = {
      text: block.text,
      voiceId: block.voiceId,
      emotion: block.emotion,
      speed: block.speed,
      pitch: block.pitch,
      format: 'wav',
      engineId: block.engineId,
      normalizeText: block.normalizeText,
    }
    const requestStartedAtMs = Date.now()
    let partialTrackId: string | null = null
    let partialReadyAfterMs: number | null = null
    let partialFirstByteMs: number | null = null
    let activeJobId = block.jobId
    let acceptingProgressiveSegments = true
    let nextSegmentIndex = 1
    let drainingSegments = false
    const pendingSegments = new Map<number, SpeechReadySegment>()
    const processedSegments = new Set<number>()

    const preparePlayableSegment = async (segment: SpeechReadySegment): Promise<ProgressiveAudioSegment | null> => {
      let playableSegment = segment
      let previewUrl = playableSegment.audioUrl
      let revokeOnRemove = false
      let allowDirectUrlFallback = true
      try {
        let response = await fetch(playableSegment.audioUrl, {
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'omit',
        })
        if ([403, 410].includes(response.status) && activeJobId) {
          allowDirectUrlFallback = false
          const refreshed = await refreshSpeechReadySegment(
            activeJobId,
            playableSegment.index,
            controller.signal,
          )
          if (refreshed) {
            playableSegment = refreshed
            previewUrl = refreshed.audioUrl
            allowDirectUrlFallback = true
            response = await fetch(refreshed.audioUrl, {
              signal: controller.signal,
              cache: 'no-store',
              credentials: 'omit',
            })
          }
        }
        if (!response.ok) {
          if ([403, 410].includes(response.status)) allowDirectUrlFallback = false
          throw new Error(`segment audio ${response.status}`)
        }
        let blob: Blob
        if (response.body) {
          const [probeStream, playbackStream] = response.body.tee()
          const probe = probeStream.getReader()
          const firstChunk = await probe.read()
          if (!firstChunk.done && playableSegment.index === 1 && partialFirstByteMs === null) {
            partialFirstByteMs = Math.max(0, Date.now() - requestStartedAtMs)
          }
          await probe.cancel()
          blob = await new Response(playbackStream, {
            headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'audio/wav' },
          }).blob()
        } else {
          if (playableSegment.index === 1 && partialFirstByteMs === null) {
            partialFirstByteMs = Math.max(0, Date.now() - requestStartedAtMs)
          }
          blob = await response.blob()
        }
        previewUrl = URL.createObjectURL(blob)
        revokeOnRemove = true
      } catch {
        if (controller.signal.aborted || !allowDirectUrlFallback) return null
        // fetch 자체가 실패한 경우에는 audio 요소가 단기 서명 URL을 직접 읽도록 복구한다.
      }
      return {
        index: playableSegment.index,
        totalSegments: playableSegment.totalSegments,
        url: previewUrl,
        filename: playableSegment.filename,
        durationSeconds: playableSegment.estimatedDurationSeconds,
        readyAfterMs: playableSegment.readyAfterMs,
        revokeOnRemove,
      }
    }

    const publishPreparedSegment = (
      segment: SpeechReadySegment,
      prepared: ProgressiveAudioSegment,
    ) => {
      const latestBlock = blocksRef.current.find((item) => item.id === blockId)
      if (
        !acceptingProgressiveSegments
        || !latestBlock
        || latestBlock.kind !== 'voice'
        || latestBlock.revision !== revision
        || latestBlock.status !== 'generating'
      ) {
        if (prepared.revokeOnRemove) URL.revokeObjectURL(prepared.url)
        return
      }

      if (!partialTrackId) {
        partialReadyAfterMs = segment.readyAfterMs
        const partialAudio: GeneratedAudio = {
          url: prepared.url,
          filename: `${buildAudioFilename(block.text, block.voiceName, 'wav').replace(/\.wav$/i, '')}-part-1.wav`,
          source: 'api',
          durationSeconds: prepared.durationSeconds,
          partial: {
            index: prepared.index,
            totalSegments: prepared.totalSegments,
            readyAfterMs: prepared.readyAfterMs,
          },
          progressive: {
            jobId: activeJobId ?? '',
            totalSegments: prepared.totalSegments,
            segments: [prepared],
          },
          telemetry: {
            requestStartedAtMs,
            serverSegmentReadyMs: prepared.readyAfterMs,
            firstByteMs: partialFirstByteMs,
          },
          result: {
            jobId: activeJobId ?? '',
            status: 'processing',
            engineId: segment.engineId,
            engineMode: segment.engineMode,
            audioUrl: segment.audioUrl,
            estimatedDurationSeconds: prepared.durationSeconds,
            message: `${prepared.totalSegments}개 구간을 준비되는 순서대로 이어 재생합니다.`,
            normalizedText: null,
            segmentCount: prepared.totalSegments,
            firstAudioMs: prepared.readyAfterMs,
            processingMs: null,
            fileSizeBytes: segment.fileSizeBytes,
            realtimeFactor: null,
          },
        }
        const title = `${block.voiceName} · 구간 연속 재생`
        partialTrackId = autoplay
          ? enqueueAndPlay(partialAudio, title)
          : enqueue(partialAudio, title)
        updateVoiceBlock(blockId, {
          audio: partialAudio,
          trackId: partialTrackId,
          durationSeconds: prepared.durationSeconds,
          progress: Math.max(12, Math.round((prepared.index / prepared.totalSegments) * 82)),
        }, revision)
        return
      }

      const targetTrackId = partialTrackId
      if (!targetTrackId) {
        if (prepared.revokeOnRemove) URL.revokeObjectURL(prepared.url)
        return
      }
      appendProgressiveSegment(targetTrackId, prepared)
      const currentAudio = latestBlock.audio
      const currentSegments = currentAudio?.progressive?.segments ?? []
      const nextSegments = [...currentSegments, prepared]
        .filter((item, index, items) => items.findIndex((candidate) => candidate.index === item.index) === index)
        .sort((left, right) => left.index - right.index)
      const nextAudio = currentAudio?.progressive
        ? {
            ...currentAudio,
            durationSeconds: nextSegments.reduce((total, item) => total + item.durationSeconds, 0),
            partial: {
              index: prepared.index,
              totalSegments: prepared.totalSegments,
              readyAfterMs: prepared.readyAfterMs,
            },
            progressive: {
              ...currentAudio.progressive,
              totalSegments: prepared.totalSegments,
              segments: nextSegments,
            },
          }
        : currentAudio
      updateVoiceBlock(blockId, {
        audio: nextAudio,
        durationSeconds: nextAudio?.durationSeconds ?? latestBlock.durationSeconds,
        progress: Math.max(12, Math.round((prepared.index / prepared.totalSegments) * 82)),
      }, revision)
    }

    const drainReadySegments = async () => {
      if (drainingSegments || !acceptingProgressiveSegments) return
      drainingSegments = true
      try {
        while (acceptingProgressiveSegments) {
          const segment = pendingSegments.get(nextSegmentIndex)
          if (!segment) break
          pendingSegments.delete(nextSegmentIndex)
          const prepared = await preparePlayableSegment(segment)
          if (!prepared) {
            acceptingProgressiveSegments = false
            break
          }
          if (!acceptingProgressiveSegments) {
            if (prepared.revokeOnRemove) URL.revokeObjectURL(prepared.url)
            break
          }
          processedSegments.add(segment.index)
          publishPreparedSegment(segment, prepared)
          nextSegmentIndex += 1
        }
      } finally {
        drainingSegments = false
      }
    }

    const previewReadySegment = (segment: SpeechReadySegment) => {
      if (
        !acceptingProgressiveSegments
        || segment.index < 1
        || processedSegments.has(segment.index)
        || pendingSegments.has(segment.index)
      ) return
      pendingSegments.set(segment.index, segment)
      void drainReadySegments()
    }
    try {
      let jobId = block.jobId
      let result: TtsSynthesisResult | null = null
      if (jobId) {
        try {
          const progress = await getSpeechProgress(jobId, controller.signal)
          for (const segment of progress.readySegments ?? []) previewReadySegment(segment)
          if (progress.phase === 'completed') {
            result = await getSpeechResult(jobId, controller.signal)
          } else if (progress.phase === 'failed' || progress.phase === 'cancelled') {
            jobId = null
          } else {
            pollProgress(blockId, jobId, revision, controller.signal, previewReadySegment)
            result = await recoverSpeechResult(jobId, controller.signal)
          }
        } catch (error) {
          const expired = error instanceof ApiError && [404, 410].includes(error.status)
          const browserFallback = error instanceof ApiError
            && (
              ['unconfigured', 'timeout', 'cors-or-network', 'offline', 'mixed-content', 'mobile-localhost']
                .includes(error.kind)
              || [502, 503, 504].includes(error.status)
            )
            && isBrowserSpeechSupported()
          if ((expired || browserFallback) && !allowSynthesis) {
            updateVoiceBlock(blockId, {
              status: 'queued',
              progress: 0,
              jobId: null,
              error: browserFallback
                ? '서버 음원은 연결하지 못했습니다. 다시 생성을 누르면 브라우저 음성으로 재생합니다.'
                : '저장된 음원 보관 기간이 끝났습니다. 다시 생성을 눌러 주세요.',
            }, revision)
            return null
          }
          if (expired || browserFallback) jobId = null
          else throw error
        }
      }
      if (!result && !allowSynthesis) {
        updateVoiceBlock(blockId, {
          status: 'queued',
          progress: 0,
          error: '저장된 음원 결과를 찾지 못했습니다. 다시 생성을 눌러 주세요.',
        }, revision)
        return null
      }
      if (!result) {
        jobId = createRandomId()
        activeJobId = jobId
        updateVoiceBlock(blockId, { jobId }, revision)
        pollProgress(
          blockId,
          jobId,
          revision,
          controller.signal,
          previewReadySegment,
        )
        result = await synthesizeSpeech(request, jobId, controller.signal)
      }

      acceptingProgressiveSegments = false
      const latestBlock = blocksRef.current.find((item) => item.id === blockId)
      if (
        !latestBlock
        || latestBlock.kind !== 'voice'
        || latestBlock.revision !== revision
      ) return null

      let audio: GeneratedAudio
      if (result.audioUrl) {
        audio = {
          url: result.audioUrl,
          filename: buildAudioFilename(block.text, block.voiceName, 'wav'),
          source: 'api',
          durationSeconds: result.estimatedDurationSeconds,
          rehydration: { kind: 'tts-final', jobId: result.jobId },
          telemetry: {
            requestStartedAtMs,
            serverSegmentReadyMs: partialReadyAfterMs,
            firstByteMs: partialFirstByteMs,
          },
          result,
        }
      } else if (result.engineId === BROWSER_SPEECH_ENGINE_ID) {
        audio = {
          url: null,
          filename: buildAudioFilename(block.text, block.voiceName, 'wav'),
          source: 'browser-speech',
          durationSeconds: result.estimatedDurationSeconds,
          browserSpeech: createBrowserSpeechPlayback(request),
          telemetry: {
            requestStartedAtMs,
            serverSegmentReadyMs: partialReadyAfterMs,
            firstByteMs: partialFirstByteMs,
          },
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
          telemetry: {
            requestStartedAtMs,
            serverSegmentReadyMs: partialReadyAfterMs,
            firstByteMs: partialFirstByteMs,
          },
          result: {
            ...result,
            message: 'Mock 엔진 결과입니다. 실제 AI 음성이 아닙니다.',
            fileSizeBytes: blob.size,
          },
        }
      }
      const trackTitle = `${block.voiceName} · ${block.text.slice(0, 22)}`
      let trackId: string
      if (partialTrackId) {
        replaceTrack(partialTrackId, audio, trackTitle, autoplay)
        trackId = partialTrackId
      } else {
        trackId = autoplay
          ? enqueueAndPlay(audio, trackTitle)
          : enqueue(audio, trackTitle)
      }
      updateVoiceBlock(blockId, {
        status: 'ready',
        progress: 100,
        durationSeconds: audio.durationSeconds,
        audio,
        trackId,
        error: null,
      }, revision)
      return audio
    } catch (error) {
      acceptingProgressiveSegments = false
      if (partialTrackId) removeTrack(partialTrackId)
      if (controller.signal.aborted) return null
      const message = error instanceof ApiError
        ? `${error.code} · ${error.message}`
        : error instanceof Error
          ? error.message
          : '이 문장을 생성하지 못했습니다.'
      updateVoiceBlock(
        blockId,
        { status: 'failed', progress: 0, error: message },
        revision,
      )
      return null
    } finally {
      acceptingProgressiveSegments = false
      if (controllers.current.get(blockId) === controller) {
        controllers.current.delete(blockId)
        stopPolling(blockId)
      }
    }
  }, [appendProgressiveSegment, enqueue, enqueueAndPlay, pollProgress, removeTrack, replaceTrack, stopPolling, updateVoiceBlock])

  const generateBlock = useCallback(
    (blockId: string) => runBlock(blockId, true, false),
    [runBlock],
  )
  const retryBlock = useCallback(
    (blockId: string) => runBlock(blockId, true, true),
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

  const applySttVerification = useCallback((results: SttSegmentVerificationResult[]) => {
    commit((current) => applySttResultsToBlocks(current, results))
  }, [commit])

  const regenerateBlocks = useCallback((ids: string[]) => regenerateSttBlocks(ids, {
    cancel: cancelActiveGeneration,
    update: commit,
    removeTrack,
    generate: generateBlock,
  }), [cancelActiveGeneration, commit, generateBlock, removeTrack])

  const restoreSession = useCallback((savedBlocks: PersistedTimelineBlock[]): string[] => {
    controllers.current.forEach((controller) => controller.abort())
    timers.current.forEach((timer) => window.clearTimeout(timer))
    controllers.current.clear()
    timers.current.clear()
    blocksRef.current.forEach((block) => {
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
    })

    const restored: TimelineBlock[] = savedBlocks.map((block) => {
      if (block.kind === 'pause') return block
      const recoverable = Boolean(block.jobId)
      return {
        ...block,
        status: recoverable ? 'queued' : block.status === 'failed' ? 'failed' : 'queued',
        progress: 0,
        audio: null,
        trackId: null,
        error: recoverable
          ? '이전 작업의 음원 결과를 다시 연결하고 있습니다.'
          : block.error,
        revision: Math.max(1, block.revision),
      }
    })
    commit(() => restored)
    return restored
      .filter((block): block is TimelineVoiceBlock => block.kind === 'voice' && Boolean(block.jobId))
      .map((block) => block.id)
  }, [commit, removeTrack])
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
    const restored = timelineBlocksFromText(project.text, options).map((block) => {
      if (block.kind !== 'voice') return block
      const jobId = jobIds[voiceIndex] ?? null
      voiceIndex += 1
      return {
        ...block,
        jobId,
        error: jobId ? '저장된 음원 결과를 확인하고 있습니다.' : null,
        revision: 1,
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
        durationSeconds: estimateTimelineDuration(text),
        status: 'queued' as const,
        progress: 0,
        audio: null,
        trackId: null,
        jobId: null,
        error: null,
        revision: block.revision + 1,
        sttVerification: undefined,
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
      const splitAt = timelineSplitPoint(block.text)
      const options = timelineOptionsFromBlock(block)
      const left = createTimelineVoiceBlock(block.text.slice(0, splitAt).trim(), options)
      const right = createTimelineVoiceBlock(block.text.slice(splitAt).trim(), options)
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


  const removeBlock = useCallback((id: string) => {
    cancelActiveGeneration(id)
    commit((current) => current.filter((block) => {
      if (block.id !== id) return true
      if (block.kind === 'voice' && block.trackId) removeTrack(block.trackId)
      return false
    }))
  }, [cancelActiveGeneration, commit, removeTrack])

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
    addVoiceBlock,
    restoreProject,
    restoreSession,
    recoverBlocks,
    generateAll,
    applySttVerification,
    regenerateBlocks,
    retryBlock,
    moveBlock,
    reorderBlock,
    updateText,
    splitBlock,
    addPause,
    removeBlock,
    clear,
  }
}
