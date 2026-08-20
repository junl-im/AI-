import { describe, expect, it } from 'vitest'
import type { VoicePresetDiagnostic } from '../settings/setupTypes'
import {
  buildNeuralReferenceManifestTemplate,
  mapNeuralPresetPreviewReadiness,
} from './neuralVoiceReference'

function diagnostic(overrides: Partial<VoicePresetDiagnostic> = {}): VoicePresetDiagnostic {
  return {
    voiceId: 'sori-warm',
    displayName: '혜린',
    declaredGender: 'female',
    filename: 'sori-warm.wav',
    manifestFilename: 'sori-warm.manifest.json',
    schemaVersion: 4,
    status: 'ready',
    usable: true,
    audioUsable: true,
    manifestStatus: 'ready',
    manifestValid: true,
    consentStatus: 'confirmed',
    humanReviewStatus: 'approved',
    sourceType: 'licensed',
    allowedUses: ['tts-inference'],
    declaredSha256: 'a'.repeat(64),
    actualSha256: 'a'.repeat(64),
    checksumMatches: true,
    reviewAudioSha256: 'a'.repeat(64),
    reviewChecksumMatches: true,
    approvalId: 'apr-test',
    signatureMode: 'unsigned',
    signingKeyId: null,
    signatureStatus: 'unsigned',
    signedPayloadSha256: 'b'.repeat(64),
    neuralPreviewEngineId: 'cosyvoice3',
    modelId: 'cosyvoice3-korean-preset',
    modelFingerprint: 'c'.repeat(64),
    referenceFingerprint: 'a'.repeat(64),
    neuralPreviewReady: true,
    previewCacheKey: 'd'.repeat(64),
    consentExpiresAt: null,
    rightsExpiresAt: null,
    consentDaysRemaining: null,
    rightsDaysRemaining: null,
    duplicateVoiceIds: [],
    durationSeconds: 8,
    sampleRate: 24000,
    channelCount: 1,
    sampleWidthBits: 16,
    silenceRatio: 0.1,
    clippingRatio: 0,
    issues: [],
    ...overrides,
  }
}

describe('neuralVoiceReference', () => {
  it('v4 fingerprint와 cache key가 모두 검증된 preset만 neural preview ready로 만든다', () => {
    expect(mapNeuralPresetPreviewReadiness(diagnostic())).toMatchObject({
      voiceId: 'sori-warm',
      ready: true,
      engineId: 'cosyvoice3',
      cacheKey: 'd'.repeat(64),
    })
    expect(mapNeuralPresetPreviewReadiness(diagnostic({ neuralPreviewReady: false }))).toMatchObject({
      ready: false,
      engineId: null,
    })
  })

  it('혜린 intake template은 v4와 rights-safe neural fingerprint 자리를 제공한다', () => {
    const template = buildNeuralReferenceManifestTemplate('sori-warm')
    expect(template).toMatchObject({
      schema_version: 4,
      voice_id: 'sori-warm',
      display_name: '혜린',
      reference_file: 'sori-warm.wav',
      neural_preview: { engine_id: 'cosyvoice3' },
    })
    expect(template.rights.allowed_uses).toEqual(['tts-inference'])
    expect(template.integrity.sha256).toBe('')
    expect(template.neural_preview.model_fingerprint).toBe('')
  })
})
