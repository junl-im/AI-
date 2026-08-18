import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePlayerStore } from '../../store/usePlayerStore'
import type { GeneratedAudio } from '../../tts/generationTypes'
import type { PlayerTrack } from '../../player/playerTypes'
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

const linkedAudio: GeneratedAudio = {
  url: 'https://voice.example/linked.wav',
  filename: 'linked.wav',
  source: 'api',
  durationSeconds: 3,
  result: {
    jobId: 'linked-job',
    status: 'completed',
    engineId: 'test-engine',
    engineMode: 'local',
    audioUrl: 'https://voice.example/linked.wav',
    estimatedDurationSeconds: 3,
    message: 'ready',
    normalizedText: null,
    segmentCount: 1,
    processingMs: 20,
    fileSizeBytes: 100,
    realtimeFactor: 0.1,
  },
}

function linkedTrack(id: string): PlayerTrack {
  return {
    id,
    title: id,
    audio: linkedAudio,
    createdAt: '2026-08-15T00:00:00.000Z',
    resumePositionSeconds: 0,
  }
}

beforeEach(() => {
  usePlayerStore.getState().clearQueue()
})

describe('TimelineEditor', () => {
  it('현재 선택 클립 ID를 부모 작업공간에 전달한다', async () => {
    const onSelectionChange = vi.fn()
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
        onSelectionChange={onSelectionChange}
      />,
    )

    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(['voice-1']))
    fireEvent.click(screen.getByLabelText(/클립 2 · 혜린/))
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(['voice-2']))
  })

  it('모바일용 + 선택 버튼으로 modifier key 없이 여러 대사를 고른다', async () => {
    const onSelectionChange = vi.fn()
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
        onSelectionChange={onSelectionChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '2번 대사 다중 선택' }))
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith(['voice-1', 'voice-2']))
    expect(screen.getByRole('button', { name: '2번 대사 선택 해제' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('PC 가로 타임라인은 시간축과 클립 폭을 같은 좌표계로 유지한다', () => {
    const { container } = render(
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

    expect(container.querySelector('[data-timeline-axis="horizontal"]')).not.toBeNull()
    const voiceSlots = container.querySelectorAll<HTMLElement>('.soa-timeline-clip-slot')
    const pause = container.querySelector<HTMLElement>('.soa-dubbing-pause-block')
    expect(voiceSlots).toHaveLength(2)
    expect(voiceSlots[0].style.getPropertyValue('--soa-clip-offset')).toBe('16px')
    expect(voiceSlots[0].style.getPropertyValue('--soa-clip-width')).toBe('216px')
    expect(pause?.style.getPropertyValue('--soa-clip-offset')).toBe('232px')
    expect(pause?.style.getPropertyValue('--soa-clip-width')).toBe('36px')
    expect(voiceSlots[1].style.getPropertyValue('--soa-clip-offset')).toBe('268px')
    expect(voiceSlots[1].style.getPropertyValue('--soa-clip-width')).toBe('288px')
  })

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

  it('Player가 다른 클립으로 이동하면 미저장 빠른 편집을 먼저 저장하고 선택을 따라간다', async () => {
    const onUpdateText = vi.fn()
    const linkedBlocks: TimelineBlock[] = blocks.map((block) => {
      if (block.kind !== 'voice') return block
      return {
        ...block,
        status: 'ready',
        progress: 100,
        trackId: block.id === 'voice-1' ? 'track-1' : 'track-2',
        error: null,
      }
    })
    usePlayerStore.getState().restoreSession(
      [linkedTrack('track-1'), linkedTrack('track-2')],
      'track-1',
      'off',
      1,
    )

    render(
      <TimelineEditor
        blocks={linkedBlocks}
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
    fireEvent.change(editor, { target: { value: '재생 이동 전 반드시 저장할 수정 문장입니다.' } })
    usePlayerStore.getState().select('track-2')

    await waitFor(() => expect(onUpdateText).toHaveBeenCalledWith('voice-1', '재생 이동 전 반드시 저장할 수정 문장입니다.'))
    await waitFor(() => expect(screen.getByRole('textbox', { name: '선택 대사 빠른 수정' })).toHaveValue('두 번째 문장입니다.'))
  })

  it('다른 타임라인 클립을 직접 선택해도 미저장 빠른 편집을 먼저 저장한다', async () => {
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
    fireEvent.change(editor, { target: { value: '직접 선택 전 저장해야 하는 수정 문장입니다.' } })
    fireEvent.click(screen.getByRole('article', { name: /클립 2/ }))

    expect(onUpdateText).toHaveBeenCalledWith('voice-1', '직접 선택 전 저장해야 하는 수정 문장입니다.')
    await waitFor(() => expect(screen.getByRole('textbox', { name: '선택 대사 빠른 수정' })).toHaveValue('두 번째 문장입니다.'))
  })

  it('빠른 편집 이전·다음 대사 이동은 쉼을 건너뛰고 현재 draft를 먼저 저장한다', async () => {
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
    fireEvent.change(editor, { target: { value: '다음 대사 이동 전에 저장할 문장입니다.' } })
    fireEvent.click(screen.getByRole('button', { name: '다음 대사로 이동' }))

    expect(onUpdateText).toHaveBeenCalledWith('voice-1', '다음 대사 이동 전에 저장할 문장입니다.')
    await waitFor(() => expect(screen.getByRole('textbox', { name: '선택 대사 빠른 수정' })).toHaveValue('두 번째 문장입니다.'))
    expect(screen.getByRole('button', { name: '다음 대사로 이동' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '이전 대사로 이동' })).toBeEnabled()
  })

  it('유실 MY VOICE는 기존 ready 음원을 자동 폐기하지 않고 명시적 복구 선택을 요구한다', async () => {
    const onBatchVoiceChange = vi.fn().mockResolvedValue(null)
    const staleBlocks: TimelineBlock[] = blocks.map((block) => block.id === 'voice-1' && block.kind === 'voice'
      ? { ...block, voiceId: 'myvoice:deleted-profile', voiceName: '삭제된 내 목소리', status: 'ready', trackId: 'stale-track', progress: 100 }
      : block)

    render(
      <TimelineEditor
        blocks={staleBlocks}
        currentVoiceId="on-clear"
        onMove={vi.fn()}
        onReorder={vi.fn()}
        onSplit={vi.fn()}
        onUpdateText={vi.fn()}
        onRetry={vi.fn()}
        onAddVoice={vi.fn()}
        onAddPause={vi.fn()}
        onRemove={vi.fn()}
        onBatchVoiceChange={onBatchVoiceChange}
        onClear={vi.fn()}
      />,
    )

    const recovery = screen.getByRole('status', { name: '사용 불가 목소리 복구' })
    expect(recovery).toHaveTextContent('사용 불가 목소리')
    expect(recovery).toHaveTextContent('현재 완성 음원은 그대로 유지됩니다')
    expect(screen.getByRole('article', { name: /클립 1 · 삭제된 내 목소리 .*사용 불가 목소리/ })).toBeInTheDocument()
    expect(onBatchVoiceChange).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('combobox', { name: '사용 불가 목소리 대체 선택' })).toHaveValue('on-clear'))

    fireEvent.click(screen.getByRole('button', { name: '교체만 적용' }))
    await waitFor(() => expect(onBatchVoiceChange).toHaveBeenCalledWith(['voice-1'], 'on-clear', false, 'recovery'))
  })

  it('여러 stale MY VOICE는 원래 구성과 ready 음원 영향을 확인한 뒤 사용 불가 클립만 일괄 복구한다', async () => {
    const onBatchVoiceChange = vi.fn().mockResolvedValue(null)
    const staleBlocks: TimelineBlock[] = [
      ...blocks.map((block) => {
        if (block.id === 'voice-1' && block.kind === 'voice') {
          return {
            ...block,
            voiceId: 'myvoice:deleted-a',
            voiceName: '유실 보이스 A',
            status: 'ready' as const,
            trackId: 'stale-track-a',
            progress: 100,
          }
        }
        if (block.id === 'voice-2' && block.kind === 'voice') {
          return {
            ...block,
            voiceId: 'myvoice:deleted-b',
            voiceName: '유실 보이스 B',
            status: 'failed' as const,
            trackId: null,
            progress: 0,
          }
        }
        return block
      }),
      {
        id: 'voice-3',
        kind: 'voice',
        text: '정상 목소리 문장입니다.',
        voiceId: 'sori-warm',
        voiceName: '혜린',
        emotion: 'neutral',
        speed: 1,
        pitch: 0,
        engineId: 'system',
        normalizeText: true,
        jobId: null,
        durationSeconds: 2,
        status: 'queued',
        progress: 0,
        audio: null,
        trackId: null,
        error: null,
        revision: 1,
      },
    ]

    render(
      <TimelineEditor
        blocks={staleBlocks}
        currentVoiceId="on-clear"
        onMove={vi.fn()}
        onMoveMany={vi.fn()}
        onReorder={vi.fn()}
        onSplit={vi.fn()}
        onUpdateText={vi.fn()}
        onRetry={vi.fn()}
        onAddVoice={vi.fn()}
        onAddPause={vi.fn()}
        onRemove={vi.fn()}
        onRemoveMany={vi.fn()}
        onBatchVoiceChange={onBatchVoiceChange}
        onClear={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '대사 전체' }))

    const recovery = screen.getByRole('status', { name: '선택 사용 불가 목소리 복구' })
    expect(recovery).toHaveTextContent('사용 불가 MY VOICE 2개')
    expect(recovery).toHaveTextContent('유실 보이스 A 1개')
    expect(recovery).toHaveTextContent('유실 보이스 B 1개')
    expect(recovery).toHaveTextContent('현재 완성 음원 1개는 복구 실행 전까지 그대로 유지됩니다')
    expect(onBatchVoiceChange).not.toHaveBeenCalled()

    await waitFor(() => expect(screen.getByRole('combobox', { name: '사용 불가 목소리 일괄 대체 선택' })).toHaveValue('on-clear'))
    fireEvent.click(screen.getByRole('button', { name: '복구 영향 확인' }))

    const impact = screen.getByRole('alertdialog', { name: '사용 불가 목소리 일괄 복구 영향 확인' })
    expect(impact).toHaveTextContent('선택 3개 중 사용 불가 MY VOICE 2개만 변경합니다')
    expect(impact).toHaveTextContent('현재 완성 음원 1개는 실행하는 순간 폐기')
    expect(impact).toHaveTextContent('Undo는 목소리 배정을 되돌리지만 과거 음원 파일을 부활시키지 않고')

    fireEvent.click(screen.getByRole('button', { name: '교체만 적용' }))
    await waitFor(() => expect(onBatchVoiceChange).toHaveBeenCalledWith(
      ['voice-1', 'voice-2'],
      'on-clear',
      false,
      'recovery',
    ))
  })

  it('혼합 성우 다중 선택은 구성과 현재 작업 목소리를 분리해 보여준다', async () => {
    const mixedBlocks: TimelineBlock[] = blocks.map((block) => block.id === 'voice-2' && block.kind === 'voice'
      ? { ...block, voiceId: 'on-clear', voiceName: '도윤' }
      : block)
    render(
      <TimelineEditor
        blocks={mixedBlocks}
        currentVoiceId="dam-calm"
        onMove={vi.fn()}
        onMoveMany={vi.fn()}
        onReorder={vi.fn()}
        onSplit={vi.fn()}
        onUpdateText={vi.fn()}
        onRetry={vi.fn()}
        onAddVoice={vi.fn()}
        onAddPause={vi.fn()}
        onRemove={vi.fn()}
        onRemoveMany={vi.fn()}
        onClear={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('article', { name: /클립 2 · 도윤/ }), { ctrlKey: true })
    const summary = screen.getByRole('status', { name: '선택 목소리 구성' })
    expect(summary).toHaveTextContent('혼합 목소리 2종')
    expect(summary).toHaveTextContent('현재 작업 목소리 · 소리')
    expect(summary).toHaveTextContent('혜린 1개')
    expect(summary).toHaveTextContent('도윤 1개')
    await waitFor(() => expect(screen.getByRole('combobox', { name: '선택 클립 일괄 목소리' })).toHaveValue('dam-calm'))
  })

})

it('Ctrl/Cmd 다중 선택 뒤 선택 클립을 일괄 이동·삭제할 수 있다 · 안전한 목소리 변경과 재생성도 지원한다', async () => {
  const onMoveMany = vi.fn()
  const onRemoveMany = vi.fn()
  const onUndo = vi.fn()
  const onRedo = vi.fn()
  const onBatchVoiceChange = vi.fn().mockResolvedValue(null)
  const onRegenerateMany = vi.fn().mockResolvedValue({
    requestedIds: ['voice-2'],
    succeededIds: ['voice-2'],
    failedIds: [],
    skippedIds: [],
  })
  render(
    <TimelineEditor
      blocks={blocks}
      onMove={vi.fn()}
      onMoveMany={onMoveMany}
      onReorder={vi.fn()}
      onSplit={vi.fn()}
      onUpdateText={vi.fn()}
      onRetry={vi.fn()}
      onAddVoice={vi.fn()}
      onAddPause={vi.fn()}
      onRemove={vi.fn()}
      onRemoveMany={onRemoveMany}
      onBatchVoiceChange={onBatchVoiceChange}
      onRegenerateMany={onRegenerateMany}
      onClear={vi.fn()}
      canUndo
      canRedo
      undoLabel="선택 클립 이동"
      redoLabel="대사 수정"
      onUndo={onUndo}
      onRedo={onRedo}
    />,
  )

  const secondVoice = screen.getByText('두 번째 문장입니다.').closest('article')
  expect(secondVoice).not.toBeNull()
  fireEvent.click(secondVoice!, { ctrlKey: true })

  expect(screen.getByRole('region', { name: '선택 클립 일괄 작업' })).toBeInTheDocument()
  expect(screen.getByText(/2개 클립/)).toBeInTheDocument()

  fireEvent.change(screen.getByRole('combobox', { name: '선택 클립 일괄 목소리' }), {
    target: { value: 'on-clear' },
  })
  fireEvent.click(screen.getByRole('button', { name: '변경 미리보기' }))
  expect(screen.getByRole('status', { name: '일괄 목소리 변경 영향 미리보기' })).toHaveTextContent('도윤 목소리로 변경')
  expect(screen.getByText(/기존 완성 음원 1개/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '목소리만 적용' }))
  await waitFor(() => expect(onBatchVoiceChange).toHaveBeenCalledWith(['voice-1', 'voice-2'], 'on-clear', false))

  fireEvent.click(screen.getByRole('button', { name: '실패만 재시도 1' }))
  await waitFor(() => expect(onRegenerateMany).toHaveBeenCalledWith(['voice-2']))
  expect(screen.getByRole('status', { name: '최근 일괄 음성 작업 결과' })).toHaveTextContent('성공 1 · 실패 0 · 건너뜀 0')

  fireEvent.click(screen.getByRole('button', { name: '선택 앞으로' }))
  expect(onMoveMany).toHaveBeenCalledWith(['voice-1', 'voice-2'], -1)

  fireEvent.click(screen.getByRole('button', { name: '선택 삭제' }))
  expect(screen.getByRole('alertdialog', { name: '일괄 명령 안전 미리보기' })).toHaveTextContent('선택 2개 삭제')
  fireEvent.click(screen.getByRole('button', { name: '삭제 실행' }))
  expect(onRemoveMany).toHaveBeenCalledWith(['voice-1', 'voice-2'])
})


