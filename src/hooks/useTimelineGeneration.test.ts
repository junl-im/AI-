import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/httpClient'
import { usePlayerStore } from '../store/usePlayerStore'
import type { TtsSynthesisResult } from '../ai/contracts'
import { useTimelineGeneration } from './useTimelineGeneration'

const voiceApiMocks = vi.hoisted(() => ({
  getSpeechProgress: vi.fn(),
  getSpeechResult: vi.fn(),
  recoverSpeechResult: vi.fn(),
  synthesizeSpeech: vi.fn(),
}))

vi.mock('../tts/voiceApi', () => voiceApiMocks)

const completedResult: TtsSynthesisResult = {
  jobId: 'mobile-job',
  status: 'completed',
  engineId: 'system',
  engineMode: 'local',
  audioUrl: 'https://voice.example.com/result.wav',
  estimatedDurationSeconds: 2,
  message: '완료',
  normalizedText: '모바일 복구 테스트입니다.',
  segmentCount: 1,
  processingMs: 800,
  fileSizeBytes: 1024,
  realtimeFactor: 0.4,
}

describe('useTimelineGeneration mobile recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePlayerStore.getState().clearQueue()
  })

  it('keeps the job id after a network failure and recovers before creating another job', async () => {
    voiceApiMocks.synthesizeSpeech.mockRejectedValueOnce(
      new ApiError('연결이 끊겼습니다.', 0, 'SOA-2001', 'cors-or-network', true),
    )
    const { result } = renderHook(() => useTimelineGeneration())
    let blockId = ''

    act(() => {
      ;[blockId] = result.current.stageText('모바일 복구 테스트입니다.', {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
      })
    })

    await act(async () => {
      await result.current.retryBlock(blockId)
    })

    const failed = result.current.blocks.find((block) => block.id === blockId)
    expect(failed?.kind).toBe('voice')
    if (!failed || failed.kind !== 'voice') throw new Error('voice block missing')
    expect(failed.status).toBe('failed')
    expect(failed.jobId).toBeTruthy()
    const originalJobId = failed.jobId

    voiceApiMocks.getSpeechProgress.mockResolvedValueOnce({
      jobId: originalJobId,
      status: 'completed',
      phase: 'completed',
      progress: 100,
      currentSegment: 1,
      totalSegments: 1,
      message: '완료',
      error: null,
      updatedAt: new Date().toISOString(),
    })
    voiceApiMocks.getSpeechResult.mockResolvedValueOnce({
      ...completedResult,
      jobId: originalJobId,
    })

    await act(async () => {
      await result.current.retryBlock(blockId)
    })

    expect(voiceApiMocks.synthesizeSpeech).toHaveBeenCalledTimes(1)
    expect(voiceApiMocks.getSpeechResult).toHaveBeenCalledWith(
      originalJobId,
      expect.any(AbortSignal),
    )
    const recovered = result.current.blocks.find((block) => block.id === blockId)
    expect(recovered?.kind).toBe('voice')
    if (!recovered || recovered.kind !== 'voice') throw new Error('voice block missing')
    expect(recovered.status).toBe('ready')
    expect(recovered.jobId).toBe(originalJobId)
  })

  it('restores a saved project and recovers its persisted job without creating a new one', async () => {
    voiceApiMocks.getSpeechProgress.mockResolvedValueOnce({
      jobId: 'saved-job',
      status: 'completed',
      phase: 'completed',
      progress: 100,
      currentSegment: 1,
      totalSegments: 1,
      message: '완료',
      error: null,
      updatedAt: new Date().toISOString(),
    })
    voiceApiMocks.getSpeechResult.mockResolvedValueOnce({
      ...completedResult,
      jobId: 'saved-job',
    })
    const { result } = renderHook(() => useTimelineGeneration())
    let recoverableIds: string[] = []

    act(() => {
      recoverableIds = result.current.restoreProject({
        id: 'project-1',
        title: '저장 프로젝트',
        text: '저장된 프로젝트 문장입니다.',
        voiceId: 'sori-warm',
        emotion: 'neutral',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'generated',
        lastJobId: 'saved-job',
      }, {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
      })
    })

    expect(recoverableIds).toHaveLength(1)
    expect(result.current.blocks).toHaveLength(1)

    await act(async () => {
      await result.current.recoverBlocks(recoverableIds)
    })

    expect(voiceApiMocks.getSpeechResult).toHaveBeenCalledWith(
      'saved-job',
      expect.any(AbortSignal),
    )
    expect(voiceApiMocks.synthesizeSpeech).not.toHaveBeenCalled()
    expect(result.current.blocks[0]).toMatchObject({
      kind: 'voice',
      status: 'ready',
      jobId: 'saved-job',
    })
  })
})

describe('useTimelineGeneration revision safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePlayerStore.getState().clearQueue()
  })

  it('does not let an old generation result overwrite edited text', async () => {
    let resolveSynthesis: ((value: TtsSynthesisResult) => void) | null = null
    voiceApiMocks.synthesizeSpeech.mockImplementationOnce(() => new Promise((resolve) => {
      resolveSynthesis = resolve
    }))
    const { result } = renderHook(() => useTimelineGeneration())
    let blockId = ''

    act(() => {
      ;[blockId] = result.current.stageText('수정 전 문장입니다.', {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
      })
    })

    let generation: Promise<unknown>
    await act(async () => {
      generation = result.current.retryBlock(blockId)
      await Promise.resolve()
    })
    act(() => result.current.updateText(blockId, '수정 후 문장입니다.'))

    await act(async () => {
      resolveSynthesis?.({ ...completedResult, jobId: 'stale-job' })
      await generation!
    })

    expect(usePlayerStore.getState().queue).toHaveLength(0)
    expect(result.current.blocks[0]).toMatchObject({
      kind: 'voice',
      text: '수정 후 문장입니다.',
      status: 'queued',
      jobId: null,
      revision: 2,
    })
  })

  it('restores persisted blocks in order and reconnects only saved jobs', () => {
    const { result } = renderHook(() => useTimelineGeneration())
    let recoverableIds: string[] = []

    act(() => {
      recoverableIds = result.current.restoreSession([
        {
          id: 'saved-voice',
          kind: 'voice',
          text: '저장된 문장',
          voiceId: 'sori-warm',
          voiceName: '혜린',
          emotion: 'neutral',
          speed: 1,
          pitch: 0,
          engineId: 'auto',
          normalizeText: true,
          jobId: 'saved-job',
          status: 'generating',
          progress: 48,
          durationSeconds: 2,
          error: null,
          revision: 3,
        },
        { id: 'saved-pause', kind: 'pause', durationSeconds: 0.5 },
      ])
    })

    expect(recoverableIds).toEqual(['saved-voice'])
    expect(result.current.blocks).toHaveLength(2)
    expect(result.current.blocks[0]).toMatchObject({
      id: 'saved-voice',
      status: 'queued',
      progress: 0,
      revision: 3,
      audio: null,
      trackId: null,
    })
  })
})
