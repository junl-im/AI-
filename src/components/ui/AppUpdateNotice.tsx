import { applyAppUpdate, dismissAppUpdate, useAppUpdateStore } from '../../update/appUpdate'
import { formatBuildLabel } from '../../update/buildInfo'

export function AppUpdateNotice() {
  const status = useAppUpdateStore((state) => state.status)
  const remote = useAppUpdateStore((state) => state.remote)
  const dismissedBuildId = useAppUpdateStore((state) => state.dismissedBuildId)

  if (status !== 'available' || !remote || dismissedBuildId === remote.buildId) return null

  return (
    <aside
      role="alert"
      className="mx-auto mt-2 flex w-[calc(100%-1.5rem)] max-w-[1180px] flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm shadow-sm"
    >
      <div>
        <strong className="font-black text-soa-ink">새 SoriON 업데이트가 준비됐습니다.</strong>
        <p className="mt-0.5 text-xs font-semibold text-soa-muted">{formatBuildLabel(remote)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void applyAppUpdate()}
          className="focus-ring min-h-10 rounded-xl bg-soa-ink px-4 font-black text-white"
        >
          지금 적용
        </button>
        <button
          type="button"
          onClick={dismissAppUpdate}
          className="focus-ring min-h-10 rounded-xl border border-soa-line bg-white px-3 font-bold"
          aria-label="업데이트 알림 닫기"
        >
          나중에
        </button>
      </div>
    </aside>
  )
}
