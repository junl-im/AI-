import { detectInAppBrowser } from '../browser/inAppBrowser'

export type FieldDeviceSurface = 'kakao-android' | 'kakao-ios' | 'android-browser' | 'ios-browser' | 'desktop-browser'
export type FieldPreviewFailure = 'none' | 'unsupported' | 'voice-unavailable' | 'blocked' | 'watchdog-timeout' | 'exception'
export type FieldDeviceCertificationStatus = 'pending' | 'ready'

export interface FieldDeviceCertificationEvidence {
  schemaVersion: 'field-device-certification/1'
  evidenceClass: 'observed-device'
  synthetic: false
  recordedAt: string
  updatedAt: string
  surface: FieldDeviceSurface
  deviceProfile: 'android' | 'ios' | 'desktop'
  inAppBrowserProvider: 'kakao' | null
  checks: {
    presetPreviewAttempted: boolean
    presetPreviewStarted: boolean
    presetPreviewFailure: FieldPreviewFailure
    externalBrowserRequested: boolean
    exitDialogOpened: boolean
    exitStayClosed: boolean
  }
  operatorConfirmed: boolean
}

export type FieldDeviceEvent =
  | 'preset-preview-attempted'
  | 'preset-preview-started'
  | 'preset-preview-unsupported'
  | 'preset-preview-voice-unavailable'
  | 'preset-preview-blocked'
  | 'preset-preview-watchdog-timeout'
  | 'preset-preview-exception'
  | 'external-browser-requested'
  | 'exit-dialog-opened'
  | 'exit-stay-closed'

const STORAGE_KEY = 'sorion.field-device-certification.v1'

export function detectFieldDeviceSurface(
  userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent,
): Pick<FieldDeviceCertificationEvidence, 'surface' | 'deviceProfile' | 'inAppBrowserProvider'> {
  const inApp = detectInAppBrowser(userAgent)
  const android = /Android/i.test(userAgent)
  const ios = /iPhone|iPad|iPod/i.test(userAgent)
  if (inApp?.provider === 'kakao' && android) {
    return { surface: 'kakao-android', deviceProfile: 'android', inAppBrowserProvider: 'kakao' }
  }
  if (inApp?.provider === 'kakao' && ios) {
    return { surface: 'kakao-ios', deviceProfile: 'ios', inAppBrowserProvider: 'kakao' }
  }
  if (android) return { surface: 'android-browser', deviceProfile: 'android', inAppBrowserProvider: null }
  if (ios) return { surface: 'ios-browser', deviceProfile: 'ios', inAppBrowserProvider: null }
  return { surface: 'desktop-browser', deviceProfile: 'desktop', inAppBrowserProvider: null }
}

export function createFieldDeviceCertificationEvidence(now = new Date().toISOString()): FieldDeviceCertificationEvidence {
  return {
    schemaVersion: 'field-device-certification/1',
    evidenceClass: 'observed-device',
    synthetic: false,
    recordedAt: now,
    updatedAt: now,
    ...detectFieldDeviceSurface(),
    checks: {
      presetPreviewAttempted: false,
      presetPreviewStarted: false,
      presetPreviewFailure: 'none',
      externalBrowserRequested: false,
      exitDialogOpened: false,
      exitStayClosed: false,
    },
    operatorConfirmed: false,
  }
}

function parseEvidence(raw: string): FieldDeviceCertificationEvidence | null {
  try {
    const value = JSON.parse(raw) as Partial<FieldDeviceCertificationEvidence>
    if (value.schemaVersion !== 'field-device-certification/1' || value.synthetic !== false || value.evidenceClass !== 'observed-device') return null
    if (!value.checks || typeof value.recordedAt !== 'string' || typeof value.updatedAt !== 'string') return null
    const currentSurface = detectFieldDeviceSurface()
    return {
      schemaVersion: 'field-device-certification/1',
      evidenceClass: 'observed-device',
      synthetic: false,
      recordedAt: value.recordedAt,
      updatedAt: value.updatedAt,
      surface: value.surface ?? currentSurface.surface,
      deviceProfile: value.deviceProfile ?? currentSurface.deviceProfile,
      inAppBrowserProvider: value.inAppBrowserProvider === 'kakao' ? 'kakao' : null,
      checks: {
        presetPreviewAttempted: Boolean(value.checks.presetPreviewAttempted),
        presetPreviewStarted: Boolean(value.checks.presetPreviewStarted),
        presetPreviewFailure: value.checks.presetPreviewFailure ?? 'none',
        externalBrowserRequested: Boolean(value.checks.externalBrowserRequested),
        exitDialogOpened: Boolean(value.checks.exitDialogOpened),
        exitStayClosed: Boolean(value.checks.exitStayClosed),
      },
      operatorConfirmed: Boolean(value.operatorConfirmed),
    }
  } catch {
    return null
  }
}

