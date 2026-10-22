import type { TimelineBlock } from '../workspace/workspaceTypes'

interface PcmWav {
  sampleRate: number
  samples: Uint8Array
}

export function readPcmWav(buffer: ArrayBuffer): PcmWav {
  const view = new DataView(buffer)
  if (buffer.byteLength < 44 || view.getUint32(0, false) !== 0x52494646 || view.getUint32(8, false) !== 0x57415645) {
    throw new Error('WAV 파일 형식이 올바르지 않습니다.')
  }
  let sampleRate = 0
  let data: Uint8Array | null = null
  for (let offset = 12; offset + 8 <= buffer.byteLength;) {
    const id = view.getUint32(offset, false)
    const size = view.getUint32(offset + 4, true)
    const start = offset + 8
    if (start + size > buffer.byteLength) throw new Error('WAV 파일 길이가 손상되었습니다.')
    if (id === 0x666d7420) {
      if (size < 16 || view.getUint16(start, true) !== 1 || view.getUint16(start + 2, true) !== 1
        || view.getUint16(start + 14, true) !== 16) throw new Error('16비트 단일 채널 PCM WAV만 합칠 수 있습니다.')
      sampleRate = view.getUint32(start + 4, true)
    }
    if (id === 0x64617461) data = new Uint8Array(buffer, start, size)
    offset = start + size + (size % 2)
  }
  if (!sampleRate || !data) throw new Error('WAV 음성 데이터를 찾지 못했습니다.')
  return { sampleRate, samples: data }
}

export function combineTimelinePcmWav(parts: Array<{ audio?: ArrayBuffer; pauseSeconds?: number }>): Blob {
  const firstAudio = parts.find((part) => part.audio)?.audio
  let sampleRate = firstAudio ? readPcmWav(firstAudio).sampleRate : 0
  const chunks: Uint8Array[] = []
  let totalBytes = 0
  for (const part of parts) {
    if (part.audio) {
      const wav = readPcmWav(part.audio)
      if (sampleRate && wav.sampleRate !== sampleRate) throw new Error('클립들의 WAV 샘플 속도가 서로 다릅니다.')
      sampleRate = wav.sampleRate
      chunks.push(wav.samples)
      totalBytes += wav.samples.byteLength
    } else if (part.pauseSeconds && sampleRate) {
      const bytes = Math.max(0, Math.round(part.pauseSeconds * sampleRate)) * 2
      chunks.push(new Uint8Array(bytes))
      totalBytes += bytes
    }
    if (totalBytes > 512_000_000) throw new Error('전체 WAV가 512MB를 넘어 분할 다운로드가 필요합니다.')
  }
  if (!sampleRate || totalBytes === 0) throw new Error('합칠 수 있는 WAV 음성이 없습니다.')
  const buffer = new ArrayBuffer(44 + totalBytes)
  const view = new DataView(buffer)
  const write = (offset: number, word: string) => [...word].forEach((letter, index) => view.setUint8(offset + index, letter.charCodeAt(0)))
  write(0, 'RIFF')
  view.setUint32(4, 36 + totalBytes, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  write(36, 'data')
  view.setUint32(40, totalBytes, true)
  let offset = 44
  for (const chunk of chunks) {
    new Uint8Array(buffer, offset, chunk.byteLength).set(chunk)
    offset += chunk.byteLength
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

export async function buildTimelineWav(blocks: TimelineBlock[]): Promise<Blob> {
  const parts: Array<{ audio?: ArrayBuffer; pauseSeconds?: number }> = []
  for (const block of blocks) {
    if (block.kind === 'pause') {
      parts.push({ pauseSeconds: block.durationSeconds })
      continue
    }
    if (block.audio?.source !== 'browser-model' || !block.audio.url) {
      throw new Error('전체 WAV는 모든 대사를 기기 내 WAV로 만든 뒤 사용할 수 있습니다.')
    }
    const response = await fetch(block.audio.url)
    if (!response.ok) throw new Error('대사 WAV를 불러오지 못했습니다.')
    parts.push({ audio: await response.arrayBuffer() })
  }
  return combineTimelinePcmWav(parts)
}
