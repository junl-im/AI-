import type { TimelineBlock } from '../workspace/workspaceTypes'

export const TIMELINE_PIXELS_PER_SECOND = 72
export const TIMELINE_INSET_PX = 16
export const TIMELINE_MIN_CANVAS_PX = 640

export interface TimelineMetric {
  id: string
  offset: number
  width: number
  duration: number
}

export interface TimelineRulerTick {
  time: number
  left: number
}

export function timelineClipWidth(block: TimelineBlock, zoom: number): number {
  return Math.max(1, Math.max(0.1, block.durationSeconds) * TIMELINE_PIXELS_PER_SECOND * zoom)
}

export function buildTimelineMetrics(blocks: TimelineBlock[], zoom: number): TimelineMetric[] {
  let offset = TIMELINE_INSET_PX
  return blocks.map((block) => {
    const width = timelineClipWidth(block, zoom)
    const metric: TimelineMetric = {
      id: block.id,
      offset,
      width,
      duration: Math.max(0.1, block.durationSeconds),
    }
    offset += width
    return metric
  })
}

export function getTimelineContentWidth(metrics: TimelineMetric[]): number {
  return Math.max(1, metrics.reduce((total, metric) => total + metric.width, 0))
}

export function getTimelineCanvasWidth(metrics: TimelineMetric[]): number {
  return Math.max(TIMELINE_MIN_CANVAS_PX, getTimelineContentWidth(metrics) + TIMELINE_INSET_PX * 2)
}

export function buildTimelineRulerTicks(totalDuration: number, contentWidth: number): TimelineRulerTick[] {
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    time: totalDuration * ratio,
    left: TIMELINE_INSET_PX + contentWidth * ratio,
  }))
}
