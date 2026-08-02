import type { VoiceEmotion } from '../ai/contracts'
import type { GeneratedAudio } from '../tts/generationTypes'

export type TimelineBlockStatus = 'queued' | 'generating' | 'ready' | 'failed'


export interface TimelineSttVerification {
  status: 'passed' | 'failed' | 'blocked' | 'unchecked'
  transcriptText: string
  characterErrorRate: number
  wordErrorRate: number
  reasons: string[]
  regenerationAttempts: number
}

interface TimelineBaseBlock {
  id: string
  durationSeconds: number
}

export interface TimelineVoiceBlock extends TimelineBaseBlock {
  kind: 'voice'
  text: string
  voiceId: string
  voiceName: string
  emotion: VoiceEmotion
  speed: number
  pitch: number
  engineId?: string
  normalizeText: boolean
  jobId: string | null
  status: TimelineBlockStatus
  progress: number
  audio: GeneratedAudio | null
  trackId: string | null
  error: string | null
  revision: number
  sttVerification?: TimelineSttVerification
}

export interface TimelinePauseBlock extends TimelineBaseBlock {
  kind: 'pause'
}

export type TimelineBlock = TimelineVoiceBlock | TimelinePauseBlock

export interface WorkspaceMessage {
  id: string
  role: 'assistant' | 'user' | 'system'
  text: string
  badge?: string
}

export interface ComposerDirective {
  id: 'commercial' | 'slow' | 'numbers' | 'bright'
  label: string
}
