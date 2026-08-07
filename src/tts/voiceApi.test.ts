import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TtsSynthesisRequest } from '../ai/contracts'
import { saveApiBaseUrl } from '../api/httpClient'
import { BROWSER_SPEECH_ENGINE_ID } from './browserSpeech'
import { synthesizeSpeech } from './voiceApi'

const originalSpeechSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis')
const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance')

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
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
  it('auto 엔진의 프리셋 호환 실패는 브라우저 음성으로 계속 폴백한다', async () => {
    saveApiBaseUrl('http://127.0.0.1:8000/api/v1', false)
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [{
          name: 'Microsoft Heami Female',
          voiceURI: 'heami-ko',
          lang: 'ko-KR',
          localService: true,
          default: true,
        }],
      },
    })
    Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: class {},
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ detail: 'SOA-4022: 현재 서버 엔진은 이 프리셋과 호환되지 않습니다.' }),
      { status: 422, headers: { 'content-type': 'application/json' } },
    ))
    const request: TtsSynthesisRequest = {
      text: '혜린 프리셋 자동 폴백 테스트입니다.',
      voiceId: 'sori-warm',
      emotion: 'neutral',
      speed: 1,
      pitch: 0,
      format: 'wav',
      engineId: 'auto',
      normalizeText: true,
    }

    const result = await synthesizeSpeech(request, 'preset-browser-fallback')

    expect(result.engineId).toBe(BROWSER_SPEECH_ENGINE_ID)
    expect(result.fallbackUsed).toBe(true)
  })

})
