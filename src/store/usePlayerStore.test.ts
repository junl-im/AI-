import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GeneratedAudio } from '../tts/generationTypes'
import { getCurrentTrack, usePlayerStore } from './usePlayerStore'

function audio(id: string): GeneratedAudio {
  return {
    url: `blob:${id}`,
    filename: `${id}.wav`,
    source: 'browser-demo',
    durationSeconds: 2,
    revokeOnRemove: true,
    result: {
      jobId: id,
      status: 'completed',
      engineId: 'test',
      engineMode: 'mock',
      audioUrl: null,
      estimatedDurationSeconds: 2,
      message: 'test',
      normalizedText: null,
      segmentCount: 1,
      processingMs: null,
      fileSizeBytes: 10,
      realtimeFactor: null,
    },
  }
}

describe('usePlayerStore', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearQueue()
    vi.restoreAllMocks()
  })

  it('queues tracks and keeps the first completed track selected', () => {
    usePlayerStore.getState().enqueue(audio('one'), '첫 음성')
    usePlayerStore.getState().enqueue(audio('two'), '두 번째 음성')
    expect(usePlayerStore.getState().queue).toHaveLength(2)
    expect(getCurrentTrack(usePlayerStore.getState())?.title).toBe('첫 음성')
  })

  it('play 버튼 요청은 선택과 재생 신호를 함께 올린다', () => {
    const first = usePlayerStore.getState().enqueue(audio('one'), '첫 음성')
    const second = usePlayerStore.getState().enqueue(audio('two'), '두 번째 음성')
    const before = usePlayerStore.getState().playRequestId

    usePlayerStore.getState().selectAndPlay(second)

    expect(usePlayerStore.getState().currentTrackId).toBe(second)
    expect(usePlayerStore.getState().playRequestId).toBe(before + 1)
    expect(first).not.toBe(second)
  })

  it('프리뷰는 대기열 추가와 동시에 재생을 요청한다', () => {
    const before = usePlayerStore.getState().playRequestId
    const id = usePlayerStore.getState().enqueueAndPlay(audio('preview'), '프리뷰')

    expect(usePlayerStore.getState().currentTrackId).toBe(id)
    expect(usePlayerStore.getState().playRequestId).toBe(before + 1)
  })

  it('revokes an owned object URL when a track is removed', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const id = usePlayerStore.getState().enqueue(audio('owned'), '샘플')
    usePlayerStore.getState().remove(id)
    expect(revoke).toHaveBeenCalledWith('blob:owned')
  })
})