it('일괄 재생성 실패 뒤 실패 클립만 자동 선택하고 결과를 유지한다', async () => {
  const onRegenerateMany = vi.fn().mockResolvedValue({
    requestedIds: ['voice-1', 'voice-2'],
    succeededIds: ['voice-1'],
    failedIds: ['voice-2'],
    skippedIds: [],
  })
  render(
    <TimelineEditor
      blocks={blocks}
      onMove={vi.fn()}
      onMoveMany={vi.fn()}
      onReorder={vi.fn()}
      onSplit={vi.fn()}
      onUpdateText={vi.fn()}
      onRetry={vi.fn()}
      onAddVoice={vi.fn()}
      onAddPause={vi.fn()}
      onRemove={vi.fn()}
      onRemoveMany={vi.fn()}
      onRegenerateMany={onRegenerateMany}
      onClear={vi.fn()}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: '대사 전체' }))
  fireEvent.click(screen.getByRole('button', { name: '선택 재생성' }))
  fireEvent.click(screen.getByRole('button', { name: '안전 실행' }))

  await waitFor(() => expect(onRegenerateMany).toHaveBeenCalledWith(['voice-1', 'voice-2']))
  expect(screen.getByRole('status', { name: '최근 일괄 음성 작업 결과' })).toHaveTextContent('성공 1 · 실패 1 · 건너뜀 0')
  await waitFor(() => expect(screen.getByRole('textbox', { name: '선택 대사 빠른 수정' })).toHaveValue('두 번째 문장입니다.'))
})

