import { getSetupStatus } from '../settings/setupApi'
import type { VoicePresetDiagnostic } from '../settings/setupTypes'
import { getVoicePreset } from '../tts/voicePresets'

export const NEURAL_PREVIEW_ENGINE_ID = 'cosyvoice3'
export const NEURAL_REFERENCE_SCHEMA_VERSION = 4
const CATALOG_TTL_MS = 15_000

export interface NeuralPresetPreviewReadiness {
  voiceId: string
  displayName: string
  ready: boolean
  engineId: string | null
  modelId: string | null
  modelFingerprint: string | null
  referenceFingerprint: string | null
  cacheKey: string | null
  approvalId: string | null
  reason: string
}

export interface NeuralReferenceManifestTemplate {
  schema_version: 4
  voice_id: string
  display_name: string
  declared_gender: 'female' | 'male' | 'neutral'
  reference_file: string
  consent: {
    status: 'pending'
    subject_reference: string
    evidence_reference: string
    consented_at: null
    expires_at: null
    notes: string
  }
  rights: {
    source_type: 'unknown'
    source_reference: string
    allowed_uses: ['tts-inference']
    commercial_use: false
    redistribution: false
    training_use: false
    expires_at: null
    notes: string
  }
  integrity: {
    sha256: string
    file_size_bytes: null
  }
  human_review: {
    status: 'pending'
    reviewer: string
    reviewed_at: null
    sample_text: string
    audio_sha256: string
    source_review_bundle_sha256: string
    approval_id: string
    notes: string
  }
  neural_preview: {
    engine_id: typeof NEURAL_PREVIEW_ENGINE_ID
    model_id: string
    model_fingerprint: string
    reference_fingerprint: string
    notes: string
  }
  approval: {
    mode: 'unsigned'
    key_id: string
    signed_at: null
    signed_payload_sha256: string
    signature: string
  }
}

let cache: { expiresAt: number; items: NeuralPresetPreviewReadiness[] } | null = null
let inFlight: Promise<NeuralPresetPreviewReadiness[]> | null = null

function shortReason(diagnostic: VoicePresetDiagnostic): string {
  if (diagnostic.neuralPreviewReady) return '검증된 reference/model fingerprint가 연결되어 neural preview를 우선합니다.'
  if (!diagnostic.audioUsable) return '권리 확인된 reference WAV가 준비되지 않았습니다.'
  if (!diagnostic.manifestValid || diagnostic.manifestStatus !== 'ready') {
    return 'reference manifest의 동의·권리·사람 검수·SHA-256 승인이 완료되지 않았습니다.'
  }
  if ((diagnostic.schemaVersion ?? 0) < NEURAL_REFERENCE_SCHEMA_VERSION) {
    return 'manifest v4 model fingerprint가 없어 기기 음성을 유지합니다.'
  }
  if (!diagnostic.modelFingerprint) return 'neural model fingerprint가 없습니다.'
  if (!diagnostic.referenceFingerprint) return 'reference fingerprint가 없습니다.'
  if (diagnostic.referenceFingerprint !== diagnostic.actualSha256) {
    return 'reference fingerprint와 현재 WAV SHA-256가 다릅니다.'
  }
  if (diagnostic.neuralPreviewEngineId !== NEURAL_PREVIEW_ENGINE_ID) {
    return '현재 버전의 neural preview engine 계약과 다릅니다.'
  }
  return diagnostic.issues[0] ?? 'neural preview 검증이 아직 완료되지 않았습니다.'
}

export function mapNeuralPresetPreviewReadiness(
  diagnostic: VoicePresetDiagnostic,
): NeuralPresetPreviewReadiness {
  return {
    voiceId: diagnostic.voiceId,
    displayName: diagnostic.displayName,
    ready: Boolean(diagnostic.neuralPreviewReady && diagnostic.previewCacheKey),
    engineId: diagnostic.neuralPreviewReady ? diagnostic.neuralPreviewEngineId : null,
    modelId: diagnostic.modelId,
    modelFingerprint: diagnostic.modelFingerprint,
    referenceFingerprint: diagnostic.referenceFingerprint,
    cacheKey: diagnostic.previewCacheKey,
    approvalId: diagnostic.approvalId,
    reason: shortReason(diagnostic),
  }
}

export function primeNeuralPresetPreviewCatalog(
  diagnostics: VoicePresetDiagnostic[],
  ttlMs = CATALOG_TTL_MS,
): NeuralPresetPreviewReadiness[] {
  const items = diagnostics.map(mapNeuralPresetPreviewReadiness)
  cache = { expiresAt: Date.now() + Math.max(0, ttlMs), items }
  return items
}

export function getCachedNeuralPresetPreview(
  voiceId: string,
): NeuralPresetPreviewReadiness | null {
  if (!cache || cache.expiresAt < Date.now()) return null
  return cache.items.find((item) => item.voiceId === voiceId) ?? null
}

export async function refreshNeuralPresetPreviewCatalog(
  signal?: AbortSignal,
): Promise<NeuralPresetPreviewReadiness[]> {
  if (cache && cache.expiresAt >= Date.now()) return cache.items
  if (inFlight) return inFlight
  inFlight = getSetupStatus(undefined, signal)
    .then((setup) => primeNeuralPresetPreviewCatalog(setup.voicePresetDiagnostics))
    .finally(() => { inFlight = null })
  return inFlight
}

export function invalidateNeuralPresetPreviewCatalog(): void {
  cache = null
  inFlight = null
}

export function buildNeuralReferenceManifestTemplate(
  voiceId: string,
): NeuralReferenceManifestTemplate {
  const preset = getVoicePreset(voiceId)
  return {
    schema_version: NEURAL_REFERENCE_SCHEMA_VERSION,
    voice_id: preset.id,
    display_name: preset.name,
    declared_gender: preset.gender,
    reference_file: `${preset.id}.wav`,
    consent: {
      status: 'pending',
      subject_reference: '',
      evidence_reference: '',
      consented_at: null,
      expires_at: null,
      notes: '',
    },
    rights: {
      source_type: 'unknown',
      source_reference: '',
      allowed_uses: ['tts-inference'],
      commercial_use: false,
      redistribution: false,
      training_use: false,
      expires_at: null,
      notes: '',
    },
    integrity: {
      sha256: '',
      file_size_bytes: null,
    },
    human_review: {
      status: 'pending',
      reviewer: '',
      reviewed_at: null,
      sample_text: '',
      audio_sha256: '',
      source_review_bundle_sha256: '',
      approval_id: '',
      notes: '',
    },
    neural_preview: {
      engine_id: NEURAL_PREVIEW_ENGINE_ID,
      model_id: '',
      model_fingerprint: '',
      reference_fingerprint: '',
      notes: '원본 WAV나 동의 문서를 Git에 넣지 않고 fingerprint와 운영 증거만 기록합니다.',
    },
    approval: {
      mode: 'unsigned',
      key_id: '',
      signed_at: null,
      signed_payload_sha256: '',
      signature: '',
    },
  }
}

export function downloadNeuralReferenceManifestTemplate(voiceId: string): void {
  const payload = buildNeuralReferenceManifestTemplate(voiceId)
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${voiceId}.manifest.json`
  anchor.click()
  URL.revokeObjectURL(url)
}
