import { describe, expect, it } from 'vitest'
import type { TimelineBlock } from '../workspace/workspaceTypes'
import {
  captureTimelineEditSnapshot,
  pushTimelineEditHistory,
  snapshotVoiceToQueuedBlock,
  timelineEditSnapshotsEqual,
} from './editHistory'

const block: TimelineBlock = {
  id: 'voice-1',
  kind: 'voice',
  text: '원래 문장',
  voiceId: 'sori-warm',
  voiceName: '혜린',
  emotion: 'neutral',
  speed: 1,
  pitch: 0,
  engineId: 'auto',
  normalizeText: true,
  jobId: 'job-1',
  status: 'ready',
  progress: 100,
  durationSeconds: 2,
  audio: null,
  trackId: 'track-1',
  error: null,
  revision: 3,
}

describe('timeline edit history', () => {
  it('오디오/트랙 상태를 제외한 편집 상태만 캡처한다', () => {
    const snapshot = captureTimelineEditSnapshot([block])
    expect(snapshot).toEqual([expect.objectContaining({
      id: 'voice-1',
      text: '원래 문장',
      voiceId: 'sori-warm',
    })])
    expect(snapshot[0]).not.toHaveProperty('audio')
    expect(snapshot[0]).not.toHaveProperty('trackId')
    expect(timelineEditSnapshotsEqual(snapshot, captureTimelineEditSnapshot([block]))).toBe(true)
  })

  it('내용이 되돌아오면 stale 음원을 복원하지 않고 queued로 만든다', () => {
    const snapshot = captureTimelineEditSnapshot([block])[0]
    if (snapshot.kind !== 'voice') throw new Error('voice snapshot expected')
    const restored = snapshotVoiceToQueuedBlock(snapshot, 8)
    expect(restored.status).toBe('queued')
    expect(restored.trackId).toBeNull()
    expect(restored.jobId).toBeNull()
    expect(restored.audio).toBeNull()
    expect(restored.revision).toBe(9)
  })

  it('이력은 최근 20건만 유지하고 새 편집 시 redo를 비운다', () => {
    let history = { past: [], future: [] } as ReturnType<typeof pushTimelineEditHistory>
    for (let index = 0; index < 25; index += 1) {
      history = pushTimelineEditHistory(history, {
        id: index,
        label: `편집 ${index}`,
        before: [],
        after: [],
      })
    }
    expect(history.past).toHaveLength(20)
    expect(history.past[0].label).toBe('편집 5')
    expect(history.future).toHaveLength(0)
  })
})
