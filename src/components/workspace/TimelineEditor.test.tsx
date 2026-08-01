import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TimelineBlock } from '../../workspace/workspaceTypes'
import { TimelineEditor } from './TimelineEditor'

const blocks: TimelineBlock[] = [
  {
    id: 'voice-1',
    kind: 'voice',
    text: '첫 번째 문장입니다.',
    voiceId: 'sori-warm',
    voiceName: '혜린',
    emotion: 'neutral',
    speed: 1,
    engineId: 'system',
    normalizeText: true,
    jobId: null,
    durationSeconds: 3,
    status: 'ready',
    progress: 100,
    audio: null,
    trackId: null,
    error: null,
  },
  { id: 'pause-1', kind: 'pause', durationSeconds: 0.5 },
  {
    id: 'voice-2',
    kind: 'voice',
    text: '두 번째 문장입니다.',
    voiceId: 'sori-warm',
    voiceName: '혜린',
    emotion: 'neutral',
    speed: 1,
    engineId: 'system',
    normalizeText: true,
    jobId: null,
    durationSeconds: 4,
    status: 'failed',
    progress: 0,
    audio: null,
    trackId: null,
    error: '엔진 연결 실패',
  },
]

describe('TimelineEditor', () => {
  it('완료·쉼·실패 블록과 문장별 재시도를 보여준다', () => {
    const onRetry = vi.fn()
    render(
      <TimelineEditor
        blocks={blocks}
        onMove={vi.fn()}
        onReorder={vi.fn()}
        onSplit={vi.fn()}
        onUpdateText={vi.fn()}
        onRetry={onRetry}
        onAddPause={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByText('첫 번째 문장입니다.')).toBeInTheDocument()
    expect(screen.getByText('0.5초')).toBeInTheDocument()
    expect(screen.getByText('엔진 연결 실패')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '재시도' }))
    expect(onRetry).toHaveBeenCalledWith('voice-2')
  })
})
