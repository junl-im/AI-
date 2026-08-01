import { workspacePageLabels } from '../../navigation/navigationItems'
import { useAppStore, type BackendStatus } from '../../store/useAppStore'

function statusLabel(status: BackendStatus): string {
  if (status === 'online') return '엔진 준비'
  if (status === 'degraded') return '제한 모드'
  if (status === 'checking') return '확인 중'
  return '준비 중'
}

export function CompactWorkspaceHeader() {
  const page = useAppStore((state) => state.page)
  const backendStatus = useAppStore((state) => state.backendStatus)
  const engineHealth = useAppStore((state) => state.engineHealth)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const exitWorkspace = useAppStore((state) => state.exitWorkspace)

  return (
    <header className="soa-compact-header">
      <button type="button" className="soa-compact-brand" onClick={() => enterWorkspace('home')}>
        <span aria-hidden="true">S</span>
        <span>
          <strong>SoriON AI</strong>
          <small>{workspacePageLabels[page]}</small>
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
        <button
          type="button"
          className="soa-settings-button"
          aria-current={page === 'settings' ? 'page' : undefined}
          onClick={() => enterWorkspace('settings')}
        >
          설정
        </button>
        <button type="button" className="soa-intro-button" onClick={exitWorkspace}>
          처음
        </button>
      </div>
    </header>
  )
}
