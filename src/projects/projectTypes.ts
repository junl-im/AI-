import type { EngineMode, VoiceEmotion } from '../ai/contracts'
import type { AudioSource } from '../tts/generationTypes'

export interface VoiceProject {
  id: string
  title: string
  text: string
  voiceId: string
  emotion: VoiceEmotion
  createdAt: string
  updatedAt: string
  status: 'draft' | 'generated'
  lastJobId?: string
  engineId?: string
  engineMode?: EngineMode
  audioSource?: AudioSource
  outputFormat?: 'mp3' | 'wav' | 'flac'
  speed?: number
  pitch?: number
  normalizeText?: boolean
  jobIds?: Array<string | null>
  timelineClips?: Array<{
    text: string
    voiceId: string
    voiceName: string
  }>
}
