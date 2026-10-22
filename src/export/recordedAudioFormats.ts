import { wavToMp3 } from './wavToMp3'

interface PcmAudio {
  length: number
  numberOfChannels: number
  sampleRate: number
  getChannelData(index: number): Float32Array<ArrayBufferLike>
}

export function audioBufferToWav(audio: PcmAudio): Blob {
  if (!audio.length || !audio.numberOfChannels || !audio.sampleRate) throw new Error('녹음된 음성 데이터가 없습니다.')
  const channels = Array.from({ length: audio.numberOfChannels }, (_, index) => audio.getChannelData(index))
  const pcm = new Int16Array(audio.length)
  let peak = 0
  let squareSum = 0
  for (let index = 0; index < audio.length; index += 1) {
    let sample = 0
    for (const channel of channels) sample += channel[index] ?? 0
    sample = Math.max(-1, Math.min(1, sample / channels.length))
    peak = Math.max(peak, Math.abs(sample))
    squareSum += sample * sample
    pcm[index] = Math.round(sample * (sample < 0 ? 32768 : 32767))
  }
  if (peak < 0.002 || Math.sqrt(squareSum / audio.length) < 0.0002) {
    throw new Error('공유된 오디오가 무음입니다. 이 PC에서는 기기 성우 소리가 화면 공유에 포함되지 않을 수 있습니다. 아래의 녹음 없는 WAV 생성 기능을 사용하거나 음성 서버를 연결해 주세요.')
  }
  const buffer = new ArrayBuffer(44 + pcm.byteLength)
  const view = new DataView(buffer)
  const word = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index))
  }
  word(0, 'RIFF')
  view.setUint32(4, 36 + pcm.byteLength, true)
  word(8, 'WAVE')
  word(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, audio.sampleRate, true)
  view.setUint32(28, audio.sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  word(36, 'data')
  view.setUint32(40, pcm.byteLength, true)
  const samples = new DataView(buffer, 44)
  for (let index = 0; index < pcm.length; index += 1) samples.setInt16(index * 2, pcm[index], true)
  return new Blob([buffer], { type: 'audio/wav' })
}

export async function recordedWebmToFiles(webm: Blob): Promise<{ wav: Blob; mp3: Blob }> {
  const context = new AudioContext()
  try {
    const decoded = await context.decodeAudioData(await webm.arrayBuffer())
    const wav = audioBufferToWav(decoded)
    return { wav, mp3: await wavToMp3(wav) }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('공유된 오디오가 무음')) throw error
    throw new Error('녹음 파일을 WAV/MP3로 변환하지 못했습니다. Chrome 또는 Edge의 오디오 공유 설정을 확인해 주세요.', { cause: error })
  } finally {
    await context.close()
  }
}
