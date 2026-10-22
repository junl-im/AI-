import type { VoiceProject } from './projectTypes'

const KEY = 'sorion-pending-project-save-v1'
const MAX_BYTES = 128_000
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

type Snapshot = { version: 1; savedAt: number; project: VoiceProject }

function validProject(value: unknown): value is VoiceProject {
  if (!value || typeof value !== 'object') return false
  const project = value as Partial<VoiceProject>
  return typeof project.id === 'string' && project.id.length > 0 && project.id.length <= 120
    && typeof project.title === 'string' && project.title.length <= 200
    && typeof project.text === 'string' && project.text.length <= 20_000
    && typeof project.voiceId === 'string' && project.voiceId.length <= 120
    && typeof project.createdAt === 'string' && typeof project.updatedAt === 'string'
    && project.status === 'generated'
    && (!project.timelineClips || (Array.isArray(project.timelineClips)
      && project.timelineClips.length <= 240
      && project.timelineClips.every((clip) => clip && typeof clip.text === 'string'
        && clip.text.length <= 2_000 && typeof clip.voiceId === 'string'
        && typeof clip.voiceName === 'string')))
    && (!project.jobIds || (Array.isArray(project.jobIds) && project.jobIds.length <= 240
      && project.jobIds.every((id) => id === null || typeof id === 'string')))
}

export function readPendingProjectSave(): VoiceProject | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw || raw.length > MAX_BYTES) return null
    const snapshot = JSON.parse(raw) as Partial<Snapshot>
    if (snapshot.version !== 1 || typeof snapshot.savedAt !== 'number'
      || snapshot.savedAt > Date.now() || Date.now() - snapshot.savedAt > MAX_AGE_MS
      || !validProject(snapshot.project)) return null
    return snapshot.project
  } catch {
    return null
  }
}

export function storePendingProjectSave(project: VoiceProject): boolean {
  try {
    if (!validProject(project)) return false
    const raw = JSON.stringify({ version: 1, savedAt: Date.now(), project } satisfies Snapshot)
    if (raw.length > MAX_BYTES) return false
    localStorage.setItem(KEY, raw)
    return true
  } catch {
    return false
  }
}

export function clearPendingProjectSave(): void {
  try { localStorage.removeItem(KEY) } catch { /* Storage can be unavailable. */ }
}
