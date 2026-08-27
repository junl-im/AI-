import {
  VOICE_LISTENING_QA_SCHEMA,
  normalizeListeningScores,
  type VoiceListeningQaEntry,
  type VoiceListeningScenarioId,
  type VoiceListeningScores,
} from './voiceListeningQa'
import { isVoicePresetId } from '../tts/voicePresets'

const STORAGE_KEY = 'sorion.voice-listening-qa.v1'

function safeParse(value: string | null): VoiceListeningQaEntry[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is VoiceListeningQaEntry => Boolean(
      item && item.schemaVersion === VOICE_LISTENING_QA_SCHEMA && isVoicePresetId(item.voiceId),
    ))
  } catch {
    return []
  }
}

export function listVoiceListeningQa(): VoiceListeningQaEntry[] {
  if (typeof localStorage === 'undefined') return []
  return safeParse(localStorage.getItem(STORAGE_KEY))
}

export function saveVoiceListeningQa(input: {
  voiceId: string
  scenarioId: VoiceListeningScenarioId
  scores: VoiceListeningScores
  note: string
}): VoiceListeningQaEntry {
  if (!isVoicePresetId(input.voiceId)) throw new Error('지원하지 않는 성우 ID입니다.')
  const current = listVoiceListeningQa()
  const now = new Date().toISOString()
  const previous = current.find((item) => item.voiceId === input.voiceId && item.scenarioId === input.scenarioId)
  const next: VoiceListeningQaEntry = {
    id: previous?.id ?? `${input.voiceId}:${input.scenarioId}`,
    schemaVersion: VOICE_LISTENING_QA_SCHEMA,
    voiceId: input.voiceId,
    scenarioId: input.scenarioId,
    scores: normalizeListeningScores(input.scores),
    note: input.note.trim().slice(0, 1000),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  }
  const merged = [...current.filter((item) => item.id !== next.id), next]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  return next
}

export function exportVoiceListeningQa(entries = listVoiceListeningQa()): void {
  const payload = {
    schemaVersion: VOICE_LISTENING_QA_SCHEMA,
    exportedAt: new Date().toISOString(),
    entries,
  }
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `SoriON-listening-QA-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
