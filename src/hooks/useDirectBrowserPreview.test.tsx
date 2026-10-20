import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { TtsSynthesisRequest } from '../ai/contracts'
import { useDirectBrowserPreview } from './useDirectBrowserPreview'
const mocks = vi.hoisted(() => ({ kakao: vi.fn(), supported: vi.fn(), utterance: vi.fn() }))
vi.mock('../browser/inAppBrowser', () => ({ isKakaoInAppBrowser: mocks.kakao }))
vi.mock('../quality/fieldDeviceCertification', () => ({ recordFieldDeviceEvent: vi.fn() }))
vi.mock('../tts/browserSpeech', () => ({
  isBrowserSpeechSupported: mocks.supported,
  createBrowserSpeechPlayback: (request: unknown) => request,
  createBrowserSpeechUtterance: mocks.utterance,
}))
const request: TtsSynthesisRequest = { text: '안녕하세요', voiceId: 'sori-warm', emotion: 'neutral', speed: 1, pitch: 0, format: 'wav', normalizeText: true }
let utterance: SpeechSynthesisUtterance
const speak = vi.fn()
const cancel = vi.fn()
beforeEach(() => {
  vi.useFakeTimers()
  mocks.kakao.mockReturnValue(true); mocks.supported.mockReturnValue(true)
  utterance = {} as SpeechSynthesisUtterance
  mocks.utterance.mockReturnValue(utterance)
  vi.stubGlobal('speechSynthesis', { speak, cancel })
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks() })
function setup() { const ready = vi.fn(); const notice = vi.fn(); return { ...renderHook(() => useDirectBrowserPreview(ready, notice)), ready, notice } }
it('starts speak inside the tap and tracks actual start/end callbacks', () => {
  const { result } = setup()
  act(() => { expect(result.current.startKakaoBrowserPreview(request, request.voiceId)).toBe(true); expect(speak).toHaveBeenCalledWith(utterance) })
  act(() => utterance.onstart?.({} as SpeechSynthesisEvent))
  expect(result.current.directBrowserPreview).toEqual({ voiceId: request.voiceId, playing: true })
  act(() => utterance.onend?.({} as SpeechSynthesisEvent))
  expect(result.current.directBrowserPreview).toBeNull()
})
it('ignores stale error/start events after cancellation', () => {
  const { result, notice } = setup()
  act(() => { result.current.startKakaoBrowserPreview(request, request.voiceId); result.current.stopDirectBrowserPreview() })
  act(() => { utterance.onerror?.({} as SpeechSynthesisErrorEvent); utterance.onstart?.({} as SpeechSynthesisEvent); vi.advanceTimersByTime(2000) })
  expect(notice).not.toHaveBeenCalled()
  expect(result.current.directBrowserPreview).toBeNull()
})
it('clears the start watchdog and invalidates its late callbacks', () => {
  const { result, notice } = setup()
  act(() => { result.current.startKakaoBrowserPreview(request, request.voiceId); vi.advanceTimersByTime(1800) })
  expect(notice).toHaveBeenCalledOnce()
  act(() => utterance.onerror?.({} as SpeechSynthesisErrorEvent))
  expect(notice).toHaveBeenCalledOnce()
})
it('leaves other browsers to the existing engine flow and stops on unmount', () => {
  const { result, unmount } = setup()
  mocks.kakao.mockReturnValue(false)
  act(() => expect(result.current.startKakaoBrowserPreview(request, request.voiceId)).toBe(false))
  expect(speak).not.toHaveBeenCalled()
  mocks.kakao.mockReturnValue(true)
  act(() => { result.current.startKakaoBrowserPreview(request, request.voiceId) })
  unmount()
  expect(cancel).toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})
