import { useAppStore, type AppPage, type BackendStatus } from '../../store/useAppStore'

const pageLabels: Record<AppPage, string> = {
  home: 'AI 음성 스튜디오',
  clone: '목소리 복제',
  quality: '품질 연구소',
  projects: '프로젝트',
  settings: '설정',
}

function statusLabel(status: BackendStatus): string {
  if (status === 'online') return '엔진 준비'
  if (status === 'degraded') return '부분 연결'
  if (status === 'checking') return '확인 중'
  return '연결 필요'
}

export function CompactWorkspaceHeader() {
  const page = useAppStore((state) => state.page)
  const backendStatus = useAppStore((state) => state.backendStatus)
  const engineHealth = useAppStore((state) => state.engineHealth)
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
        <div
          className={`soa-engine-chip is-${backendStatus}`}
          role="status"
          aria-label={`자동 엔진 상태: ${statusLabel(backendStatus)}`}
        >
          <span className="soa-engine-chip__dots" aria-hidden="true">
            <i className={`is-${engineHealth.api}`} />
            <i className={`is-${engineHealth.tts}`} />
            <i className={`is-${engineHealth.worker}`} />
            <i className={`is-${engineHealth.gpu}`} />
          </span>
          <span>{statusLabel(backendStatus)}</span>
          {engineHealth.latencyMs !== null ? <small>{engineHealth.latencyMs}ms</small> : null}
        </div>
        <button type="button" className="soa-intro-button" onClick={exitWorkspace}>
          처음
        </button>
      </div>
    </header>
  )
}
