import type { GeneratedAudio } from '../tts/generationTypes'

export type RepeatMode = 'off' | 'one' | 'all'

export interface PlayerTrack {
  id: string
  title: string
  audio: GeneratedAudio
  createdAt: string
  resumePositionSeconds?: number
}
