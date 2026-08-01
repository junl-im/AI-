import type { PropsWithChildren } from 'react'
import { useBackendBootstrap } from '../../hooks/useBackendBootstrap'
import { getCurrentTrack, usePlayerStore } from '../../store/usePlayerStore'
import { useAppStore } from '../../store/useAppStore'
import { LinkedPlayerDock } from '../navigation/LinkedPlayerDock'
import { ConnectionBottomSheet } from '../settings/ConnectionBottomSheet'
import { NoticeToast } from '../ui/NoticeToast'
import { BrandMasthead } from './BrandMasthead'
import { CompactWorkspaceHeader } from './CompactWorkspaceHeader'

export function AppShell({ children }: PropsWithChildren) {
  useBackendBootstrap()
  const workspaceEntered = useAppStore((state) => state.workspaceEntered)
  const hasPlayer = usePlayerStore((state) => getCurrentTrack(state) !== null)
  const shellClassName = [
    'soa-workspace-shell',
    workspaceEntered ? 'soa-workspace-shell--editor' : 'soa-workspace-shell--landing',
    hasPlayer ? 'soa-workspace-shell--has-player' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={workspaceEntered ? 'soa-app-root is-editor' : 'soa-app-root is-landing'}>
      {workspaceEntered ? <CompactWorkspaceHeader /> : <BrandMasthead />}
      <div className={shellClassName}>
        <section className="soa-primary-frame">{children}</section>
      </div>
      <LinkedPlayerDock />
      <ConnectionBottomSheet />
      <NoticeToast />
    </div>
  )
}
