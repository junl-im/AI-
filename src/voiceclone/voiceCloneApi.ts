import { apiRequest } from '../api/httpClient'
import type {
  VoiceCloneConsent,
  VoiceCloneProfileStatus,
  VoiceSampleAnalysis,
} from './voiceCloneTypes'

interface ApiVoiceCloneProfile {
  id: string
  display_name: string
  status: VoiceCloneProfileStatus
  engine_id: string
  sample_file_name: string
  created_at: string
  message: string
}

export interface VoiceCloneCapability {
  engineId: string
  engineName: string
  ready: boolean
  reason: string | null
  recommendedSeconds: number
  maxFileBytes: number
  acceptedExtensions: string[]
}

interface ApiVoiceCloneCapability {
  engine_id: string
  engine_name: string
  ready: boolean
  reason: string | null
  recommended_seconds: number
  max_file_bytes: number
  accepted_extensions: string[]
}

export async function getVoiceCloneCapability(baseUrl?: string): Promise<VoiceCloneCapability> {
  const result = await apiRequest<ApiVoiceCloneCapability>(
    '/voice-clones/capabilities',
    undefined,
    { baseUrl, timeoutMs: 8_000 },
  )
  return {
    engineId: result.engine_id,
    engineName: result.engine_name,
    ready: result.ready,
    reason: result.reason,
    recommendedSeconds: result.recommended_seconds,
    maxFileBytes: result.max_file_bytes,
    acceptedExtensions: result.accepted_extensions,
  }
}

export async function prepareVoiceCloneProfile(input: {
  file: File
  displayName: string
  consent: VoiceCloneConsent
  analysis: VoiceSampleAnalysis
}): Promise<ApiVoiceCloneProfile> {
  const form = new FormData()
  form.set('sample', input.file)
  form.set('display_name', input.displayName)
  form.set('consent_json', JSON.stringify({
    rights_confirmed: input.consent.rightsConfirmed,
    disclosure_confirmed: input.consent.disclosureConfirmed,
    prohibited_use_confirmed: input.consent.prohibitedUseConfirmed,
    consented_at: input.consent.consentedAt,
    allowed_purpose: input.consent.allowedPurpose,
  }))
  form.set('client_analysis_json', JSON.stringify({
    duration_seconds: input.analysis.durationSeconds,
    sample_rate: input.analysis.sampleRate,
    channel_count: input.analysis.channelCount,
    rms_db: input.analysis.rmsDb,
    silence_ratio: input.analysis.silenceRatio,
    clipping_ratio: input.analysis.clippingRatio,
    status: input.analysis.status,
    messages: input.analysis.messages,
  }))
  return apiRequest<ApiVoiceCloneProfile>('/voice-clones/profiles', {
    method: 'POST',
    body: form,
  }, { timeoutMs: 45_000 })
}

export async function deleteRemoteVoiceCloneProfile(profileId: string): Promise<void> {
  await apiRequest(`/voice-clones/profiles/${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
  })
}
