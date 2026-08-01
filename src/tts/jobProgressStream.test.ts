import { afterEach, describe, expect, it, vi } from 'vitest'
import { streamSpeechProgress } from './jobProgressStream'

vi.mock('../api/httpClient', () => ({
  getApiBaseUrl: () => 'https://voice.example/api/v1',
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
