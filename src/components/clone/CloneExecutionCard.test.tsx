import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { VoiceCloneJob } from '../../voiceclone/voiceCloneTypes'
import { CloneExecutionCard } from './CloneExecutionCard'

function job(status: VoiceCloneJob['status'] = 'running'): VoiceCloneJob {
  return {
    id: 'job-1',
    profileId: 'profile-1',
    status,
    progress: status === 'completed' ? 100 : 48,
    phase: 'synthesizing',
    message: '문장별 음성을 생성하고 있습니다.',
    text: '첫 번째 문장입니다. 두 번째 문장입니다.',
    createdAt: '2026-07-31T00:00:00Z',
    updatedAt: '2026-07-31T00:00:01Z',
    firstAudioMs: 820,
    durationSeconds: status === 'completed' ? 3.2 : null,
    audioUrl: status === 'completed' ? 'http://api.test/audio.wav' : null,
    eventsUrl: 'http://api.test/events',
    error: null,
    segments: [
      {
        index: 1,
        text: '첫 번째 문장입니다.',
        status: 'completed',
        progress: 100,
        message: '완료',
        error: null,
        audioUrl: 'http://api.test/segment-1.wav',
      },
      {
        index: 2,
        text: '두 번째 문장입니다.',
        status: status === 'completed' ? 'completed' : 'running',
        progress: status === 'completed' ? 100 : 35,
        message: status === 'completed' ? '완료' : '음성 생성 중',
        error: null,
        audioUrl: status === 'completed' ? 'http://api.test/segment-2.wav' : null,
      },
    ],
  }
}

describe('CloneExecutionCard', () => {
  it('Worker가 준비되지 않으면 실제 실행 버튼을 잠근다', () => {
    render(
      <CloneExecutionCard
        profileName="내 목소리"
        ready={false}
        reason="모델이 준비되지 않았습니다."
        job={null}
        busy={false}
        error={null}
        onStart={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('모델이 준비되지 않았습니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '이 목소리로 WAV 생성하기' }))
      .toBeDisabled()
  })

  it('문장별 진행률과 취소 기능을 표시한다', () => {
    const cancel = vi.fn()
    render(
      <CloneExecutionCard
        profileName="내 목소리"
        ready
        reason={null}
        job={job()}
        busy={false}
        error={null}
        onStart={vi.fn()}
        onCancel={cancel}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('첫 번째 문장입니다.')).toBeInTheDocument()
    expect(screen.getByText('두 번째 문장입니다.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '생성 취소' }))
    expect(cancel).toHaveBeenCalledOnce()
  })

  it('완료되면 Dock 연결 안내를 표시한다', () => {
    render(
      <CloneExecutionCard
        profileName="내 목소리"
        ready
        reason={null}
        job={job('completed')}
        busy={false}
        error={null}
        onStart={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText(/하단 Linked Player Dock에 연결했습니다/)).toBeInTheDocument()
    expect(screen.getByText(/첫 구간 820ms/)).toBeInTheDocument()
  })
})
