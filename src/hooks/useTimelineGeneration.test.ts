import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/httpClient'
import { usePlayerStore } from '../store/usePlayerStore'
import type { TtsSynthesisResult } from '../ai/contracts'
import type { SpeechJobProgress, SpeechReadySegment } from '../tts/voiceApi'
import { useTimelineGeneration, type TimelineGenerationBatchResult } from './useTimelineGeneration'

const streamMocks = vi.hoisted(() => ({
  streamSpeechProgress: vi.fn(),
}))

const voiceApiMocks = vi.hoisted(() => ({
  getSpeechProgress: vi.fn(),
  getSpeechResult: vi.fn(),
  recoverSpeechResult: vi.fn(),
  refreshSpeechReadySegment: vi.fn(),
  synthesizeSpeech: vi.fn(),
}))

vi.mock('../tts/voiceApi', () => voiceApiMocks)

vi.mock('../tts/jobProgressStream', () => streamMocks)

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

function audioResponse(value: string): Response {
  return new Response(new TextEncoder().encode(value), {
    status: 200,
    headers: { 'Content-Type': 'audio/wav' },
  })
}

describe('useTimelineGeneration mobile recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamMocks.streamSpeechProgress.mockResolvedValue(true)
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


describe('useTimelineGeneration browser voice fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamMocks.streamSpeechProgress.mockResolvedValue(true)
    usePlayerStore.getState().clearQueue()
  })

  it('stores a browser speech result as a playable queue item without a fake WAV URL', async () => {
    voiceApiMocks.synthesizeSpeech.mockResolvedValueOnce({
      ...completedResult,
      jobId: 'browser-job',
      engineId: 'browser-speech',
      engineMode: 'browser',
      audioUrl: null,
      message: '브라우저 음성 준비',
    })
    const { result } = renderHook(() => useTimelineGeneration())
    let blockId = ''

    act(() => {
      ;[blockId] = result.current.stageText('브라우저 음성 문장입니다.', {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'auto',
        normalizeText: true,
      })
    })

    await act(async () => {
      await result.current.retryBlock(blockId)
    })

    const block = result.current.blocks.find((item) => item.id === blockId)
    expect(block?.kind).toBe('voice')
    if (!block || block.kind !== 'voice') throw new Error('voice block missing')
    expect(block.status).toBe('ready')
    expect(block.audio).toMatchObject({
      url: null,
      source: 'browser-speech',
      browserSpeech: { text: '브라우저 음성 문장입니다.', lang: 'ko-KR' },
    })
    expect(usePlayerStore.getState().queue[0]?.audio.source).toBe('browser-speech')
  })
})

