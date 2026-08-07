import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  dispatchRuntimeFault,
  RUNTIME_FAULT_EVENT,
  subscribeRuntimeFaults,
} from './runtimeFaultInjection'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('runtime fault injection', () => {
  it('dispatches an explicit quality-lab fault without changing browser network state', () => {
    const observed: string[] = []
    const stop = subscribeRuntimeFaults((detail) => observed.push(detail.kind))
    const nativeOnline = navigator.onLine

    dispatchRuntimeFault('network-offline')
    stop()

    expect(observed).toEqual(['network-offline'])
    expect(navigator.onLine).toBe(nativeOnline)
  })

  it('uses one stable custom event contract', () => {
    expect(RUNTIME_FAULT_EVENT).toBe('sorion-runtime-fault-injection')
  })
})