export function loadFieldDeviceCertificationEvidence(): FieldDeviceCertificationEvidence {
  if (typeof window === 'undefined') return createFieldDeviceCertificationEvidence()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? parseEvidence(raw) ?? createFieldDeviceCertificationEvidence() : createFieldDeviceCertificationEvidence()
  } catch {
    return createFieldDeviceCertificationEvidence()
  }
}

export function saveFieldDeviceCertificationEvidence(value: FieldDeviceCertificationEvidence) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Private browsing/storage limits must not break the editor.
  }
}

function failureFromEvent(event: FieldDeviceEvent): FieldPreviewFailure | null {
  if (event === 'preset-preview-unsupported') return 'unsupported'
  if (event === 'preset-preview-voice-unavailable') return 'voice-unavailable'
  if (event === 'preset-preview-blocked') return 'blocked'
  if (event === 'preset-preview-watchdog-timeout') return 'watchdog-timeout'
  if (event === 'preset-preview-exception') return 'exception'
  return null
}

export function recordFieldDeviceEvent(event: FieldDeviceEvent): FieldDeviceCertificationEvidence {
  const current = loadFieldDeviceCertificationEvidence()
  const detected = detectFieldDeviceSurface()
  const now = new Date().toISOString()
  const failure = failureFromEvent(event)
  const next: FieldDeviceCertificationEvidence = {
    ...current,
    ...detected,
    updatedAt: now,
    operatorConfirmed: false,
    checks: {
      ...current.checks,
      presetPreviewAttempted: current.checks.presetPreviewAttempted || event.startsWith('preset-preview-'),
      presetPreviewStarted: current.checks.presetPreviewStarted || event === 'preset-preview-started',
      presetPreviewFailure: event === 'preset-preview-started' ? 'none' : failure ?? current.checks.presetPreviewFailure,
      externalBrowserRequested: current.checks.externalBrowserRequested || event === 'external-browser-requested',
      exitDialogOpened: current.checks.exitDialogOpened || event === 'exit-dialog-opened',
      exitStayClosed: current.checks.exitStayClosed || event === 'exit-stay-closed',
    },
  }
  saveFieldDeviceCertificationEvidence(next)
  return next
}

export function confirmFieldDeviceCertificationEvidence(confirmed: boolean): FieldDeviceCertificationEvidence {
  const current = loadFieldDeviceCertificationEvidence()
  const next = { ...current, updatedAt: new Date().toISOString(), operatorConfirmed: confirmed }
  saveFieldDeviceCertificationEvidence(next)
  return next
}

export function resetFieldDeviceCertificationEvidence(): FieldDeviceCertificationEvidence {
  const next = createFieldDeviceCertificationEvidence()
  saveFieldDeviceCertificationEvidence(next)
  return next
}

export function getFieldDeviceCertificationStatus(value: FieldDeviceCertificationEvidence): FieldDeviceCertificationStatus {
  const isKakao = value.surface === 'kakao-android' || value.surface === 'kakao-ios'
  const previewPathObserved = value.checks.presetPreviewStarted || (
    value.checks.presetPreviewAttempted
    && value.checks.presetPreviewFailure !== 'none'
    && value.checks.externalBrowserRequested
  )
  return isKakao
    && previewPathObserved
    && value.checks.exitDialogOpened
    && value.checks.exitStayClosed
    && value.operatorConfirmed
    ? 'ready'
    : 'pending'
}

export function downloadFieldDeviceCertificationEvidence(value: FieldDeviceCertificationEvidence) {
  const payload = JSON.stringify(value, null, 2)
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-field-device-${value.surface}-${value.recordedAt.slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
