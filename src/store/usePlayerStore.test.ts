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

  it('같은 트랙의 프리셋 버튼을 다시 누르면 재생 토글 신호를 보낸다', () => {
    const id = usePlayerStore.getState().enqueue(audio('toggle'), '토글 음성')
    const before = usePlayerStore.getState().toggleRequestId

    usePlayerStore.getState().toggleTrack(id)

    expect(usePlayerStore.getState().toggleRequestId).toBe(before + 1)
  })

  it('타임라인 위치 이동 요청은 트랙과 초 단위를 함께 기록한다', () => {
    const id = usePlayerStore.getState().enqueue(audio('seek'), '위치 이동')
    const before = usePlayerStore.getState().seekRequestId

    usePlayerStore.getState().seekTrack(id, 1.25)

    expect(usePlayerStore.getState()).toMatchObject({
      currentTrackId: id,
      seekTrackId: id,
      seekTargetSeconds: 1.25,
      seekRequestId: before + 1,
    })
  })

  it('프리뷰는 대기열 추가와 동시에 재생을 요청한다', () => {
    const before = usePlayerStore.getState().playRequestId
    const id = usePlayerStore.getState().enqueueAndPlay(audio('preview'), '프리뷰')

    expect(usePlayerStore.getState().currentTrackId).toBe(id)
    expect(usePlayerStore.getState().playRequestId).toBe(before + 1)
  })


  it('첫 구간 트랙을 같은 ID의 최종 음원으로 교체하고 지연 지표를 보존한다', () => {
    const partial = audio('partial')
    partial.partial = { index: 1, totalSegments: 3, readyAfterMs: 420 }
    partial.telemetry = { requestStartedAtMs: 1_000, serverSegmentReadyMs: 420 }
    const id = usePlayerStore.getState().enqueue(partial, '첫 구간')

    usePlayerStore.getState().updateTelemetry(id, { firstByteMs: 510 })
    usePlayerStore.getState().replace(id, audio('final'), '최종 음원', true)

    const state = usePlayerStore.getState()
    expect(state.queue).toHaveLength(1)
    expect(state.queue[0]).toMatchObject({
      id,
      title: '최종 음원',
      audio: {
        filename: 'final.wav',
        telemetry: {
          requestStartedAtMs: 1_000,
          serverSegmentReadyMs: 420,
          firstByteMs: 510,
        },
      },
    })
    expect(state.currentTrackId).toBe(id)
  })

  it('준비된 후속 구간을 번호 순서로 정렬하고 중복 구간을 무시한다', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const progressive = audio('segment-1')
    progressive.partial = { index: 1, totalSegments: 3, readyAfterMs: 300 }
    progressive.progressive = {
      jobId: 'ordered-job',
      totalSegments: 3,
      segments: [{
        index: 1,
        totalSegments: 3,
        url: 'blob:segment-1',
        filename: 'segment-1.wav',
        durationSeconds: 1,
        readyAfterMs: 300,
        revokeOnRemove: true,
      }],
    }
    const id = usePlayerStore.getState().enqueue(progressive, '연속 구간')

    usePlayerStore.getState().appendProgressiveSegment(id, {
      index: 3,
      totalSegments: 3,
      url: 'blob:segment-3',
      filename: 'segment-3.wav',
      durationSeconds: 1.4,
      readyAfterMs: 900,
      revokeOnRemove: true,
    })
    usePlayerStore.getState().appendProgressiveSegment(id, {
      index: 2,
      totalSegments: 3,
      url: 'blob:segment-2',
      filename: 'segment-2.wav',
      durationSeconds: 1.2,
      readyAfterMs: 600,
      revokeOnRemove: true,
    })
    usePlayerStore.getState().appendProgressiveSegment(id, {
      index: 2,
      totalSegments: 3,
      url: 'blob:segment-2-duplicate',
      filename: 'segment-2.wav',
      durationSeconds: 1.2,
      readyAfterMs: 610,
      revokeOnRemove: true,
    })

    const track = usePlayerStore.getState().queue[0]
    expect(track.audio.progressive?.segments.map((segment) => segment.index)).toEqual([1, 2, 3])
    expect(track.audio.durationSeconds).toBeCloseTo(3.6)
    expect(revoke).toHaveBeenCalledWith('blob:segment-2-duplicate')
  })

  it('revokes an owned object URL when a track is removed', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL')
    const id = usePlayerStore.getState().enqueue(audio('owned'), '샘플')
    usePlayerStore.getState().remove(id)
    expect(revoke).toHaveBeenCalledWith('blob:owned')
  })
  it('구간 전환 지표를 트랙에 누적한다', () => {
    const id = usePlayerStore.getState().enqueue(audio('seam'), '구간 전환')

    usePlayerStore.getState().recordSeamMetric(id, {
      fromSegment: 1,
      toSegment: 2,
      gapMs: 84,
      waitedForSegment: true,
      recordedAt: '2026-08-03T00:00:00.000Z',
    })

    expect(usePlayerStore.getState().queue[0].audio.telemetry?.seams).toEqual([{
      fromSegment: 1,
      toSegment: 2,
      gapMs: 84,
      waitedForSegment: true,
      recordedAt: '2026-08-03T00:00:00.000Z',
    }])
  })

  it('안전하게 저장된 대기열과 재생 위치를 빈 store에 복원한다', () => {
    const restored = {
      id: 'restored-track',
      title: '복원 음원',
      audio: { ...audio('restored'), url: 'https://voice.example/final.wav', source: 'api' as const, revokeOnRemove: false },
      createdAt: '2026-08-03T00:00:00.000Z',
      resumePositionSeconds: 3.5,
    }

    usePlayerStore.getState().restoreSession([restored], restored.id, 'all', 1.25)

    expect(usePlayerStore.getState()).toMatchObject({
      currentTrackId: restored.id,
      repeatMode: 'all',
      playbackRate: 1.25,
      queue: [{ resumePositionSeconds: 3.5 }],
    })
  })

})