describe('useTimelineGeneration revision safety', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamMocks.streamSpeechProgress.mockResolvedValue(true)
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


describe('useTimelineGeneration partial audio delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamMocks.streamSpeechProgress.mockResolvedValue(true)
    usePlayerStore.getState().clearQueue()
  })


  it('만료된 첫 구간 URL은 작업 상태에서 새 서명을 받아 한 번 다시 요청한다', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 410 }))
      .mockResolvedValueOnce(audioResponse('renewed-wave'))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:renewed-segment')
    voiceApiMocks.refreshSpeechReadySegment.mockResolvedValueOnce({
      index: 1,
      totalSegments: 2,
      filename: 'segment-1.wav',
      audioUrl: 'https://voice.example.com/segment-1-renewed.wav',
      engineId: 'cosyvoice3',
      engineMode: 'ai',
      estimatedDurationSeconds: 1.2,
      fileSizeBytes: 2048,
      readyAfterMs: 500,
      readyAt: new Date().toISOString(),
    })
    streamMocks.streamSpeechProgress.mockImplementationOnce(
      async (
        jobId: string,
        _onProgress: (progress: SpeechJobProgress) => void,
        _signal: AbortSignal,
        onSegmentReady: (segment: SpeechReadySegment) => void,
      ) => {
        onSegmentReady({
          index: 1,
          totalSegments: 2,
          filename: 'segment-1.wav',
          audioUrl: 'https://voice.example.com/segment-1-expired.wav',
          engineId: 'cosyvoice3',
          engineMode: 'ai',
          estimatedDurationSeconds: 1.2,
          fileSizeBytes: 2048,
          readyAfterMs: 500,
          readyAt: new Date().toISOString(),
        })
        expect(jobId).toBeTruthy()
        return true
      },
    )
    let resolveSynthesis: ((value: TtsSynthesisResult) => void) | null = null
    voiceApiMocks.synthesizeSpeech.mockImplementationOnce(() => new Promise((resolve) => {
      resolveSynthesis = resolve
    }))
    const { result } = renderHook(() => useTimelineGeneration())
    let blockId = ''

    act(() => {
      ;[blockId] = result.current.stageText('만료 URL 복구를 검증합니다.', {
        voiceId: 'jun-deep',
        voiceName: '준호',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'cosyvoice3',
        normalizeText: true,
      })
    })

    let generation: Promise<unknown>
    await act(async () => {
      generation = result.current.retryBlock(blockId)
      await Promise.resolve()
    })
    await vi.waitFor(() => expect(usePlayerStore.getState().queue[0]?.audio.url).toBe('blob:renewed-segment'))

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://voice.example.com/segment-1-renewed.wav',
      expect.objectContaining({ cache: 'no-store' }),
    )
    expect(voiceApiMocks.refreshSpeechReadySegment).toHaveBeenCalledWith(
      expect.any(String),
      1,
      expect.any(AbortSignal),
    )

    await act(async () => {
      resolveSynthesis?.({
        ...completedResult,
        jobId: 'renewed-job',
        audioUrl: 'https://voice.example.com/final.wav',
        segmentCount: 2,
      })
      await generation!
    })
  })

  it('첫 구간을 즉시 큐에 넣고 최종 WAV를 같은 트랙으로 교체한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(audioResponse('partial-wave'))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:partial-segment')
    streamMocks.streamSpeechProgress.mockImplementationOnce(
      async (
        _jobId: string,
        _onProgress: (progress: SpeechJobProgress) => void,
        _signal: AbortSignal,
        onSegmentReady: (segment: SpeechReadySegment) => void,
      ) => {
        onSegmentReady({
          index: 1,
          totalSegments: 3,
          filename: 'segment-1.wav',
          audioUrl: 'https://voice.example.com/segment-1.wav',
          engineId: 'cosyvoice3',
          engineMode: 'ai',
          estimatedDurationSeconds: 1.4,
          fileSizeBytes: 4096,
          readyAfterMs: 650,
          readyAt: new Date().toISOString(),
        })
        return true
      },
    )
    let resolveSynthesis: ((value: TtsSynthesisResult) => void) | null = null
    voiceApiMocks.synthesizeSpeech.mockImplementationOnce(() => new Promise((resolve) => {
      resolveSynthesis = resolve
    }))
    const { result } = renderHook(() => useTimelineGeneration())
    let blockId = ''

    act(() => {
      ;[blockId] = result.current.stageText('첫 구간 전달을 검증하는 장문입니다.', {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'cosyvoice3',
        normalizeText: true,
      })
    })

    let generation: Promise<unknown>
    await act(async () => {
      generation = result.current.retryBlock(blockId)
      await Promise.resolve()
    })
    await vi.waitFor(() => {
      expect(usePlayerStore.getState().queue[0]?.audio.partial).toMatchObject({
        index: 1,
        totalSegments: 3,
      })
    })
    const partialTrackId = usePlayerStore.getState().queue[0].id

    await act(async () => {
      resolveSynthesis?.({
        ...completedResult,
        jobId: 'partial-job',
        audioUrl: 'https://voice.example.com/final.wav',
        segmentCount: 3,
      })
      await generation!
    })

    const state = usePlayerStore.getState()
    expect(state.queue).toHaveLength(1)
    expect(state.queue[0]).toMatchObject({
      id: partialTrackId,
      audio: {
        url: 'https://voice.example.com/final.wav',
        telemetry: { serverSegmentReadyMs: 650 },
      },
    })
    expect(state.queue[0].audio.telemetry?.firstByteMs).toEqual(expect.any(Number))
    expect(state.queue[0].audio.partial).toBeUndefined()
    expect(result.current.blocks[0]).toMatchObject({
      kind: 'voice',
      status: 'ready',
      trackId: partialTrackId,
      audio: { telemetry: { serverSegmentReadyMs: 650 } },
    })
  })
  it('뒤섞여 도착한 구간을 번호 순서대로 준비해 하나의 트랙에 누적한다', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(audioResponse('one'))
      .mockResolvedValueOnce(audioResponse('two'))
      .mockResolvedValueOnce(audioResponse('three'))
    vi.spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:ordered-1')
      .mockReturnValueOnce('blob:ordered-2')
      .mockReturnValueOnce('blob:ordered-3')
    const segment = (index: number): SpeechReadySegment => ({
      index,
      totalSegments: 3,
      filename: `segment-${index}.wav`,
      audioUrl: `https://voice.example.com/segment-${index}.wav`,
      engineId: 'cosyvoice3',
      engineMode: 'ai',
      estimatedDurationSeconds: index,
      fileSizeBytes: 1024 * index,
      readyAfterMs: 300 * index,
      readyAt: new Date().toISOString(),
    })
    streamMocks.streamSpeechProgress.mockImplementationOnce(
      async (
        _jobId: string,
        _onProgress: (progress: SpeechJobProgress) => void,
        _signal: AbortSignal,
        onSegmentReady: (segment: SpeechReadySegment) => void,
      ) => {
        onSegmentReady(segment(2))
        onSegmentReady(segment(1))
        onSegmentReady(segment(3))
        return true
      },
    )
    let resolveSynthesis: ((value: TtsSynthesisResult) => void) | null = null
    voiceApiMocks.synthesizeSpeech.mockImplementationOnce(() => new Promise((resolve) => {
      resolveSynthesis = resolve
    }))
    const { result } = renderHook(() => useTimelineGeneration())
    let blockId = ''

    act(() => {
      ;[blockId] = result.current.stageText('순서가 뒤섞인 구간을 검증합니다.', {
        voiceId: 'jun-deep',
        voiceName: '준호',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'cosyvoice3',
        normalizeText: true,
      })
    })

    let generation: Promise<unknown>
    await act(async () => {
      generation = result.current.retryBlock(blockId)
      await Promise.resolve()
    })

    await vi.waitFor(() => {
      expect(usePlayerStore.getState().queue[0]?.audio.progressive?.segments)
        .toHaveLength(3)
    })
    expect(usePlayerStore.getState().queue[0]?.audio.progressive?.segments.map((item) => item.index))
      .toEqual([1, 2, 3])
    expect(usePlayerStore.getState().queue[0]?.audio.progressive?.segments.map((item) => item.url))
      .toEqual(['blob:ordered-1', 'blob:ordered-2', 'blob:ordered-3'])

    await act(async () => {
      resolveSynthesis?.({
        ...completedResult,
        jobId: 'ordered-job',
        audioUrl: 'https://voice.example.com/ordered-final.wav',
        segmentCount: 3,
        estimatedDurationSeconds: 6,
      })
      await generation!
    })
  })

})

