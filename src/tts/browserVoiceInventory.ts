import {
  diagnoseBrowserSpeechVoices,
  isBrowserSpeechSupported,
  type BrowserVoiceSelectionDiagnostic,
} from './browserSpeech'

const STORAGE_KEY = 'sorion.browser-voice-inventory.v2'
const LEGACY_STORAGE_KEY = 'sorion.browser-voice-inventory.v1'

export interface BrowserVoicePresetAssignment {
  voiceId: string
  presetName: string
  status: BrowserVoiceSelectionDiagnostic['status']
  selectedVoiceName: string | null
  selectedVoiceUri: string | null
  selectionBasis: BrowserVoiceSelectionDiagnostic['selectionBasis']
}

export interface BrowserVoiceAssignmentDiff {
  voiceId: string
  presetName: string
  previousVoiceName: string | null
  currentVoiceName: string | null
  previousStatus: BrowserVoiceSelectionDiagnostic['status'] | null
  currentStatus: BrowserVoiceSelectionDiagnostic['status']
}

export interface BrowserVoiceInventorySnapshot {
  fingerprint: string
  totalVoices: number
  koreanVoices: number
  readyPresets: number
  capturedAt: string
  assignments: BrowserVoicePresetAssignment[]
}

export interface BrowserVoiceInventoryObservation extends BrowserVoiceInventorySnapshot {
  changed: boolean
  previousFingerprint: string | null
  changedAt: string | null
  assignmentDiff: BrowserVoiceAssignmentDiff[]
}

interface StoredInventory extends BrowserVoiceInventorySnapshot {
  previousFingerprint: string | null
  changedAt: string | null
  previousAssignments: BrowserVoicePresetAssignment[] | null
}

function hashInventory(value: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function assignmentsFromDiagnostics(
  diagnostics: BrowserVoiceSelectionDiagnostic[],
): BrowserVoicePresetAssignment[] {
  return diagnostics.map((item) => ({
    voiceId: item.voiceId,
    presetName: item.presetName,
    status: item.status,
    selectedVoiceName: item.selectedVoiceName,
    selectedVoiceUri: item.selectedVoiceUri,
    selectionBasis: item.selectionBasis,
  }))
}

function compareAssignments(
  previous: BrowserVoicePresetAssignment[] | null | undefined,
  current: BrowserVoicePresetAssignment[],
): BrowserVoiceAssignmentDiff[] {
  if (!previous?.length) return []
  const previousById = new Map(previous.map((item) => [item.voiceId, item]))
  return current.flatMap((item) => {
    const before = previousById.get(item.voiceId)
    if (
      before
      && before.status === item.status
      && before.selectedVoiceName === item.selectedVoiceName
      && before.selectedVoiceUri === item.selectedVoiceUri
    ) return []
    return [{
      voiceId: item.voiceId,
      presetName: item.presetName,
      previousVoiceName: before?.selectedVoiceName ?? null,
      currentVoiceName: item.selectedVoiceName,
      previousStatus: before?.status ?? null,
      currentStatus: item.status,
    }]
  })
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
    assignments: assignmentsFromDiagnostics(diagnostics),
  }
}

function readStored(): StoredInventory | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
      ?? window.localStorage.getItem(LEGACY_STORAGE_KEY)
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
      assignmentDiff: compareAssignments(stored?.previousAssignments, snapshot.assignments),
    }
  }
  if (!stored) {
    writeStored({
      ...snapshot,
      previousFingerprint: null,
      changedAt: null,
      previousAssignments: null,
    })
    return {
      ...snapshot,
      changed: false,
      previousFingerprint: null,
      changedAt: null,
      assignmentDiff: [],
    }
  }
  if (stored.fingerprint !== snapshot.fingerprint) {
    const changedAt = new Date().toISOString()
    const previousAssignments = stored.assignments ?? null
    writeStored({
      ...snapshot,
      previousFingerprint: stored.fingerprint,
      changedAt,
      previousAssignments,
    })
    return {
      ...snapshot,
      changed: true,
      previousFingerprint: stored.fingerprint,
      changedAt,
      assignmentDiff: compareAssignments(previousAssignments, snapshot.assignments),
    }
  }
  return {
    ...snapshot,
    changed: Boolean(stored.previousFingerprint),
    previousFingerprint: stored.previousFingerprint,
    changedAt: stored.changedAt,
    assignmentDiff: compareAssignments(stored.previousAssignments, snapshot.assignments),
  }
}

export function acknowledgeBrowserVoiceInventory(
  voices?: SpeechSynthesisVoice[],
): BrowserVoiceInventoryObservation {
  const snapshot = snapshotBrowserVoiceInventory(voices)
  if (snapshot.totalVoices > 0) {
    writeStored({
      ...snapshot,
      previousFingerprint: null,
      changedAt: null,
      previousAssignments: null,
    })
  }
  return {
    ...snapshot,
    changed: false,
    previousFingerprint: null,
    changedAt: null,
    assignmentDiff: [],
  }
}
