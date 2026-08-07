import { diagnoseBrowserSpeechVoices, isBrowserSpeechSupported } from './browserSpeech'

const STORAGE_KEY = 'sorion.browser-voice-inventory.v1'

export interface BrowserVoiceInventorySnapshot {
  fingerprint: string
  totalVoices: number
  koreanVoices: number
  readyPresets: number
  capturedAt: string
}

export interface BrowserVoiceInventoryObservation extends BrowserVoiceInventorySnapshot {
  changed: boolean
  previousFingerprint: string | null
  changedAt: string | null
}

interface StoredInventory {
  fingerprint: string
  previousFingerprint: string | null
  changedAt: string | null
  capturedAt: string
  totalVoices: number
  koreanVoices: number
  readyPresets: number
}

function hashInventory(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

export function snapshotBrowserVoiceInventory(
  voices: SpeechSynthesisVoice[] = isBrowserSpeechSupported()
    ? window.speechSynthesis.getVoices()
    : [],
): BrowserVoiceInventorySnapshot {
  const stable = voices
    .map((voice) => [
      voice.name,
      voice.voiceURI,
      voice.lang,
      voice.localService ? '1' : '0',
      voice.default ? '1' : '0',
    ].join('\u001f'))
    .sort()
    .join('\u001e')
  const diagnostics = diagnoseBrowserSpeechVoices(voices)
  return {
    fingerprint: hashInventory(stable),
    totalVoices: voices.length,
    koreanVoices: voices.filter((voice) => voice.lang.toLowerCase().startsWith('ko')).length,
    readyPresets: diagnostics.filter((item) => item.status === 'ready').length,
    capturedAt: new Date().toISOString(),
  }
}

function readStored(): StoredInventory | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as StoredInventory : null
  } catch {
    return null
  }
}

function writeStored(value: StoredInventory): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage may be blocked in privacy mode. Runtime diagnostics still work in memory.
  }
}

export function observeBrowserVoiceInventory(
  voices?: SpeechSynthesisVoice[],
): BrowserVoiceInventoryObservation {
  const snapshot = snapshotBrowserVoiceInventory(voices)
  const stored = readStored()
  if (snapshot.totalVoices === 0) {
    return {
      ...snapshot,
      changed: false,
      previousFingerprint: stored?.previousFingerprint ?? null,
      changedAt: stored?.changedAt ?? null,
    }
  }
  if (!stored) {
    writeStored({ ...snapshot, previousFingerprint: null, changedAt: null })
    return { ...snapshot, changed: false, previousFingerprint: null, changedAt: null }
  }
  if (stored.fingerprint !== snapshot.fingerprint) {
    const changedAt = new Date().toISOString()
    writeStored({
      ...snapshot,
      previousFingerprint: stored.fingerprint,
      changedAt,
    })
    return {
      ...snapshot,
      changed: true,
      previousFingerprint: stored.fingerprint,
      changedAt,
    }
  }
  return {
    ...snapshot,
    changed: Boolean(stored.previousFingerprint),
    previousFingerprint: stored.previousFingerprint,
    changedAt: stored.changedAt,
  }
}

export function acknowledgeBrowserVoiceInventory(
  voices?: SpeechSynthesisVoice[],
): BrowserVoiceInventoryObservation {
  const snapshot = snapshotBrowserVoiceInventory(voices)
  if (snapshot.totalVoices > 0) {
    writeStored({ ...snapshot, previousFingerprint: null, changedAt: null })
  }
  return { ...snapshot, changed: false, previousFingerprint: null, changedAt: null }
}
