import type { VoiceEmotion } from '../ai/contracts'

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
}
