import { create } from 'zustand'
import type { GeneratedAudio } from '../tts/generationTypes'
import type { PlayerTrack, RepeatMode } from '../player/playerTypes'

const MAX_QUEUE_SIZE = 20

function releaseTrack(track: PlayerTrack | undefined) {
  if (!track?.audio.revokeOnRemove) return
  URL.revokeObjectURL(track.audio.url)
}

export interface PlayerState {
  queue: PlayerTrack[]
  currentTrackId: string | null
  repeatMode: RepeatMode
  playbackRate: number
  enqueue: (audio: GeneratedAudio, title?: string) => string
  select: (trackId: string) => void
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
  repeatMode: 'off',
  playbackRate: 1,
  enqueue: (audio, title = 'SoriON 생성 음성') => {
    const id = crypto.randomUUID()
    const track: PlayerTrack = {
      id,
      title,
      audio,
      createdAt: new Date().toISOString(),
    }
    set((state: PlayerState) => {
      const nextQueue = [...state.queue, track]
      const overflow = Math.max(0, nextQueue.length - MAX_QUEUE_SIZE)
      nextQueue.slice(0, overflow).forEach(releaseTrack)
      return {
        queue: nextQueue.slice(overflow),
        currentTrackId: id,
      }
    })
    return id
  },
  select: (currentTrackId) => set((state: PlayerState) => (
    state.queue.some((track) => track.id === currentTrackId)
      ? { currentTrackId }
      : state
  )),
  remove: (trackId) => set((state: PlayerState) => {
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
  clearQueue: () => set((state: PlayerState) => {
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
  cycleRepeatMode: () => set((state: PlayerState) => ({
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
