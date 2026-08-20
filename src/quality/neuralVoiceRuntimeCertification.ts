import type { TtsSynthesisResult } from '../ai/contracts'

export const NEURAL_VOICE_RUNTIME_SCHEMA = 'neural-voice-runtime-certification/1'
export const NEURAL_VOICE_RUNTIME_STORAGE_KEY = 'sorion.neural-voice-runtime-certification.v1'

export type NeuralRuntimeSurface = 'desktop-browser' | 'mobile-browser'

export interface NeuralVoiceRuntimeRecord {
  id: string
  schema: typeof NEURAL_VOICE_RUNTIME_SCHEMA
  evidenceClass: 'observed-runtime'
  synthetic: false
  voiceId: string
  surface: NeuralRuntimeSurface
  cacheId: string
  cacheHit: boolean
  previewCacheKey: string
  textSha256: string
  styleSha256: string
  audioSha256: string
  modelFingerprint: string
  referenceFingerprint: string
  generationFirstAudioMs: number | null
  generatedAt: string
  playbackStartedAt: string | null
  playbackCompletedAt: string | null
  updatedAt: string
}

function runtimeSurface(): NeuralRuntimeSurface {
  if (typeof window === 'undefined') return 'desktop-browser'
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  return window.innerWidth <= 767 || coarse ? 'mobile-browser' : 'desktop-browser'
}

function readRecords(): NeuralVoiceRuntimeRecord[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(NEURAL_VOICE_RUNTIME_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is NeuralVoiceRuntimeRecord => (
      item?.schema === NEURAL_VOICE_RUNTIME_SCHEMA
      && item.evidenceClass === 'observed-runtime'
      && item.synthetic === false
      && typeof item.voiceId === 'string'
      && typeof item.audioSha256 === 'string'
    ))
  } catch {
    return []
  }
}

function writeRecords(records: NeuralVoiceRuntimeRecord[]): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(NEURAL_VOICE_RUNTIME_STORAGE_KEY, JSON.stringify(records.slice(-80)))
}

function recordId(result: TtsSynthesisResult): string | null {
  const evidence = result.neuralPreview
  if (!evidence?.runtimeCertified) return null
  return `${evidence.voiceId}:${evidence.cacheId}:${runtimeSurface()}`
}

export function recordNeuralVoicePlaybackStarted(result: TtsSynthesisResult): void {
  const evidence = result.neuralPreview
  const id = recordId(result)
  if (!evidence || !id) return
  const now = new Date().toISOString()
  const records = readRecords()
  const previous = records.find((item) => item.id === id)
  const next: NeuralVoiceRuntimeRecord = {
    id,
    schema: NEURAL_VOICE_RUNTIME_SCHEMA,
    evidenceClass: 'observed-runtime',
    synthetic: false,
    voiceId: evidence.voiceId,
    surface: runtimeSurface(),
    cacheId: evidence.cacheId,
    cacheHit: evidence.cacheHit,
    previewCacheKey: evidence.previewCacheKey,
    textSha256: evidence.textSha256,
    styleSha256: evidence.styleSha256,
    audioSha256: evidence.audioSha256,
    modelFingerprint: evidence.modelFingerprint,
    referenceFingerprint: evidence.referenceFingerprint,
    generationFirstAudioMs: result.firstAudioMs ?? null,
    generatedAt: evidence.generatedAt,
    playbackStartedAt: previous?.playbackStartedAt ?? now,
    playbackCompletedAt: previous?.playbackCompletedAt ?? null,
    updatedAt: now,
  }
  writeRecords([...records.filter((item) => item.id !== id), next])
}

export function recordNeuralVoicePlaybackCompleted(result: TtsSynthesisResult): void {
  const evidence = result.neuralPreview
  const id = recordId(result)
  if (!evidence || !id) return
  const now = new Date().toISOString()
  const records = readRecords()
  const previous = records.find((item) => item.id === id)
  if (!previous) {
    recordNeuralVoicePlaybackStarted(result)
    return recordNeuralVoicePlaybackCompleted(result)
  }
  writeRecords([
    ...records.filter((item) => item.id !== id),
    { ...previous, playbackCompletedAt: now, updatedAt: now },
  ])
}

export function listNeuralVoiceRuntimeRecords(): NeuralVoiceRuntimeRecord[] {
  return readRecords().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function importNeuralVoiceRuntimeRecords(value: unknown): NeuralVoiceRuntimeRecord[] {
  const incoming = Array.isArray(value) ? value : (value as { records?: unknown[] } | null)?.records
  if (!Array.isArray(incoming)) throw new Error('neural runtime evidence records 배열이 없습니다.')
  const accepted = incoming.filter((value): value is NeuralVoiceRuntimeRecord => {
    const item = value as Partial<NeuralVoiceRuntimeRecord>
    return (
      item.schema === NEURAL_VOICE_RUNTIME_SCHEMA
      && item.evidenceClass === 'observed-runtime'
      && item.synthetic === false
      && ['desktop-browser', 'mobile-browser'].includes(item.surface ?? '')
      && /^[0-9a-f]{64}$/.test(item.audioSha256 ?? '')
      && /^[0-9a-f]{64}$/.test(item.modelFingerprint ?? '')
      && /^[0-9a-f]{64}$/.test(item.referenceFingerprint ?? '')
    )
  })
  if (accepted.length === 0) throw new Error('유효한 observed-runtime neural evidence가 없습니다.')
  const current = readRecords()
  const merged = new Map([...current, ...accepted].map((item) => [item.id, item]))
  const records = [...merged.values()]
  writeRecords(records)
  return records
}

export function clearNeuralVoiceRuntimeRecords(): void {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(NEURAL_VOICE_RUNTIME_STORAGE_KEY)
}

export function buildNeuralVoiceRuntimeBundle(): { schema: string; exportedAt: string; records: NeuralVoiceRuntimeRecord[] } {
  return {
    schema: 'neural-voice-runtime-bundle/1',
    exportedAt: new Date().toISOString(),
    records: listNeuralVoiceRuntimeRecords(),
  }
}