it('moves and removes multiple timeline blocks while preserving their relative order', () => {
  const { result } = renderHook(() => useTimelineGeneration())
  act(() => {
    result.current.restoreSession([
      {
        id: 'voice-a',
        kind: 'voice',
        text: '첫 문장',
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
        jobId: null,
        status: 'queued',
        progress: 0,
        durationSeconds: 2,
        error: null,
        revision: 1,
      },
      { id: 'pause-a', kind: 'pause', durationSeconds: 0.5 },
      {
        id: 'voice-b',
        kind: 'voice',
        text: '둘째 문장',
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
        jobId: null,
        status: 'queued',
        progress: 0,
        durationSeconds: 2,
        error: null,
        revision: 1,
      },
    ])
  })

  act(() => {
    result.current.moveBlocks(['voice-a', 'voice-b'], -1)
  })
  expect(result.current.blocks.map((block) => block.id)).toEqual(['voice-a', 'voice-b', 'pause-a'])

  act(() => {
    result.current.removeBlocks(['voice-a', 'voice-b'])
  })
  expect(result.current.blocks.map((block) => block.id)).toEqual(['pause-a'])
})

it('changes only selected voice blocks and invalidates their generated revision for batch editing', () => {
  const { result } = renderHook(() => useTimelineGeneration())
  act(() => {
    result.current.restoreSession([
      {
        id: 'voice-a',
        kind: 'voice',
        text: '첫 문장',
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
        jobId: null,
        status: 'queued',
        progress: 0,
        durationSeconds: 2,
        error: null,
        revision: 3,
      },
      { id: 'pause-a', kind: 'pause', durationSeconds: 0.5 },
      {
        id: 'voice-b',
        kind: 'voice',
        text: '둘째 문장',
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
        jobId: null,
        status: 'queued',
        progress: 0,
        durationSeconds: 2,
        error: null,
        revision: 4,
      },
    ])
  })

  act(() => {
    result.current.updateVoiceMany(['voice-a', 'pause-a'], 'on-clear', '도윤')
  })

  const first = result.current.blocks.find((block) => block.id === 'voice-a')
  const second = result.current.blocks.find((block) => block.id === 'voice-b')
  expect(first?.kind).toBe('voice')
  expect(second?.kind).toBe('voice')
  if (!first || first.kind !== 'voice' || !second || second.kind !== 'voice') {
    throw new Error('voice block missing')
  }
  expect(first.voiceId).toBe('on-clear')
  expect(first.voiceName).toBe('도윤')
  expect(first.revision).toBe(4)
  expect(first.status).toBe('queued')
  expect(second.voiceId).toBe('sori-warm')
  expect(second.revision).toBe(4)
})


