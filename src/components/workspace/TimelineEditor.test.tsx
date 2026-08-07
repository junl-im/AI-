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
    pitch: 0,
    engineId: 'system',
    normalizeText: true,
    jobId: null,
    durationSeconds: 3,
    status: 'ready',
    progress: 100,
    audio: null,
    trackId: null,
    error: null,
    revision: 1,
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
    pitch: 0,
    engineId: 'system',
    normalizeText: true,
    jobId: null,
    durationSeconds: 4,
    status: 'failed',
    progress: 0,
    audio: null,
    trackId: null,
    error: '엔진 연결 실패',
    revision: 1,
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
        onAddVoice={vi.fn()}
        onAddPause={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    expect(screen.getByDisplayValue('첫 번째 문장입니다.')).toBeInTheDocument()
    expect(screen.getByText('0.5초')).toBeInTheDocument()
    expect(screen.getByText('엔진 연결 실패')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: '1번 대사 음성 다시 생성' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '2번 대사 음성 다시 생성' }))
    expect(onRetry).toHaveBeenCalledWith('voice-2')
    expect(screen.getByText('0:08')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1번 대사 가위로 나누기' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1번 대사 삭제' })).toBeInTheDocument()
  })

  it('대사 블록 메뉴는 명시적 버튼으로 열리고 선택 뒤 닫힌다', () => {
    const onRemove = vi.fn()
    render(
      <TimelineEditor
        blocks={blocks}
        onMove={vi.fn()}
        onReorder={vi.fn()}
        onSplit={vi.fn()}
        onUpdateText={vi.fn()}
        onRetry={vi.fn()}
        onAddVoice={vi.fn()}
        onAddPause={vi.fn()}
        onRemove={onRemove}
        onClear={vi.fn()}
      />,
    )

    const menuButton = screen.getByRole('button', { name: '2번 대사 블록 메뉴 열기' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: '클립 삭제' }))

    expect(onRemove).toHaveBeenCalledWith('voice-2')
    expect(screen.queryByRole('button', { name: '클립 삭제' })).not.toBeInTheDocument()
  })

  it('선택 클립을 빠른 편집 패널에서 수정하고 저장한다', () => {
    const onUpdateText = vi.fn()
    render(
      <TimelineEditor
        blocks={blocks}
        onMove={vi.fn()}
        onReorder={vi.fn()}
        onSplit={vi.fn()}
        onUpdateText={onUpdateText}
        onRetry={vi.fn()}
        onAddVoice={vi.fn()}
        onAddPause={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    const editor = screen.getByRole('textbox', { name: '선택 대사 빠른 수정' })
    expect(editor).toHaveValue('첫 번째 문장입니다.')
    fireEvent.change(editor, { target: { value: '실사용 편집기로 바로 고친 문장입니다.' } })
    expect(screen.getByText(/수정됨 · 저장 필요/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(onUpdateText).toHaveBeenCalledWith('voice-1', '실사용 편집기로 바로 고친 문장입니다.')
  })

  it('클립의 편집 버튼은 선택 클립 빠른 편집기로 연결된다', () => {
    render(
      <TimelineEditor
        blocks={blocks}
        onMove={vi.fn()}
        onReorder={vi.fn()}
        onSplit={vi.fn()}
        onUpdateText={vi.fn()}
        onRetry={vi.fn()}
        onAddVoice={vi.fn()}
        onAddPause={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '2번 대사 바로 편집' }))
    expect(screen.getByRole('textbox', { name: '선택 대사 빠른 수정' })).toHaveValue('두 번째 문장입니다.')
  })

})
