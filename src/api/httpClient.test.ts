import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiRequest, normalizeApiBaseUrl } from './httpClient'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('normalizeApiBaseUrl', () => {
  it('adds the API version path to a server origin', () => {
    expect(normalizeApiBaseUrl('http://127.0.0.1:8000/')).toBe('http://127.0.0.1:8000/api/v1')
  })

  it('does not duplicate an existing API path', () => {
    expect(normalizeApiBaseUrl('https://voice.example.com/api/v1')).toBe('https://voice.example.com/api/v1')
  })
})


describe('apiRequest', () => {
  it('does not force JSON content type for FormData', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    const form = new FormData()
    form.set('sample', new Blob(['voice'], { type: 'audio/wav' }), 'sample.wav')

    await apiRequest('/voice-clones/profiles', { method: 'POST', body: form })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).has('Content-Type')).toBe(false)
  })
})
