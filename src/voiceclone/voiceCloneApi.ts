import { apiRequest, resolveApiAssetUrl } from '../api/httpClient'
import type {
  VoiceCloneConsent,
  VoiceCloneJob,
  VoiceCloneProfileStatus,
  VoiceCloneWorkerDiagnostics,
  VoiceSampleAnalysis,
} from './voiceCloneTypes'

interface ApiVoiceSampleAnalysis {
  duration_seconds: number
  sample_rate: number | null
  channel_count: number | null
  rms_db: number | null
  silence_ratio: number | null
  clipping_ratio: number | null
  status: VoiceSampleAnalysis['status']
  messages: string[]
}

interface ApiVoiceCloneProfile {
  id: string
  display_name: string
  status: VoiceCloneProfileStatus
  engine_id: string
  sample_file_name: string
  created_at: string
  message: string
  server_analysis: ApiVoiceSampleAnalysis | null
}

export interface RemoteVoiceCloneProfile {
  id: string
  displayName: string
  status: VoiceCloneProfileStatus
  engineId: string
  sampleFileName: string
  createdAt: string
  message: string
  serverAnalysis: VoiceSampleAnalysis | null
}

export interface VoiceCloneCapability {
  engineId: string
  engineName: string
  ready: boolean
  reason: string | null
  recommendedSeconds: number
  maxFileBytes: number
  acceptedExtensions: string[]
  workerVersion: string | null
  diagnostics: VoiceCloneWorkerDiagnostics | null
}

interface ApiVoiceCloneCapability {
  engine_id: string
  engine_name: string
  ready: boolean
  reason: string | null
  recommended_seconds: number
  max_file_bytes: number
  accepted_extensions: string[]
  worker_version: string | null
  diagnostics: VoiceCloneWorkerDiagnostics | null
}

interface ApiVoiceCloneSegment {
  index: number
  text: string
  status: VoiceCloneJob['segments'][number]['status']
  progress: number
  message: string
  error: string | null
  audio_url: string | null
}

interface ApiVoiceCloneJob {
  id: string
  profile_id: string
  status: VoiceCloneJob['status']
  progress: number
  phase: string
  message: string
  text: string
  created_at: string
  updated_at: string
  first_audio_ms: number | null
  duration_seconds: number | null
  audio_url: string | null
  events_url: string
  error: string | null
  segments: ApiVoiceCloneSegment[]
}

function mapAnalysis(value: ApiVoiceSampleAnalysis | null): VoiceSampleAnalysis | null {
  if (!value) return null
  return {
    durationSeconds: value.duration_seconds,
    sampleRate: value.sample_rate,
    channelCount: value.channel_count,
    rmsDb: value.rms_db,
    silenceRatio: value.silence_ratio,
    clippingRatio: value.clipping_ratio,
    status: value.status,
    messages: value.messages,
  }
}

function mapProfile(value: ApiVoiceCloneProfile): RemoteVoiceCloneProfile {
  return {
    id: value.id,
    displayName: value.display_name,
    status: value.status,
    engineId: value.engine_id,
    sampleFileName: value.sample_file_name,
    createdAt: value.created_at,
    message: value.message,
    serverAnalysis: mapAnalysis(value.server_analysis),
  }
}

function mapJob(value: ApiVoiceCloneJob): VoiceCloneJob {
  return {
    id: value.id,
    profileId: value.profile_id,
    status: value.status,
    progress: value.progress,
    phase: value.phase,
    message: value.message,
    text: value.text,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
    firstAudioMs: value.first_audio_ms,
    durationSeconds: value.duration_seconds,
    audioUrl: resolveApiAssetUrl(value.audio_url),
    eventsUrl: resolveApiAssetUrl(value.events_url) ?? value.events_url,
    error: value.error,
    segments: value.segments.map((segment) => ({
      index: segment.index,
      text: segment.text,
      status: segment.status,
      progress: segment.progress,
      message: segment.message,
      error: segment.error,
      audioUrl: resolveApiAssetUrl(segment.audio_url),
    })),
  }
}

export async function getVoiceCloneCapability(
  baseUrl?: string,
  signal?: AbortSignal,
): Promise<VoiceCloneCapability> {
  const result = await apiRequest<ApiVoiceCloneCapability>(
    '/voice-clones/capabilities',
    undefined,
    { baseUrl, signal, timeoutMs: 8_000, retries: 1 },
  )
  return {
    engineId: result.engine_id,
    engineName: result.engine_name,
    ready: result.ready,
    reason: result.reason,
    recommendedSeconds: result.recommended_seconds,
    maxFileBytes: result.max_file_bytes,
    acceptedExtensions: result.accepted_extensions,
    workerVersion: result.worker_version,
    diagnostics: result.diagnostics,
  }
}

