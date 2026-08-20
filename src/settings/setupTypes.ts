export type SetupStepStatus = 'ready' | 'warning' | 'missing'
export type VoicePresetStatus = SetupStepStatus | 'blocked'
export type VoiceSelectionStatus = 'ready' | 'idle' | 'missing' | 'blocked'

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
  displayName: string
  declaredGender: string
  filename: string
  manifestFilename: string
  schemaVersion: number | null
  status: VoicePresetStatus
  usable: boolean
  audioUsable: boolean
  manifestStatus: VoicePresetStatus
  manifestValid: boolean
  consentStatus: string
  humanReviewStatus: string
  sourceType: string
  allowedUses: string[]
  declaredSha256: string | null
  actualSha256: string | null
  checksumMatches: boolean | null
  reviewAudioSha256: string | null
  reviewChecksumMatches: boolean | null
  approvalId: string | null
  signatureMode: string
  signingKeyId: string | null
  signatureStatus: string
  signedPayloadSha256: string | null
  neuralPreviewEngineId: string | null
  modelId: string | null
  modelFingerprint: string | null
  referenceFingerprint: string | null
  neuralPreviewReady: boolean
  previewCacheKey: string | null
  consentExpiresAt: string | null
  rightsExpiresAt: string | null
  consentDaysRemaining: number | null
  rightsDaysRemaining: number | null
  duplicateVoiceIds: string[]
  durationSeconds: number | null
  sampleRate: number | null
  channelCount: number | null
  sampleWidthBits: number | null
  silenceRatio: number | null
  clippingRatio: number | null
  issues: string[]
}

export interface VoiceSelectionDiagnostic {
  engineId: string
  engineName: string
  voiceId: string
  displayName: string
  expectedGender: string
  status: VoiceSelectionStatus
  selectedVoiceId: string | null
  selectedVoiceName: string | null
  selectedGender: string | null
  selectionBasis: string
  reason: string
}

export interface SetupStatus {
  version: string
  ready: boolean
  realEngineCount: number
  voicePresetReadyCount: number
  voicePresetAudioReadyCount: number
  voicePresetManifestReadyCount: number
  voicePresetExpectedCount: number
  voicePresetDuplicateGroupCount: number
  voicePresetDiagnostics: VoicePresetDiagnostic[]
  voiceSelectionDiagnostics: VoiceSelectionDiagnostic[]
  steps: SetupStep[]
}
