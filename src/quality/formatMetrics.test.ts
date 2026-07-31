import { describe, expect, it } from 'vitest'
import { formatBytes, formatMilliseconds } from './formatMetrics'

describe('quality metric formatting', () => {
  it('formats bytes for compact mobile labels', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
  })

  it('formats generation time in milliseconds and seconds', () => {
    expect(formatMilliseconds(850)).toBe('850 ms')
    expect(formatMilliseconds(1250)).toBe('1.25초')
  })
})
