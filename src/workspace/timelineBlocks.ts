import type { TtsSynthesisRequest } from '../ai/contracts'
import { splitTextForUi } from '../tts/segmentText'
import { createRandomId } from '../utils/randomId'
import type { TimelineBlock, TimelineVoiceBlock } from './workspaceTypes'

export interface TimelineGenerationOptions {
  voiceId: string
  voiceName: string
  emotion: TtsSynthesisRequest['emotion']
  speed: number
  pitch: number
  engineId?: string
  normalizeText: boolean
}

export function estimateTimelineDuration(text: string): number {
  return Math.max(1.2, Math.round((text.length / 4.4) * 10) / 10)
}

export function createTimelineVoiceBlock(
  text: string,
  options: TimelineGenerationOptions,
): TimelineVoiceBlock {
  return {
    id: createRandomId(),
    kind: 'voice',
    text,
    voiceId: options.voiceId,
    voiceName: options.voiceName,
    emotion: options.emotion,
    speed: options.speed,
    pitch: options.pitch,
    engineId: options.engineId,
    normalizeText: options.normalizeText,
    jobId: null,
    durationSeconds: estimateTimelineDuration(text),
    status: 'queued',
    progress: 0,
    audio: null,
    trackId: null,
    error: null,
    revision: 1,
  }
}

export function timelineOptionsFromBlock(
  block: TimelineVoiceBlock,
): TimelineGenerationOptions {
  return {
    voiceId: block.voiceId,
    voiceName: block.voiceName,
    emotion: block.emotion,
    speed: block.speed,
    pitch: block.pitch,
    engineId: block.engineId,
    normalizeText: block.normalizeText,
  }
}

export function timelineBlocksFromText(
  text: string,
  options: TimelineGenerationOptions,
): TimelineBlock[] {
  const segments = splitTextForUi(text)
  return segments.flatMap((segment, index) => {
    const block = createTimelineVoiceBlock(segment, options)
    if (index === segments.length - 1) return [block]
    return [
      block,
      { id: createRandomId(), kind: 'pause' as const, durationSeconds: 0.5 },
    ]
  })
}

export function timelineSplitPoint(text: string): number {
  const center = Math.floor(text.length / 2)
  const right = text.indexOf(' ', center)
  const left = text.lastIndexOf(' ', center)
  if (right >= 0 && (left < 0 || right - center < center - left)) return right
  return left > 0 ? left : center
}
