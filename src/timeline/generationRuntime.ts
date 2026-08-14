import type { TtsSynthesisRequest, TtsSynthesisResult } from '../ai/contracts'
import { ApiError } from '../api/httpClient'
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
import { createRandomId } from '../utils/randomId'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'

export interface TimelineGenerationRuntimeDeps {
  getBlocks: () => TimelineBlock[]
  controllers: Map<string, AbortController>
  timers: Map<string, number>
  updateVoiceBlock: (id: string, patch: Partial<TimelineVoiceBlock>, expectedRevision?: number) => void
  enqueue: (audio: GeneratedAudio, title?: string) => string
  enqueueAndPlay: (audio: GeneratedAudio, title?: string) => string
  replaceTrack: (trackId: string, audio: GeneratedAudio, title?: string, autoplay?: boolean) => void
  appendProgressiveSegment: (trackId: string, segment: ProgressiveAudioSegment) => void
  removeTrack: (trackId: string) => void
  stopPolling: (blockId: string) => void
}

function pollProgress(
  deps: TimelineGenerationRuntimeDeps,
  blockId: string,
  jobId: string,
  revision: number,
  signal: AbortSignal,
  onSegmentReady?: (segment: SpeechReadySegment) => void,
) {
  const deliveredSegments = new Set<number>()
  const applySegment = (segment: SpeechReadySegment) => {
    if (deliveredSegments.has(segment.index)) return
    deliveredSegments.add(segment.index)
    onSegmentReady?.(segment)
  }
  const applyProgress = (progress: Awaited<ReturnType<typeof getSpeechProgress>>) => {
    for (const segment of progress.readySegments ?? []) applySegment(segment)
    deps.updateVoiceBlock(
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
    deps.timers.set(blockId, window.setTimeout(() => void poll(), 650))
  }
  void streamSpeechProgress(
    jobId,
    applyProgress,
    signal,
    applySegment,
  ).then((streamed) => {
    if (!streamed && !signal.aborted) void poll()
  })
}

export async function runTimelineVoiceBlock(
  deps: TimelineGenerationRuntimeDeps,
  blockId: string,
  allowSynthesis = true,
  autoplay = false,
): Promise<GeneratedAudio | null> {
    if (deps.controllers.has(blockId)) return null
    const block = deps.getBlocks().find((item) => item.id === blockId)
    if (!block || block.kind !== 'voice') return null
    const revision = block.revision
    const controller = new AbortController()
    deps.controllers.set(blockId, controller)
    deps.updateVoiceBlock(
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
          const probeCancellation = probe.cancel().catch(() => undefined)
          blob = await new Response(playbackStream, {
            headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'audio/wav' },
          }).blob()
          await probeCancellation
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
      const latestBlock = deps.getBlocks().find((item) => item.id === blockId)
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
          ? deps.enqueueAndPlay(partialAudio, title)
          : deps.enqueue(partialAudio, title)
        deps.updateVoiceBlock(blockId, {
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
      deps.appendProgressiveSegment(targetTrackId, prepared)
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
      deps.updateVoiceBlock(blockId, {
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
            pollProgress(deps, blockId, jobId, revision, controller.signal, previewReadySegment)
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
            deps.updateVoiceBlock(blockId, {
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
        deps.updateVoiceBlock(blockId, {
          status: 'queued',
          progress: 0,
          error: '저장된 음원 결과를 찾지 못했습니다. 다시 생성을 눌러 주세요.',
        }, revision)
        return null
      }
      if (!result) {
        jobId = createRandomId()
        activeJobId = jobId
        deps.updateVoiceBlock(blockId, { jobId }, revision)
        pollProgress(
          deps,
          blockId,
          jobId,
          revision,
          controller.signal,
          previewReadySegment,
        )
        result = await synthesizeSpeech(request, jobId, controller.signal)
      }

      acceptingProgressiveSegments = false
      const latestBlock = deps.getBlocks().find((item) => item.id === blockId)
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
        deps.replaceTrack(partialTrackId, audio, trackTitle, autoplay)
        trackId = partialTrackId
      } else {
        trackId = autoplay
          ? deps.enqueueAndPlay(audio, trackTitle)
          : deps.enqueue(audio, trackTitle)
      }
      deps.updateVoiceBlock(blockId, {
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
      if (partialTrackId) deps.removeTrack(partialTrackId)
      if (controller.signal.aborted) return null
      const message = error instanceof ApiError
        ? `${error.code} · ${error.message}`
        : error instanceof Error
          ? error.message
          : '이 문장을 생성하지 못했습니다.'
      deps.updateVoiceBlock(
        blockId,
        { status: 'failed', progress: 0, error: message },
        revision,
      )
      return null
    } finally {
      acceptingProgressiveSegments = false
      if (deps.controllers.get(blockId) === controller) {
        deps.controllers.delete(blockId)
        deps.stopPolling(blockId)
      }
    }
}
