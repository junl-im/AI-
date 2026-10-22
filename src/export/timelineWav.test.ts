import { describe, expect, it } from 'vitest'
import { createMockWave } from '../tts/mockWave'
import { combineTimelinePcmWav } from './timelineWav'

describe('combineTimelinePcmWav', () => {
  it('대사 WAV와 앞·중간 쉼을 하나의 PCM WAV로 합친다', async () => {
    const input = await createMockWave('안녕하세요.', 'voice-a').arrayBuffer()
    const sourceSamples = input.byteLength - 44
    const result = combineTimelinePcmWav([
      { pauseSeconds: 0.5 }, { audio: input }, { pauseSeconds: 0.25 }, { audio: input },
    ])
    const buffer = await result.arrayBuffer()
    const view = new DataView(buffer)
    expect(result.type).toBe('audio/wav')
    expect(view.getUint32(24, true)).toBe(22_050)
    expect(view.getUint32(40, true)).toBe(sourceSamples * 2 + (Math.round(0.75 * 22_050) * 2))
    expect(view.getInt16(44, true)).toBe(0)
  })

  it('손상된 파일을 음성으로 합치지 않는다', () => {
    expect(() => combineTimelinePcmWav([{ audio: new ArrayBuffer(44) }])).toThrow('WAV 파일 형식')
  })
})
