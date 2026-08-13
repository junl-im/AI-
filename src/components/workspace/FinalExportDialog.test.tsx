import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TimelineBlock } from '../../workspace/workspaceTypes'
import { FinalExportDialog } from './FinalExportDialog'

const readyBlock = {
  id: 'voice-1',
  kind: 'voice',
  durationSeconds: 1,
  text: '완료 대사',
  voiceId: 'sori-warm',
  voiceName: '혜린',
  emotion: 'neutral',
  speed: 1,
  pitch: 0,
  normalizeText: true,
  jobId: 'job-1',
  status: 'ready',
  progress: 100,
  audio: null,
  trackId: 'track-1',
  error: null,
  revision: 1,
} as TimelineBlock

describe('FinalExportDialog', () => {
  it('내보내기를 편집기 밖의 완료 대화상자로 분리한다', () => {
    const onClose = vi.fn()
    render(<FinalExportDialog open blocks={[readyBlock]} onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: '완성본 내보내기' })).toBeInTheDocument()
    expect(screen.getByText('대사 1/1 완료')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'WAV + 자막' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '내보내기 닫기' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
