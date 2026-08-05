import { apiRequest } from '../api/httpClient'

export interface VoicePresetApprovalInput {
  voiceId: string
  reviewer: string
  sampleText: string
  reviewBundleSha256: string
  expectedAudioSha256: string
  expectedManifestSha256?: string | null
  reviewedAt: string
  notes: string
}

export interface VoicePresetApprovalDiff {
  path: string
  before: unknown
  after: unknown
}

export interface VoicePresetApprovalPreview {
  previewId: string
  approvalId: string
  voiceId: string
  currentAudioSha256: string
  currentManifestSha256: string
  proposedManifestSha256: string
  proposedManifest: Record<string, unknown>
  changes: VoicePresetApprovalDiff[]
  blockingIssues: string[]
  warnings: string[]
  duplicateVoiceIds: string[]
  signatureMode: 'unsigned' | 'hmac-sha256'
  signingKeyId: string | null
  canApply: boolean
}

export interface VoicePresetApprovalRecord {
  approvalId: string
  event: 'approved' | 'rolled-back'
  voiceId: string
  actor: string
  reviewer: string
  at: string
  audioSha256: string
  beforeManifestSha256: string
  afterManifestSha256: string
  reviewBundleSha256: string
  signatureMode: 'unsigned' | 'hmac-sha256'
  signingKeyId: string | null
  signedPayloadSha256: string | null
  signature: string | null
  relatedApprovalId: string | null
}

function payload(input: VoicePresetApprovalInput) {
  return {
    voice_id: input.voiceId,
    reviewer: input.reviewer,
    sample_text: input.sampleText,
    review_bundle_sha256: input.reviewBundleSha256,
    expected_audio_sha256: input.expectedAudioSha256,
    expected_manifest_sha256: input.expectedManifestSha256 ?? null,
    reviewed_at: input.reviewedAt,
    notes: input.notes,
  }
}

interface VoicePresetApprovalRecordResponse {
  approval_id: string
  event: 'approved' | 'rolled-back'
  voice_id: string
  actor: string
  reviewer: string
  at: string
  audio_sha256: string
  before_manifest_sha256: string
  after_manifest_sha256: string
  review_bundle_sha256: string
  signature_mode: 'unsigned' | 'hmac-sha256'
  signing_key_id?: string | null
  signed_payload_sha256?: string | null
  signature?: string | null
  related_approval_id?: string | null
}

interface VoicePresetApprovalPreviewResponse {
  preview_id: string
  approval_id: string
  voice_id: string
  current_audio_sha256: string
  current_manifest_sha256: string
  proposed_manifest_sha256: string
  proposed_manifest: Record<string, unknown>
  changes?: Array<{ path: string; before: unknown; after: unknown }>
  blocking_issues?: string[]
  warnings?: string[]
  duplicate_voice_ids?: string[]
  signature_mode: 'unsigned' | 'hmac-sha256'
  signing_key_id?: string | null
  can_apply: boolean
}

interface VoicePresetApprovalMutationResponse {
  record: VoicePresetApprovalRecordResponse
  manifest: Record<string, unknown>
}

function mapRecord(value: VoicePresetApprovalRecordResponse): VoicePresetApprovalRecord {
  return {
    approvalId: value.approval_id,
    event: value.event,
    voiceId: value.voice_id,
    actor: value.actor,
    reviewer: value.reviewer,
    at: value.at,
    audioSha256: value.audio_sha256,
    beforeManifestSha256: value.before_manifest_sha256,
    afterManifestSha256: value.after_manifest_sha256,
    reviewBundleSha256: value.review_bundle_sha256,
    signatureMode: value.signature_mode,
    signingKeyId: value.signing_key_id ?? null,
    signedPayloadSha256: value.signed_payload_sha256 ?? null,
    signature: value.signature ?? null,
    relatedApprovalId: value.related_approval_id ?? null,
  }
}

export async function previewVoicePresetApproval(input: VoicePresetApprovalInput): Promise<VoicePresetApprovalPreview> {
  const value = await apiRequest<VoicePresetApprovalPreviewResponse>('/quality/voice-preset-approvals/preview', {
    method: 'POST',
    body: JSON.stringify(payload(input)),
  })
  return {
    previewId: value.preview_id,
    approvalId: value.approval_id,
    voiceId: value.voice_id,
    currentAudioSha256: value.current_audio_sha256,
    currentManifestSha256: value.current_manifest_sha256,
    proposedManifestSha256: value.proposed_manifest_sha256,
    proposedManifest: value.proposed_manifest,
    changes: (value.changes ?? []).map((item) => ({ path: item.path, before: item.before, after: item.after })),
    blockingIssues: value.blocking_issues ?? [],
    warnings: value.warnings ?? [],
    duplicateVoiceIds: value.duplicate_voice_ids ?? [],
    signatureMode: value.signature_mode,
    signingKeyId: value.signing_key_id ?? null,
    canApply: value.can_apply,
  }
}

export async function applyVoicePresetApproval(input: VoicePresetApprovalInput, previewId: string) {
  const value = await apiRequest<VoicePresetApprovalMutationResponse>('/quality/voice-preset-approvals/apply', {
    method: 'POST',
    body: JSON.stringify({ ...payload(input), preview_id: previewId, confirmation: '현재 WAV 승인' }),
  })
  return { record: mapRecord(value.record), manifest: value.manifest as Record<string, unknown> }
}

export async function listVoicePresetApprovalHistory(): Promise<VoicePresetApprovalRecord[]> {
  const value = await apiRequest<VoicePresetApprovalRecordResponse[]>('/quality/voice-preset-approvals/history?limit=100')
  return value.map(mapRecord)
}

export async function rollbackVoicePresetApproval(approvalId: string, reason: string) {
  const value = await apiRequest<VoicePresetApprovalMutationResponse>(`/quality/voice-preset-approvals/${encodeURIComponent(approvalId)}/rollback`, {
    method: 'POST',
    body: JSON.stringify({ confirmation: '승인 롤백', reason }),
  })
  return { record: mapRecord(value.record), manifest: value.manifest as Record<string, unknown> }
}
