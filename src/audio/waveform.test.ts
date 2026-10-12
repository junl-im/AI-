import { describe, expect, it } from 'vitest'
import { fetchBoundedAudio, inspectPreviewWav, waveformPeaks } from './waveform'
import { vi } from 'vitest'

describe('actual audio waveform', () => {
  it('validates WAV duration before decoding and rejects compressed or oversized-duration data', () => {
    const bytes = new ArrayBuffer(48)
    const view = new DataView(bytes)
    for (const [offset, text] of [[0, 'RIFF'], [8, 'WAVE'], [12, 'fmt '], [36, 'data']] as const) for (let index = 0; index < text.length; index++) view.setUint8(offset + index, text.charCodeAt(index))
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint32(28, 2, true)
    view.setUint32(40, 4, true)
    expect(inspectPreviewWav(bytes)).toBe(2)
    view.setUint32(28, 0, true)
    expect(() => inspectPreviewWav(bytes)).toThrow('길이')
    view.setUint16(20, 85, true)
    expect(() => inspectPreviewWav(bytes)).toThrow('PCM')
    expect(() => inspectPreviewWav(new ArrayBuffer(4))).toThrow('WAV')
  })

  it('keeps a peak on either channel and handles silence and non-finite samples', () => {
    expect(waveformPeaks([new Float32Array([0, 0, 0, 0]), new Float32Array([0.8, 0, -0.5, NaN])], 2)).toEqual([expect.closeTo(0.8), 0.5])
    expect(waveformPeaks([new Float32Array(4)], 2)).toEqual([0, 0])
    expect(waveformPeaks([], 2)).toEqual([])
  })
  it('rejects a growing stream beyond the bound and cancels it', async () => {
    const cancel = vi.fn()
    const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(6)) }, cancel })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream)))
    try {
      await expect(fetchBoundedAudio('blob:test', new AbortController().signal, 4)).rejects.toThrow('20MB')
      expect(cancel).toHaveBeenCalledOnce()
    } finally { vi.unstubAllGlobals() }
  })
})
