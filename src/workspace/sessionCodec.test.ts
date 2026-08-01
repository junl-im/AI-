import { describe, expect, it } from 'vitest'
import {
  createWorkspaceSession,
  hasMeaningfulWorkspaceSession,
  normalizeWorkspaceSession,
} from './sessionCodec'

function sessionDraft() {
  return {
    workspaceEntered: true,
    page: 'home' as const,
    projectTitle: '새 프로젝트',
    voiceId: 'sori-warm',
    speechSpeed: 1,
    speechPitch: 0,
    speechEmotion: 'neutral' as const,
    composerDraft: '전송 전 문장',
    directiveIds: ['numbers'] as Array<'numbers'>,
    messages: [{ id: 'welcome', role: 'assistant' as const, text: '안녕하세요.' }],
    blocks: [{
      id: 'voice-1',
      kind: 'voice' as const,
      text: '저장 문장',
      voiceId: 'sori-warm',
      voiceName: '혜린',
      emotion: 'neutral' as const,
      speed: 1,
      pitch: 0,
      engineId: 'auto',
      normalizeText: true,
      jobId: 'job-1',
      durationSeconds: 2,
      status: 'ready' as const,
      progress: 100,
      audio: {
        url: 'blob:temporary',
        filename: 'voice.wav',
        source: 'api' as const,
        durationSeconds: 2,
        result: {
          jobId: 'job-1',
          status: 'completed' as const,
          engineId: 'system',
          engineMode: 'local' as const,
          audioUrl: '/result.wav',
          estimatedDurationSeconds: 2,
          message: 'done',
          normalizedText: null,
          segmentCount: 1,
          processingMs: 10,
          fileSizeBytes: 100,
          realtimeFactor: 0.1,
        },
      },
      trackId: 'track-1',
      error: null,
      revision: 4,
    }],
  }
}

describe('workspace session codec', () => {
  it('stores only serializable timeline data and preserves revisions', () => {
    const session = createWorkspaceSession(sessionDraft(), 7)
    const voice = session.blocks[0]

    expect(session.revision).toBe(7)
    expect(session.composerDraft).toBe('전송 전 문장')
    expect(voice).toMatchObject({ jobId: 'job-1', revision: 4 })
    expect(voice).not.toHaveProperty('audio')
    expect(voice).not.toHaveProperty('trackId')
  })


  it('keeps a long-form draft up to the studio limit', () => {
    const draft = '가'.repeat(20_000)
    const session = createWorkspaceSession({ ...sessionDraft(), composerDraft: draft }, 2)

    expect(session.composerDraft).toHaveLength(20_000)
    expect(normalizeWorkspaceSession(session)?.composerDraft).toHaveLength(20_000)
  })

  it('restores an entered empty workspace and non-default composer options', () => {
    const entered = createWorkspaceSession({
      ...sessionDraft(),
      composerDraft: '',
      messages: [],
      blocks: [],
    }, 1)
    const optionOnly = {
      ...entered,
      workspaceEntered: false,
      directiveIds: ['bright'] as Array<'bright'>,
    }

    expect(hasMeaningfulWorkspaceSession(entered)).toBe(true)
    expect(hasMeaningfulWorkspaceSession(optionOnly)).toBe(true)
  })

  it('rejects expired or incompatible records', () => {
    const session = createWorkspaceSession(sessionDraft(), 1)
    expect(normalizeWorkspaceSession({ ...session, schemaVersion: 999 })).toBeNull()
    expect(normalizeWorkspaceSession({
      ...session,
      savedAt: new Date('2020-01-01T00:00:00.000Z').toISOString(),
    })).toBeNull()
  })
})
