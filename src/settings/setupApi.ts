import { apiRequest } from '../api/httpClient'
import type { SetupStatus } from './setupTypes'

interface ApiSetupStep {
  id: string
  label: string
  status: SetupStatus['steps'][number]['status']
  required: boolean
  detail: string
  action: string | null
}

interface ApiVoicePresetDiagnostic {
  voice_id: string
  display_name?: string
  declared_gender?: string
  filename: string
  manifest_filename?: string
  schema_version?: number | null
  status: SetupStatus['voicePresetDiagnostics'][number]['status']
  usable: boolean
  audio_usable?: boolean
  manifest_status?: SetupStatus['voicePresetDiagnostics'][number]['manifestStatus']
  manifest_valid?: boolean
  consent_status?: string
  human_review_status?: string
  source_type?: string
  allowed_uses?: string[]
  declared_sha256?: string | null
  actual_sha256?: string | null
  checksum_matches?: boolean | null
  review_audio_sha256?: string | null
  review_checksum_matches?: boolean | null
  approval_id?: string | null
  signature_mode?: string
  signing_key_id?: string | null
  signature_status?: string
  signed_payload_sha256?: string | null
  neural_preview_engine_id?: string | null
  model_id?: string | null
  model_fingerprint?: string | null
  reference_fingerprint?: string | null
  neural_preview_ready?: boolean
  preview_cache_key?: string | null
  consent_expires_at?: string | null
  rights_expires_at?: string | null
  consent_days_remaining?: number | null
  rights_days_remaining?: number | null
  duplicate_voice_ids?: string[]
  duration_seconds: number | null
  sample_rate: number | null
  channel_count: number | null
  sample_width_bits: number | null
  silence_ratio: number | null
  clipping_ratio: number | null
  issues: string[]
}


interface ApiVoiceSelectionDiagnostic {
  engine_id: string
  engine_name: string
  voice_id: string
  display_name: string
  expected_gender: string
  status: SetupStatus['voiceSelectionDiagnostics'][number]['status']
  selected_voice_id: string | null
  selected_voice_name: string | null
  selected_gender: string | null
  selection_basis: string
  reason: string
}

interface ApiSetupStatus {
  version: string
  ready: boolean
  real_engine_count: number
  voice_preset_ready_count?: number
  voice_preset_audio_ready_count?: number
  voice_preset_manifest_ready_count?: number
  voice_preset_expected_count?: number
  voice_preset_duplicate_group_count?: number
  voice_preset_diagnostics?: ApiVoicePresetDiagnostic[]
  voice_selection_diagnostics?: ApiVoiceSelectionDiagnostic[]
  steps: ApiSetupStep[]
}

export async function getSetupStatus(baseUrl?: string, signal?: AbortSignal): Promise<SetupStatus> {
  const result = await apiRequest<ApiSetupStatus>('/setup', undefined, {
    baseUrl,
    signal,
    timeoutMs: 8_000,
    retries: 1,
  })
  return {
    version: result.version,
    ready: result.ready,
    realEngineCount: result.real_engine_count,
    voicePresetReadyCount: result.voice_preset_ready_count ?? 0,
    voicePresetAudioReadyCount: result.voice_preset_audio_ready_count ?? 0,
    voicePresetManifestReadyCount: result.voice_preset_manifest_ready_count ?? 0,
    voicePresetExpectedCount: result.voice_preset_expected_count ?? 5,
    voicePresetDuplicateGroupCount: result.voice_preset_duplicate_group_count ?? 0,
    voicePresetDiagnostics: (result.voice_preset_diagnostics ?? []).map((item) => ({
      voiceId: item.voice_id,
      displayName: item.display_name ?? item.voice_id,
      declaredGender: item.declared_gender ?? 'unknown',
      filename: item.filename,
      manifestFilename: item.manifest_filename ?? `${item.voice_id}.manifest.json`,
      schemaVersion: item.schema_version ?? null,
      status: item.status,
      usable: item.usable,
      audioUsable: item.audio_usable ?? item.usable,
      manifestStatus: item.manifest_status ?? 'missing',
      manifestValid: item.manifest_valid ?? false,
      consentStatus: item.consent_status ?? 'missing',
      humanReviewStatus: item.human_review_status ?? 'missing',
      sourceType: item.source_type ?? 'unknown',
      allowedUses: item.allowed_uses ?? [],
      declaredSha256: item.declared_sha256 ?? null,
      actualSha256: item.actual_sha256 ?? null,
      checksumMatches: item.checksum_matches ?? null,
      reviewAudioSha256: item.review_audio_sha256 ?? null,
      reviewChecksumMatches: item.review_checksum_matches ?? null,
      approvalId: item.approval_id ?? null,
      signatureMode: item.signature_mode ?? 'unsigned',
      signingKeyId: item.signing_key_id ?? null,
      signatureStatus: item.signature_status ?? 'missing',
      signedPayloadSha256: item.signed_payload_sha256 ?? null,
      neuralPreviewEngineId: item.neural_preview_engine_id ?? null,
      modelId: item.model_id ?? null,
      modelFingerprint: item.model_fingerprint ?? null,
      referenceFingerprint: item.reference_fingerprint ?? null,
      neuralPreviewReady: item.neural_preview_ready ?? false,
      previewCacheKey: item.preview_cache_key ?? null,
      consentExpiresAt: item.consent_expires_at ?? null,
      rightsExpiresAt: item.rights_expires_at ?? null,
      consentDaysRemaining: item.consent_days_remaining ?? null,
      rightsDaysRemaining: item.rights_days_remaining ?? null,
      duplicateVoiceIds: item.duplicate_voice_ids ?? [],
      durationSeconds: item.duration_seconds,
      sampleRate: item.sample_rate,
      channelCount: item.channel_count,
      sampleWidthBits: item.sample_width_bits,
      silenceRatio: item.silence_ratio,
      clippingRatio: item.clipping_ratio,
      issues: item.issues,
    })),
    voiceSelectionDiagnostics: (result.voice_selection_diagnostics ?? []).map((item) => ({
      engineId: item.engine_id,
      engineName: item.engine_name,
      voiceId: item.voice_id,
      displayName: item.display_name,
      expectedGender: item.expected_gender,
      status: item.status,
      selectedVoiceId: item.selected_voice_id,
      selectedVoiceName: item.selected_voice_name,
      selectedGender: item.selected_gender,
      selectionBasis: item.selection_basis,
      reason: item.reason,
    })),
    steps: result.steps,
  }
}
