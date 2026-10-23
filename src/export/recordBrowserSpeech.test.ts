import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TimelineVoiceBlock } from '../workspace/workspaceTypes'
import { waitForSpeech } from './recordBrowserSpeech'

vi.mock('../tts/browserSpeech', () => ({ createBrowserSpeechUtterance: () => ({ onstart: null, onend: null, onerror: null }) }))

const block = { audio: { browserSpeech: { text: '안녕하세요.', lang: 'ko-KR', rate: 1, pitch: 1, voiceId: 'sori-warm' } } } as TimelineVoiceBlock

describe('browser speech recording watchdog', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('음성이 시작되지 않으면 녹음 대기를 끝낸다', async () => {
    vi.useFakeTimers()
    const cancel = vi.fn()
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel })
    const result = waitForSpeech(block, new AbortController().signal)
    const failure = expect(result).rejects.toThrow('기기 음성이 시작되지 않아')
    await vi.advanceTimersByTimeAsync(8_000)
    await failure
    expect(cancel).toHaveBeenCalledTimes(1)
  })

  it('음성이 끝나지 않으면 제한 시간 뒤 종료한다', async () => {
    vi.useFakeTimers()
    const cancel = vi.fn()
    const speak = vi.fn((utterance: SpeechSynthesisUtterance) => utterance.onstart?.(new Event('start') as SpeechSynthesisEvent))
    vi.stubGlobal('speechSynthesis', { speak, cancel })
    const result = waitForSpeech(block, new AbortController().signal)
    const failure = expect(result).rejects.toThrow('기기 음성 재생이 끝나지 않아')
    await vi.advanceTimersByTimeAsync(30_000)
    await failure
    expect(cancel).toHaveBeenCalledTimes(1)
  })
})
