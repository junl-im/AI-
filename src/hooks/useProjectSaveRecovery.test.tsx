import { act, renderHook } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import type { VoiceProject } from '../projects/projectTypes'
import { useProjectSaveRecovery } from './useProjectSaveRecovery'

const mocks = vi.hoisted(() => ({ saveProject: vi.fn() }))
vi.mock('../projects/projectRepository', () => ({ saveProject: mocks.saveProject }))
const project: VoiceProject = {
  id: 'stable-project-id', title: '긴 대본', text: '원본 대본입니다.',
  voiceId: 'sori-warm', emotion: 'neutral', createdAt: '2026-10-22T00:00:00Z',
  updatedAt: '2026-10-22T00:00:00Z', status: 'generated',
}

beforeEach(() => mocks.saveProject.mockReset())

it('failed project save retries the same ID and clears the warning after success', async () => {
  mocks.saveProject.mockRejectedValueOnce(new Error('storage blocked')).mockResolvedValue(undefined)
  const { result } = renderHook(() => useProjectSaveRecovery())
  await act(async () => { expect(await result.current.save(project)).toBe(false) })
  expect(result.current.pendingProject?.id).toBe('stable-project-id')
  await act(async () => { expect(await result.current.retry()).toBe(true) })
  expect(result.current.pendingProject).toBeNull()
  expect(mocks.saveProject).toHaveBeenCalledTimes(2)
  expect(mocks.saveProject.mock.calls[0][0]).toBe(project)
  expect(mocks.saveProject.mock.calls[1][0]).toBe(project)
})

it('failed retry preserves the project for another attempt', async () => {
  mocks.saveProject.mockRejectedValueOnce(new Error('storage blocked'))
    .mockRejectedValueOnce(new Error('still blocked'))
  const { result } = renderHook(() => useProjectSaveRecovery())
  await act(async () => { await result.current.save(project) })
  await act(async () => { expect(await result.current.retry()).toBe(false) })
  expect(result.current.pendingProject).toBe(project)
  expect(result.current.retrying).toBe(false)
  act(() => result.current.clear())
  expect(result.current.pendingProject).toBeNull()
})
