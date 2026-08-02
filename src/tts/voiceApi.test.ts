import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TtsSynthesisRequest } from '../ai/contracts'
import { BROWSER_SPEECH_ENGINE_ID } from './browserSpeech'
import { synthesizeSpeech } from './voiceApi'

const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis')
const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance')

afterEach(() => {
  vi.restoreAllMocks()
  if (originalSpeechSynthesis) Object.defineProperty(window, 'speechSynthesis', originalSpeechSynthesis)
  else Reflect.deleteProperty(window, 'speechSynthesis')
  if (originalUtterance) Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', originalUtterance)
  else Reflect.deleteProperty(globalThis, 'SpeechSynthesisUtterance')
})

describe('synthesizeSpeech', () => {
  it('브라우저 엔진이 선택되면 죽은 API를 기다리지 않고 즉시 완료한다', async () => {
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { getVoices: () => [] },
    })
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class {},
    })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const request: TtsSynthesisRequest = {
      text: '즉시 재생할 내용입니다.',
      voiceId: 'sori-warm',
      emotion: 'neutral',
      speed: 1,
      pitch: 0,
      format: 'wav',
      engineId: BROWSER_SPEECH_ENGINE_ID,
      normalizeText: true,
    }

    const result = await synthesizeSpeech(request, 'browser-fast-path')

    expect(result.engineId).toBe(BROWSER_SPEECH_ENGINE_ID)
    expect(result.fallbackUsed).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
