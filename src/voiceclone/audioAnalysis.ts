import type { VoiceSampleAnalysis } from './voiceCloneTypes'

const SILENCE_THRESHOLD = 0.015
const CLIPPING_THRESHOLD = 0.98
const MAX_ANALYSIS_SAMPLES = 1_200_000

function round(value: number, digits = 4) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function summarizeSampleQuality(
  samples: Float32Array,
  durationSeconds: number,
  sampleRate: number | null,
  channelCount: number | null,
): VoiceSampleAnalysis {
  const stride = Math.max(1, Math.ceil(samples.length / MAX_ANALYSIS_SAMPLES))
  let total = 0
  let squares = 0
  let silent = 0
  let clipped = 0

  for (let index = 0; index < samples.length; index += stride) {
    const value = Math.abs(samples[index] ?? 0)
    total += 1
    squares += value * value
    if (value < SILENCE_THRESHOLD) silent += 1
    if (value >= CLIPPING_THRESHOLD) clipped += 1
  }

  const rms = total > 0 ? Math.sqrt(squares / total) : 0
  const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100
  const silenceRatio = total > 0 ? silent / total : 1
  const clippingRatio = total > 0 ? clipped / total : 0
  const messages: string[] = []
  let status: VoiceSampleAnalysis['status'] = 'good'

  if (durationSeconds < 5) {
    status = 'blocked'
    messages.push('5초보다 짧아 목소리 특징을 확인하기 어렵습니다.')
  } else if (durationSeconds < 10) {
    status = 'warning'
    messages.push('10초 이상 녹음하면 복제 안정성이 좋아집니다.')
  }

  if (durationSeconds > 120) {
    status = status === 'blocked' ? status : 'warning'
    messages.push('120초를 넘는 샘플은 필요한 부분만 잘라 사용하는 편이 좋습니다.')
  }
  if (silenceRatio > 0.58) {
    status = status === 'blocked' ? status : 'warning'
    messages.push('무음 구간이 많습니다. 말소리가 이어지는 구간으로 다시 녹음해 주세요.')
  }
  if (clippingRatio > 0.02) {
    status = 'blocked'
    messages.push('소리가 찢어지는 클리핑이 많습니다. 마이크에서 조금 멀어져 다시 녹음해 주세요.')
  } else if (clippingRatio > 0.005) {
    status = status === 'good' ? 'warning' : status
    messages.push('일부 구간의 입력이 너무 큽니다.')
  }
  if (rmsDb < -38) {
    status = status === 'blocked' ? status : 'warning'
    messages.push('목소리가 너무 작습니다. 조용한 곳에서 마이크 가까이 말해 주세요.')
  }
  if (messages.length === 0) messages.push('복제 샘플로 사용하기 좋은 음질입니다.')

  return {
    durationSeconds: round(durationSeconds, 2),
    sampleRate,
    channelCount,
    rmsDb: round(rmsDb, 1),
    silenceRatio: round(silenceRatio),
    clippingRatio: round(clippingRatio),
    status,
    messages,
  }
}

export async function analyzeAudioFile(file: File): Promise<VoiceSampleAnalysis> {
  const context = new AudioContext()
  try {
    const buffer = await file.arrayBuffer()
    const decoded = await context.decodeAudioData(buffer.slice(0))
    const channels: Float32Array[] = []
    for (let index = 0; index < decoded.numberOfChannels; index += 1) {
      channels.push(decoded.getChannelData(index))
    }
    const sampleCount = channels[0]?.length ?? 0
    const mixed = new Float32Array(sampleCount)
    for (let index = 0; index < sampleCount; index += 1) {
      let sum = 0
      for (const channel of channels) sum += channel[index] ?? 0
      mixed[index] = channels.length > 0 ? sum / channels.length : 0
    }
    return summarizeSampleQuality(
      mixed,
      decoded.duration,
      decoded.sampleRate,
      decoded.numberOfChannels,
    )
  } finally {
    await context.close()
  }
}
