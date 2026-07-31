import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/httpClient'
import { buildAudioFilename } from '../tts/audioFile'
import type { GeneratedAudio, GenerationAttempt, VoiceGenerationState } from '../tts/generationTypes'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import { cancelSpeech, synthesizeSpeech } from '../tts/voiceApi'

const initialState: VoiceGenerationState = {
  phase: 'idle',
  audio: null,
  error: null,
  lastAttempt: null,
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 180))
}

export function useVoiceGeneration() {
  const [state, setState] = useState<VoiceGenerationState>(initialState)
  const localUrlRef = useRef<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const jobIdRef = useRef<string | null>(null)

  const releaseLocalUrl = useCallback(() => {
    if (!localUrlRef.current) return
    URL.revokeObjectURL(localUrlRef.current)
    localUrlRef.current = null
  }, [])

  useEffect(() => () => {
    controllerRef.current?.abort()
    releaseLocalUrl()
  }, [releaseLocalUrl])

  const createBrowserDemo = useCallback(async (attempt: GenerationAttempt, message: string): Promise<GeneratedAudio> => {
    setState((current) => ({ ...current, phase: 'rendering', error: null }))
    await waitForPaint()
    releaseLocalUrl()
    const blob = createMockWave(attempt.request.text, attempt.request.voiceId)
    const url = URL.createObjectURL(blob)
    localUrlRef.current = url

    return {
      url,
      filename: buildAudioFilename(attempt.request.text, attempt.voiceName, 'wav'),
      source: 'browser-demo',
      durationSeconds: getMockWaveDuration(attempt.request.text),
      result: {
        jobId: crypto.randomUUID(),
        status: 'mock-complete',
        engineId: 'browser-demo',
        engineMode: 'mock',
        audioUrl: null,
        estimatedDurationSeconds: getMockWaveDuration(attempt.request.text),
        message,
        normalizedText: attempt.request.text,
        segmentCount: 1,
        processingMs: null,
        fileSizeBytes: blob.size,
        realtimeFactor: null,
      },
    }
  }, [releaseLocalUrl])

  const generate = useCallback(async (attempt: GenerationAttempt): Promise<GeneratedAudio | null> => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    const jobId = crypto.randomUUID()
    controllerRef.current = controller
    jobIdRef.current = jobId
    setState({ phase: 'preparing', audio: null, error: null, lastAttempt: attempt })
    await waitForPaint()
    setState((current) => ({ ...current, phase: 'requesting' }))

    try {
      const result = await synthesizeSpeech(attempt.request, jobId, controller.signal)
      let audio: GeneratedAudio

      if (result.audioUrl) {
        releaseLocalUrl()
        audio = {
          url: result.audioUrl,
          filename: buildAudioFilename(attempt.request.text, attempt.voiceName, attempt.request.format),
          source: 'api',
          durationSeconds: result.estimatedDurationSeconds,
          result,
        }
      } else {
        audio = await createBrowserDemo(
          attempt,
          'Mock 엔진 연결을 확인했습니다. 아래 음원은 기능 검증용 브라우저 데모이며 실제 AI 음성이 아닙니다.',
        )
      }

      setState({ phase: 'completed', audio, error: null, lastAttempt: attempt })
      return audio
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SOA-2003') {
        setState({ phase: 'cancelled', audio: null, error: null, lastAttempt: attempt })
        return null
      }
      if (error instanceof ApiError && (error.status === 0 || error.status === 408)) {
        const audio = await createBrowserDemo(
          attempt,
          'AI API에 연결되지 않아 브라우저 데모 음원을 만들었습니다. 실제 TTS 엔진 연결 전 기능 확인용입니다.',
        )
        setState({ phase: 'completed', audio, error: null, lastAttempt: attempt })
        return audio
      }

      const message = error instanceof Error ? error.message : '음성을 생성하지 못했습니다.'
      setState({ phase: 'failed', audio: null, error: message, lastAttempt: attempt })
      return null
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      if (jobIdRef.current === jobId) jobIdRef.current = null
    }
  }, [createBrowserDemo, releaseLocalUrl])

  const cancel = useCallback(() => {
    const jobId = jobIdRef.current
    controllerRef.current?.abort()
    if (jobId) void cancelSpeech(jobId).catch(() => undefined)
  }, [])

  const retry = useCallback(() => {
    if (!state.lastAttempt) return Promise.resolve(null)
    return generate(state.lastAttempt)
  }, [generate, state.lastAttempt])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    releaseLocalUrl()
    setState(initialState)
  }, [releaseLocalUrl])

  return { ...state, generate, retry, cancel, reset }
}
