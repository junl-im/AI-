import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExitConfirmDialog } from '../components/ui/ExitConfirmDialog'
import { useExitConfirmation } from './useExitConfirmation'

function dispatchPopState() {
  act(() => {
    // A real Back moves from the guard entry to the base entry before popstate fires.
    window.history.replaceState({ __sorionExitBase: true }, document.title, '/')
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
  })
}

function Harness() {
  const confirmation = useExitConfirmation()
  return (
    <ExitConfirmDialog
      open={confirmation.open}
      onStay={confirmation.stay}
      onExit={confirmation.exit}
    />
  )
}

describe('useExitConfirmation', () => {
  beforeEach(() => {
    window.history.replaceState({}, document.title, '/')
    vi.restoreAllMocks()
  })

  it('첫 뒤로가기에는 팝업만 열고 계속 만들기를 누를 때 guard를 다시 쌓는다', () => {
    const push = vi.spyOn(window.history, 'pushState')
    render(<Harness />)
    const pushesAfterMount = push.mock.calls.length

    dispatchPopState()

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('SoriON을 닫을까요?')).toBeInTheDocument()
    expect(push).toHaveBeenCalledTimes(pushesAfterMount)

    fireEvent.click(screen.getByRole('button', { name: '계속 만들기' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(push).toHaveBeenCalledTimes(pushesAfterMount + 1)
  })

  it('확인창이 열린 상태의 두 번째 뒤로가기는 보호 이력을 다시 만들지 않는다', () => {
    const push = vi.spyOn(window.history, 'pushState')
    render(<Harness />)
    const pushesAfterMount = push.mock.calls.length

    dispatchPopState()
    dispatchPopState()

    expect(push).toHaveBeenCalledTimes(pushesAfterMount)
  })

  it('종료 버튼은 base entry에서 한 번만 뒤로 이동한다', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    render(<Harness />)

    dispatchPopState()
    fireEvent.click(screen.getByRole('button', { name: '종료' }))

    expect(back).toHaveBeenCalledTimes(1)
  })
})