it('일괄 실패 원인을 그룹으로 나눠 필요한 항목만 다시 시도한다', async () => {
  const onRegenerateMany = vi.fn()
    .mockResolvedValueOnce({
      requestedIds: ['voice-1', 'voice-2'],
      succeededIds: [],
      failedIds: ['voice-1', 'voice-2'],
      skippedIds: [],
      failures: [
        { id: 'voice-1', kind: 'network', message: 'network timeout' },
        { id: 'voice-2', kind: 'engine', message: 'engine unavailable' },
      ],
    })
    .mockResolvedValueOnce({
      requestedIds: ['voice-1'],
      succeededIds: ['voice-1'],
      failedIds: [],
      skippedIds: [],
      failures: [],
    })

  render(
    <TimelineEditor
      blocks={blocks}
      onMove={vi.fn()}
      onMoveMany={vi.fn()}
      onReorder={vi.fn()}
      onSplit={vi.fn()}
      onUpdateText={vi.fn()}
      onRetry={vi.fn()}
      onAddVoice={vi.fn()}
      onAddPause={vi.fn()}
      onRemove={vi.fn()}
      onRemoveMany={vi.fn()}
      onRegenerateMany={onRegenerateMany}
      onClear={vi.fn()}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: '대사 전체' }))
  fireEvent.click(screen.getByRole('button', { name: '선택 재생성' }))
  fireEvent.click(screen.getByRole('button', { name: '안전 실행' }))

  await waitFor(() => expect(screen.getByRole('button', { name: '연결 1 · 재시도' })).toBeInTheDocument())
  expect(screen.getByRole('button', { name: '엔진 1 · 재시도' })).toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: '연결 1 · 재시도' }))
  await waitFor(() => expect(onRegenerateMany).toHaveBeenLastCalledWith(['voice-1']))
})

