import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelVoiceCloneJob,
  getVoiceCloneJob,
  startVoiceCloneJob,
} from './voiceCloneApi'
import { synthesizeVoiceCloneProfile } from './voiceCloneSynthesis'
import type { VoiceCloneJob } from './voiceCloneTypes'

vi.mock('./voiceCloneApi', () => ({
  cancelVoiceCloneJob: vi.fn(),
  getVoiceCloneJob: vi.fn(),
  startVoiceCloneJob: vi.fn(),
}))

function completedJob(overrides: Partial<VoiceCloneJob> = {}): VoiceCloneJob {
  return {
    id: 'clone-job-1',
    profileId: 'profile-1',
    status: 'completed',
    progress: 100,
    phase: 'completed',
    message: '완료',
    text: '안녕하세요.',
    createdAt: '2026-08-13T00:00:00.000Z',
    updatedAt: '2026-08-13T00:00:01.000Z',
    firstAudioMs: 420,
    durationSeconds: 2.4,
    audioUrl: 'https://example.com/clone.wav',
    eventsUrl: 'https://example.com/events',
    error: null,
    segments: [{
      index: 0,
      text: '안녕하세요.',
      status: 'completed',
      progress: 100,
      message: '완료',
      error: null,
      audioUrl: 'https://example.com/clone-0.wav',
    }],
    ...overrides,
  }
}

describe('synthesizeVoiceCloneProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('새 MY VOICE job을 실제 TTS 결과 계약으로 연결한다', async () => {
    vi.mocked(startVoiceCloneJob).mockResolvedValue(completedJob())

    const onJobId = vi.fn()
    const result = await synthesizeVoiceCloneProfile({
      profileId: 'profile-1',
      text: '안녕하세요.',
      onJobId,
    })

    expect(startVoiceCloneJob).toHaveBeenCalledWith('profile-1', '안녕하세요.')
    expect(onJobId).toHaveBeenCalledWith('clone-job-1')
    expect(result).toMatchObject({
      jobId: 'clone-job-1',
      status: 'completed',
      engineId: 'cosyvoice3-worker',
      audioUrl: 'https://example.com/clone.wav',
      segmentCount: 1,
    })
  })

  it('기존 완료 job이 있으면 새 생성을 시작하지 않고 복구한다', async () => {
    vi.mocked(getVoiceCloneJob).mockResolvedValue(completedJob({ id: 'existing-job' }))

    const result = await synthesizeVoiceCloneProfile({
      profileId: 'profile-1',
      text: '복구 문장',
      existingJobId: 'existing-job',
      allowStart: false,
    })

    expect(getVoiceCloneJob).toHaveBeenCalledWith('existing-job')
    expect(startVoiceCloneJob).not.toHaveBeenCalled()
    expect(cancelVoiceCloneJob).not.toHaveBeenCalled()
    expect(result?.jobId).toBe('existing-job')
  })
})
