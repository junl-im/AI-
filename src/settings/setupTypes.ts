export type SetupStepStatus = 'ready' | 'warning' | 'missing'
export type VoicePresetStatus = SetupStepStatus | 'blocked'

export interface SetupStep {
  id: string
  label: string
  status: SetupStepStatus
  required: boolean
  detail: string
  action: string | null
}

export interface VoicePresetDiagnostic {
  voiceId: string
  filename: string
  status: VoicePresetStatus
  usable: boolean
  durationSeconds: number | null
  sampleRate: number | null
  channelCount: number | null
  sampleWidthBits: number | null
  silenceRatio: number | null
  clippingRatio: number | null
  issues: string[]
}

export interface SetupStatus {
  version: string
  ready: boolean
  realEngineCount: number
  voicePresetReadyCount: number
  voicePresetExpectedCount: number
  voicePresetDiagnostics: VoicePresetDiagnostic[]
  steps: SetupStep[]
}
