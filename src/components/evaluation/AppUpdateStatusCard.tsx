import { StatusPill } from '../ui/StatusPill'
import { applyAppUpdate, checkForAppUpdate, useAppUpdateStore, type AppUpdateStatus } from '../../update/appUpdate'
import { currentBuildInfo, formatBuildDiagnosticsLabel, formatBuildLabel } from '../../update/buildInfo'

function statusLabel(status: AppUpdateStatus): string {
  if (status === 'checking') return '확인 중'
  if (status === 'available') return '업데이트 있음'
  if (status === 'error') return '확인 실패'
  if (status === 'applying') return '적용 중'
  if (status === 'current') return '최신'
  return '미확인'
}

export function AppUpdateStatusCard() {
  const status = useAppUpdateStore((state) => state.status)
  const remote = useAppUpdateStore((state) => state.remote)
  const checkedAt = useAppUpdateStore((state) => state.checkedAt)
  const message = useAppUpdateStore((state) => state.message)
  const busy = status === 'checking' || status === 'applying'
  const tone = status === 'available' || status === 'error' ? 'warning' : status === 'current' ? 'good' : 'neutral'

  return (
    <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-black tracking-[-0.035em]">앱 업데이트</h2>
          <p className="mt-1 text-xs font-bold text-soa-muted">현재 버전 {formatBuildLabel(currentBuildInfo)}</p>
        </div>
        <StatusPill label={statusLabel(status)} tone={tone} />
      </div>
      <p className="mt-3 text-sm leading-6 text-soa-muted">
        배포본의 version.json을 캐시 없이 확인해 새 빌드가 있으면 안전하게 새로고침합니다.
      </p>
      <details className="mt-3 text-xs text-soa-muted">
        <summary className="cursor-pointer font-bold">고급 빌드 정보</summary>
        <p className="mt-2 break-all">{formatBuildDiagnosticsLabel(currentBuildInfo)}</p>
      </details>
      {remote && status === 'available' ? (
        <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs font-black text-amber-900">
          새 배포본: {formatBuildLabel(remote)}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-xs font-bold text-soa-muted">{message}</p> : null}
      {checkedAt ? (
        <p className="mt-1 text-[11px] text-soa-muted">마지막 확인 {new Date(checkedAt).toLocaleString('ko-KR')}</p>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void checkForAppUpdate({ force: true })}
          className="focus-ring min-h-12 rounded-2xl border border-soa-line bg-white font-bold disabled:opacity-50"
        >
          {status === 'checking' ? '확인 중…' : '업데이트 확인'}
        </button>
        <button
          type="button"
          disabled={status !== 'available' || busy}
          onClick={() => void applyAppUpdate()}
          className="focus-ring min-h-12 rounded-2xl bg-soa-ink font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
        >
          새 버전 적용
        </button>
      </div>
    </article>
  )
}
