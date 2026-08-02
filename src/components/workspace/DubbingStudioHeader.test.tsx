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
    expect(screen.getByText(/AI 음성 엔진 준비 · System Voice/)).toBeInTheDocument()
  })

  it('작업 비우기는 앱 내부 확인 뒤에만 실행한다', () => {
    const onClear = vi.fn()
    renderHeader(onClear)

    const menuButton = screen.getByRole('button', { name: '프로젝트 메뉴 열기' })
    expect(menuButton).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(menuButton)
    expect(menuButton).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: '현재 작업 비우기' }))

    expect(screen.getByRole('alertdialog', { name: '현재 작업을 비울까요?' })).toBeInTheDocument()
    expect(onClear).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '작업 비우기' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('프로젝트 메뉴는 Escape로 닫히고 실행 버튼으로 초점이 복귀한다', () => {
    renderHeader()

    const menuButton = screen.getByRole('button', { name: '프로젝트 메뉴 열기' })
    fireEvent.click(menuButton)
    expect(screen.getByLabelText('프로젝트 메뉴')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByLabelText('프로젝트 메뉴')).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })

  it('작업 비우기 확인창은 안전 동작에 초점을 두고 Escape로 닫힌다', () => {
    renderHeader()

    const menuButton = screen.getByRole('button', { name: '프로젝트 메뉴 열기' })
    fireEvent.click(menuButton)
    fireEvent.click(screen.getByRole('button', { name: '현재 작업 비우기' }))

    expect(screen.getByRole('button', { name: '계속 편집' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('alertdialog', { name: '현재 작업을 비울까요?' })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(menuButton).toHaveFocus()
  })

})
