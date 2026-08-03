import type { PlaybackSeamMetric } from '../tts/generationTypes'
import type { DeviceCertificationScenario, DeviceSoakRecordInput } from './qualityTypes'

export interface DeviceSoakSession {
  schemaVersion: 1
  startedAt: string
  sampleMinutes: 10 | 30 | 60
  deviceProfile: 'android' | 'ios'
  scenario: DeviceCertificationScenario
}

const STORAGE_KEY = 'sorion.device-soak-session.v1'

export function percentile95(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)]
}

export function summarizeSeams(seams: PlaybackSeamMetric[]) {
  return {
    waitedP95Ms: percentile95(seams.filter((item) => item.waitedForSegment).map((item) => item.gapMs)),
    decodeP95Ms: percentile95(seams.filter((item) => !item.waitedForSegment).map((item) => item.gapMs)),
  }
}

export function elapsedSoakSeconds(session: DeviceSoakSession, now = Date.now()): number {
  const started = Date.parse(session.startedAt)
  return Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 1000)) : 0
}

export function saveDeviceSoakSession(session: DeviceSoakSession | null) {
  try {
    if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Diagnostics must keep working in private browsing.
  }
}

export function loadDeviceSoakSession(): DeviceSoakSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<DeviceSoakSession>
    if (
      value.schemaVersion !== 1
      || typeof value.startedAt !== 'string'
      || ![10, 30, 60].includes(value.sampleMinutes ?? 0)
      || !['android', 'ios'].includes(value.deviceProfile ?? '')
      || !['baseline', 'network-switch', 'background-resume', 'installed-pwa'].includes(value.scenario ?? '')
    ) return null
    return value as DeviceSoakSession
  } catch {
    return null
  }
}

export function downloadDeviceSoakRecord(record: DeviceSoakRecordInput, status?: string) {
  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status: status ?? 'draft',
    record,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-device-soak-${record.deviceProfile}-${record.scenario}-${record.sampleMinutes}m.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
