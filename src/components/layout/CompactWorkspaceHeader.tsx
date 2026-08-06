import { workspacePageLabels } from '../../navigation/navigationItems'
import { useAppStore } from '../../store/useAppStore'
import { BrandMark } from '../ui/BrandMark'

export function CompactWorkspaceHeader() {
  const page = useAppStore((state) => state.page)
  const enterWorkspace = useAppStore((state) => state.enterWorkspace)
  const exitWorkspace = useAppStore((state) => state.exitWorkspace)

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
