import { create } from 'zustand'
import type { GeneratedAudio } from '../tts/generationTypes'

interface PlayerState {
  audio: GeneratedAudio | null
  title: string
  setAudio: (audio: GeneratedAudio, title?: string) => void
  clearAudio: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  audio: null,
  title: '아직 생성된 음성이 없습니다.',
  setAudio: (audio, title = 'SoriON 생성 음성') => set({ audio, title }),
  clearAudio: () => set({ audio: null, title: '아직 생성된 음성이 없습니다.' }),
}))
