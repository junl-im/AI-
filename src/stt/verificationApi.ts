import { apiRequest } from '../api/httpClient'
import type { TimelineBlock } from '../workspace/workspaceTypes'

export interface SttSegmentVerificationResult {
  segmentId: string
  audioFilename: string
  transcriptText: string
  characterErrorRate: number
  wordErrorRate: number
  realtimeFactor: number | null
  needsRegeneration: boolean
  regenerationAllowed: boolean
  reasons: string[]
}

export interface SttBatchVerificationResult {
  engineId: string
  modelId: string
  deviceProfile: string
  results: SttSegmentVerificationResult[]
  regenerationSegmentIds: string[]
  blockedSegmentIds: string[]
  processingSeconds: number
}

function audioFilename(block: Extract<TimelineBlock, { kind: 'voice' }>): string | null {
  if (block.audio?.source !== 'api' || !block.audio.url) return null
  try {
    const url = new URL(block.audio.url, window.location.href)
    return url.pathname.split('/').filter(Boolean).at(-1) ?? null
  } catch {
    return null
  }
}

export async function verifyTimelineSegments(
  blocks: TimelineBlock[],
): Promise<SttBatchVerificationResult> {
  const segments = blocks.flatMap((block) => {
    if (block.kind !== 'voice' || block.status !== 'ready') return []
    const filename = audioFilename(block)
    if (!filename) return []
    return [{
      segment_id: block.id,
      audio_filename: filename,
      reference_text: block.text,
      regeneration_attempts: block.sttVerification?.regenerationAttempts ?? 0,
    }]
  })
  if (!segments.length) {
    throw new Error('STT로 검수할 서버 WAV 음성이 없습니다.')
  }
  const result = await apiRequest<{
    engine_id: string
    model_id: string
    device_profile: string
    results: Array<{
      segment_id: string
      audio_filename: string
      transcript_text: string
      character_error_rate: number
      word_error_rate: number
      realtime_factor: number | null
      needs_regeneration: boolean
      regeneration_allowed: boolean
      reasons: string[]
    }>
    regeneration_segment_ids: string[]
    blocked_segment_ids: string[]
    processing_seconds: number
  }>('/quality/stt/verify-segments', {
    method: 'POST',
    body: JSON.stringify({ segments }),
  }, { timeoutMs: 300_000 })
  return {
    engineId: result.engine_id,
    modelId: result.model_id,
    deviceProfile: result.device_profile,
    results: result.results.map((item) => ({
      segmentId: item.segment_id,
      audioFilename: item.audio_filename,
      transcriptText: item.transcript_text,
      characterErrorRate: item.character_error_rate,
      wordErrorRate: item.word_error_rate,
      realtimeFactor: item.realtime_factor,
      needsRegeneration: item.needs_regeneration,
      regenerationAllowed: item.regeneration_allowed,
      reasons: item.reasons,
    })),
    regenerationSegmentIds: result.regeneration_segment_ids,
    blockedSegmentIds: result.blocked_segment_ids,
    processingSeconds: result.processing_seconds,
  }
}


export interface SttRegenerationComparisonRequest {
  segment_id: string
  reference_text: string
  before_transcript: string
  after_transcript: string
  engine_id: string
  model_id: string
  device_profile: string
}

export function buildSttComparisonRequests(
  blocks: TimelineBlock[],
  report: SttBatchVerificationResult,
): SttRegenerationComparisonRequest[] {
  const previousById = new Map(
    blocks.flatMap((block) => {
      if (block.kind !== 'voice') return []
      const verification = block.sttVerification
      if (!verification || verification.regenerationAttempts < 1 || !verification.transcriptText) return []
      return [[block.id, { text: block.text, transcript: verification.transcriptText }] as const]
    }),
  )
  return report.results.flatMap((result) => {
    const previous = previousById.get(result.segmentId)
    if (!previous || previous.transcript === result.transcriptText) return []
    return [{
      segment_id: result.segmentId,
      reference_text: previous.text,
      before_transcript: previous.transcript,
      after_transcript: result.transcriptText,
      engine_id: report.engineId,
      model_id: report.modelId,
      device_profile: report.deviceProfile,
    }]
  })
}

export async function recordSttRegenerationComparisons(
  blocks: TimelineBlock[],
  report: SttBatchVerificationResult,
): Promise<number> {
  const requests = buildSttComparisonRequests(blocks, report)
  const settled = await Promise.allSettled(requests.map((body) => apiRequest(
    '/quality/stt/regeneration-comparisons',
    { method: 'POST', body: JSON.stringify(body) },
  )))
  return settled.filter((item) => item.status === 'fulfilled').length
}