let capabilityCache: { value: VoiceCloneCapability; savedAt: number; baseUrl?: string } | null = null
let capabilityRequest: Promise<VoiceCloneCapability> | null = null

export async function getVoiceCloneCapabilityCached(options: {
  baseUrl?: string
  signal?: AbortSignal
  maxAgeMs?: number
  force?: boolean
} = {}): Promise<VoiceCloneCapability> {
  const maxAgeMs = options.maxAgeMs ?? 30_000
  const now = Date.now()
  const cacheAgeLimit = capabilityCache?.value.ready ? maxAgeMs : Math.min(maxAgeMs, 3_000)
  if (!options.force && capabilityCache
    && capabilityCache.baseUrl === options.baseUrl
    && now - capabilityCache.savedAt <= cacheAgeLimit) {
    return capabilityCache.value
  }
  if (!options.force && capabilityRequest && !options.signal) return capabilityRequest

  const request = getVoiceCloneCapability(options.baseUrl, options.signal).then((value) => {
    capabilityCache = { value, savedAt: Date.now(), baseUrl: options.baseUrl }
    return value
  })
  if (!options.signal) {
    capabilityRequest = request
    void request.finally(() => {
      if (capabilityRequest === request) capabilityRequest = null
    }).catch(() => undefined)
  }
  return request
}

export function invalidateVoiceCloneCapabilityCache(): void {
  capabilityCache = null
}

export async function prepareVoiceCloneProfile(input: {
  file: File
  profileId?: string
  displayName: string
  consent: VoiceCloneConsent
  analysis: VoiceSampleAnalysis
}): Promise<RemoteVoiceCloneProfile> {
  const form = new FormData()
  form.set('sample', input.file)
  if (input.profileId) form.set('client_profile_id', input.profileId)
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
  const result = await apiRequest<ApiVoiceCloneProfile>('/voice-clones/profiles', {
    method: 'POST',
    body: form,
  }, { timeoutMs: 45_000 })
  return mapProfile(result)
}

export async function getRemoteVoiceCloneProfile(
  profileId: string,
  signal?: AbortSignal,
): Promise<RemoteVoiceCloneProfile> {
  const result = await apiRequest<ApiVoiceCloneProfile>(
    `/voice-clones/profiles/${encodeURIComponent(profileId)}`,
    undefined,
    { timeoutMs: 8_000, signal },
  )
  return mapProfile(result)
}

export async function startVoiceCloneJob(
  profileId: string,
  text: string,
  signal?: AbortSignal,
): Promise<VoiceCloneJob> {
  const result = await apiRequest<ApiVoiceCloneJob>(
    `/voice-clones/profiles/${encodeURIComponent(profileId)}/jobs`,
    {
      method: 'POST',
      body: JSON.stringify({ text }),
    },
    { timeoutMs: 45_000, signal },
  )
  return mapJob(result)
}

export async function getVoiceCloneJob(jobId: string, signal?: AbortSignal): Promise<VoiceCloneJob> {
  const result = await apiRequest<ApiVoiceCloneJob>(
    `/voice-clones/jobs/${encodeURIComponent(jobId)}`,
    undefined,
    { timeoutMs: 8_000, signal },
  )
  return mapJob(result)
}

export async function cancelVoiceCloneJob(jobId: string): Promise<VoiceCloneJob> {
  const result = await apiRequest<ApiVoiceCloneJob>(
    `/voice-clones/jobs/${encodeURIComponent(jobId)}/cancel`,
    { method: 'POST' },
    { timeoutMs: 12_000 },
  )
  return mapJob(result)
}

export async function retryVoiceCloneJob(jobId: string): Promise<VoiceCloneJob> {
  const result = await apiRequest<ApiVoiceCloneJob>(
    `/voice-clones/jobs/${encodeURIComponent(jobId)}/retry`,
    { method: 'POST' },
    { timeoutMs: 12_000 },
  )
  return mapJob(result)
}

export async function deleteRemoteVoiceCloneProfile(profileId: string): Promise<void> {
  await apiRequest(`/voice-clones/profiles/${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
  })
}
