import { apiRequest } from '../api/httpClient'

export const VOICE_REVIEW_OPERATOR_TOKEN_SESSION_KEY = 'sorion.voice-review.operator-token'

export function loadVoiceReviewOperatorToken(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.sessionStorage.getItem(VOICE_REVIEW_OPERATOR_TOKEN_SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveVoiceReviewOperatorToken(value: string): void {
  if (typeof window === 'undefined') return
  try {
    const normalized = value.trim()
    if (normalized) window.sessionStorage.setItem(VOICE_REVIEW_OPERATOR_TOKEN_SESSION_KEY, normalized)
    else window.sessionStorage.removeItem(VOICE_REVIEW_OPERATOR_TOKEN_SESSION_KEY)
  } catch {
    // Private browsing or browser policy can disable sessionStorage.
  }
}

function operatorHeaders(operatorToken: string): HeadersInit | undefined {
  const normalized = operatorToken.trim()
  return normalized ? { 'X-SoriON-Operator-Token': normalized } : undefined
}

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
  event: 'approved' | 'rolled-back' | 're-signed'
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
  event: 'approved' | 'rolled-back' | 're-signed'
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

export async function previewVoicePresetApproval(
  input: VoicePresetApprovalInput,
  operatorToken = '',
): Promise<VoicePresetApprovalPreview> {
  const value = await apiRequest<VoicePresetApprovalPreviewResponse>('/quality/voice-preset-approvals/preview', {
    method: 'POST',
    headers: operatorHeaders(operatorToken),
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

export async function applyVoicePresetApproval(
  input: VoicePresetApprovalInput,
  previewId: string,
  operatorToken = '',
) {
  const value = await apiRequest<VoicePresetApprovalMutationResponse>('/quality/voice-preset-approvals/apply', {
    method: 'POST',
    headers: operatorHeaders(operatorToken),
    body: JSON.stringify({ ...payload(input), preview_id: previewId, confirmation: '현재 WAV 승인' }),
  })
  return { record: mapRecord(value.record), manifest: value.manifest as Record<string, unknown> }
}

export async function listVoicePresetApprovalHistory(
  operatorToken = '',
): Promise<VoicePresetApprovalRecord[]> {
  const value = await apiRequest<VoicePresetApprovalRecordResponse[]>(
    '/quality/voice-preset-approvals/history?limit=100',
    { headers: operatorHeaders(operatorToken) },
  )
  return value.map(mapRecord)
}

export async function rollbackVoicePresetApproval(
  approvalId: string,
  reason: string,
  operatorToken = '',
) {
  const value = await apiRequest<VoicePresetApprovalMutationResponse>(`/quality/voice-preset-approvals/${encodeURIComponent(approvalId)}/rollback`, {
    method: 'POST',
    headers: operatorHeaders(operatorToken),
    body: JSON.stringify({ confirmation: '승인 롤백', reason }),
  })
  return { record: mapRecord(value.record), manifest: value.manifest as Record<string, unknown> }
}


export interface VoicePresetRenewalItem {
  voiceId: string
  displayName: string
  priority: 'blocked' | 'urgent' | 'soon' | 'rotation'
  reasons: string[]
  manifestSha256: string | null
  audioSha256: string | null
  consentExpiresAt: string | null
  rightsExpiresAt: string | null
  consentDaysRemaining: number | null
  rightsDaysRemaining: number | null
  currentKeyId: string | null
  activeKeyId: string | null
  canResign: boolean
}

export interface VoicePresetRenewalQueue {
  generatedAt: string
  warningDays: number
  activeKeyId: string | null
  trustedKeyIds: string[]
  items: VoicePresetRenewalItem[]
}

interface VoicePresetRenewalQueueResponse {
  generated_at: string
  warning_days: number
  active_key_id?: string | null
  trusted_key_ids?: string[]
  items?: Array<{
    voice_id: string
    display_name: string
    priority: 'blocked' | 'urgent' | 'soon' | 'rotation'
    reasons?: string[]
    manifest_sha256?: string | null
    audio_sha256?: string | null
    consent_expires_at?: string | null
    rights_expires_at?: string | null
    consent_days_remaining?: number | null
    rights_days_remaining?: number | null
    current_key_id?: string | null
    active_key_id?: string | null
    can_resign?: boolean
  }>
}

export interface VoicePresetResignPreview {
  previewId: string
  voiceId: string
  currentManifestSha256: string
  proposedManifestSha256: string
  currentKeyId: string | null
  activeKeyId: string
  resignedAt: string
  changes: VoicePresetApprovalDiff[]
  blockingIssues: string[]
  canApply: boolean
}

interface VoicePresetResignPreviewResponse {
  preview_id: string
  voice_id: string
  current_manifest_sha256: string
  proposed_manifest_sha256: string
  current_key_id?: string | null
  active_key_id: string
  resigned_at: string
  changes?: Array<{ path: string; before: unknown; after: unknown }>
  blocking_issues?: string[]
  can_apply: boolean
}

export async function listVoicePresetRenewals(
  operatorToken = '',
  warningDays = 60,
): Promise<VoicePresetRenewalQueue> {
  const value = await apiRequest<VoicePresetRenewalQueueResponse>(
    `/quality/voice-preset-approvals/renewals?days=${encodeURIComponent(String(warningDays))}`,
    { headers: operatorHeaders(operatorToken) },
  )
  return {
    generatedAt: value.generated_at,
    warningDays: value.warning_days,
    activeKeyId: value.active_key_id ?? null,
    trustedKeyIds: value.trusted_key_ids ?? [],
    items: (value.items ?? []).map((item) => ({
      voiceId: item.voice_id,
      displayName: item.display_name,
      priority: item.priority,
      reasons: item.reasons ?? [],
      manifestSha256: item.manifest_sha256 ?? null,
      audioSha256: item.audio_sha256 ?? null,
      consentExpiresAt: item.consent_expires_at ?? null,
      rightsExpiresAt: item.rights_expires_at ?? null,
      consentDaysRemaining: item.consent_days_remaining ?? null,
      rightsDaysRemaining: item.rights_days_remaining ?? null,
      currentKeyId: item.current_key_id ?? null,
      activeKeyId: item.active_key_id ?? null,
      canResign: item.can_resign ?? false,
    })),
  }
}

export async function previewVoicePresetResign(
  voiceId: string,
  expectedManifestSha256: string | null,
  operatorToken = '',
): Promise<VoicePresetResignPreview> {
  const value = await apiRequest<VoicePresetResignPreviewResponse>('/quality/voice-preset-approvals/resign/preview', {
    method: 'POST',
    headers: operatorHeaders(operatorToken),
    body: JSON.stringify({
      voice_id: voiceId,
      expected_manifest_sha256: expectedManifestSha256,
      resigned_at: new Date().toISOString(),
    }),
  })
  return {
    previewId: value.preview_id,
    voiceId: value.voice_id,
    currentManifestSha256: value.current_manifest_sha256,
    proposedManifestSha256: value.proposed_manifest_sha256,
    currentKeyId: value.current_key_id ?? null,
    activeKeyId: value.active_key_id,
    resignedAt: value.resigned_at,
    changes: (value.changes ?? []).map((item) => ({ path: item.path, before: item.before, after: item.after })),
    blockingIssues: value.blocking_issues ?? [],
    canApply: value.can_apply,
  }
}

export async function applyVoicePresetResign(
  preview: VoicePresetResignPreview,
  operatorToken = '',
) {
  const value = await apiRequest<VoicePresetApprovalMutationResponse>('/quality/voice-preset-approvals/resign/apply', {
    method: 'POST',
    headers: operatorHeaders(operatorToken),
    body: JSON.stringify({
      voice_id: preview.voiceId,
      expected_manifest_sha256: preview.currentManifestSha256,
      resigned_at: preview.resignedAt,
      preview_id: preview.previewId,
      confirmation: '현재 키로 재서명',
    }),
  })
  return { record: mapRecord(value.record), manifest: value.manifest as Record<string, unknown> }
}
