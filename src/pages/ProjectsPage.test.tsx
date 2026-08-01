import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../store/useAppStore'
import { ProjectsPage } from './ProjectsPage'

const projectMocks = vi.hoisted(() => ({
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
  listProjects: vi.fn().mockResolvedValue([projectMocks.project]),
}))

describe('ProjectsPage', () => {
  beforeEach(() => {
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
})
