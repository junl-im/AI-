import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureBrowserSpeechWithWindowsLoopback, readWindowsCaptureToken, windowsCaptureAvailable, windowsCaptureStatus } from './windowsLoopbackCapture'

const speech = vi.hoisted(() => ({ waitForSpeech: vi.fn() }))
vi.mock('./recordBrowserSpeech', () => speech)

afterEach(() => {
  window.sessionStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('Windows 오디오 보조 앱 연결', () => {
  it('실행 토큰을 주소에서 지우고 루프백 접근으로 상태를 확인한다', async () => {
    const token = 'A'.repeat(48)
    window.history.replaceState(null, '', `/?sorion-capture-token=${token}`)
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ outputDevice: '스피커 (테스트)', helperVersion: '0.11.74' }) })
    vi.stubGlobal('fetch', fetch)

    expect(await windowsCaptureAvailable()).toBe(true)
    expect(await windowsCaptureStatus()).toMatchObject({ ready: true, outputDevice: '스피커 (테스트)', helperVersion: '0.11.74' })
    expect(window.location.search).not.toContain('sorion-capture-token')
    expect(readWindowsCaptureToken()).toBe(token)
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:18717/status', expect.objectContaining({
      method: 'GET', mode: 'cors', credentials: 'omit', targetAddressSpace: 'loopback',
      headers: { 'X-SoriON-Token': token },
    }))
  })

  it('토큰이 없으면 로컬 앱에 요청하지 않는다', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    expect(await windowsCaptureAvailable()).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
    expect((await windowsCaptureStatus()).error).toContain('새 소리온 탭')
  })

  it('앱을 재시작해 토큰이 달라졌을 때 해결 방법을 보여준다', async () => {
    window.history.replaceState(null, '', `/?sorion-capture-token=${'A'.repeat(48)}`)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }))
    const status = await windowsCaptureStatus()
    expect(status.ready).toBe(false)
    expect(status.error).toContain('보조 앱을 다시 실행')
  })

  it('음성 녹음 취소 시 보조 앱의 활성 캡처를 해제한다', async () => {
    window.history.replaceState(null, '', `/?sorion-capture-token=${'B'.repeat(48)}`)
    const controller = new AbortController()
    const fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.endsWith('/capture/start')) return { ok: true }
      if (url.endsWith('/capture/cancel')) return { ok: true }
      throw new Error(`예상하지 못한 요청: ${url}`)
    })
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('AudioContext', class { close = vi.fn() })
    vi.stubGlobal('speechSynthesis', { cancel: vi.fn() })
    speech.waitForSpeech.mockImplementation((_block: unknown, signal: AbortSignal) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('녹음이 취소되었습니다.')), { once: true })
    }))
    const block = { kind: 'voice', id: 'voice-1' } as Parameters<typeof captureBrowserSpeechWithWindowsLoopback>[0][number]
    const recording = captureBrowserSpeechWithWindowsLoopback([block], controller.signal, vi.fn())
    await vi.waitFor(() => expect(speech.waitForSpeech).toHaveBeenCalledOnce())
    controller.abort()
    await expect(recording).rejects.toThrow('녹음이 취소되었습니다.')
    expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:18717/capture/cancel', expect.any(Object))
    expect(fetch).not.toHaveBeenCalledWith('http://127.0.0.1:18717/capture/stop', expect.any(Object))
  })
})
