import { readPcmWav } from './timelineWav'

interface Mp3EncodeOptions {
  signal?: AbortSignal
  onProgress?: (encodedSamples: number, totalSamples: number) => void
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('MP3 변환이 취소되었습니다.', 'AbortError')
}

export async function wavToMp3(wav: Blob, options: Mp3EncodeOptions = {}): Promise<Blob> {
  throwIfAborted(options.signal)
  const { sampleRate, samples } = readPcmWav(await wav.arrayBuffer())
  throwIfAborted(options.signal)
  const { Mp3Encoder } = await import('@breezystack/lamejs')
  throwIfAborted(options.signal)
  const encoder = new Mp3Encoder(1, sampleRate, 128)
  const totalSamples = samples.byteLength / 2
  const pcm = new Int16Array(1152)
  const view = new DataView(samples.buffer, samples.byteOffset, samples.byteLength)
  const chunks: Uint8Array[] = []
  for (let index = 0; index < totalSamples; index += 1152) {
    throwIfAborted(options.signal)
    const length = Math.min(1152, totalSamples - index)
    for (let offset = 0; offset < length; offset += 1) pcm[offset] = view.getInt16((index + offset) * 2, true)
    const encoded = encoder.encodeBuffer(pcm.subarray(0, length))
    if (encoded.length) chunks.push(encoded)
    if ((index / 1152) % 64 === 63) {
      options.onProgress?.(Math.min(index + length, totalSamples), totalSamples)
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }
  throwIfAborted(options.signal)
  options.onProgress?.(totalSamples, totalSamples)
  const tail = encoder.flush()
  if (tail.length) chunks.push(tail)
  if (!chunks.length) throw new Error('MP3 파일을 만들지 못했습니다.')
  return new Blob(chunks.map((chunk) => Uint8Array.from(chunk)), { type: 'audio/mpeg' })
}
