import { getApiBaseUrl, resolveApiAssetUrl } from '../api/httpClient'
import { getApiClientId } from '../api/apiConnection'
import type { SpeechJobProgress, SpeechReadySegment } from './voiceApi'

interface ApiReadySegment {
  index: number
  total_segments: number
  filename: string
  audio_url: string
  engine_id: string
  engine_mode: SpeechReadySegment['engineMode']
  estimated_duration_seconds: number
  file_size_bytes: number
  ready_after_ms: number
  ready_at: string
}

interface ApiJobProgress {
  job_id: string
  status: SpeechJobProgress['status']
  phase: SpeechJobProgress['phase']
  progress: number
  current_segment: number
  total_segments: number
  message: string
  error: string | null
  ready_segments?: ApiReadySegment[]
  updated_at: string
}

function mapSegment(value: ApiReadySegment): SpeechReadySegment {
  return {
    index: value.index,
    totalSegments: value.total_segments,
    filename: value.filename,
    audioUrl: resolveApiAssetUrl(value.audio_url) ?? value.audio_url,
    engineId: value.engine_id,
    engineMode: value.engine_mode,
    estimatedDurationSeconds: value.estimated_duration_seconds,
    fileSizeBytes: value.file_size_bytes,
    readyAfterMs: value.ready_after_ms,
    readyAt: value.ready_at,
  }
}

function mapProgress(value: ApiJobProgress): SpeechJobProgress {
  return {
    jobId: value.job_id,
    status: value.status,
    phase: value.phase,
    progress: value.progress,
    currentSegment: value.current_segment,
    totalSegments: value.total_segments,
    message: value.message,
    error: value.error,
    readySegments: (value.ready_segments ?? []).map(mapSegment),
    updatedAt: value.updated_at,
  }
}

function consumeFrame(
  frame: string,
  onProgress: (progress: SpeechJobProgress) => void,
  onSegmentReady: (segment: SpeechReadySegment) => void,
): void {
  const event = frame
    .split('\n')
    .find((line) => line.startsWith('event:'))
    ?.slice('event:'.length)
    .trim()
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n')
  if (!data) return
  if (event === 'progress') {
    onProgress(mapProgress(JSON.parse(data) as ApiJobProgress))
  } else if (event === 'segment-ready') {
    onSegmentReady(mapSegment(JSON.parse(data) as ApiReadySegment))
  }
}

export async function streamSpeechProgress(
  jobId: string,
  onProgress: (progress: SpeechJobProgress) => void,
  signal: AbortSignal,
  onSegmentReady: (segment: SpeechReadySegment) => void = () => undefined,
): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  if (!baseUrl || signal.aborted) return false
  try {
    const response = await fetch(
      `${baseUrl}/tts/jobs/${encodeURIComponent(jobId)}/events`,
      {
        signal,
        cache: 'no-store',
        credentials: 'omit',
        headers: {
          Accept: 'text/event-stream',
          'X-SoriON-Client-ID': getApiClientId(),
        },
      },
    )
    if (!response.ok || !response.body) return false
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (!signal.aborted) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, '\n')
      let boundary = buffer.indexOf('\n\n')
      while (boundary >= 0) {
        consumeFrame(buffer.slice(0, boundary), onProgress, onSegmentReady)
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
      if (done) break
    }
    if (buffer.trim()) consumeFrame(buffer, onProgress, onSegmentReady)
    return true
  } catch (error) {
    if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return true
    }
    return false
  }
}
