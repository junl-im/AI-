import { getApiBaseUrl } from '../api/httpClient'
import { getApiClientId } from '../api/apiConnection'
import type { SpeechJobProgress } from './voiceApi'

interface ApiJobProgress {
  job_id: string
  status: SpeechJobProgress['status']
  phase: SpeechJobProgress['phase']
  progress: number
  current_segment: number
  total_segments: number
  message: string
  error: string | null
  updated_at: string
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
    updatedAt: value.updated_at,
  }
}

function consumeFrame(frame: string, onProgress: (progress: SpeechJobProgress) => void): void {
  const event = frame
    .split('\n')
    .find((line) => line.startsWith('event:'))
    ?.slice('event:'.length)
    .trim()
  if (event !== 'progress') return
  const data = frame
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).trimStart())
    .join('\n')
  if (!data) return
  onProgress(mapProgress(JSON.parse(data) as ApiJobProgress))
}

export async function streamSpeechProgress(
  jobId: string,
  onProgress: (progress: SpeechJobProgress) => void,
  signal: AbortSignal,
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
        consumeFrame(buffer.slice(0, boundary), onProgress)
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')
      }
      if (done) break
    }
    if (buffer.trim()) consumeFrame(buffer, onProgress)
    return true
  } catch (error) {
    if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return true
    }
    return false
  }
}
