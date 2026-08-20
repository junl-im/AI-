import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TtsSynthesisResult } from '../ai/contracts'
import {
  clearNeuralVoiceRuntimeRecords,
  importNeuralVoiceRuntimeRecords,
  listNeuralVoiceRuntimeRecords,
  recordNeuralVoicePlaybackCompleted,
  recordNeuralVoicePlaybackStarted,
} from './neuralVoiceRuntimeCertification'

function result(): TtsSynthesisResult {
  return {
    jobId: 'neural-preview-test',
    status: 'completed',
    engineId: 'cosyvoice3',
    engineMode: 'ai',
    audioUrl: 'https://example.test/audio.wav',
    estimatedDurationSeconds: 1.5,
    message: 'ok',
    normalizedText: '테스트',
    segmentCount: 1,
    firstAudioMs: 250,
    processingMs: 700,
    fileSizeBytes: 1200,
    realtimeFactor: null,
    fallbackUsed: false,
    neuralPreview: {
      voiceId: 'sori-warm',
      cacheId: 'a'.repeat(64),
      cacheHit: true,
      previewCacheKey: 'b'.repeat(64),
      textSha256: 'c'.repeat(64),
      styleSha256: 'd'.repeat(64),
      audioSha256: 'e'.repeat(64),
      modelFingerprint: 'f'.repeat(64),
      referenceFingerprint: '1'.repeat(64),
      generatedAt: '2026-08-20T00:00:00.000Z',
      runtimeCertified: true,
    },
  }
}

describe('neural voice runtime certification', () => {
  beforeEach(() => {
    clearNeuralVoiceRuntimeRecords()
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    })
  })

  it('records observed playback start and completion without raw text/audio', () => {
    const value = result()
    recordNeuralVoicePlaybackStarted(value)
    recordNeuralVoicePlaybackCompleted(value)
    const records = listNeuralVoiceRuntimeRecords()
    expect(records).toHaveLength(1)
    expect(records[0].playbackStartedAt).toBeTruthy()
    expect(records[0].playbackCompletedAt).toBeTruthy()
    expect(records[0].audioSha256).toBe('e'.repeat(64))
    expect(JSON.stringify(records[0])).not.toContain('테스트')
    expect(JSON.stringify(records[0])).not.toContain('https://example.test')
  })

  it('rejects synthetic or malformed imported runtime evidence', () => {
    expect(() => importNeuralVoiceRuntimeRecords({
      records: [{ ...result().neuralPreview, synthetic: true }],
    })).toThrow('유효한 observed-runtime')
  })
})
