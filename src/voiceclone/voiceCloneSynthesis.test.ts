import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VoiceCloneJob } from './voiceCloneTypes'

vi.mock('./voiceCloneApi', () => ({
  cancelVoiceCloneJob: vi.fn(),
  getVoiceCloneJob: vi.fn(),
  startVoiceCloneJob: vi.fn(),
}))
vi.mock('./voiceCloneProgressStream', () => ({
  streamVoiceCloneProgress: vi.fn().mockResolvedValue(false),
}))

import { getVoiceCloneJob, startVoiceCloneJob } from './voiceCloneApi'
import { synthesizeVoiceCloneProfile } from './voiceCloneSynthesis'

function completedJob(): VoiceCloneJob {
  return {
    id: 'clone-job-1',
    profileId: 'profile-1',
    status: 'completed',
    progress: 100,
    phase: 'completed',
    message: '완료',
    text: '테스트 문장',
    createdAt: '2026-08-15T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:01.000Z',
    firstAudioMs: 280,
    durationSeconds: 2,
    audioUrl: 'https://voice.example/clone.wav',
    eventsUrl: 'https://voice.example/events',
    error: null,
    segments: [],
  }
}

describe('voiceCloneSynthesis fast path', () => {
  beforeEach(() => vi.clearAllMocks())

  it('POST가 완료 결과를 바로 주면 추가 GET 없이 즉시 음원을 반환한다', async () => {
    vi.mocked(startVoiceCloneJob).mockResolvedValue(completedJob())
    const result = await synthesizeVoiceCloneProfile({ profileId: 'profile-1', text: '테스트 문장' })
    expect(result?.audioUrl).toBe('https://voice.example/clone.wav')
    expect(getVoiceCloneJob).not.toHaveBeenCalled()
    expect(startVoiceCloneJob).toHaveBeenCalledWith('profile-1', '테스트 문장', expect.any(AbortSignal))
  })

  it('복구 job이 이미 완료됐다면 새 생성 요청을 만들지 않는다', async () => {
    vi.mocked(getVoiceCloneJob).mockResolvedValue(completedJob())
    const result = await synthesizeVoiceCloneProfile({
      profileId: 'profile-1',
      text: '테스트 문장',
      existingJobId: 'clone-job-1',
      allowStart: false,
    })
    expect(result?.jobId).toBe('clone-job-1')
    expect(startVoiceCloneJob).not.toHaveBeenCalled()
  })
})
