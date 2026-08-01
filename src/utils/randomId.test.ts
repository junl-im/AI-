import { afterEach, describe, expect, it, vi } from 'vitest'
import { createRandomId } from './randomId'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createRandomId', () => {
  it('uses randomUUID when the browser provides it', () => {
    const randomUUID = vi.fn(() => 'fixed-id')
    vi.stubGlobal('crypto', { randomUUID })

    expect(createRandomId()).toBe('fixed-id')
    expect(randomUUID).toHaveBeenCalledOnce()
  })

  it('builds an RFC4122-shaped id without randomUUID', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (target: Uint8Array) => {
        target.fill(1)
        return target
      },
    })

    expect(createRandomId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })
})
