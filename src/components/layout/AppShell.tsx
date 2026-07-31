import type { PropsWithChildren } from 'react'
import { LinkedPlayerDock } from '../navigation/LinkedPlayerDock'
import { NoticeToast } from '../ui/NoticeToast'
import { getCurrentTrack, usePlayerStore } from '../../store/usePlayerStore'
import { BrandMasthead } from './BrandMasthead'
import { DesktopContextFrame } from './DesktopContextFrame'

export function AppShell({ children }: PropsWithChildren) {
  const hasPlayer = usePlayerStore((state) => getCurrentTrack(state) !== null)
  const workspaceClassName = hasPlayer
    ? 'soa-workspace-shell soa-workspace-shell--has-player'
    : 'soa-workspace-shell'

  return (
    <div className="min-h-dvh bg-[#070b14]">
      <BrandMasthead />
      <div className={workspaceClassName}>
        <section className="soa-primary-frame">{children}</section>
        <DesktopContextFrame />
      </div>
      <LinkedPlayerDock />
      <NoticeToast />
    </div>
  )
}
