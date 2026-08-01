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

  it('normalizes a bare mobile LAN address', () => {
    expect(normalizeApiBaseUrl('192.168.0.15:8000')).toBe(
      'http://192.168.0.15:8000/api/v1',
    )
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
  it('retries a transient GET request and sends mobile request identifiers', async () => {
    saveApiBaseUrl('https://voice.example.com')
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(new Response('{"status":"ok"}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest('/health')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const init = fetchMock.mock.calls[1]?.[1] as RequestInit
    const headers = new Headers(init.headers)
    expect(headers.has('X-Request-ID')).toBe(true)
    expect(headers.has('X-SoriON-Client-ID')).toBe(true)
  })

  it('does not retry a POST that may already be running on the server', async () => {
    saveApiBaseUrl('https://voice.example.com')
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('network'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiRequest('/tts/synthesize', { method: 'POST', body: '{}' }))
      .rejects.toThrow('API에 연결할 수 없습니다')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

})
