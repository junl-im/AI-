import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFinalExport } from '../../export/finalExportApi'
import type { TimelineBlock } from '../../workspace/workspaceTypes'
import { FinalExportControls } from './FinalExportControls'

vi.mock('../../export/finalExportApi', () => ({
  createFinalExport: vi.fn(),
}))

const readyBlock = {
  id: 'block-1',
  kind: 'voice',
  durationSeconds: 1.2,
  text: '최종 음성 문장',
  voiceId: 'sori-warm',
  voiceName: '혜린',
  emotion: 'neutral',
  speed: 1,
  pitch: 0,
  normalizeText: true,
  jobId: 'job-1',
  status: 'ready',
  progress: 100,
  audio: {
    url: 'http://localhost:8000/api/v1/audio/job-1.wav',
    filename: 'job-1.wav',
    source: 'api',
    durationSeconds: 1.2,
    result: {},
  },
  trackId: 'track-1',
  error: null,
  revision: 1,
} as TimelineBlock

describe('FinalExportControls', () => {
  beforeEach(() => {
    vi.mocked(createFinalExport).mockReset()
  })

  it('완료 블록을 최종 WAV와 자막으로 요청하고 다운로드 링크를 보여준다', async () => {
    vi.mocked(createFinalExport).mockResolvedValue({
      audioUrl: 'http://localhost/final.wav',
      srtUrl: 'http://localhost/final.srt',
      vttUrl: 'http://localhost/final.vtt',
      outputFormat: 'wav',
      durationSeconds: 1.2,
      skippedSegments: 0,
      message: '완료',
    })

    render(<FinalExportControls blocks={[readyBlock]} />)
    fireEvent.click(screen.getByRole('button', { name: '최종 WAV + 자막' }))

    await waitFor(() => expect(createFinalExport).toHaveBeenCalledWith([readyBlock], 'wav'))
    expect(screen.getByRole('link', { name: '음원 받기' })).toHaveAttribute(
      'href',
      'http://localhost/final.wav',
    )
    expect(screen.getByRole('link', { name: 'SRT' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'VTT' })).toBeInTheDocument()
  })
})