it('일괄 작업 재시도 이력을 세션 안에서 최근 순서로 보존한다', async () => {
  const onBatchRetrySnapshotChange = vi.fn()
  const onRegenerateMany = vi.fn()
    .mockResolvedValueOnce({
      requestedIds: ['voice-1', 'voice-2'],
      succeededIds: ['voice-1'],
      failedIds: ['voice-2'],
      skippedIds: [],
      failures: [{ id: 'voice-2', kind: 'engine', message: 'engine unavailable' }],
    })
    .mockResolvedValueOnce({
      requestedIds: ['voice-2'],
      succeededIds: ['voice-2'],
      failedIds: [],
      skippedIds: [],
      failures: [],
    })

  render(
    <TimelineEditor
      blocks={blocks}
      onMove={vi.fn()}
      onMoveMany={vi.fn()}
      onReorder={vi.fn()}
      onSplit={vi.fn()}
      onUpdateText={vi.fn()}
      onRetry={vi.fn()}
      onAddVoice={vi.fn()}
      onAddPause={vi.fn()}
      onRemove={vi.fn()}
      onRemoveMany={vi.fn()}
      onRegenerateMany={onRegenerateMany}
      onClear={vi.fn()}
      onBatchRetrySnapshotChange={onBatchRetrySnapshotChange}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: '대사 전체' }))
  fireEvent.click(screen.getByRole('button', { name: '선택 재생성' }))
  fireEvent.click(screen.getByRole('button', { name: '안전 실행' }))
  await waitFor(() => expect(onRegenerateMany).toHaveBeenCalledTimes(1))

  fireEvent.click(screen.getByRole('button', { name: '엔진 1 · 재시도' }))
  await waitFor(() => expect(onRegenerateMany).toHaveBeenCalledTimes(2))

  const history = screen.getByText('세션 재시도 이력 2건')
  expect(history).toBeInTheDocument()
  fireEvent.click(history)
  expect(screen.getAllByText('일괄 작업').length).toBeGreaterThanOrEqual(1)
  expect(screen.getByText('빠른 재시도')).toBeInTheDocument()
  expect(onBatchRetrySnapshotChange).toHaveBeenCalled()
  const snapshot = onBatchRetrySnapshotChange.mock.calls.at(-1)?.[0]
  expect(snapshot).toMatchObject({ retryCount: 1 })
  expect(JSON.stringify(snapshot)).not.toContain('voice-2')
  expect(JSON.stringify(snapshot)).not.toContain('engine unavailable')
})

