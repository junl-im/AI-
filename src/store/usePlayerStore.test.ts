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

  it('queues tracks and selects the newest track', () => {
    usePlayerStore.getState().enqueue(audio('one'), '첫 음성')
    usePlayerStore.getState().enqueue(audio('two'), '두 번째 음성')
    expect(usePlayerStore.getState().queue).toHaveLength(2)
    expect(getCurrentTrack(usePlayerStore.getState())?.title).toBe('두 번째 음성')
  })

  it('revokes an owned object URL when a track is removed', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const id = usePlayerStore.getState().enqueue(audio('owned'), '샘플')
    usePlayerStore.getState().remove(id)
    expect(revoke).toHaveBeenCalledWith('blob:owned')
  })
})
