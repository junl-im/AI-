import { afterEach, describe, expect, it, vi } from 'vitest'
import { combineTimelinePcmWav } from './timelineWav'
import { wavToMp3 } from './wavToMp3'

describe('wavToMp3', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('작업 스레드 취소 시 즉시 종료한다', async () => {
    const terminate = vi.fn()
    vi.stubGlobal('Worker', class {
      onmessage = null
      onerror = null
      onmessageerror = null
      postMessage = vi.fn()
      terminate = terminate
    })
    const controller = new AbortController()
    const conversion = wavToMp3(new Blob(['RIFF']), { signal: controller.signal })
    controller.abort()
    await expect(conversion).rejects.toMatchObject({ name: 'AbortError' })
    expect(terminate).toHaveBeenCalledOnce()
  })

  it('취소된 변환은 MP3 파일을 만들지 않는다', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(wavToMp3(new Blob(), { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
  })
  it('실제 PCM WAV를 재생 가능한 MP3 바이트로 인코딩한다', async () => {
    const sampleRate = 24_000
    const pcm = new Uint8Array(sampleRate * 2)
    const view = new DataView(pcm.buffer)
    for (let index = 0; index < sampleRate; index += 1) {
      view.setInt16(index * 2, Math.round(Math.sin(index * 2 * Math.PI * 440 / sampleRate) * 8_000), true)
    }
    const wav = combineTimelinePcmWav([{ audio: (() => {
      const buffer = new ArrayBuffer(44 + pcm.length)
      const header = new DataView(buffer)
      for (const [offset, word] of [[0, 'RIFF'], [8, 'WAVE'], [12, 'fmt '], [36, 'data']] as const) {
        for (let index = 0; index < word.length; index += 1) header.setUint8(offset + index, word.charCodeAt(index))
      }
      header.setUint32(4, 36 + pcm.length, true)
      header.setUint32(16, 16, true)
      header.setUint16(20, 1, true)
      header.setUint16(22, 1, true)
      header.setUint32(24, sampleRate, true)
      header.setUint32(28, sampleRate * 2, true)
      header.setUint16(32, 2, true)
      header.setUint16(34, 16, true)
      header.setUint32(40, pcm.length, true)
      new Uint8Array(buffer, 44).set(pcm)
      return buffer
    })() }])
    const mp3 = await wavToMp3(wav)
    expect(mp3.type).toBe('audio/mpeg')
    expect(mp3.size).toBeGreaterThan(1_000)
    const bytes = new Uint8Array(await mp3.arrayBuffer())
    expect(bytes[0]).toBe(0xff)
    expect(bytes[1] & 0xe0).toBe(0xe0)
  })
})
