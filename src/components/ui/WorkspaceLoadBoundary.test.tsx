import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { WorkspaceLoadBoundary } from './WorkspaceLoadBoundary'

afterEach(() => vi.restoreAllMocks())
it('offers recovery from a failed chunk without erasing stored work', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
  window.localStorage.setItem('sorion-active-workspace-session', 'saved-draft')
  function FailedChunk(): never { throw new Error('Loading chunk failed') }
  render(<WorkspaceLoadBoundary><FailedChunk /></WorkspaceLoadBoundary>)
  expect(screen.getByRole('alert')).toHaveTextContent('편집기를 불러오지 못했습니다')
  expect(screen.getByRole('button', { name: '화면 다시 불러오기' })).toBeEnabled()
  expect(window.localStorage.getItem('sorion-active-workspace-session')).toBe('saved-draft')
  window.localStorage.removeItem('sorion-active-workspace-session')
})
