import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useWorkspaceSessionPersistence } from './useWorkspaceSessionPersistence'
import { formatWorkspaceSavedLabel } from '../workspace/homeWorkspaceHelpers'
import type { WorkspaceSessionDraft, WorkspaceSessionSaveResult } from '../workspace/sessionTypes'
const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), checkpoint: vi.fn() }))
vi.mock('../workspace/workspaceSessionRepository', () => ({ loadWorkspaceSession: mocks.load, saveWorkspaceSession: mocks.save, checkpointWorkspaceSession: mocks.checkpoint }))
const draft: WorkspaceSessionDraft = {
  workspaceEntered: true, page: 'home', projectTitle: '테스트', voiceId: 'sori-warm',
  speechSpeed: 1, speechPitch: 0, speechEmotion: 'neutral', composerDraft: '첫 대본',
  directiveIds: ['numbers'], messages: [], blocks: [], batchRetrySnapshot: { retryCount: 0, history: [] },
}
beforeEach(() => { vi.useFakeTimers(); mocks.load.mockResolvedValue({ session: null, mode: 'indexeddb' }); mocks.save.mockReset(); mocks.checkpoint.mockReturnValue({ mode: 'localstorage', persisted: true }) })
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks() })
it('keeps saving visible when an older save finishes before the next debounce', async () => {
  let first!: (result: WorkspaceSessionSaveResult) => void
  mocks.save.mockImplementationOnce(() => new Promise(resolve => { first = resolve })).mockResolvedValue({ mode: 'indexeddb', persisted: true })
  const onRestore = vi.fn(); const onPersistenceUnavailable = vi.fn()
  const { result, rerender } = renderHook((props: WorkspaceSessionDraft) => useWorkspaceSessionPersistence({ ...props, onRestore, onPersistenceUnavailable }), { initialProps: draft })
  await act(async () => {})
  await act(async () => { await vi.advanceTimersByTimeAsync(450) })
  expect(result.current.savePending).toBe(true)
  rerender({ ...draft, composerDraft: '두 번째 대본' })
  await act(async () => { first({ mode: 'indexeddb', persisted: true }) })
  expect(result.current.savePending).toBe(true)
  expect(result.current.lastSavedAt).toBeNull()
  await act(async () => { await vi.advanceTimersByTimeAsync(450) })
  expect(result.current.savePending).toBe(false)
  expect(result.current.lastSavedAt).not.toBeNull()
})
it('clears saving on storage failure and accurately labels memory-only work', async () => {
  mocks.save.mockRejectedValue(new Error('storage unavailable'))
  const warning = vi.fn()
  const onRestore = vi.fn()
  const { result } = renderHook(() => useWorkspaceSessionPersistence({ ...draft, onRestore, onPersistenceUnavailable: warning }))
  await act(async () => {})
  await act(async () => { await vi.advanceTimersByTimeAsync(450) })
  expect(result.current.savePending).toBe(false)
  expect(result.current.storageMode).toBe('memory')
  expect(warning).toHaveBeenCalledOnce()
  expect(formatWorkspaceSavedLabel('2026-10-21T00:00:00Z', true, true)).toContain('창을 닫으면 사라집니다')
  expect(formatWorkspaceSavedLabel(null, true, false, true)).toBe('변경 내용 저장 중…')
})
