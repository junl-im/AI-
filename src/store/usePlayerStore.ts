import { create } from 'zustand'
import type { GeneratedAudio } from '../tts/generationTypes'
import type { PlayerTrack, RepeatMode } from '../player/playerTypes'
import { createRandomId } from '../utils/randomId'

const MAX_QUEUE_SIZE = 20

function releaseTrack(track: PlayerTrack | undefined) {
  if (!track?.audio.revokeOnRemove || !track.audio.url) return
  URL.revokeObjectURL(track.audio.url)
}

function createTrack(audio: GeneratedAudio, title: string): PlayerTrack {
  return {
    id: createRandomId(),
    title,
    audio,
    createdAt: new Date().toISOString(),
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
  enqueue: (audio: GeneratedAudio, title?: string) => string
  enqueueAndPlay: (audio: GeneratedAudio, title?: string) => string
  select: (trackId: string) => void
  selectAndPlay: (trackId: string) => void
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
  remove: (trackId) => set((state) => {
    const index = state.queue.findIndex((track) => track.id === trackId)
    if (index < 0) return state
    releaseTrack(state.queue[index])
    const queue = state.queue.filter((track) => track.id !== trackId)
    let currentTrackId = state.currentTrackId
    if (currentTrackId === trackId) {
      currentTrackId = queue[index]?.id ?? queue[index - 1]?.id ?? null
    }
    return { queue, currentTrackId }
  }),
  clearQueue: () => set((state) => {
    state.queue.forEach(releaseTrack)
    return { queue: [], currentTrackId: null }
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
