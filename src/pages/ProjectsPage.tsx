import { useCallback, useEffect, useState } from 'react'
import { WorkspacePageHeader } from '../components/layout/WorkspacePageHeader'
import { StatusPill } from '../components/ui/StatusPill'
import { listProjects } from '../projects/projectRepository'
import type { VoiceProject } from '../projects/projectTypes'
import { useAppStore } from '../store/useAppStore'
import { getVoicePreset } from '../tts/voicePresets'

export function ProjectsPage() {
  const setPage = useAppStore((state) => state.setPage)
  const openProject = useAppStore((state) => state.openProject)
  const clearActiveProject = useAppStore((state) => state.clearActiveProject)
  const [projects, setProjects] = useState<VoiceProject[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setProjects(await listProjects())
    } catch {
      setProjects([])
      setLoadError('이 기기의 프로젝트 저장소를 읽지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  return (
    <div className="soa-secondary-page">
      <WorkspacePageHeader
        eyebrow="PROJECTS · LOCAL FIRST"
        title="최근 프로젝트"
        description="이 기기에 저장된 음성 작업을 이어서 편집하고, 서버에 남은 생성 결과를 자동으로 복구합니다."
        actions={(
          <button
            type="button"
            onClick={() => {
              clearActiveProject()
              setPage('home')
            }}
            className="soa-page-action"
          >
            새로 만들기
          </button>
        )}
      />

      {loading ? (
        <section className="mt-8 rounded-[28px] border border-soa-line bg-soa-card p-8 text-center" role="status">
          <div className="mx-auto size-8 animate-pulse rounded-full bg-soa-violet/25" aria-hidden="true" />
          <p className="mt-4 text-sm font-bold text-soa-muted">프로젝트를 불러오는 중입니다.</p>
        </section>
      ) : loadError ? (
        <section className="mt-8 rounded-[28px] border border-soa-coral/40 bg-soa-card p-8 text-center" role="alert">
          <h2 className="font-black tracking-[-0.035em]">프로젝트를 열 수 없습니다</h2>
          <p className="mt-2 text-sm leading-6 text-soa-muted">{loadError}</p>
          <button type="button" className="soa-page-action mt-4" onClick={() => void loadProjects()}>다시 확인</button>
        </section>
      ) : projects.length === 0 ? (
        <section className="mt-8 rounded-[28px] border border-dashed border-soa-line bg-soa-card p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#ece9e1] text-2xl" aria-hidden="true">▣</div>
          <h2 className="mt-4 font-black tracking-[-0.035em]">아직 저장된 작업이 없습니다</h2>
          <p className="mt-2 text-sm leading-6 text-soa-muted">음성을 생성하면 이 기기의 IndexedDB에 프로젝트 정보가 자동 저장됩니다.</p>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((project) => {
            const voice = getVoicePreset(project.voiceId)
            const isDemo = project.audioSource === 'browser-demo' || project.engineMode === 'mock'
            const modeLabel = isDemo ? '데모' : project.engineMode === 'ai' ? 'AI' : project.engineMode === 'local' ? '로컬' : project.status === 'generated' ? '완료' : '초안'
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => openProject(project)}
                  className="focus-ring w-full rounded-[24px] border border-soa-line bg-soa-card p-4 text-left transition hover:-translate-y-0.5 hover:border-soa-ink/25"
                  aria-label={`${project.title} 프로젝트 불러오기`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-black tracking-[-0.03em]">{project.title}</h2>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-soa-muted">{project.text}</p>
                    </div>
                    <StatusPill label={modeLabel} tone={isDemo ? 'warning' : project.status === 'generated' ? 'good' : 'neutral'} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-soa-muted">
                    <span>{voice.name}</span>
                    <span>{project.outputFormat?.toUpperCase() ?? 'WAV'}</span>
                    <span>{new Date(project.updatedAt).toLocaleString('ko-KR')}</span>
                    <strong className="ml-auto text-soa-ink">불러오기 →</strong>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
