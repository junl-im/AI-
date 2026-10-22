import { readPcmWav } from './timelineWav'

export async function wavToMp3(wav: Blob): Promise<Blob> {
  const { sampleRate, samples } = readPcmWav(await wav.arrayBuffer())
  const { Mp3Encoder } = await import('@breezystack/lamejs')
  const encoder = new Mp3Encoder(1, sampleRate, 128)
  const pcm = new Int16Array(samples.byteLength / 2)
  const view = new DataView(samples.buffer, samples.byteOffset, samples.byteLength)
  for (let index = 0; index < pcm.length; index += 1) pcm[index] = view.getInt16(index * 2, true)
  const chunks: Uint8Array[] = []
  for (let index = 0; index < pcm.length; index += 1152) {
    const encoded = encoder.encodeBuffer(pcm.subarray(index, index + 1152))
    if (encoded.length) chunks.push(encoded)
  }
  const tail = encoder.flush()
  if (tail.length) chunks.push(tail)
  if (!chunks.length) throw new Error('MP3 파일을 만들지 못했습니다.')
  return new Blob(chunks.map((chunk) => Uint8Array.from(chunk)), { type: 'audio/mpeg' })
}
