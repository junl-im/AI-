import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAppStore } from '../../store/useAppStore'
import { NoticeToast } from './NoticeToast'

afterEach(() => {
  cleanup()
  useAppStore.getState().clearNotice()
  document.querySelector('.soa-dubbing-player-dock')?.remove()
})

it('모바일 Dock 높이가 바뀌어도 안내 알림을 Dock 위에 둔다', () => {
  const dock = document.createElement('aside')
  dock.className = 'soa-dubbing-player-dock'
  let top = window.innerHeight - 158
  vi.spyOn(dock, 'getBoundingClientRect').mockImplementation(() => ({
    top,
    height: window.innerHeight - top,
  }) as DOMRect)
  document.body.append(dock)
  act(() => useAppStore.getState().showNotice('별하 WAV 엔진 불러오는 중'))
  render(<NoticeToast />)
  expect(screen.getByRole('status')).toHaveStyle({ bottom: '170px' })

  top = window.innerHeight - 224
  act(() => window.dispatchEvent(new Event('resize')))
  expect(screen.getByRole('status')).toHaveStyle({ bottom: '236px' })
})
