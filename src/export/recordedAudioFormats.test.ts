import { describe, expect, it } from 'vitest'
import { audioBufferToWav } from './recordedAudioFormats'
import { readPcmWav } from './timelineWav'

function audio(samples: Float32Array, secondChannel = samples) {
  return {
    length: samples.length,
    numberOfChannels: 2,
    sampleRate: 48_000,
    getChannelData: (index: number) => index === 0 ? samples : secondChannel,
  }
}

describe('audioBufferToWav', () => {
  it('녹음된 두 채널을 단일 채널 WAV로 만든다', async () => {
    const wav = audioBufferToWav(audio(Float32Array.from([0.5, -0.5]), Float32Array.from([0, 0])))
    const pcm = readPcmWav(await wav.arrayBuffer())
    expect(pcm.sampleRate).toBe(48_000)
    expect(new DataView(pcm.samples.buffer, pcm.samples.byteOffset).getInt16(0, true)).toBe(8192)
  })

  it('공유된 오디오 트랙이 무음이면 파일 저장을 성공 처리하지 않는다', () => {
    expect(() => audioBufferToWav(audio(new Float32Array(48_000))))
      .toThrow('공유된 오디오가 무음입니다.')
  })
})
