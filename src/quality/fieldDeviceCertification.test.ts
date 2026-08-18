import { afterEach, describe, expect, it } from 'vitest'
import {
  confirmFieldDeviceCertificationEvidence,
  detectFieldDeviceSurface,
  getFieldDeviceCertificationStatus,
  loadFieldDeviceCertificationEvidence,
  recordFieldDeviceEvent,
} from './fieldDeviceCertification'

const originalUserAgent = Object.getOwnPropertyDescriptor(navigator, 'userAgent')

afterEach(() => {
  if (originalUserAgent) Object.defineProperty(navigator, 'userAgent', originalUserAgent)
  window.localStorage.clear()
})

function useUserAgent(value: string) {
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value })
}

describe('fieldDeviceCertification', () => {
  it('카카오 Android/iOS surface를 전체 UA 저장 없이 구분한다', () => {
    expect(detectFieldDeviceSurface('Mozilla/5.0 (Linux; Android 15; wv) KAKAOTALK/11.1 (INAPP)')).toMatchObject({ surface: 'kakao-android', deviceProfile: 'android' })
    expect(detectFieldDeviceSurface('Mozilla/5.0 (iPhone) Mobile/15E148 KAKAOTALK/11.1 (INAPP)')).toMatchObject({ surface: 'kakao-ios', deviceProfile: 'ios' })
  })

  it('직접 재생 시작과 exit stay 관찰 뒤 운영자 확인이 있어야 ready가 된다', () => {
    useUserAgent('Mozilla/5.0 (Linux; Android 15; wv) KAKAOTALK/11.1 (INAPP)')
    recordFieldDeviceEvent('preset-preview-attempted')
    recordFieldDeviceEvent('preset-preview-started')
    recordFieldDeviceEvent('exit-dialog-opened')
    recordFieldDeviceEvent('exit-stay-closed')
    expect(getFieldDeviceCertificationStatus(loadFieldDeviceCertificationEvidence())).toBe('pending')
    const confirmed = confirmFieldDeviceCertificationEvidence(true)
    expect(getFieldDeviceCertificationStatus(confirmed)).toBe('ready')
  })

  it('WebView가 재생을 막아도 fallback 요청을 실제 관찰하면 preview 경로를 인증할 수 있다', () => {
    useUserAgent('Mozilla/5.0 (iPhone) Mobile/15E148 KAKAOTALK/11.1 (INAPP)')
    recordFieldDeviceEvent('preset-preview-attempted')
    recordFieldDeviceEvent('preset-preview-watchdog-timeout')
    recordFieldDeviceEvent('external-browser-requested')
    recordFieldDeviceEvent('exit-dialog-opened')
    recordFieldDeviceEvent('exit-stay-closed')
    const confirmed = confirmFieldDeviceCertificationEvidence(true)
    expect(confirmed.checks.presetPreviewFailure).toBe('watchdog-timeout')
    expect(getFieldDeviceCertificationStatus(confirmed)).toBe('ready')
  })
})
