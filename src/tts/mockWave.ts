const SAMPLE_RATE = 22_050
const CHANNELS = 1
const BITS_PER_SAMPLE = 16

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index))
  }
}

function hashText(value: string): number {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function getDurationSeconds(text: string): number {
  return Math.min(5.5, Math.max(1.8, text.trim().length / 12))
}

export function createMockWave(text: string, voiceId: string): Blob {
  const durationSeconds = getDurationSeconds(text)
  const sampleCount = Math.floor(SAMPLE_RATE * durationSeconds)
  const dataSize = sampleCount * CHANNELS * (BITS_PER_SAMPLE / 8)
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const seed = hashText(`${voiceId}:${text}`)
  const baseFrequency = 150 + (seed % 90)

  writeAscii(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(view, 8, 'WAVE')
  writeAscii(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, CHANNELS, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), true)
  view.setUint16(32, CHANNELS * (BITS_PER_SAMPLE / 8), true)
  view.setUint16(34, BITS_PER_SAMPLE, true)
  writeAscii(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE
    const progress = index / sampleCount
    const syllablePulse = 0.55 + 0.45 * Math.sin(time * Math.PI * 7.2) ** 2
    const envelope = Math.min(1, progress * 12) * Math.min(1, (1 - progress) * 12)
    const carrier = Math.sin(2 * Math.PI * baseFrequency * time)
    const overtone = 0.34 * Math.sin(2 * Math.PI * baseFrequency * 2.02 * time)
    const shimmer = 0.12 * Math.sin(2 * Math.PI * (baseFrequency + 36) * time)
    const sample = Math.max(-1, Math.min(1, (carrier + overtone + shimmer) * 0.22 * syllablePulse * envelope))
    view.setInt16(44 + index * 2, sample * 0x7fff, true)
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

export function getMockWaveDuration(text: string): number {
  return Number(getDurationSeconds(text).toFixed(1))
}
