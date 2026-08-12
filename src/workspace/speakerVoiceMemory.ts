import type { SpeakerVoiceAssignment } from './multiSpeaker'

const STORAGE_KEY = 'sorion-speaker-voice-memory-v1'
const MAX_ENTRIES = 24

interface SpeakerVoiceMemoryEntry {
  speakerKey: string
  voiceId: string
  updatedAt: string
}

function normalizeSpeaker(value: string): string {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('ko-KR')
}

export function speakerMemoryKey(value: string): string {
  const normalized = normalizeSpeaker(value)
  let hash = 0x811c9dc5
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `spk-${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function readEntries(): SpeakerVoiceMemoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item): SpeakerVoiceMemoryEntry[] => (
      item
      && typeof item.speakerKey === 'string'
      && typeof item.voiceId === 'string'
      && typeof item.updatedAt === 'string'
        ? [{ speakerKey: item.speakerKey, voiceId: item.voiceId, updatedAt: item.updatedAt }]
        : []
    )).slice(0, MAX_ENTRIES)
  } catch {
    return []
  }
}

function writeEntries(entries: SpeakerVoiceMemoryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
  } catch {
    // 저장 불가 환경에서는 현재 세션의 배정만 사용한다.
  }
}

export function getRememberedSpeakerVoiceMap(speakers: string[]): Map<string, string> {
  const entries = new Map(readEntries().map((entry) => [entry.speakerKey, entry.voiceId]))
  return new Map(speakers.flatMap((speaker) => {
    const voiceId = entries.get(speakerMemoryKey(speaker))
    return voiceId ? [[speaker, voiceId] as const] : []
  }))
}

export function rememberSpeakerVoiceAssignments(assignments: SpeakerVoiceAssignment[]): void {
  if (!assignments.length) return
  const now = new Date().toISOString()
  const nextByKey = new Map(readEntries().map((entry) => [entry.speakerKey, entry]))
  for (const assignment of assignments) {
    nextByKey.set(speakerMemoryKey(assignment.speaker), {
      speakerKey: speakerMemoryKey(assignment.speaker),
      voiceId: assignment.voiceId,
      updatedAt: now,
    })
  }
  const next = [...nextByKey.values()]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, MAX_ENTRIES)
  writeEntries(next)
}

export function clearRememberedSpeakerVoices(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // no-op
  }
}
