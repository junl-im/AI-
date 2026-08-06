import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { runApiConnectivityAudit } from '../settings/connectivityApi'
import { getSetupStatus } from '../settings/setupApi'
import { useEngineDoctor } from './useEngineDoctor'

vi.mock('../api/httpClient', () => ({
  getApiConnectionContext: () => ({ baseUrl: '' }),
  normalizeApiBaseUrl: (value: string) => value.trim(),
  requestAutomaticApiReconnect: vi.fn(),
  resetApiBaseUrl: vi.fn(),
  saveApiBaseUrl: (value: string) => value.trim(),
}))
vi.mock('../browser/inAppBrowser', () => ({ detectInAppBrowser: () => null }))
vi.mock('../settings/connectivityApi', () => ({ runApiConnectivityAudit: vi.fn() }))
vi.mock('../settings/setupApi', () => ({ getSetupStatus: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => {
    resolve = next
  })
  return { promise, resolve }
}

describe('useEngineDoctor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ignores an older diagnosis that finishes after a newer request', async () => {
    const firstReport = deferred<Awaited<ReturnType<typeof runApiConnectivityAudit>>>()
    const firstSetup = deferred<Awaited<ReturnType<typeof getSetupStatus>>>()
    const secondReport = deferred<Awaited<ReturnType<typeof runApiConnectivityAudit>>>()
    const secondSetup = deferred<Awaited<ReturnType<typeof getSetupStatus>>>()
    vi.mocked(runApiConnectivityAudit)
      .mockReturnValueOnce(firstReport.promise)
      .mockReturnValueOnce(secondReport.promise)
    vi.mocked(getSetupStatus)
      .mockReturnValueOnce(firstSetup.promise)
      .mockReturnValueOnce(secondSetup.promise)

    const { result } = renderHook(() => useEngineDoctor())

    act(() => result.current.setBaseUrl('http://first'))
    let firstRun!: Promise<boolean>
    act(() => {
      firstRun = result.current.runCheck()
    })

    act(() => result.current.setBaseUrl('http://second'))
    let secondRun!: Promise<boolean>
    act(() => {
      secondRun = result.current.runCheck()
    })

    await act(async () => {
      secondReport.resolve({
        apiReady: true,
        ttsReady: true,
        latencyMs: 22,
        status: 'ready',
      } as Awaited<ReturnType<typeof runApiConnectivityAudit>>)
      secondSetup.resolve({ ready: true } as Awaited<ReturnType<typeof getSetupStatus>>)
      await secondRun
    })
    expect(result.current.report?.latencyMs).toBe(22)

    await act(async () => {
      firstReport.resolve({
        apiReady: false,
        ttsReady: false,
        latencyMs: 999,
        status: 'offline',
      } as unknown as Awaited<ReturnType<typeof runApiConnectivityAudit>>)
      firstSetup.resolve({ ready: false } as Awaited<ReturnType<typeof getSetupStatus>>)
      await firstRun
    })

    expect(result.current.report?.latencyMs).toBe(22)
    expect(result.current.message).toContain('22ms')
  })
})
