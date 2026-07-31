export type VoiceSampleQualityStatus = 'good' | 'warning' | 'blocked'
export type VoiceCloneProfileStatus = 'sample-ready' | 'engine-ready' | 'engine-unavailable'
export type VoiceCloneJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
export type VoiceCloneSegmentStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface VoiceSampleAnalysis {
  durationSeconds: number
  sampleRate: number | null
  channelCount: number | null
  rmsDb: number | null
  silenceRatio: number | null
  clippingRatio: number | null
  status: VoiceSampleQualityStatus
  messages: string[]
}

export interface VoiceCloneConsent {
  rightsConfirmed: boolean
  disclosureConfirmed: boolean
  prohibitedUseConfirmed: boolean
  consentedAt: string
  allowedPurpose: 'personal' | 'content' | 'accessibility'
}

export interface VoiceCloneProfile {
  id: string
  displayName: string
  status: VoiceCloneProfileStatus
  engineId: string
  fileName: string
  mimeType: string
  sampleBlob: Blob
  analysis: VoiceSampleAnalysis
  consent: VoiceCloneConsent
  createdAt: string
  updatedAt: string
  message: string
}

export interface VoiceCloneWorkerDiagnostics {
  ready: boolean
  backend?: string
  reason?: string
  device?: string
  model_path?: string | null
  model_exists?: boolean
  adapter_module?: string | null
  adapter_loaded?: boolean
  torch_available?: boolean
  cuda_available?: boolean
  cuda_device_count?: number
  gpu_name?: string | null
  vram_total_mb?: number | null
}

export interface VoiceCloneSegment {
  index: number
  text: string
  status: VoiceCloneSegmentStatus
  progress: number
  message: string
  error: string | null
  audioUrl: string | null
}

export interface VoiceCloneJob {
  id: string
  profileId: string
  status: VoiceCloneJobStatus
  progress: number
  phase: string
  message: string
  text: string
  createdAt: string
  updatedAt: string
  firstAudioMs: number | null
  durationSeconds: number | null
  audioUrl: string | null
  eventsUrl: string
  error: string | null
  segments: VoiceCloneSegment[]
}
