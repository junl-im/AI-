import { afterEach, describe, expect, it, vi } from 'vitest'
import { dispatchRuntimeFault } from '../network/runtimeFaultInjection'
import {
  collectBrowserPlaybackEvidence,
  runGesturePlaybackProbe,
  startBrowserPlaybackEvidenceMonitor,
} from './browserPlaybackEvidence'

const originalUserAgent = Object.getOwnPropertyDescriptor(navigator, 'userAgent')
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia')
const originalSecureContext = Object.getOwnPropertyDescriptor(window, 'isSecureContext')
const originalEventSource = Object.getOwnPropertyDescriptor(window, 'EventSource')
const originalAudio = Object.getOwnPropertyDescriptor(globalThis, 'Audio')
const originalVisibilityState = Object.getOwnPropertyDescriptor(document, 'visibilityState')
const originalOnline = Object.getOwnPropertyDescriptor(navigator, 'onLine')

function restore(target: object, name: string, descriptor?: PropertyDescriptor) {
  if (descriptor) Object.defineProperty(target, name, descriptor)
  else Reflect.deleteProperty(target, name)
}

afterEach(() => {
  restore(navigator, 'userAgent', originalUserAgent)
  restore(window, 'matchMedia', originalMatchMedia)
  restore(window, 'isSecureContext', originalSecureContext)
  restore(window, 'EventSource', originalEventSource)
  restore(globalThis, 'Audio', originalAudio)
  restore(document, 'visibilityState', originalVisibilityState)
  restore(navigator, 'onLine', originalOnline)
  window.localStorage.clear()
  vi.restoreAllMocks()
  it('진단용 장애 주입은 실제 전환과 분리해서 누적한다', () => {
    let latest = collectBrowserPlaybackEvidence()
    const stop = startBrowserPlaybackEvidenceMonitor((evidence) => {
      latest = evidence
    })

    dispatchRuntimeFault('network-offline')
    dispatchRuntimeFault('network-online')
    dispatchRuntimeFault('network-change')
    dispatchRuntimeFault('background-hidden')
    dispatchRuntimeFault('background-visible')
    stop()

    expect(latest.soak).toMatchObject({
      networkTransitions: 0,
      injectedNetworkFaultCount: 2,
      injectedNetworkChangeCount: 1,
      injectedBackgroundFaultCount: 2,
    })
  })

})

describe('browserPlaybackEvidence', () => {
  it('Android Chrome 환경과 지원 기능을 개인 식별 정보 없이 기록한다', () => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 15) Chrome/135.0 Mobile',
    })
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: false }),
    })
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
    Object.defineProperty(window, 'EventSource', { configurable: true, value: class {} })

    const evidence = collectBrowserPlaybackEvidence('passed')

    expect(evidence).toMatchObject({
      deviceProfile: 'android-chrome',
      browserName: 'Chrome',
      secureContext: true,
      eventSourceSupported: true,
      gesturePlayback: 'passed',
    })
    expect(evidence).not.toHaveProperty('userAgent')
  })

  it('사용자 제스처 재생이 차단되면 blocked로 구분한다', async () => {
    class BlockedAudio {
      muted = false
      preload = ''
      play = vi.fn().mockRejectedValue(new DOMException('blocked', 'NotAllowedError'))
      pause = vi.fn()
      removeAttribute = vi.fn()
      load = vi.fn()
    }
    Object.defineProperty(globalThis, 'Audio', { configurable: true, value: BlockedAudio })

    await expect(runGesturePlaybackProbe()).resolves.toBe('blocked')
  })

  it('탭 숨김·복귀와 네트워크 전환을 관찰 세션에 누적한다', () => {
    let visibility: DocumentVisibilityState = 'visible'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    })
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    let now = 1_000
    let latest = collectBrowserPlaybackEvidence()
    const stop = startBrowserPlaybackEvidenceMonitor((evidence) => {
      latest = evidence
    }, () => now)

    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    now = 4_500
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('offline'))
    stop()

    expect(latest.backgroundRestore).toBe('observed')
    expect(latest.soak).toMatchObject({
      visibilityTransitions: 2,
      backgroundReturnCount: 1,
      totalHiddenMs: 3_500,
      longestHiddenMs: 3_500,
      networkTransitions: 1,
    })
  })

  it('진단용 장애 주입은 실제 전환과 분리해서 누적한다', () => {
    let latest = collectBrowserPlaybackEvidence()
    const stop = startBrowserPlaybackEvidenceMonitor((evidence) => {
      latest = evidence
    })

    dispatchRuntimeFault('network-offline')
    dispatchRuntimeFault('network-online')
    dispatchRuntimeFault('network-change')
    dispatchRuntimeFault('background-hidden')
    dispatchRuntimeFault('background-visible')
    stop()

    expect(latest.soak).toMatchObject({
      networkTransitions: 0,
      injectedNetworkFaultCount: 2,
      injectedNetworkChangeCount: 1,
      injectedBackgroundFaultCount: 2,
    })
  })

})
