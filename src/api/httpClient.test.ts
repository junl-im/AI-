import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  apiRequest,
  discoverApiBaseUrl,
  getApiDiscoveryCandidates,
  getApiConnectionContext,
  getLocationApiCandidates,
  isKnownStaticHostingHostname,
  normalizeApiBaseUrl,
  resolveApiAssetUrl,
  resetApiBaseUrl,
  saveApiBaseUrl,
} from './httpClient'
import { loadRuntimeApiCandidates } from './apiConnection'

afterEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
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
  it('loads multiple runtime API failover candidates without exposing a settings form', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      apiBaseUrls: [
        'https://voice-a.example.com',
        'https://voice-b.example.com/api/v1',
        'invalid',
      ],
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })))

    await expect(loadRuntimeApiCandidates()).resolves.toEqual([
      'https://voice-a.example.com/api/v1',
      'https://voice-b.example.com/api/v1',
    ])
  })


  it('skips a failed saved API and promotes the next runtime candidate', async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('sorion-runtime-config.json')) {
        return Promise.resolve(new Response(JSON.stringify({
          apiBaseUrls: [
            'https://voice-a.example.com',
            'https://voice-b.example.com',
          ],
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      if (url.startsWith('https://voice-b.example.com/api/v1/health')) {
        return Promise.resolve(new Response(JSON.stringify({
          status: 'ok',
          version: '0.9.2',
          default_engine: 'auto',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      return Promise.reject(new TypeError(`unexpected candidate: ${url}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(discoverApiBaseUrl('https://voice-a.example.com/api/v1'))
      .resolves.toMatchObject({ baseUrl: 'https://voice-b.example.com/api/v1' })
    expect(fetchMock.mock.calls.some(([input]) => String(input).startsWith(
      'https://voice-a.example.com/api/v1/health',
    ))).toBe(false)
  })

  it('includes the current origin as an automatic API candidate', () => {
    expect(getApiDiscoveryCandidates()[0]).toBe(
      normalizeApiBaseUrl(`${window.location.origin}/api/v1`),
    )
  })


  it('treats GitHub Pages and Firebase Hosting as static and probes only desktop localhost', () => {
    expect(isKnownStaticHostingHostname('junl-im.github.io')).toBe(true)
    expect(isKnownStaticHostingHostname('sorion.web.app')).toBe(true)
    expect(isKnownStaticHostingHostname('sorion.firebaseapp.com')).toBe(true)
    const localRuntime = [
      'http://127.0.0.1:8000/api/v1',
      'http://localhost:8000/api/v1',
    ]
    expect(getLocationApiCandidates({
      hostname: 'junl-im.github.io',
      protocol: 'https:',
      origin: 'https://junl-im.github.io',
    })).toEqual(localRuntime)
    expect(getLocationApiCandidates({
      hostname: 'sorion.web.app',
      protocol: 'https:',
      origin: 'https://sorion.web.app',
    })).toEqual(localRuntime)
    expect(getLocationApiCandidates({
      hostname: 'voice.example.com',
      protocol: 'https:',
      origin: 'https://voice.example.com',
    })).toEqual([
      'https://voice.example.com/api/v1',
      'https://voice.example.com:8443/api/v1',
    ])
  })

  it('does not probe localhost from a mobile static host', () => {
    vi.stubGlobal('navigator', {
      maxTouchPoints: 5,
      userAgent: 'iPhone',
      onLine: true,
    })

    expect(getLocationApiCandidates({
      hostname: 'sorion.web.app',
      protocol: 'https:',
      origin: 'https://sorion.web.app',
    })).toEqual([])
  })

  it('uses a saved API address and resolves relative audio URLs', () => {
    saveApiBaseUrl('https://voice.example.com')

    expect(getApiConnectionContext().source).toBe('saved')
    expect(resolveApiAssetUrl('/api/v1/audio/result.wav')).toBe(
      'https://voice.example.com/api/v1/audio/result.wav',
    )
  })

  it('keeps the API address usable when mobile storage writes fail', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })

    saveApiBaseUrl('https://mobile.example.com')
    expect(getApiConnectionContext().baseUrl).toBe('https://mobile.example.com/api/v1')

    setItem.mockRestore()
    saveApiBaseUrl('https://cleanup.example.com')
    resetApiBaseUrl()
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
