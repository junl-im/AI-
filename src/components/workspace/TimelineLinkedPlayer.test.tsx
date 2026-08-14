import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePlayerStore } from '../../store/usePlayerStore'
import type { GeneratedAudio } from '../../tts/generationTypes'
import { TimelineLinkedPlayer } from './TimelineLinkedPlayer'

function audio(name: string): GeneratedAudio {
  const url = `https://example.com/${name}.wav`
  return {
    url,
    filename: `${name}.wav`,
    source: 'api',
    durationSeconds: 12,
    result: {
      jobId: `test-${name}`,
      status: 'completed',
      engineId: 'test-engine',
      engineMode: 'local',
      audioUrl: url,
      estimatedDurationSeconds: 12,
      message: 'test fixture',
      normalizedText: null,
      segmentCount: 1,
      processingMs: 100,
      fileSizeBytes: null,
      realtimeFactor: null,
    },
  }
}

describe('TimelineLinkedPlayer', () => {
  beforeEach(() => {
    usePlayerStore.getState().clearQueue()
    usePlayerStore.setState({ playbackTrackId: null, playbackPositionSeconds: 0, playbackActive: false })
  })

  it('Dock 재생 스냅샷을 표시하고 같은 toggle 요청을 사용한다', () => {
    const firstId = usePlayerStore.getState().enqueue(audio('first'), '첫 대사')
    usePlayerStore.getState().setPlaybackSnapshot(firstId, 3, true)
    const before = usePlayerStore.getState().toggleRequestId
    render(<TimelineLinkedPlayer />)
    expect(screen.getByRole('region', { name: '타임라인 연계 플레이어' })).toHaveTextContent('첫 대사')
    expect(screen.getByText('SYNC')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '일시정지' }))
    expect(usePlayerStore.getState().toggleRequestId).toBe(before + 1)
  })

  it('재생 중 다음 음성을 누르면 같은 queue를 다음 track으로 재생 요청한다', () => {
    const firstId = usePlayerStore.getState().enqueue(audio('first'), '첫 대사')
    const secondId = usePlayerStore.getState().enqueue(audio('second'), '둘째 대사')
    usePlayerStore.getState().select(firstId)
    usePlayerStore.getState().setPlaybackSnapshot(firstId, 2, true)
    const before = usePlayerStore.getState().playRequestId
    render(<TimelineLinkedPlayer />)
    fireEvent.click(screen.getByRole('button', { name: '다음 음성' }))
    expect(usePlayerStore.getState().currentTrackId).toBe(secondId)
    expect(usePlayerStore.getState().playRequestId).toBe(before + 1)
  })
})
