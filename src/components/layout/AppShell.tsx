import type { PropsWithChildren } from 'react'
import { BottomNavigation } from '../navigation/BottomNavigation'
import { NoticeToast } from '../ui/NoticeToast'
import { BrandMasthead } from './BrandMasthead'

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-dvh bg-[#070b14]">
      <BrandMasthead />
      <div className="relative mx-auto flex min-h-[62dvh] w-full max-w-[560px] flex-col rounded-t-[34px] bg-soa-paper px-4 pt-3 shadow-[0_-22px_80px_rgba(0,0,0,0.22)] sm:px-6 lg:rounded-[34px_34px_0_0]">
        {children}
        <BottomNavigation />
      </div>
      <NoticeToast />
    </div>
  )
}