describe('useTimelineGeneration fast ordered batch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamMocks.streamSpeechProgress.mockResolvedValue(true)
    usePlayerStore.getState().clearQueue()
  })

  it('첫 음성은 먼저 재생하고 나머지는 최대 2개 병렬 처리한 뒤 원문 순서로 정렬한다', async () => {
    let active = 0
    let maxActive = 0
    voiceApiMocks.synthesizeSpeech.mockImplementation(async (request, jobId) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      const delay = request.text.includes('두 번째') ? 24 : request.text.includes('세 번째') ? 3 : 2
      await new Promise((resolve) => setTimeout(resolve, delay))
      active -= 1
      return {
        ...completedResult,
        jobId,
        engineId: 'browser-speech',
        engineMode: 'browser',
        audioUrl: null,
        normalizedText: request.text,
      }
    })

    const { result } = renderHook(() => useTimelineGeneration())
    let ids: string[] = []
    act(() => {
      ids = result.current.stageText('첫 번째 문장입니다. 두 번째 문장입니다. 세 번째 문장입니다. 네 번째 문장입니다.', {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'auto',
        normalizeText: true,
      })
    })

    let batch!: TimelineGenerationBatchResult
    await act(async () => {
      batch = await result.current.generateAll(ids, true)
    })

    expect(batch.cancelled).toBe(false)
    expect(batch.concurrency).toBe(2)
    expect(batch.results.map((item) => item.blockId)).toEqual(ids)
    expect(maxActive).toBe(2)
    expect(usePlayerStore.getState().queue.map((track) => track.title)).toEqual([
      expect.stringContaining('첫 번째'),
      expect.stringContaining('두 번째'),
      expect.stringContaining('세 번째'),
      expect.stringContaining('네 번째'),
    ])
  })
})

describe('useTimelineGeneration multi speaker staging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    streamMocks.streamSpeechProgress.mockResolvedValue(true)
    usePlayerStore.getState().clearQueue()
  })

  it('stages explicit per-clip voice options without collapsing them to the project default', () => {
    const { result } = renderHook(() => useTimelineGeneration())
    act(() => {
      result.current.stageSegments([
        {
          text: '철수 대사입니다.',
          options: {
            voiceId: 'on-clear',
            voiceName: '도윤',
            emotion: 'neutral',
            speed: 1,
            pitch: 0,
            engineId: 'auto',
            normalizeText: true,
          },
        },
        {
          text: '영희 대사입니다.',
          options: {
            voiceId: 'sori-warm',
            voiceName: '혜린',
            emotion: 'neutral',
            speed: 1,
            pitch: 0,
            engineId: 'auto',
            normalizeText: true,
          },
        },
      ])
    })

    const voices = result.current.blocks
      .filter((block) => block.kind === 'voice')
      .map((block) => ({ text: block.text, voiceId: block.voiceId }))
    expect(voices).toEqual([
      { text: '철수 대사입니다.', voiceId: 'on-clear' },
      { text: '영희 대사입니다.', voiceId: 'sori-warm' },
    ])
  })

  it('restores saved project clip-level voices and job ordering', () => {
    const { result } = renderHook(() => useTimelineGeneration())
    let recoverableIds: string[] = []
    act(() => {
      recoverableIds = result.current.restoreProject({
        id: 'multi-project',
        title: '다중 화자',
        text: '철수: 안녕하세요.\n영희: 반가워요.',
        voiceId: 'sori-warm',
        emotion: 'neutral',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'generated',
        jobIds: ['job-a', 'job-b'],
        timelineClips: [
          { text: '안녕하세요.', voiceId: 'on-clear', voiceName: '도윤' },
          { text: '반가워요.', voiceId: 'sori-warm', voiceName: '혜린' },
        ],
      }, {
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'auto',
        normalizeText: true,
      })
    })

    expect(recoverableIds).toHaveLength(2)
    const voices = result.current.blocks.filter((block) => block.kind === 'voice')
    expect(voices).toMatchObject([
      { text: '안녕하세요.', voiceId: 'on-clear', jobId: 'job-a' },
      { text: '반가워요.', voiceId: 'sori-warm', jobId: 'job-b' },
    ])
  })
})
