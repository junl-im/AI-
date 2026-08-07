import { create } from 'zustand'
import type { GeneratedAudio, PlaybackSeamMetric, PlaybackTelemetry, ProgressiveAudioSegment } from '../tts/generationTypes'
import type { PlayerTrack, RepeatMode } from '../player/playerTypes'
import { createRandomId } from '../utils/randomId'

const MAX_QUEUE_SIZE = 20

function releaseAudio(audio: GeneratedAudio | undefined) {
  if (!audio) return
  const urls = new Set<string>()
  if (audio.revokeOnRemove && audio.url) urls.add(audio.url)
  for (const segment of audio.progressive?.segments ?? []) {
    if (segment.revokeOnRemove) urls.add(segment.url)
  }
  urls.forEach((url) => URL.revokeObjectURL(url))
}

function releaseTrack(track: PlayerTrack | undefined) {
  releaseAudio(track?.audio)
}

function createTrack(audio: GeneratedAudio, title: string): PlayerTrack {
  return {
    id: createRandomId(),
    title,
    audio,
    createdAt: new Date().toISOString(),
    resumePositionSeconds: 0,
  }
}

function appendTrack(
  state: PlayerState,
  track: PlayerTrack,
  autoplay: boolean,
): Pick<PlayerState, 'queue' | 'currentTrackId' | 'playRequestId'> {
  const nextQueue = [...state.queue, track]
  const overflow = Math.max(0, nextQueue.length - MAX_QUEUE_SIZE)
  nextQueue.slice(0, overflow).forEach(releaseTrack)
  const queue = nextQueue.slice(overflow)
  const currentTrackId = autoplay
    ? track.id
    : queue.some((item) => item.id === state.currentTrackId)
      ? state.currentTrackId
      : queue[0]?.id ?? null
  return {
    queue,
    currentTrackId,
    playRequestId: autoplay ? state.playRequestId + 1 : state.playRequestId,
  }
}

