import { afterEach, describe, expect, it, vi } from 'vitest'
import { getBrowserSpeechCaptureStream } from './recordBrowserSpeech'

const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
afterEach(() => {
  if (originalMediaDevices) Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices)
  else Reflect.deleteProperty(navigator, 'mediaDevices')
})

describe('browser speech audio capture', () => {
  it('화면 공유가 무음인 PC에서 선택한 입력 장치를 오디오 소스로 요청한다', async () => {
    const stream = {} as MediaStream
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    const getDisplayMedia = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia, getDisplayMedia } })
    await expect(getBrowserSpeechCaptureStream('stereo-mix')).resolves.toBe(stream)
    expect(getUserMedia).toHaveBeenCalledWith({ audio: {
      deviceId: { exact: 'stereo-mix' }, echoCancellation: false, noiseSuppression: false, autoGainControl: false,
    } })
    expect(getDisplayMedia).not.toHaveBeenCalled()
  })

  it('기존 기본 녹음은 화면 오디오 공유를 요청한다', async () => {
    const stream = {} as MediaStream
    const getUserMedia = vi.fn()
    const getDisplayMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia, getDisplayMedia } })
    await expect(getBrowserSpeechCaptureStream()).resolves.toBe(stream)
    expect(getDisplayMedia).toHaveBeenCalledWith(expect.objectContaining({ systemAudio: 'include' }))
    expect(getUserMedia).not.toHaveBeenCalled()
  })
})