it('다중 선택 command bar는 재생성·Undo/Redo·삭제 안전 확인을 제공한다', async () => {
  const onMoveMany = vi.fn()
  const onRemoveMany = vi.fn()
  const onUndo = vi.fn()
  const onRedo = vi.fn()
  const onRegenerateMany = vi.fn().mockResolvedValue({
    requestedIds: ['voice-1', 'voice-2'],
    succeededIds: ['voice-1', 'voice-2'],
    failedIds: [],
    skippedIds: [],
    failures: [],
  })
  render(
    <TimelineEditor
      blocks={blocks}
      onMove={vi.fn()}
      onMoveMany={onMoveMany}
      onReorder={vi.fn()}
      onSplit={vi.fn()}
      onUpdateText={vi.fn()}
      onRetry={vi.fn()}
      onAddVoice={vi.fn()}
      onAddPause={vi.fn()}
      onRemove={vi.fn()}
      onRemoveMany={onRemoveMany}
      onRegenerateMany={onRegenerateMany}
      onUndo={onUndo}
      onRedo={onRedo}
      onClear={vi.fn()}
      canUndo
      canRedo
      undoLabel="선택 클립 이동"
      redoLabel="대사 수정"
    />,
  )

  const firstVoice = screen.getByRole('article', { name: '클립 1 · 혜린 · 0:03 · 완료' })
  fireEvent.keyDown(firstVoice!, { key: 'a', ctrlKey: true })
  expect(screen.getByRole('region', { name: '선택 클립 일괄 작업' })).toBeInTheDocument()

  fireEvent.keyDown(firstVoice!, { key: 'r' })
  expect(screen.getByRole('alertdialog', { name: '일괄 명령 안전 미리보기' })).toHaveTextContent('선택 대사 2개 재생성')
  fireEvent.click(screen.getByRole('button', { name: '안전 실행' }))
  await waitFor(() => expect(onRegenerateMany).toHaveBeenCalledWith(['voice-1', 'voice-2']))

  fireEvent.keyDown(firstVoice!, { key: 'ArrowRight', altKey: true })
  expect(onMoveMany).toHaveBeenLastCalledWith(['voice-1', 'voice-2'], 1)
  fireEvent.keyDown(firstVoice!, { key: 'z', ctrlKey: true })
  expect(onUndo).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(firstVoice!, { key: 'z', ctrlKey: true, shiftKey: true })
  expect(onRedo).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: '선택 클립 이동 되돌리기' }))
  expect(onUndo).toHaveBeenCalledTimes(2)

  fireEvent.keyDown(firstVoice!, { key: 'Delete' })
  expect(screen.getByRole('alertdialog', { name: '일괄 명령 안전 미리보기' })).toHaveTextContent('선택 2개 삭제')
  fireEvent.click(screen.getByRole('button', { name: '삭제 실행' }))
  expect(onRemoveMany).toHaveBeenCalledWith(['voice-1', 'voice-2'])
})
