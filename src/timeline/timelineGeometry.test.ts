import { describe, expect, it } from 'vitest'
import type { TimelineBlock } from '../workspace/workspaceTypes'
import {
  TIMELINE_INSET_PX,
  TIMELINE_PIXELS_PER_SECOND,
  buildTimelineMetrics,
  buildTimelineRulerTicks,
  getTimelineCanvasWidth,
  getTimelineContentWidth,
} from './timelineGeometry'

const blocks: TimelineBlock[] = [
  { id: 'voice-a', kind: 'voice', text: 'A', voiceId: 'sori-warm', voiceName: '혜린', emotion: 'neutral', speed: 1, pitch: 0, engineId: 'system', normalizeText: true, jobId: null, durationSeconds: 3, status: 'ready', progress: 100, audio: null, trackId: null, error: null, revision: 1 },
  { id: 'pause-a', kind: 'pause', durationSeconds: 0.5 },
  { id: 'voice-b', kind: 'voice', text: 'B', voiceId: 'sori-warm', voiceName: '혜린', emotion: 'neutral', speed: 1, pitch: 0, engineId: 'system', normalizeText: true, jobId: null, durationSeconds: 4, status: 'queued', progress: 0, audio: null, trackId: null, error: null, revision: 1 },
]

describe('timelineGeometry', () => {
  it('시간 길이를 동일한 X축 픽셀 폭과 offset으로 변환한다', () => {
    const metrics = buildTimelineMetrics(blocks, 1)
    expect(metrics.map((metric) => [metric.offset, metric.width])).toEqual([
      [TIMELINE_INSET_PX, 3 * TIMELINE_PIXELS_PER_SECOND],
      [TIMELINE_INSET_PX + 3 * TIMELINE_PIXELS_PER_SECOND, 0.5 * TIMELINE_PIXELS_PER_SECOND],
      [TIMELINE_INSET_PX + 3.5 * TIMELINE_PIXELS_PER_SECOND, 4 * TIMELINE_PIXELS_PER_SECOND],
    ])
    expect(getTimelineContentWidth(metrics)).toBe(7.5 * TIMELINE_PIXELS_PER_SECOND)
    expect(getTimelineCanvasWidth(metrics)).toBe(640)
  })

  it('ruler tick도 클립과 같은 시간축 폭을 사용한다', () => {
    const metrics = buildTimelineMetrics(blocks, 1.5)
    const width = getTimelineContentWidth(metrics)
    const ticks = buildTimelineRulerTicks(7.5, width)
    expect(ticks[0]).toEqual({ time: 0, left: TIMELINE_INSET_PX })
    expect(ticks.at(-1)).toEqual({ time: 7.5, left: TIMELINE_INSET_PX + width })
  })
})
