export interface StreamWaveform { peaks: number[]; duration: number }
const MAX_BYTES = 128 * 1024 * 1024
const MAX_SECONDS = 3600

/** Read uncompressed WAV without retaining the full response or decoded PCM. */
export async function streamWavPeaks(url: string, signal: AbortSignal, onProgress?: (percent: number) => void): Promise<StreamWaveform> {
  const response = await fetch(url, { signal })
  if (!response.ok || !response.body) throw new Error('음원을 불러오지 못했습니다. 다시 시도해 주세요.')
  if (Number(response.headers.get('content-length')) > MAX_BYTES) {
    await response.body.cancel()
    throw new Error('128MB 이하 WAV에서 파형을 볼 수 있어요.')
  }
  const reader = response.body.getReader()
  const cancelReader = () => { void reader.cancel().catch(() => undefined) }
  signal.addEventListener('abort', cancelReader, { once: true })
  let pending = new Uint8Array(0)
  let yieldStartedAt = performance.now()
  let received = 0
  let headerBytes = 0
  let riff = false
  let format = 0, channels = 0, rate = 0, bits = 0, align = 0
  let dataSize = -1, consumed = 0, frames = 0
  let duration = 0
  const peaks = Array<number>(96).fill(0)
  const tag = (bytes: Uint8Array, offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4))
  try {
    while (true) {
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      const { done, value } = await reader.read()
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      if (done) break
      received += value.byteLength
      if (received > MAX_BYTES) throw new Error('128MB 이하 WAV에서 파형을 볼 수 있어요.')
      const bytes = pending.length ? new Uint8Array(pending.length + value.length) : value
      if (pending.length) { bytes.set(pending); bytes.set(value, pending.length) }
      let offset = 0
      if (!riff) {
        if (bytes.length < 12) { pending = bytes; continue }
        if (tag(bytes, 0) !== 'RIFF' || tag(bytes, 8) !== 'WAVE') throw new Error('PCM WAV 음원에서 파형을 볼 수 있어요.')
        riff = true; offset = 12; headerBytes = 12
      }
      while (dataSize < 0 && offset + 8 <= bytes.length) {
        const view = new DataView(bytes.buffer, bytes.byteOffset + offset)
        const size = view.getUint32(4, true)
        const name = tag(bytes, offset)
        if (name === 'data') {
          if (!format || !align || size === 0 || size % align) throw new Error('WAV 데이터 형식을 확인하지 못했습니다.')
          dataSize = size; duration = size / align / rate
          if (size > MAX_BYTES || duration > MAX_SECONDS) throw new Error('128MB·60분 이하 WAV에서 파형을 볼 수 있어요.')
          offset += 8; break
        }
        const padded = size + size % 2
        if (headerBytes + 8 + padded > 65536) throw new Error('WAV 헤더가 너무 큽니다.')
        if (offset + 8 + padded > bytes.length) break
        if (name === 'fmt ') {
          if (size < 16) throw new Error('WAV 형식 정보가 불완전합니다.')
          format = view.getUint16(8, true); channels = view.getUint16(10, true)
          rate = view.getUint32(12, true); align = view.getUint16(20, true); bits = view.getUint16(22, true)
          if (!(format === 1 && [8,16,24,32].includes(bits) || format === 3 && bits === 32) || channels < 1 || channels > 8 || rate < 8000 || rate > 192000 || align !== channels * bits / 8 || view.getUint32(16, true) !== rate * align) throw new Error('지원하는 PCM WAV 형식이 아닙니다.')
        }
        offset += 8 + padded; headerBytes += 8 + padded
      }
      if (dataSize < 0) { pending = bytes.slice(offset); continue }
      const available = Math.min(bytes.length - offset, dataSize - consumed)
      const length = Math.floor(available / align) * align
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset, length)
      const totalFrames = dataSize / align
      for (let frame = 0; frame < length; frame += align) {
        // A cached/blob response may arrive as one huge chunk. Yield to cancel/paint events.
        if (frames % 32768 === 0 && performance.now() - yieldStartedAt >= 8) {
          await new Promise<void>((resolve) => setTimeout(resolve, 0))
          if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
          yieldStartedAt = performance.now()
        }
        let peak = 0
        for (let channel = 0; channel < channels; channel++) {
          const sample = frame + channel * bits / 8
          let amplitude: number
          if (format === 3) amplitude = view.getFloat32(sample, true)
          else if (bits === 8) amplitude = (view.getUint8(sample) - 128) / 128
          else if (bits === 16) amplitude = view.getInt16(sample, true) / 32768
          else if (bits === 32) amplitude = view.getInt32(sample, true) / 2147483648
          else { const raw = view.getUint8(sample) | view.getUint8(sample + 1) << 8 | view.getUint8(sample + 2) << 16; amplitude = (raw & 0x800000 ? raw - 0x1000000 : raw) / 8388608 }
          if (Number.isFinite(amplitude)) peak = Math.max(peak, Math.min(1, Math.abs(amplitude)))
        }
        const bin = Math.min(95, Math.floor(frames++ * 96 / totalFrames))
        peaks[bin] = Math.max(peaks[bin], peak)
      }
      consumed += length
      onProgress?.(Math.floor(consumed * 100 / dataSize))
      if (consumed === dataSize) return { peaks, duration }
      pending = bytes.slice(offset + length)
    }
    throw new Error('WAV 파일이 불완전합니다. 다시 시도해 주세요.')
  } finally {
    signal.removeEventListener('abort', cancelReader)
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
