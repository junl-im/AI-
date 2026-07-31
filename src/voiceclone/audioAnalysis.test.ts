import { describe, expect, it } from 'vitest'
import { summarizeSampleQuality } from './audioAnalysis'

describe('summarizeSampleQuality', () => {
  it('accepts a clean ten second voice sample', () => {
    const samples = new Float32Array(16_000)
    samples.forEach((_, index) => { samples[index] = Math.sin(index / 8) * 0.18 })
    const result = summarizeSampleQuality(samples, 12, 16_000, 1)
    expect(result.status).toBe('good')
    expect(result.clippingRatio).toBe(0)
  })

  it('blocks a short clipped sample', () => {
    const samples = new Float32Array(8_000).fill(1)
    const result = summarizeSampleQuality(samples, 3, 16_000, 1)
    expect(result.status).toBe('blocked')
    expect(result.messages.join(' ')).toContain('클리핑')
  })
})
