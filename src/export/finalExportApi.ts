import { apiRequest, resolveApiAssetUrl } from '../api/httpClient'
import type { TimelineBlock } from '../workspace/workspaceTypes'

export interface FinalExportResult {
  audioUrl: string
  srtUrl: string
  vttUrl: string
  outputFormat: 'wav' | 'mp3'
  durationSeconds: number
  skippedSegments: number
  message: string
  serverExpiresAt: string
  serverRetentionMinutes: number
  preservationMode: 'download-only'
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

export async function createFinalExport(
  blocks: TimelineBlock[],
  outputFormat: 'wav' | 'mp3',
  allowIncomplete = false,
): Promise<FinalExportResult> {
  const result = await apiRequest<{
    audio_url: string
    srt_url: string
    vtt_url: string
    output_format: 'wav' | 'mp3'
    duration_seconds: number
    skipped_segments: number
    message: string
    server_expires_at: string
    server_retention_minutes: number
    preservation_mode: 'download-only'
  }>('/exports', {
    method: 'POST',
    body: JSON.stringify({
      output_format: outputFormat,
      allow_incomplete: allowIncomplete,
      segments: blocks.map((block) => block.kind === 'pause'
        ? {
            kind: 'pause',
            duration_ms: Math.round(block.durationSeconds * 1000),
          }
        : {
            kind: 'voice',
            text: block.text,
            audio_filename: audioFilename(block),
            status: block.status === 'ready' && audioFilename(block) ? 'ready' : 'queued',
          }),
    }),
  }, { timeoutMs: 180_000 })
  return {
    audioUrl: resolveApiAssetUrl(result.audio_url) ?? result.audio_url,
    srtUrl: resolveApiAssetUrl(result.srt_url) ?? result.srt_url,
    vttUrl: resolveApiAssetUrl(result.vtt_url) ?? result.vtt_url,
    outputFormat: result.output_format,
    durationSeconds: result.duration_seconds,
    skippedSegments: result.skipped_segments,
    message: result.message,
    serverExpiresAt: result.server_expires_at,
    serverRetentionMinutes: result.server_retention_minutes,
    preservationMode: result.preservation_mode,
  }
}
