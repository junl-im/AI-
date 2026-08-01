import { afterEach, describe, expect, it } from 'vitest'
import { adaptiveTimeoutMs, getMobileNetworkSnapshot, mobileNetworkLabel } from './mobileNetwork'

afterEach(() => {
  Reflect.deleteProperty(navigator, 'connection')
})

describe('mobile network profile', () => {
  it('uses a longer timeout on a slow mobile connection', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { effectiveType: '3g', saveData: false, downlink: 1.2, rtt: 240 },
    })

    expect(adaptiveTimeoutMs(10_000)).toBe(15_000)
    expect(getMobileNetworkSnapshot().effectiveType).toBe('3g')
    expect(mobileNetworkLabel()).toBe('3G')
  })

  it('reports data saver mode to the connection sheet', () => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { effectiveType: '4g', saveData: true },
    })

    expect(mobileNetworkLabel()).toContain('데이터 절약')
  })
})
