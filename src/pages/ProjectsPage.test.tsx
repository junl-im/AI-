import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { ProjectsPage } from './ProjectsPage'

const projectMocks = vi.hoisted(() => ({
  listProjects: vi.fn(),
  project: {
    id: 'project-1',
    title: '아침 안내 음성',
    text: '좋은 아침입니다. 오늘 일정을 안내합니다.',
    voiceId: 'sori-warm',
    emotion: 'neutral' as const,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T01:00:00.000Z',
    status: 'generated' as const,
    lastJobId: 'job-1',
    outputFormat: 'wav' as const,
  },
}))

vi.mock('../projects/projectRepository', () => ({
  listProjects: projectMocks.listProjects,
}))

describe('ProjectsPage', () => {
  beforeEach(() => {
    projectMocks.listProjects.mockReset().mockResolvedValue([projectMocks.project])
    useAppStore.setState({
      page: 'projects',
      workspaceEntered: true,
      activeProject: null,
      notice: null,
    })
  })

  it('opens a listed project in the creation workspace', async () => {
    render(<ProjectsPage />)

    const openButton = await screen.findByRole('button', {
      name: '아침 안내 음성 프로젝트 불러오기',
    })
    fireEvent.click(openButton)

    expect(useAppStore.getState()).toMatchObject({
      page: 'home',
      workspaceEntered: true,
      activeProject: projectMocks.project,
    })
  })

  it('shows a recoverable error state when local storage cannot be read', async () => {
    projectMocks.listProjects
      .mockRejectedValueOnce(new Error('indexeddb unavailable'))
      .mockResolvedValueOnce([])

    render(<ProjectsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('프로젝트를 열 수 없습니다')
    fireEvent.click(screen.getByRole('button', { name: '다시 확인' }))

    await waitFor(() => expect(projectMocks.listProjects).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('아직 저장된 작업이 없습니다')).toBeInTheDocument()
  })
})
