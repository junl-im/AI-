import { getApiClientId } from '../api/apiConnection'
import type { VoiceCloneJobStatus } from './voiceCloneTypes'

export interface VoiceCloneProgressSnapshot {
  id: string
  status: VoiceCloneJobStatus
  progress: number
  phase: string
  message: string
  updatedAt: string
  firstAudioMs: number | null
}

interface ApiVoiceCloneProgressSnapshot {
  id: string
  status: VoiceCloneJobStatus
  progress: number
  phase: string
  message: string
  updated_at: string
  first_audio_ms: number | null
}

function mapSnapshot(value: ApiVoiceCloneProgressSnapshot): VoiceCloneProgressSnapshot {
  return {
    id: value.id,
    status: value.status,
    progress: value.progress,
    phase: value.phase,
    message: value.message,
    updatedAt: value.updated_at,
    firstAudioMs: value.first_audio_ms,
  }
}

function consumeFrame(frame: string, onProgress: (progress: VoiceCloneProgressSnapshot) => void): void {
  const lines = frame.split('\n')
  const event = lines.find((line) => line.startsWith('event:'))?.slice(6).trim()
  if (event !== 'progress') return
  const data = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
  if (!data) return
  try {
    onProgress(mapSnapshot(JSON.parse(data) as ApiVoiceCloneProgressSnapshot))
  } catch {
    // Ignore one malformed frame and allow the stream/poll fallback to continue.
  }
}

export async function streamVoiceCloneProgress(
  eventsUrl: string,
  onProgress: (progress: VoiceCloneProgressSnapshot) => void,
  signal: AbortSignal,
): Promise<boolean> {
  if (!eventsUrl || signal.aborted) return false
  try {
    const response = await fetch(eventsUrl, {
      signal,
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        Accept: 'text/event-stream',
        'X-SoriON-Client-ID': getApiClientId(),
      },
    })
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
    if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) return true
    return false
  }
}
