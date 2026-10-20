import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyAppUpdate, checkForAppUpdate, useAppUpdateStore, fetchRemoteBuildInfo } from './appUpdate'

const manifest = {
  schemaVersion: 1 as const,
  appVersion: '0.10.0',
  heartbeat: '6.8.4',
  revision: 'abc123',
  buildId: 'build-abc123',
}

describe('appUpdate', () => {
  it('loads a no-store build manifest', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(manifest), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(fetchRemoteBuildInfo(fetcher, 'https://example.com/version.json')).resolves.toEqual(manifest)
    expect(fetcher).toHaveBeenCalledWith('https://example.com/version.json', expect.objectContaining({
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    }))
  })

  it('rejects an invalid build manifest', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ buildId: '' }), {
      status: 200,
    }))
    await expect(fetchRemoteBuildInfo(fetcher, 'https://example.com/version.json')).rejects.toThrow('형식')
  })
})

describe('safe update application', () => {
  beforeEach(() => {
    useAppUpdateStore.setState({ status: 'available', remote: manifest, message: null })
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
  })
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

  function worker(update: () => Promise<unknown>) {
    const serviceWorker = Object.assign(new EventTarget(), {
      getRegistrations: vi.fn().mockResolvedValue([{ update, waiting: null }]),
    })
    vi.stubGlobal('navigator', { onLine: true, serviceWorker })
    return serviceWorker
  }
  it('stays in the current workspace offline without navigating', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const navigate = vi.fn()
    await applyAppUpdate({ navigate })
    expect(navigate).not.toHaveBeenCalled()
    expect(useAppUpdateStore.getState()).toMatchObject({ status: 'error', message: expect.stringContaining('오프라인') })
  })
  it('retains work on service-worker failure, removes its listener and permits retry', async () => {
    const update = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined)
    const sw = worker(update)
    const remove = vi.spyOn(sw, 'removeEventListener')
    const navigate = vi.fn()
    window.localStorage.setItem('update-test-draft', 'keep')
    await applyAppUpdate({ navigate })
    expect(navigate).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('controllerchange', expect.any(Function))
    expect(useAppUpdateStore.getState().status).toBe('error')
    expect(window.localStorage.getItem('update-test-draft')).toBe('keep')
    vi.useFakeTimers()
    const retry = applyAppUpdate({ navigate })
    await vi.advanceTimersByTimeAsync(4000)
    await retry
    expect(navigate).toHaveBeenCalledWith(expect.stringContaining('sorion-build=build-abc123'))
    window.localStorage.removeItem('update-test-draft')
  })
  it('coalesces repeated applies and ignores manifest checks during application', async () => {
    let complete!: () => void
    worker(() => new Promise<void>((resolve) => { complete = resolve }))
    const navigate = vi.fn()
    vi.useFakeTimers()
    const first = applyAppUpdate({ navigate })
    await Promise.resolve()
    await applyAppUpdate({ navigate })
    expect(await checkForAppUpdate({ allowDevelopment: true })).toBe(false)
    complete()
    await vi.advanceTimersByTimeAsync(4000)
    await first
    expect(navigate).toHaveBeenCalledOnce()
  })
})
