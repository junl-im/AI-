import { describe, expect, it } from 'vitest'
import type { TimelineBlock, TimelineVoiceBlock } from '../workspace/workspaceTypes'
import { findAdjacentVoiceBlockId, summarizeTimelineVoiceSelection } from './timelineSelection'

const voice = (id: string, voiceId = 'sori-warm', voiceName = '혜린'): TimelineVoiceBlock => ({
  id,
  kind: 'voice',
  text: id,
  voiceId,
  voiceName,
  emotion: 'neutral',
  speed: 1,
  pitch: 0,
  normalizeText: true,
  jobId: null,
  durationSeconds: 1,
  status: 'queued',
  progress: 0,
  audio: null,
  trackId: null,
  error: null,
  revision: 1,
})

const blocks: TimelineBlock[] = [
  voice('voice-1'),
  { id: 'pause-1', kind: 'pause', durationSeconds: 0.4 },
  voice('voice-2', 'on-clear', '도윤'),
  voice('voice-3', 'on-clear', '도윤'),
]

describe('timelineSelection', () => {
  it('이전/다음 대사 이동은 쉼 블록을 건너뛴다', () => {
    expect(findAdjacentVoiceBlockId(blocks, 'voice-1', 1)).toBe('voice-2')
    expect(findAdjacentVoiceBlockId(blocks, 'voice-2', -1)).toBe('voice-1')
    expect(findAdjacentVoiceBlockId(blocks, 'voice-3', 1)).toBeNull()
  })

  it('다중 선택의 혼합 목소리와 대상 개수를 요약한다', () => {
    expect(summarizeTimelineVoiceSelection(blocks.filter((block): block is TimelineVoiceBlock => block.kind === 'voice'))).toEqual({
      voiceCount: 2,
      voiceIds: ['sori-warm', 'on-clear'],
      mixed: true,
      labels: [
        { voiceId: 'sori-warm', voiceName: '혜린', count: 1 },
        { voiceId: 'on-clear', voiceName: '도윤', count: 2 },
      ],
    })
  })
})
