import { describe, expect, it } from 'vitest'
import { createMockWave, getMockWaveDuration } from './mockWave'

async function readBlob(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer()

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (reader.result instanceof ArrayBuffer) resolve(reader.result)
      else reject(new TypeError('Blob을 ArrayBuffer로 변환하지 못했습니다.'))
    })
    reader.addEventListener('error', () => reject(reader.error ?? new Error('Blob 읽기에 실패했습니다.')))
    reader.readAsArrayBuffer(blob)
  })
}

function readAscii(view: DataView, offset: number, length: number): string {
  return Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join('')
}

describe('createMockWave', () => {
  it('creates a valid PCM WAV container', async () => {
    const blob = createMockWave('소리온 데모 음원입니다.', 'sori-warm')
    const view = new DataView(await readBlob(blob))

    expect(blob.type).toBe('audio/wav')
    expect(readAscii(view, 0, 4)).toBe('RIFF')
    expect(readAscii(view, 8, 4)).toBe('WAVE')
    expect(readAscii(view, 36, 4)).toBe('data')
    expect(view.byteLength).toBeGreaterThan(44)
  })

  it('limits preview duration for long text', () => {
    expect(getMockWaveDuration('가'.repeat(1000))).toBeLessThanOrEqual(5.5)
  })
})
