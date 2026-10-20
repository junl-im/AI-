import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TtsSynthesisRequest } from '../ai/contracts'
import { isKakaoInAppBrowser } from '../browser/inAppBrowser'
import { recordFieldDeviceEvent } from '../quality/fieldDeviceCertification'
import { createBrowserSpeechPlayback, createBrowserSpeechUtterance, isBrowserSpeechSupported } from '../tts/browserSpeech'

export function useDirectBrowserPreview(setPreviewingId: Dispatch<SetStateAction<string | null>>, showNotice: (message: string) => void) {
  const [directBrowserPreview, setDirectBrowserPreview] = useState<{ voiceId: string; playing: boolean } | null>(null)
  const directPreviewRunIdRef = useRef(0)
  const directPreviewWatchdogRef = useRef<number | null>(null)
  const stopDirectBrowserPreview = useCallback((resetState = true) => {
    directPreviewRunIdRef.current += 1
    if (directPreviewWatchdogRef.current !== null) {
      window.clearTimeout(directPreviewWatchdogRef.current)
      directPreviewWatchdogRef.current = null
    }
    if (isBrowserSpeechSupported()) window.speechSynthesis.cancel()
    if (resetState) setDirectBrowserPreview(null)
  }, [])
  const startKakaoBrowserPreview = useCallback((request: TtsSynthesisRequest, nextVoiceId: string) => {
    if (!isKakaoInAppBrowser()) return false
    recordFieldDeviceEvent('preset-preview-attempted')
    if (!isBrowserSpeechSupported()) {
      recordFieldDeviceEvent('preset-preview-unsupported')
      return false
    }
    stopDirectBrowserPreview(false)
    const runId = directPreviewRunIdRef.current + 1
    directPreviewRunIdRef.current = runId
    let utterance: SpeechSynthesisUtterance
    try {
      utterance = createBrowserSpeechUtterance(createBrowserSpeechPlayback(request))
    } catch (error) {
      recordFieldDeviceEvent('preset-preview-voice-unavailable')
      setPreviewingId(null)
      setDirectBrowserPreview(null)
      showNotice(error instanceof Error
        ? error.message
        : '카카오톡 브라우저에서 사용할 수 있는 한국어 음성을 찾지 못했습니다.')
      return true
    }
    let started = false
    utterance.onstart = () => {
      if (directPreviewRunIdRef.current !== runId) return
      started = true
      recordFieldDeviceEvent('preset-preview-started')
      if (directPreviewWatchdogRef.current !== null) {
        window.clearTimeout(directPreviewWatchdogRef.current)
        directPreviewWatchdogRef.current = null
      }
      setPreviewingId(null)
      setDirectBrowserPreview({ voiceId: nextVoiceId, playing: true })
    }
    const finish = () => {
      if (directPreviewRunIdRef.current !== runId) return
      if (directPreviewWatchdogRef.current !== null) {
        window.clearTimeout(directPreviewWatchdogRef.current)
        directPreviewWatchdogRef.current = null
      }
      setPreviewingId(null)
      setDirectBrowserPreview(null)
      directPreviewRunIdRef.current += 1
    }
    utterance.onend = finish
    utterance.onerror = () => {
      if (directPreviewRunIdRef.current !== runId) return
      recordFieldDeviceEvent('preset-preview-blocked')
      finish()
      showNotice('카카오톡 브라우저가 음성 재생을 차단했습니다. 외부 브라우저로 열면 안정적으로 들을 수 있습니다.')
    }
    try {
      // Kakao mobile WebView needs speak() to stay inside the original tap gesture.
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    } catch {
      recordFieldDeviceEvent('preset-preview-exception')
      finish()
      showNotice('카카오톡 브라우저가 음성 재생을 시작하지 못했습니다. 외부 브라우저로 열어 주세요.')
      return true
    }
    if (!started) directPreviewWatchdogRef.current = window.setTimeout(() => {
      if (directPreviewRunIdRef.current !== runId || started) return
      recordFieldDeviceEvent('preset-preview-watchdog-timeout')
      stopDirectBrowserPreview()
      setPreviewingId(null)
      setDirectBrowserPreview(null)
      showNotice('카카오톡 브라우저에서 음성 시작 응답이 없습니다. 외부 브라우저로 열어 주세요.')
    }, 1_800)
    return true
  }, [setPreviewingId, showNotice, stopDirectBrowserPreview])
  useEffect(() => () => stopDirectBrowserPreview(false), [stopDirectBrowserPreview])
  return { directBrowserPreview, stopDirectBrowserPreview, startKakaoBrowserPreview }
}
