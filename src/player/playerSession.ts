import type { TtsSynthesisResult } from '../ai/contracts'
import type { PlayerTrack, RepeatMode } from './playerTypes'

const STORAGE_KEY = 'sorion.player-session.v1'
const SCHEMA_VERSION = 2
const LEGACY_SCHEMA_VERSION = 1
const MAX_SESSION_AGE_MS = 25 * 60 * 1_000
const MAX_PERSISTED_TRACKS = 10

export interface PlayerSessionSnapshot {
  schemaVersion: typeof SCHEMA_VERSION
  savedAt: string
  currentTrackId: string | null
  repeatMode: RepeatMode
  playbackRate: number
  tracks: PlayerTrack[]
}

export type FinalAudioRenewal = (
  jobId: string,
) => Promise<TtsSynthesisResult>

function hasSafeRemoteUrl(url: string | null): url is string {
  return Boolean(url && /^https?:\/\//i.test(url))
}

export function isRestorablePlayerTrack(track: PlayerTrack): boolean {
  const audio = track.audio
  if (audio.partial || audio.progressive || audio.revokeOnRemove) return false
  if (audio.source === 'browser-speech') return Boolean(audio.browserSpeech?.text)
  return audio.source === 'api' && hasSafeRemoteUrl(audio.url)
}

function normalizeTrack(value: unknown): PlayerTrack | null {
  if (!value || typeof value !== 'object') return null
  const track = value as PlayerTrack
  if (
    typeof track.id !== 'string'
    || typeof track.title !== 'string'
    || typeof track.createdAt !== 'string'
    || !track.audio
    || typeof track.audio !== 'object'
  ) return null
  const resumePositionSeconds = track.audio.source === 'browser-speech'
    ? 0
    : Math.max(0, Number(track.resumePositionSeconds) || 0)
  const rehydration = track.audio.rehydration?.kind === 'tts-final'
    && typeof track.audio.rehydration.jobId === 'string'
    && track.audio.rehydration.jobId
    ? track.audio.rehydration
    : undefined
  const normalized = {
    ...track,
    resumePositionSeconds,
    audio: { ...track.audio, rehydration },
  }
  return isRestorablePlayerTrack(normalized) ? normalized : null
}

export function createPlayerSessionSnapshot(input: {
  queue: PlayerTrack[]
  currentTrackId: string | null
  repeatMode: RepeatMode
  playbackRate: number
}): PlayerSessionSnapshot | null {
  const tracks = input.queue.filter(isRestorablePlayerTrack).slice(-MAX_PERSISTED_TRACKS)
  if (tracks.length === 0) return null
  const currentTrackId = input.currentTrackId && tracks.some((track) => track.id === input.currentTrackId)
    ? input.currentTrackId
    : tracks[0]?.id ?? null
  return {
    schemaVersion: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    currentTrackId,
    repeatMode: input.repeatMode,
    playbackRate: Math.min(2, Math.max(0.75, input.playbackRate)),
    tracks,
  }
}

export function savePlayerSession(snapshot: PlayerSessionSnapshot | null): boolean {
  try {
    if (!snapshot) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    return true
  } catch {
    return false
  }
}

export function loadPlayerSession(now = Date.now()): PlayerSessionSnapshot | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<PlayerSessionSnapshot> & { schemaVersion?: number }
    const savedAtMs = typeof value.savedAt === 'string' ? Date.parse(value.savedAt) : Number.NaN
    if (
      ![LEGACY_SCHEMA_VERSION, SCHEMA_VERSION].includes(value.schemaVersion ?? 0)
      || !Number.isFinite(savedAtMs)
      || now - savedAtMs > MAX_SESSION_AGE_MS
      || now < savedAtMs - 60_000
      || !Array.isArray(value.tracks)
    ) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const tracks = value.tracks.map(normalizeTrack).filter((track): track is PlayerTrack => Boolean(track))
    if (tracks.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const repeatMode: RepeatMode = value.repeatMode === 'one' || value.repeatMode === 'all'
      ? value.repeatMode
      : 'off'
    const playbackRate = Math.min(2, Math.max(0.75, Number(value.playbackRate) || 1))
    const currentTrackId = typeof value.currentTrackId === 'string'
      && tracks.some((track) => track.id === value.currentTrackId)
      ? value.currentTrackId
      : tracks[0].id
    return {
      schemaVersion: SCHEMA_VERSION,
      savedAt: value.savedAt as string,
      currentTrackId,
      repeatMode,
      playbackRate,
      tracks,
    }
  } catch {
    return null
  }
}

export async function rehydratePlayerSession(
  snapshot: PlayerSessionSnapshot,
  renewFinalAudio: FinalAudioRenewal,
): Promise<PlayerSessionSnapshot | null> {
  const tracks = (await Promise.all(snapshot.tracks.map(async (track) => {
    const jobId = track.audio.rehydration?.kind === 'tts-final'
      ? track.audio.rehydration.jobId
      : null
    if (!jobId) return track
    try {
      const result = await renewFinalAudio(jobId)
      if (!result.audioUrl) return null
      return {
        ...track,
        audio: {
          ...track.audio,
          url: result.audioUrl,
          result: { ...track.audio.result, ...result },
          rehydration: {
            kind: 'tts-final' as const,
            jobId,
            renewedAt: new Date().toISOString(),
          },
        },
      }
    } catch {
      return null
    }
  }))).filter((track): track is PlayerTrack => Boolean(track))
  if (!tracks.length) return null
  return {
    ...snapshot,
    currentTrackId: snapshot.currentTrackId && tracks.some((track) => track.id === snapshot.currentTrackId)
      ? snapshot.currentTrackId
      : tracks[0].id,
    tracks,
  }
}

export function clearPlayerSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage can be unavailable in private browsing; the in-memory queue still works.
  }
}
