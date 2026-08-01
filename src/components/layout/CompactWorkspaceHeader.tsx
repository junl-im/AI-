import { useAppStore, type AppPage, type BackendStatus } from '../../store/useAppStore'

const pageLabels: Record<AppPage, string> = {
  home: 'AI 음성 스튜디오',
  clone: '목소리 복제',
  quality: '품질 연구소',
  projects: '프로젝트',
  settings: '설정',
}

function statusLabel(status: BackendStatus): string {
  if (status === 'online') return '실제 엔진 준비'
  if (status === 'degraded') return 'Demo 엔진'
  if (status === 'checking') return '연결 확인 중'
  return '엔진 연결'
}

export function CompactWorkspaceHeader() {
  const page = useAppStore((state) => state.page)
  const backendStatus = useAppStore((state) => state.backendStatus)
  const openConnectionSheet = useAppStore((state) => state.openConnectionSheet)
  const exitWorkspace = useAppStore((state) => state.exitWorkspace)

  return (
    <header className="soa-compact-header">
      <button type="button" className="soa-compact-brand" onClick={exitWorkspace}>
        <span aria-hidden="true">S</span>
        <span>
          <strong>SoriON AI</strong>
          <small>{pageLabels[page]}</small>
        </span>
      </button>
      <div className="soa-compact-header__actions">
        <button
          type="button"
          className={`soa-engine-chip is-${backendStatus}`}
          onClick={openConnectionSheet}
        >
          <i aria-hidden="true" />
          {statusLabel(backendStatus)}
        </button>
        <button type="button" className="soa-intro-button" onClick={exitWorkspace}>
          처음 화면
        </button>
      </div>
    </header>
  )
}
