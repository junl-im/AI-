import type { PropsWithChildren } from 'react'
import { LinkedPlayerDock } from '../navigation/LinkedPlayerDock'
import { NoticeToast } from '../ui/NoticeToast'
import { BrandMasthead } from './BrandMasthead'
import { DesktopContextFrame } from './DesktopContextFrame'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-[#070b14]">
      <BrandMasthead />
      <div className="soa-workspace-shell">
        <section className="soa-primary-frame">{children}</section>
        <DesktopContextFrame />
      </div>
      <LinkedPlayerDock />
      <NoticeToast />
    </div>
  )
}
