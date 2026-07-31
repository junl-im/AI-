export type VoiceSampleQualityStatus = 'good' | 'warning' | 'blocked'
export type VoiceCloneProfileStatus = 'sample-ready' | 'engine-ready' | 'engine-unavailable'

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
