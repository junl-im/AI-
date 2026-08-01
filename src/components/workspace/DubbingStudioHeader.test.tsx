import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DubbingStudioHeader } from './DubbingStudioHeader'

function renderHeader(onClear = vi.fn()) {
  return render(
    <DubbingStudioHeader
      title="오디오북 1장"
      savedLabel="오후 07:30 자동 저장됨"
      backendStatus="online"
      engineLabel="System Voice"
      downloadHref={null}
      downloadName="voice.wav"
      onTitleChange={vi.fn()}
      onGoHome={vi.fn()}
      onOpenClone={vi.fn()}
      onOpenQuality={vi.fn()}
      onOpenProjects={vi.fn()}
      onOpenSettings={vi.fn()}
      onClear={onClear}
    />,
  )
}

describe('DubbingStudioHeader', () => {
  it('프로젝트·저장·엔진 상태를 같은 상단 영역에서 보여준다', () => {
    renderHeader()

    expect(screen.getByRole('textbox', { name: '프로젝트 제목' })).toHaveValue('오디오북 1장')
    expect(screen.getByText('오후 07:30 자동 저장됨')).toBeInTheDocument()
    expect(screen.getByText(/음성 엔진 준비 · System Voice/)).toBeInTheDocument()
  })

  it('작업 비우기는 앱 내부 확인 뒤에만 실행한다', () => {
    const onClear = vi.fn()
    renderHeader(onClear)

    fireEvent.click(screen.getByRole('button', { name: '프로젝트 메뉴' }))
    fireEvent.click(screen.getByRole('button', { name: '현재 작업 비우기' }))

    expect(screen.getByRole('alertdialog', { name: '현재 작업을 비울까요?' })).toBeInTheDocument()
    expect(onClear).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '작업 비우기' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
