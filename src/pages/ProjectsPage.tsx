import { useEffect, useState } from 'react'
import { StatusPill } from '../components/ui/StatusPill'
import { listProjects } from '../projects/projectRepository'
import type { VoiceProject } from '../projects/projectTypes'
import { useAppStore } from '../store/useAppStore'

export function ProjectsPage() {
  const setPage = useAppStore((state) => state.setPage)
  const [projects, setProjects] = useState<VoiceProject[]>([])

  useEffect(() => {
    void listProjects().then(setProjects).catch(() => setProjects([]))
  }, [])

  return (
    <div className="pb-4 pt-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <StatusPill label="LOCAL FIRST" />
          <h1 className="mt-3 text-3xl font-black tracking-[-0.06em]">최근 프로젝트</h1>
        </div>
        <button type="button" onClick={() => setPage('home')} className="focus-ring rounded-full bg-soa-ink px-4 py-2 text-xs font-bold text-white">새로 만들기</button>
      </div>

      {projects.length === 0 ? (
        <section className="mt-8 rounded-[28px] border border-dashed border-soa-line bg-soa-card p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#ece9e1] text-2xl" aria-hidden="true">▣</div>
          <h2 className="mt-4 font-black tracking-[-0.035em]">아직 저장된 작업이 없습니다</h2>
          <p className="mt-2 text-sm leading-6 text-soa-muted">음성 생성 요청을 보내면 이 기기의 IndexedDB에 프로젝트가 자동 저장됩니다.</p>
        </section>
      ) : (
        <ul className="mt-6 space-y-3">
          {projects.map((project) => (
            <li key={project.id} className="rounded-[24px] border border-soa-line bg-soa-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-black tracking-[-0.03em]">{project.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-soa-muted">{project.text}</p>
                </div>
                <StatusPill label={project.status === 'generated' ? '완료' : '초안'} tone={project.status === 'generated' ? 'good' : 'neutral'} />
              </div>
              <p className="mt-3 text-[11px] font-semibold text-soa-muted">{new Date(project.updatedAt).toLocaleString('ko-KR')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
