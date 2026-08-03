import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamSpeechProgress } from './jobProgressStream'

vi.mock('../api/httpClient', () => ({
  getApiBaseUrl: () => 'https://voice.example/api/v1',
  resolveApiAssetUrl: (value: string | null) => value
    ? new URL(value, 'https://voice.example').toString()
    : null,
}))

vi.mock('../api/apiConnection', () => ({
  getApiClientId: () => 'test-client',
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('streamSpeechProgress', () => {
  it('parses progress events from the SSE response', async () => {
    const payload = JSON.stringify({
      job_id: 'job-1',
      status: 'processing',
      phase: 'generating',
      progress: 48,
      current_segment: 1,
      total_segments: 3,
      message: '첫 문장을 만들고 있습니다.',
      error: null,
      updated_at: '2026-08-01T00:00:00Z',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(
      `event: progress\ndata: ${payload}\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    ))
    const received = vi.fn()

    const streamed = await streamSpeechProgress(
      'job-1',
      received,
      new AbortController().signal,
    )

    expect(streamed).toBe(true)
    expect(received).toHaveBeenCalledWith(expect.objectContaining({
      jobId: 'job-1',
      phase: 'generating',
      progress: 48,
      currentSegment: 1,
      totalSegments: 3,
    }))
  })


  it('publishes signed segment-ready events separately from progress', async () => {
    const segment = JSON.stringify({
      index: 1,
      total_segments: 3,
      filename: 'part.wav',
      audio_url: '/api/v1/tts/jobs/job-1/segments/1/audio?signature=test',
      engine_id: 'cosyvoice3',
      engine_mode: 'ai',
      estimated_duration_seconds: 1.2,
      file_size_bytes: 2048,
      ready_after_ms: 640,
      ready_at: '2026-08-03T00:00:00Z',
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(
      `event: segment-ready\ndata: ${segment}\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
    ))
    const ready = vi.fn()

    const streamed = await streamSpeechProgress(
      'job-1',
      vi.fn(),
      new AbortController().signal,
      ready,
    )

    expect(streamed).toBe(true)
    expect(ready).toHaveBeenCalledWith(expect.objectContaining({
      index: 1,
      totalSegments: 3,
      readyAfterMs: 640,
      audioUrl: 'https://voice.example/api/v1/tts/jobs/job-1/segments/1/audio?signature=test',
    }))
  })

  it('returns false so the caller can fall back to polling', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 404 }))

    const streamed = await streamSpeechProgress(
      'missing-job',
      vi.fn(),
      new AbortController().signal,
    )

    expect(streamed).toBe(false)
  })
})
