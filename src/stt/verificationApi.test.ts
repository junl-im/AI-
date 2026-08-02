import { describe, expect, it } from 'vitest'
import type { TimelineVoiceBlock } from '../workspace/workspaceTypes'
import { buildSttComparisonRequests, type SttBatchVerificationResult } from './verificationApi'

const block: TimelineVoiceBlock = {
  id: 'segment-1',
  kind: 'voice',
  text: '결제 금액은 38,500원입니다.',
  voiceId: 'sori-warm',
  voiceName: '소리',
  emotion: 'neutral',
  speed: 1,
  pitch: 0,
  normalizeText: true,
  jobId: 'job-2',
  durationSeconds: 3,
  status: 'ready',
  progress: 100,
  audio: null,
  trackId: 'track-2',
  error: null,
  revision: 2,
  sttVerification: {
    status: 'unchecked',
    transcriptText: '결제 금액은 35,800원입니다.',
    characterErrorRate: 0.2,
    wordErrorRate: 0.25,
    reasons: ['critical_token:money'],
    regenerationAttempts: 1,
  },
}

const report: SttBatchVerificationResult = {
  engineId: 'faster-whisper',
  modelId: 'small',
  deviceProfile: 'cuda',
  results: [{
    segmentId: block.id,
    audioFilename: 'regenerated.wav',
    transcriptText: '결제 금액은 38,500원입니다.',
    characterErrorRate: 0,
    wordErrorRate: 0,
    realtimeFactor: 0.2,
    needsRegeneration: false,
    regenerationAllowed: false,
    reasons: [],
  }],
  regenerationSegmentIds: [],
  blockedSegmentIds: [],
  processingSeconds: 1,
}

describe('STT regeneration evidence', () => {
  it('재생성 전후 전사문을 같은 문장 ID로 묶는다', () => {
    expect(buildSttComparisonRequests([block], report)).toEqual([{
      segment_id: 'segment-1',
      reference_text: block.text,
      before_transcript: '결제 금액은 35,800원입니다.',
      after_transcript: '결제 금액은 38,500원입니다.',
      engine_id: 'faster-whisper',
      model_id: 'small',
      device_profile: 'cuda',
    }])
  })

  it('재생성 전 기록이 없으면 증거를 만들지 않는다', () => {
    expect(buildSttComparisonRequests([{ ...block, sttVerification: undefined }], report)).toEqual([])
  })
})
