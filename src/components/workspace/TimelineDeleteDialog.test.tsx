import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TimelineBlock } from '../../workspace/workspaceTypes'
import { TimelineDeleteDialog } from './TimelineDeleteDialog'

afterEach(cleanup)
const pause: TimelineBlock = { id: 'pause', kind: 'pause', durationSeconds: 0.5 }

describe('TimelineDeleteDialog', () => {
  it('focuses cancel and leaves clips intact on Escape', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<TimelineDeleteDialog blocks={[pause]} onCancel={onCancel} onConfirm={onConfirm} />)
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onConfirm).not.toHaveBeenCalled()
  })
  it('rechecks the live target list before confirmation', () => {
    const onConfirm = vi.fn()
    const { rerender } = render(<TimelineDeleteDialog blocks={[pause]} onCancel={vi.fn()} onConfirm={onConfirm} />)
    rerender(<TimelineDeleteDialog blocks={[]} onCancel={vi.fn()} onConfirm={onConfirm} />)
    expect(screen.getByRole('button', { name: '삭제 실행' })).toBeDisabled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
  it('confirms only the displayed clip ids', () => {
    const onConfirm = vi.fn()
    render(<TimelineDeleteDialog blocks={[pause]} onCancel={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: '삭제 실행' }))
    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(['pause'])
  })
})
