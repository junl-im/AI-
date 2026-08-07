import { describe, expect, it, vi } from 'vitest'
import { injectRecoveryPath } from './recoveryInjection'

describe('recovery path injection', () => {
  it('injects the online and engine refresh path without changing the real network', () => {
    const online = vi.fn()
    const refresh = vi.fn()
    window.addEventListener('online', online, { once: true })
    window.addEventListener('sorion-engine-refresh', refresh, { once: true })
    const result = injectRecoveryPath('online-resume')
    expect(result.supported).toBe(true)
    expect(online).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledTimes(1)
  })
})
