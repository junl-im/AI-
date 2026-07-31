import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiRequest,
  getApiConnectionContext,
  normalizeApiBaseUrl,
  resolveApiAssetUrl,
  saveApiBaseUrl,
} from './httpClient'

afterEach(() => {
  window.localStorage.clear()
  vi.unstubAllGlobals()
})

describe('normalizeApiBaseUrl', () => {
  it('adds the API version path to a server origin', () => {
    expect(normalizeApiBaseUrl('http://127.0.0.1:8000/')).toBe('http://127.0.0.1:8000/api/v1')
  })

  it('does not duplicate an existing API path', () => {
    expect(normalizeApiBaseUrl('https://voice.example.com/api/v1')).toBe('https://voice.example.com/api/v1')
  })

  it('keeps an empty value unconfigured', () => {
    expect(normalizeApiBaseUrl('   ')).toBe('')
  })
})

describe('API connection context', () => {
  it('uses a saved API address and resolves relative audio URLs', () => {
    saveApiBaseUrl('https://voice.example.com')

    expect(getApiConnectionContext().source).toBe('saved')
    expect(resolveApiAssetUrl('/api/v1/audio/result.wav')).toBe(
      'https://voice.example.com/api/v1/audio/result.wav',
    )
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
