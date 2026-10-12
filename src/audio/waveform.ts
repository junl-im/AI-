export function waveformPeaks(channels: Float32Array[], count = 96): number[] {
  if (!channels.length || !channels[0].length || count < 1) return []
  const length = Math.min(...channels.map((channel) => channel.length))
  const bins = Math.min(count, length)
  return Array.from({ length: bins }, (_, index) => {
    const start = Math.floor(index * length / bins)
    const end = Math.floor((index + 1) * length / bins)
    let peak = 0
    for (const channel of channels) {
      for (let sample = start; sample < end; sample += 1) {
        if (Number.isFinite(channel[sample])) peak = Math.max(peak, Math.abs(channel[sample]))
      }
    }
    return Math.min(1, peak)
  })
}

export async function fetchBoundedAudio(url: string, signal: AbortSignal, limit = 20 * 1024 * 1024) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('음원을 불러오지 못했습니다. 다시 선택해 주세요.')
  if (Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel()
    throw new Error('20MB 이하 음원에서 파형을 볼 수 있어요.')
  }
  if (!response.body) throw new Error('이 브라우저에서는 파형 읽기를 지원하지 않습니다.')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) throw new Error('20MB 이하 음원에서 파형을 볼 수 있어요.')
      chunks.push(value)
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined)
    throw error
  } finally { reader.releaseLock() }
  const buffer = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength }
  return buffer.buffer
}

export function inspectPreviewWav(buffer: ArrayBuffer): number {
  const view = new DataView(buffer)
  const tag = (offset: number) => String.fromCharCode(...new Uint8Array(buffer, offset, 4))
  if (buffer.byteLength < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('WAV 음원에서 파형을 볼 수 있어요.')
  let byteRate = 0
  let dataSize = 0
  for (let offset = 12; offset + 8 <= buffer.byteLength;) {
    const size = view.getUint32(offset + 4, true)
    if (offset + 8 + size > buffer.byteLength) throw new Error('WAV 파일이 불완전합니다.')
    if (tag(offset) === 'fmt ' && size >= 16) {
      const format = view.getUint16(offset + 8, true)
      if (format !== 1 && format !== 3) throw new Error('PCM WAV 음원에서 파형을 볼 수 있어요.')
      byteRate = view.getUint32(offset + 16, true)
    }
    if (tag(offset) === 'data') dataSize += size
    offset += 8 + size + size % 2
  }
  const duration = dataSize / byteRate
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('WAV 길이를 확인하지 못했습니다.')
  if (duration > 300) throw new Error('5분 이하 음원에서 파형을 볼 수 있어요.')
  return duration
}
