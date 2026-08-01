import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    usePlayerStore.getState().clearQueue()
    useAppStore.setState({
      page: 'home',
      workspaceEntered: false,
      connectionSheetOpen: false,
      backendStatus: 'offline',
      backendMessage: 'Voice API가 설정되지 않았습니다.',
      notice: null,
    })
    vi.restoreAllMocks()
  })

  it('초기 화면에서는 브랜드 설명과 스튜디오 시작 동선을 유지한다', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { name: /문장 하나면/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /AI 음성 스튜디오 시작/ }))
      .toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '음성으로 만들 메시지' }))
      .not.toBeInTheDocument()
  })

  it('작업공간에서는 채팅 입력을 문장별 타임라인 블록으로 만든다', () => {
    useAppStore.setState({ workspaceEntered: true })
    const view = render(<HomePage />)
    const scoped = within(view.container)
    const textbox = scoped.getByRole('textbox', { name: '음성으로 만들 메시지' })

    expect(textbox).toHaveAttribute('placeholder', '메시지를 입력하세요…')
    expect(scoped.getByRole('radio', { name: /혜린/ })).toBeInTheDocument()
    expect(scoped.getByRole('button', { name: /API 연결 안됨/ })).toBeInTheDocument()

    fireEvent.change(textbox, {
      target: { value: '첫 번째 문장입니다. 두 번째 문장입니다.' },
    })
    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter' })

    expect(scoped.getByText('첫 번째 문장입니다.')).toBeInTheDocument()
    expect(scoped.getByText('두 번째 문장입니다.')).toBeInTheDocument()
    expect(scoped.getAllByText(/음성 · 혜린/)).toHaveLength(2)
    expect(useAppStore.getState().connectionSheetOpen).toBe(true)
  })
})
