import { describe, expect, it } from 'vitest'
import { summarizeSampleQuality } from './audioAnalysis'

describe('summarizeSampleQuality', () => {
  it('accepts a clean 20 to 30 second voice sample', () => {
    const samples = new Float32Array(16_000)
    samples.forEach((_, index) => { samples[index] = Math.sin(index / 8) * 0.18 })
    const result = summarizeSampleQuality(samples, 25, 16_000, 1)
    expect(result.status).toBe('good')
    expect(result.clippingRatio).toBe(0)
  })

  it('blocks a short clipped sample', () => {
    const samples = new Float32Array(8_000).fill(1)
    const result = summarizeSampleQuality(samples, 3, 16_000, 1)
    expect(result.status).toBe('blocked')
    expect(result.messages.join(' ')).toContain('클리핑')
  })

  it('blocks mostly silent samples even when duration is ideal', () => {
    const samples = new Float32Array(16_000)
    const result = summarizeSampleQuality(samples, 25, 16_000, 1)
    expect(result.status).toBe('blocked')
    expect(result.messages.join(' ')).toContain('무음')
  })

  it('blocks references longer than the engine limit', () => {
    const samples = new Float32Array(16_000)
    samples.forEach((_, index) => { samples[index] = Math.sin(index / 8) * 0.18 })
    const result = summarizeSampleQuality(samples, 31, 16_000, 1)
    expect(result.status).toBe('blocked')
    expect(result.messages.join(' ')).toContain('30초')
  })
})
