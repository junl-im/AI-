import { afterEach, describe, expect, it } from 'vitest'
import type { TtsSynthesisRequest } from '../ai/contracts'
import {
  BROWSER_SPEECH_ENGINE_ID,
  createBrowserSpeechPlayback,
  createBrowserSpeechResult,
  createBrowserSpeechUtterance,
  diagnoseBrowserSpeechVoices,
  estimateBrowserSpeechDuration,
  getBrowserSpeechEngine,
  isBrowserSpeechSupported,
  selectBrowserSpeechVoice,
} from './browserSpeech'

class TestUtterance {
  text: string
  lang = ''
  rate = 1
  pitch = 1
  voice: SpeechSynthesisVoice | null = null
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, 'SpeechSynthesisUtterance')
const originalSynthesis = Object.getOwnPropertyDescriptor(window, 'speechSynthesis')

function installBrowserSpeech() {
  const voices = [
    { name: 'English', lang: 'en-US', voiceURI: 'english' },
    { name: 'Microsoft Heami Female', lang: 'ko-KR', voiceURI: 'korean-a' },
    { name: 'Microsoft InJoon Male', lang: 'ko-KR', voiceURI: 'korean-b' },
    { name: 'Korean Neutral', lang: 'ko-KR', voiceURI: 'korean-c' },
    { name: 'Korean Minsu Male', lang: 'ko-KR', voiceURI: 'korean-d' },
    { name: 'Korean Youngho Male', lang: 'ko-KR', voiceURI: 'korean-e' },
  ] as SpeechSynthesisVoice[]
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', {
    configurable: true,
    value: TestUtterance,
  })
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      getVoices: () => voices,
    },
  })
  return voices
}


function disableBrowserSpeech() {
  Object.defineProperty(globalThis, 'SpeechSynthesisUtterance', { configurable: true, value: undefined })
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined })
}

function restoreProperty(target: object, name: string, descriptor?: PropertyDescriptor) {
  if (descriptor) Object.defineProperty(target, name, descriptor)
  else Reflect.deleteProperty(target, name)
}

afterEach(() => {
  restoreProperty(globalThis, 'SpeechSynthesisUtterance', originalUtterance)
  restoreProperty(window, 'speechSynthesis', originalSynthesis)
})

const request: TtsSynthesisRequest = {
  text: '안녕하세요. 소리온 브라우저 음성입니다.',
  voiceId: 'sori-warm',
  emotion: 'neutral',
  speed: 1.1,
  pitch: 2,
  format: 'wav',
  engineId: 'auto',
  normalizeText: true,
}

