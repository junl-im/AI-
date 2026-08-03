import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../api/httpClient'
import { buildAudioFilename } from '../tts/audioFile'
import {
  BROWSER_SPEECH_ENGINE_ID,
  createBrowserSpeechPlayback,
} from '../tts/browserSpeech'
import type { GeneratedAudio, GenerationAttempt, VoiceGenerationState } from '../tts/generationTypes'
import { createMockWave, getMockWaveDuration } from '../tts/mockWave'
import { cancelSpeech, getSpeechProgress, synthesizeSpeech } from '../tts/voiceApi'
import { createRandomId } from '../utils/randomId'

const initialState: VoiceGenerationState = {
  phase: 'idle',
  audio: null,
  error: null,
  lastAttempt: null,
  progress: null,
}

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 180))
}

export function useVoiceGeneration() {
  const [state, setState] = useState<VoiceGenerationState>(initialState)
  const localUrlRef = useRef<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const jobIdRef = useRef<string | null>(null)
  const pollTimerRef = useRef<number | null>(null)

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current !== null) window.clearTimeout(pollTimerRef.current)
    pollTimerRef.current = null
  }, [])

  const releaseLocalUrl = useCallback(() => {
    if (!localUrlRef.current) return
    URL.revokeObjectURL(localUrlRef.current)
    localUrlRef.current = null
  }, [])

  useEffect(() => () => {
    controllerRef.current?.abort()
    stopPolling()
    releaseLocalUrl()
  }, [releaseLocalUrl, stopPolling])

  const startPolling = useCallback((jobId: string, signal: AbortSignal) => {
    const poll = async () => {
      if (signal.aborted || jobIdRef.current !== jobId) return
      try {
        const progress = await getSpeechProgress(jobId)
        setState((current) => ({ ...current, progress }))
        if (['completed', 'failed', 'cancelled'].includes(progress.phase)) return
      } catch {
        // 첫 POST가 작업 스냅샷을 만들기 전의 404와 일시적인 상태 조회 실패는 다음 주기에 재시도한다.
      }
      pollTimerRef.current = window.setTimeout(() => void poll(), 450)
    }
    pollTimerRef.current = window.setTimeout(() => void poll(), 250)
  }, [])

  const createBrowserDemo = useCallback(async (attempt: GenerationAttempt, message: string): Promise<GeneratedAudio> => {
    stopPolling()
    setState((current) => ({ ...current, phase: 'rendering', error: null, progress: null }))
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
      revokeOnRemove: true,
      result: {
        jobId: createRandomId(),
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
  }, [releaseLocalUrl, stopPolling])

  const generate = useCallback(async (attempt: GenerationAttempt): Promise<GeneratedAudio | null> => {
    controllerRef.current?.abort()
    stopPolling()
    const controller = new AbortController()
    const jobId = createRandomId()
    controllerRef.current = controller
    jobIdRef.current = jobId
    setState({ phase: 'preparing', audio: null, error: null, lastAttempt: attempt, progress: null })
    await waitForPaint()
    setState((current) => ({ ...current, phase: 'requesting' }))
    startPolling(jobId, controller.signal)

    try {
      const result = await synthesizeSpeech(attempt.request, jobId, controller.signal)
      stopPolling()
      let audio: GeneratedAudio

      if (result.audioUrl) {
        releaseLocalUrl()
        audio = {
          url: result.audioUrl,
          filename: buildAudioFilename(attempt.request.text, attempt.voiceName, attempt.request.format),
          source: 'api',
          durationSeconds: result.estimatedDurationSeconds,
          rehydration: { kind: 'tts-final', jobId: result.jobId },
          result,
        }
      } else if (result.engineId === BROWSER_SPEECH_ENGINE_ID) {
        releaseLocalUrl()
        audio = {
          url: null,
          filename: buildAudioFilename(attempt.request.text, attempt.voiceName, attempt.request.format),
          source: 'browser-speech',
          durationSeconds: result.estimatedDurationSeconds,
          browserSpeech: createBrowserSpeechPlayback(attempt.request),
          result,
        }
      } else {
        audio = await createBrowserDemo(
          attempt,
          'Mock 엔진 연결을 확인했습니다. 아래 음원은 기능 검증용 브라우저 데모이며 실제 AI 음성이 아닙니다.',
        )
      }

      setState((current) => ({ ...current, phase: 'completed', audio, error: null, lastAttempt: attempt }))
      return audio
    } catch (error) {
      stopPolling()
      if (error instanceof ApiError && error.code === 'SOA-2003') {
        setState({ phase: 'cancelled', audio: null, error: null, lastAttempt: attempt, progress: null })
        return null
      }
      if (error instanceof ApiError && (error.status === 0 || error.status === 408)) {
        const audio = await createBrowserDemo(
          attempt,
          'AI API에 연결되지 않아 브라우저 데모 음원을 만들었습니다. 실제 TTS 엔진 연결 전 기능 확인용입니다.',
        )
        setState({ phase: 'completed', audio, error: null, lastAttempt: attempt, progress: null })
        return audio
      }

      const message = error instanceof Error ? error.message : '음성을 생성하지 못했습니다.'
      setState((current) => ({ ...current, phase: 'failed', audio: null, error: message, lastAttempt: attempt }))
      return null
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null
      if (jobIdRef.current === jobId) jobIdRef.current = null
    }
  }, [createBrowserDemo, releaseLocalUrl, startPolling, stopPolling])


  const handoffAudioUrl = useCallback((url: string) => {
    if (localUrlRef.current === url) localUrlRef.current = null
  }, [])

  const cancel = useCallback(() => {
    const jobId = jobIdRef.current
    controllerRef.current?.abort()
    stopPolling()
    if (jobId) void cancelSpeech(jobId).catch(() => undefined)
  }, [stopPolling])

  const retry = useCallback(() => {
    if (!state.lastAttempt) return Promise.resolve(null)
    return generate(state.lastAttempt)
  }, [generate, state.lastAttempt])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    stopPolling()
    releaseLocalUrl()
    setState(initialState)
  }, [releaseLocalUrl, stopPolling])

  return { ...state, generate, retry, cancel, reset, handoffAudioUrl }
}
