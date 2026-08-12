import { describe, expect, it } from 'vitest'
import type { GeneratedAudio } from '../tts/generationTypes'
import { buildEngineRoutingTrace, formatEngineRoutingTrace } from './engineRoutingTrace'

function result(blockId: string, engineId: string, fallbackUsed = false): { audio: GeneratedAudio } {
  return {
    audio: {
      url: null,
      filename: `${blockId}.wav`,
      source: 'browser-demo',
      durationSeconds: 1,
      result: {
        jobId: blockId,
        status: 'completed',
        engineId,
        engineMode: 'local',
        audioUrl: null,
        estimatedDurationSeconds: 1,
        message: 'ok',
        normalizedText: null,
        segmentCount: 1,
        processingMs: 10,
        fileSizeBytes: 10,
        realtimeFactor: 0.1,
        attemptedEngineIds: fallbackUsed ? ['primary', engineId] : [engineId],
        fallbackUsed,
      },
    },
  }
}

describe('engine routing trace', () => {
  it('실제 완료 순서에서 엔진 분산·전환·fallback을 집계한다', () => {
    const trace = buildEngineRoutingTrace([
      result('a', 'primary'),
      result('b', 'backup'),
      result('c', 'backup', true),
      result('d', 'primary'),
    ])
    expect(trace.engineUsage).toEqual([
      { engineId: 'backup', count: 2 },
      { engineId: 'primary', count: 2 },
    ])
    expect(trace.engineSwitchCount).toBe(2)
    expect(trace.fallbackCount).toBe(1)
    expect(trace.attemptedEngineCount).toBe(2)
    expect(formatEngineRoutingTrace(trace)).toContain('자동 분산 2개 엔진')
  })
})
