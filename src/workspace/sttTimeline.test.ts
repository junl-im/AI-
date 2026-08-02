import { describe, expect, it } from 'vitest'
import type { TimelineVoiceBlock } from './workspaceTypes'
import {
  applySttResultsToBlocks,
  prepareBlockForSttRegeneration,
} from './sttTimeline'

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
  jobId: 'job-1',
  durationSeconds: 3,
  status: 'ready',
  progress: 100,
  audio: null,
  trackId: 'track-1',
  error: null,
  revision: 1,
}

describe('STT selective regeneration timeline', () => {
  it('검수 실패를 대사 블록에 기록한다', () => {
    const [result] = applySttResultsToBlocks([block], [{
      segmentId: block.id,
      audioFilename: 'sample.wav',
      transcriptText: '결제 금액은 35,800원입니다.',
      characterErrorRate: 0.2,
      wordErrorRate: 0.25,
      realtimeFactor: 0.5,
      needsRegeneration: true,
      regenerationAllowed: true,
      reasons: ['critical_token:money'],
    }])

    expect(result.kind).toBe('voice')
    if (result.kind !== 'voice') throw new Error('voice block expected')
    expect(result.sttVerification?.status).toBe('failed')
    expect(result.sttVerification?.reasons).toEqual(['critical_token:money'])
  })

  it('재생성 전에 기존 job과 음원 연결을 지우고 횟수를 올린다', () => {
    const prepared = prepareBlockForSttRegeneration({
      ...block,
      sttVerification: {
        status: 'failed',
        transcriptText: '오류',
        characterErrorRate: 0.3,
        wordErrorRate: 0.4,
        reasons: ['word_error_rate'],
        regenerationAttempts: 1,
      },
    })

    expect(prepared.jobId).toBeNull()
    expect(prepared.trackId).toBeNull()
    expect(prepared.audio).toBeNull()
    expect(prepared.revision).toBe(2)
    expect(prepared.sttVerification?.status).toBe('unchecked')
    expect(prepared.sttVerification?.regenerationAttempts).toBe(2)
  })
})
