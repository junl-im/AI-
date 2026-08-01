import type { PropsWithChildren } from 'react'
import { useBackendBootstrap } from '../../hooks/useBackendBootstrap'
import { useExitConfirmation } from '../../hooks/useExitConfirmation'
import { getCurrentTrack, usePlayerStore } from '../../store/usePlayerStore'
import { useAppStore } from '../../store/useAppStore'
import { LinkedPlayerDock } from '../navigation/LinkedPlayerDock'
import { ExitConfirmDialog } from '../ui/ExitConfirmDialog'
import { NoticeToast } from '../ui/NoticeToast'
import { BrandMasthead } from './BrandMasthead'
import { CompactWorkspaceHeader } from './CompactWorkspaceHeader'

export function AppShell({ children }: PropsWithChildren) {
  useBackendBootstrap()
  const exitConfirmation = useExitConfirmation()
  const workspaceEntered = useAppStore((state) => state.workspaceEntered)
  const page = useAppStore((state) => state.page)
  const hasPlayer = usePlayerStore((state) => (
    workspaceEntered && getCurrentTrack(state) !== null
  ))
  const shellClassName = [
    'soa-workspace-shell',
    workspaceEntered ? 'soa-workspace-shell--editor' : 'soa-workspace-shell--landing',
    hasPlayer ? 'soa-workspace-shell--has-player' : '',
    workspaceEntered && page === 'home' ? 'soa-workspace-shell--dubbing' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={workspaceEntered ? 'soa-app-root is-editor' : 'soa-app-root is-landing'}>
      {workspaceEntered ? <CompactWorkspaceHeader /> : <BrandMasthead />}
      <div className={shellClassName}>
        <section className="soa-primary-frame">{children}</section>
      </div>
      {workspaceEntered ? <LinkedPlayerDock /> : null}
      <NoticeToast />
      <ExitConfirmDialog
        open={exitConfirmation.open}
        onStay={exitConfirmation.stay}
        onExit={exitConfirmation.exit}
      />
    </div>
  )
}
