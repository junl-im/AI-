import type { PropsWithChildren } from 'react'
import { BottomNavigation } from '../navigation/BottomNavigation'
import { BrandMark } from '../ui/BrandMark'
import { NoticeToast } from '../ui/NoticeToast'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col bg-soa-paper px-4 pt-4 sm:px-6">
      <header className="flex items-center justify-between py-2">
        <BrandMark />
        <span className="rounded-full border border-soa-line bg-soa-card px-3 py-1.5 text-[11px] font-semibold tracking-[-0.01em] text-soa-muted">
          FOUNDATION 0.1
        </span>
      </header>
      {children}
      <BottomNavigation />
      <NoticeToast />
    </div>
  )
}
