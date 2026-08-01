import { workspacePageLabels } from '../../navigation/navigationItems'
import { useAppStore, type BackendStatus } from '../../store/useAppStore'
import { BrandMark } from '../ui/BrandMark'

function statusLabel(status: BackendStatus, browserTtsReady: boolean): string {
  if (status === 'online') return 'AI 엔진 준비'
  if (status === 'degraded' && browserTtsReady) return '브라우저 음성'
  if (status === 'degraded') return '제한 모드'
  if (status === 'checking') return '확인 중'
  if (status === 'offline') return '서버 미연결'
  return '준비 중'
}

export function CompactWorkspaceHeader() {
  const page = useAppStore((state) => state.page)
  const backendStatus = useAppStore((state) => state.backendStatus)
  const engineHealth = useAppStore((state) => state.engineHealth)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const exitWorkspace = useAppStore((state) => state.exitWorkspace)
  const browserTtsReady = backendStatus === 'degraded'
    && engineHealth.tts === 'ready'
    && engineHealth.api !== 'ready'

  return (
    <header className="soa-compact-header">
      <button
        type="button"
        className="soa-compact-brand"
        onClick={exitWorkspace}
        aria-label="SoriON AI 첫 페이지로 이동"
      >
        <BrandMark compact />
        <span className="soa-compact-brand__page">{workspacePageLabels[page]}</span>
      </button>
      <div className="soa-compact-header__actions">
        <div
          className={`soa-engine-chip is-${backendStatus}`}
          role="status"
          aria-label={`자동 엔진 상태: ${statusLabel(backendStatus, browserTtsReady)}`}
        >
          <span className="soa-engine-chip__dots" aria-hidden="true">
            <i className={`is-${engineHealth.api}`} />
            <i className={`is-${engineHealth.tts}`} />
            <i className={`is-${engineHealth.worker}`} />
            <i className={`is-${engineHealth.gpu}`} />
          </span>
          <span>{statusLabel(backendStatus, browserTtsReady)}</span>
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
