import { beforeEach, expect, it, vi } from 'vitest'
import { clearPendingProjectSave, readPendingProjectSave, storePendingProjectSave } from './pendingProjectSave'
import type { VoiceProject } from './projectTypes'

const project: VoiceProject = {
  id: 'same-id', title: '긴 대본', text: '원본 대본', voiceId: 'sori-warm', emotion: 'neutral',
  createdAt: '2026-10-22T00:00:00Z', updatedAt: '2026-10-22T00:00:00Z', status: 'generated',
}

beforeEach(() => localStorage.clear())

it('stores and clears the complete recoverable project', () => {
  expect(storePendingProjectSave(project)).toBe(true)
  expect(readPendingProjectSave()).toEqual(project)
  clearPendingProjectSave()
  expect(readPendingProjectSave()).toBeNull()
})

it('rejects oversized content and stale or malformed snapshots', () => {
  expect(storePendingProjectSave({ ...project, text: '가'.repeat(20_001) })).toBe(false)
  localStorage.setItem('sorion-pending-project-save-v1', JSON.stringify({ version: 1, savedAt: 0, project }))
  expect(readPendingProjectSave()).toBeNull()
  localStorage.setItem('sorion-pending-project-save-v1', '{bad json')
  expect(readPendingProjectSave()).toBeNull()
})

it('reports unavailable browser storage without losing the current tab', () => {
  const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  expect(storePendingProjectSave(project)).toBe(false)
  setItem.mockRestore()
})
