export interface VoiceCloneConsent {
  subjectName: string
  consentedAt: string
  rightsConfirmed: boolean
  allowedPurposes: string[]
}

export interface VoiceCloneRequest {
  sampleFileName: string
  displayName: string
  consent: VoiceCloneConsent
}
