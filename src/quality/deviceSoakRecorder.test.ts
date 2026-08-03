import { describe, expect, it } from 'vitest'
import { elapsedSoakSeconds, percentile95, summarizeSeams } from './deviceSoakRecorder'

describe('device soak recorder helpers', () => {
  it('calculates p95 with a nearest-rank boundary', () => {
    expect(percentile95([10, 20, 30, 40, 50])).toBe(50)
    expect(percentile95([])).toBeNull()
  })

  it('separates generation-wait seams from decode seams', () => {
    const result = summarizeSeams([
      { fromSegment: 1, toSegment: 2, gapMs: 800, waitedForSegment: true, recordedAt: '2026-08-03T00:00:00Z' },
      { fromSegment: 2, toSegment: 3, gapMs: 120, waitedForSegment: false, recordedAt: '2026-08-03T00:00:01Z' },
    ])
    expect(result.waitedP95Ms).toBe(800)
    expect(result.decodeP95Ms).toBe(120)
  })

  it('measures elapsed wall-clock seconds', () => {
    expect(elapsedSoakSeconds({
      schemaVersion: 1,
      startedAt: '2026-08-03T00:00:00.000Z',
      sampleMinutes: 10,
      deviceProfile: 'android',
      scenario: 'baseline',
    }, Date.parse('2026-08-03T00:01:30.000Z'))).toBe(90)
  })
})
