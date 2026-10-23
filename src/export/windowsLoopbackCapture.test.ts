import { afterEach, describe, expect, it, vi } from 'vitest'
import { readWindowsCaptureToken, windowsCaptureAvailable, windowsCaptureStatus } from './windowsLoopbackCapture'

afterEach(() => {
  window.sessionStorage.clear()
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
})

describe('Windows 오디오 보조 앱 연결', () => {
  it('실행 토큰을 주소에서 지우고 루프백 접근으로 상태를 확인한다', async () => {
    const token = 'A'.repeat(48)
    window.history.replaceState(null, '', `/?sorion-capture-token=${token}`)
    const fetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetch)

    expect(await windowsCaptureAvailable()).toBe(true)
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
})