describe('browserSpeech', () => {
  it('지원 여부와 브라우저 엔진 계약을 정확히 노출한다', () => {
    disableBrowserSpeech()
    expect(isBrowserSpeechSupported()).toBe(false)
    installBrowserSpeech()

    expect(isBrowserSpeechSupported()).toBe(true)
    expect(getBrowserSpeechEngine()).toMatchObject({
      id: BROWSER_SPEECH_ENGINE_ID,
      mode: 'browser',
      ready: true,
      recommended: false,
    })
  })

  it('API 없는 결과를 다운로드 없는 실제 브라우저 재생 결과로 만든다', () => {
    installBrowserSpeech()
    const result = createBrowserSpeechResult(request, 'browser-job')
    const playback = createBrowserSpeechPlayback(request)

    expect(result).toMatchObject({
      jobId: 'browser-job',
      engineId: BROWSER_SPEECH_ENGINE_ID,
      engineMode: 'browser',
      audioUrl: null,
      fallbackUsed: true,
      firstAudioMs: null,
    })
    expect(result.estimatedDurationSeconds).toBeGreaterThan(0)
    expect(playback).toMatchObject({ text: request.text, lang: 'ko-KR', voiceId: 'sori-warm' })
    expect(playback.rate).toBeCloseTo(request.speed, 5)
    expect(playback.pitch).toBeGreaterThan(1)
  })

  it('한국어 목소리를 우선 선택하고 utterance에 속도를 반영한다', () => {
    const voices = installBrowserSpeech()
    const playback = createBrowserSpeechPlayback(request)
    const selected = selectBrowserSpeechVoice(voices, request.voiceId)
    const utterance = createBrowserSpeechUtterance(playback)

    expect(selected?.lang).toBe('ko-KR')
    expect(selected?.name).toBe('Microsoft Heami Female')
    expect(utterance.text).toBe(request.text)
    expect(utterance.lang).toBe('ko-KR')
    expect(utterance.rate).toBe(playback.rate)
    expect(utterance.voice?.lang).toBe('ko-KR')
  })

  it('프리셋마다 브라우저 음성과 운율을 다르게 적용한다', () => {
    const voices = installBrowserSpeech()
    const warm = createBrowserSpeechPlayback(request)
    const clear = createBrowserSpeechPlayback({ ...request, voiceId: 'on-clear' })

    expect(selectBrowserSpeechVoice(voices, 'sori-warm')?.name).toBe('Microsoft Heami Female')
    expect(selectBrowserSpeechVoice(voices, 'on-clear')?.name).toBe('Microsoft InJoon Male')
    expect(clear.rate).not.toBe(warm.rate)
    expect(clear.pitch).not.toBe(warm.pitch)
  })

  it('남성 프리셋을 여성 음성으로 자동 대체하지 않는다', () => {
    installBrowserSpeech()
    const femaleOnly = [
      { name: 'Microsoft Heami Female', lang: 'ko-KR', voiceURI: 'female-only' },
    ] as SpeechSynthesisVoice[]

    expect(selectBrowserSpeechVoice(femaleOnly, 'on-clear')).toBeNull()
  })


  it('같은 성별 후보가 하나뿐이어도 준호와 민준 프리셋을 운율 차이로 재사용한다', () => {
    const oneMaleVoice = [
      { name: 'Generic Korean Male', lang: 'ko-KR', voiceURI: 'male-only' },
    ] as SpeechSynthesisVoice[]

    expect(selectBrowserSpeechVoice(oneMaleVoice, 'on-clear')?.name).toBe('Generic Korean Male')
    expect(selectBrowserSpeechVoice(oneMaleVoice, 'jun-deep')?.name).toBe('Generic Korean Male')
    expect(selectBrowserSpeechVoice(oneMaleVoice, 'min-energetic')?.name).toBe('Generic Korean Male')
    expect(createBrowserSpeechPlayback({ ...request, voiceId: 'jun-deep' }).rate)
      .not.toBe(createBrowserSpeechPlayback({ ...request, voiceId: 'min-energetic' }).rate)
  })

  it('중성 프리셋을 성별이 명시된 음성으로 자동 대체하지 않는다', () => {
    const genderedOnly = [
      { name: 'Korean Female', lang: 'ko-KR', voiceURI: 'female' },
      { name: 'Korean Male', lang: 'ko-KR', voiceURI: 'male' },
    ] as SpeechSynthesisVoice[]

    expect(selectBrowserSpeechVoice(genderedOnly, 'dam-calm')).toBeNull()
  })

  it('알 수 없는 프리셋 ID를 첫 여성 프리셋으로 바꾸지 않는다', () => {
    const voices = installBrowserSpeech()

    expect(() => selectBrowserSpeechVoice(voices, 'unknown-preset')).toThrow('지원하지 않는 음성 프리셋')
  })


  it('브라우저 음성 실제 배정 근거를 5개 프리셋별로 노출한다', () => {
    const voices = installBrowserSpeech()
    const diagnostics = diagnoseBrowserSpeechVoices(voices)

    expect(diagnostics).toHaveLength(5)
    expect(diagnostics.find((item) => item.voiceId === 'on-clear')).toMatchObject({
      status: 'ready',
      selectedVoiceName: 'Microsoft InJoon Male',
      inferredGender: 'male',
      selectionBasis: 'preferred-token',
    })
    expect(diagnostics.find((item) => item.voiceId === 'jun-deep')).toMatchObject({
      status: 'ready',
      selectedVoiceName: 'Korean Minsu Male',
    })
  })

  it('긴 내용일수록 예상 재생시간이 늘고 빠른 속도에서는 줄어든다', () => {
    const short = estimateBrowserSpeechDuration('짧은 문장입니다.', 1)
    const long = estimateBrowserSpeechDuration('짧은 문장입니다. '.repeat(12), 1)
    const fast = estimateBrowserSpeechDuration('짧은 문장입니다. '.repeat(12), 1.5)

    expect(long).toBeGreaterThan(short)
    expect(fast).toBeLessThan(long)
  })
})
