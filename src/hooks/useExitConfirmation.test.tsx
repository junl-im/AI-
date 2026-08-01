import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExitConfirmDialog } from '../components/ui/ExitConfirmDialog'
import { useExitConfirmation } from './useExitConfirmation'

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

  it('첫 뒤로가기에는 커스텀 종료 확인창을 보여준다', () => {
    render(<Harness />)

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('SoriON을 닫을까요?')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '계속 만들기' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('확인창이 열린 상태의 두 번째 뒤로가기는 브라우저 이력을 바로 빠져나간다', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => undefined)
    render(<Harness />)

    window.dispatchEvent(new PopStateEvent('popstate'))
    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(back).toHaveBeenCalledTimes(1)
  })

  it('종료 버튼은 앱이 넣은 두 개의 보호 이력을 건너뛴다', () => {
    const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined)
    render(<Harness />)

    window.dispatchEvent(new PopStateEvent('popstate'))
    fireEvent.click(screen.getByRole('button', { name: '종료' }))

    expect(go).toHaveBeenCalledWith(-2)
  })
})
