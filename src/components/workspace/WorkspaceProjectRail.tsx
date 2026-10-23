import { ProjectDeleteButton } from './ProjectDeleteButton'
import { useEffect, useState } from 'react'
import { listProjects } from '../../projects/projectRepository'
import type { VoiceProject } from '../../projects/projectTypes'

interface WorkspaceProjectRailProps {
  currentTitle: string
  refreshKey: number
  onOpenProject: (project: VoiceProject) => void
  onNewProject: () => void
  onOpenProjects: () => void
  collapsed: boolean
  onToggleCollapsed: () => void
}

function projectTime(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function WorkspaceProjectRail({
  currentTitle,
  refreshKey,
  onOpenProject,
  onNewProject,
  onOpenProjects,
  collapsed,
  onToggleCollapsed,
}: WorkspaceProjectRailProps) {
  const [projects, setProjects] = useState<VoiceProject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setLoadError(false)
    void listProjects()
      .then((items) => {
        if (active) setProjects(items.slice(0, 10))
      })
      .catch(() => {
        if (active) { setProjects([]); setLoadError(true) }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [refreshKey, retry])

  return (
    <aside
      id="soa-project-rail"
      className={`soa-project-rail ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="프로젝트 목록"
    >
      <button
        type="button"
        className="soa-studio-panel-toggle"
        aria-label={collapsed ? '프로젝트 패널 펼치기' : '프로젝트 패널 접기'}
        aria-expanded={!collapsed}
        aria-controls="soa-project-rail"
        onClick={onToggleCollapsed}
      >
        <span aria-hidden="true">{collapsed ? '›' : '‹'}</span>{!collapsed ? <b>접기</b> : null}
      </button>
      {collapsed ? (
        <span className="soa-studio-panel-monogram" aria-hidden="true">P</span>
      ) : (
        <>
      <div className="soa-project-rail__head">
        <span>PROJECTS</span>
        <button type="button" onClick={onNewProject}>＋ 새 작업</button>
      </div>

      <div className="soa-project-rail__current" aria-current="page">
        <span aria-hidden="true">●</span>
        <span><strong>{currentTitle || '새 프로젝트'}</strong><small>현재 편집 중</small></span>
      </div>

      <div className="soa-project-rail__list" aria-live="polite">
        {loading ? <p>최근 작업을 불러오는 중…</p> : null}
        {!loading && !loadError && projects.length === 0 ? <p>저장된 프로젝트가 없습니다.</p> : null}
        {loadError && <div role="alert"><p>최근 작업을 불러오지 못했습니다.</p><button type="button" onClick={() => setRetry((value) => value + 1)}>다시 확인</button></div>}
        {projects.map((project) => (
          <div key={project.id} className="soa-project-rail__item">
          <button
            type="button"
            onClick={() => onOpenProject(project)}
            aria-label={`${project.title} 프로젝트 열기`}
          >
            <span aria-hidden="true">▤</span>
            <span>
              <strong>{project.title}</strong>
              <small>{projectTime(project.updatedAt)}</small>
            </span>
          </button>
          <ProjectDeleteButton project={project} onDeleted={(id) => setProjects((items) => items.filter((item) => item.id !== id))} />
          </div>
        ))}
      </div>

      <nav className="soa-project-rail__nav" aria-label="작업공간 바로가기">
        <button type="button" onClick={onOpenProjects}>전체 프로젝트</button>
      </nav>
        </>
      )}
    </aside>
  )
}