export interface PlayerState {
  queue: PlayerTrack[]
  currentTrackId: string | null
  playRequestId: number
  repeatMode: RepeatMode
  playbackRate: number
  playbackTrackId: string | null
  playbackPositionSeconds: number
  playbackActive: boolean
  toggleRequestId: number
  seekRequestId: number
  seekTrackId: string | null
  seekTargetSeconds: number
  enqueue: (audio: GeneratedAudio, title?: string) => string
  enqueueAndPlay: (audio: GeneratedAudio, title?: string) => string
  replace: (trackId: string, audio: GeneratedAudio, title?: string, autoplay?: boolean) => void
  appendProgressiveSegment: (trackId: string, segment: ProgressiveAudioSegment) => void
  recordSeamMetric: (trackId: string, metric: PlaybackSeamMetric) => void
  updateTelemetry: (trackId: string, patch: Partial<PlaybackTelemetry>) => void
  updateResumePosition: (trackId: string, seconds: number) => void
  restoreSession: (tracks: PlayerTrack[], currentTrackId: string | null, repeatMode: RepeatMode, playbackRate: number) => void
  select: (trackId: string) => void
  selectAndPlay: (trackId: string) => void
  toggleTrack: (trackId: string) => void
  seekTrack: (trackId: string, seconds: number) => void
  setPlaybackSnapshot: (trackId: string | null, seconds: number, active: boolean) => void
  remove: (trackId: string) => void
  clearQueue: () => void
  selectNext: () => string | null
  selectPrevious: () => string | null
  cycleRepeatMode: () => void
  setPlaybackRate: (rate: number) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentTrackId: null,
  playRequestId: 0,
  repeatMode: 'off',
  playbackRate: 1,
  playbackTrackId: null,
  playbackPositionSeconds: 0,
  playbackActive: false,
  toggleRequestId: 0,
  seekRequestId: 0,
  seekTrackId: null,
  seekTargetSeconds: 0,
  enqueue: (audio, title = 'SoriON 생성 음성') => {
    const track = createTrack(audio, title)
    set((state) => appendTrack(state, track, false))
    return track.id
  },
  enqueueAndPlay: (audio, title = 'SoriON 생성 음성') => {
    const track = createTrack(audio, title)
    set((state) => appendTrack(state, track, true))
    return track.id
  },
  replace: (trackId, audio, title, autoplay = false) => set((state) => {
    const index = state.queue.findIndex((track) => track.id === trackId)
    if (index < 0) return state
    const previous = state.queue[index]
    if (previous.audio !== audio) releaseTrack(previous)
    const mergedAudio = {
      ...audio,
      telemetry: previous.audio.telemetry || audio.telemetry
        ? {
            ...previous.audio.telemetry,
            ...audio.telemetry,
            requestStartedAtMs: previous.audio.telemetry?.requestStartedAtMs
              ?? audio.telemetry?.requestStartedAtMs
              ?? Date.now(),
          }
        : undefined,
    }
    const queue = state.queue.map((track) => track.id === trackId
      ? { ...track, title: title ?? track.title, audio: mergedAudio }
      : track)
    return {
      queue,
      currentTrackId: autoplay ? trackId : state.currentTrackId,
      playRequestId: autoplay ? state.playRequestId + 1 : state.playRequestId,
    }
  }),
  appendProgressiveSegment: (trackId, segment) => set((state) => ({
    queue: state.queue.map((track) => {
      if (track.id !== trackId || !track.audio.progressive) return track
      const existing = track.audio.progressive.segments.find((item) => item.index === segment.index)
      if (existing) {
        if (segment.revokeOnRemove && segment.url !== existing.url) URL.revokeObjectURL(segment.url)
        return track
      }
      const segments = [...track.audio.progressive.segments, segment]
        .sort((left, right) => left.index - right.index)
      return {
        ...track,
        audio: {
          ...track.audio,
          durationSeconds: segments.reduce((total, item) => total + item.durationSeconds, 0),
          progressive: {
            ...track.audio.progressive,
            totalSegments: Math.max(track.audio.progressive.totalSegments, segment.totalSegments),
            segments,
          },
        },
      }
    }),
  })),
  recordSeamMetric: (trackId, metric) => set((state) => ({
    queue: state.queue.map((track) => {
      if (track.id !== trackId) return track
      const telemetry = track.audio.telemetry ?? { requestStartedAtMs: Date.now() }
      const seams = [...(telemetry.seams ?? []), metric].slice(-20)
      return {
        ...track,
        audio: {
          ...track.audio,
          telemetry: { ...telemetry, seams },
        },
      }
    }),
  })),
  updateTelemetry: (trackId, patch) => set((state) => ({
    queue: state.queue.map((track) => track.id === trackId
      ? {
          ...track,
          audio: {
            ...track.audio,
            telemetry: {
              requestStartedAtMs: track.audio.telemetry?.requestStartedAtMs ?? Date.now(),
              ...track.audio.telemetry,
              ...patch,
            },
          },
        }
      : track),
  })),
  updateResumePosition: (trackId, seconds) => set((state) => ({
    queue: state.queue.map((track) => track.id === trackId
      ? { ...track, resumePositionSeconds: Math.max(0, Number.isFinite(seconds) ? seconds : 0) }
      : track),
  })),
  restoreSession: (tracks, currentTrackId, repeatMode, playbackRate) => set((state) => {
    if (state.queue.length > 0 || tracks.length === 0) return state
    const queue = tracks.slice(-MAX_QUEUE_SIZE)
    const selected = currentTrackId && queue.some((track) => track.id === currentTrackId)
      ? currentTrackId
      : queue[0]?.id ?? null
    return {
      queue,
      currentTrackId: selected,
      repeatMode,
      playbackRate: Math.min(2, Math.max(0.75, playbackRate)),
    }
  }),
  select: (currentTrackId) => set((state) => (
    state.queue.some((track) => track.id === currentTrackId)
      ? { currentTrackId }
      : state
  )),
  selectAndPlay: (currentTrackId) => set((state) => (
    state.queue.some((track) => track.id === currentTrackId)
      ? { currentTrackId, playRequestId: state.playRequestId + 1 }
      : state
  )),
  toggleTrack: (trackId) => set((state) => {
    if (!state.queue.some((track) => track.id === trackId)) return state
    if (state.currentTrackId !== trackId) {
      return { currentTrackId: trackId, playRequestId: state.playRequestId + 1 }
    }
    return { toggleRequestId: state.toggleRequestId + 1 }
  }),
  seekTrack: (trackId, seconds) => set((state) => {
    if (!state.queue.some((track) => track.id === trackId)) return state
    return {
      currentTrackId: trackId,
      seekTrackId: trackId,
      seekTargetSeconds: Math.max(0, Number.isFinite(seconds) ? seconds : 0),
      seekRequestId: state.seekRequestId + 1,
    }
  }),
  setPlaybackSnapshot: (playbackTrackId, playbackPositionSeconds, playbackActive) => set({
    playbackTrackId,
    playbackPositionSeconds: Math.max(
      0,
      Number.isFinite(playbackPositionSeconds) ? playbackPositionSeconds : 0,
    ),
    playbackActive,
  }),
  remove: (trackId) => set((state) => {
    const index = state.queue.findIndex((track) => track.id === trackId)
    if (index < 0) return state
    releaseTrack(state.queue[index])
    const queue = state.queue.filter((track) => track.id !== trackId)
    let currentTrackId = state.currentTrackId
    if (currentTrackId === trackId) {
      currentTrackId = queue[index]?.id ?? queue[index - 1]?.id ?? null
    }
    return {
      queue,
      currentTrackId,
      playbackTrackId: state.playbackTrackId === trackId ? null : state.playbackTrackId,
      playbackPositionSeconds: state.playbackTrackId === trackId ? 0 : state.playbackPositionSeconds,
      playbackActive: state.playbackTrackId === trackId ? false : state.playbackActive,
      seekTrackId: state.seekTrackId === trackId ? null : state.seekTrackId,
      seekTargetSeconds: state.seekTrackId === trackId ? 0 : state.seekTargetSeconds,
    }
  }),
  clearQueue: () => set((state) => {
    state.queue.forEach(releaseTrack)
    return {
      queue: [],
      currentTrackId: null,
      playbackTrackId: null,
      playbackPositionSeconds: 0,
      playbackActive: false,
      seekTrackId: null,
      seekTargetSeconds: 0,
    }
  }),
  selectNext: () => {
    const state = get()
    if (state.queue.length === 0) return null
    const index = state.queue.findIndex((track) => track.id === state.currentTrackId)
    const nextIndex = index < 0 ? 0 : index + 1
    if (nextIndex >= state.queue.length && state.repeatMode !== 'all') return null
    const next = state.queue[nextIndex % state.queue.length]
    set({ currentTrackId: next.id })
    return next.id
  },
  selectPrevious: () => {
    const state = get()
    if (state.queue.length === 0) return null
    const index = state.queue.findIndex((track) => track.id === state.currentTrackId)
    const previousIndex = index <= 0 ? state.queue.length - 1 : index - 1
    if (index === 0 && state.repeatMode !== 'all') return null
    const previous = state.queue[previousIndex]
    set({ currentTrackId: previous.id })
    return previous.id
  },
  cycleRepeatMode: () => set((state) => ({
    repeatMode: state.repeatMode === 'off'
      ? 'all'
      : state.repeatMode === 'all'
        ? 'one'
        : 'off',
  })),
  setPlaybackRate: (playbackRate) => set({
    playbackRate: Math.min(2, Math.max(0.75, playbackRate)),
  }),
}))

export function getCurrentTrack(state: PlayerState): PlayerTrack | null {
  return state.queue.find((track) => track.id === state.currentTrackId) ?? null
}
