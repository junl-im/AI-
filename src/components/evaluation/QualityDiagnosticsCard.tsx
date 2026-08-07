import type { QualityDiagnostics } from '../../quality/qualityTypes'
import { StatusPill } from '../ui/StatusPill'

interface QualityDiagnosticsCardProps {
  diagnostics: QualityDiagnostics | null
  loading: boolean
  error: string | null
  resettingEngineId: string | null
  onRefresh: () => void
  onResetEngine: (engineId: string) => void
}

function successRateLabel(value: number | null) {
  return value === null ? '표본 없음' : `성공 ${Math.round(value * 100)}%`
}

function latencyLabel(value: number | null) {
  return value === null ? '지연 미측정' : `평균 ${Math.round(value)}ms`
}

export function QualityDiagnosticsCard({
  diagnostics,
  loading,
  error,
  resettingEngineId,
  onRefresh,
  onResetEngine,
}: QualityDiagnosticsCardProps) {
  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">ENGINE DIAGNOSTICS</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">실행 환경 점검</h2>
        </div>
        <StatusPill
          label={loading ? '확인 중' : diagnostics ? '연결됨' : 'API 필요'}
          tone={diagnostics ? 'good' : 'warning'}
        />
      </div>

      {diagnostics ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-soa-muted">
            <div className="rounded-2xl bg-[#f4f2ec] p-3">
              <span className="block text-[9px] tracking-[0.12em]">PYTHON</span>
              <strong className="mt-1 block text-soa-ink">{diagnostics.pythonVersion}</strong>
            </div>
            <div className="rounded-2xl bg-[#f4f2ec] p-3">
              <span className="block text-[9px] tracking-[0.12em]">MEMORY</span>
              <strong className="mt-1 block text-soa-ink">
                {diagnostics.memoryMb === null ? '측정 불가' : `${diagnostics.memoryMb} MB`}
              </strong>
            </div>
          </div>
          <p className="mt-2 truncate text-[11px] font-semibold text-soa-muted">{diagnostics.platform}</p>
          <div className="mt-4 space-y-3">
            {diagnostics.engines.map((engine) => {
              const resetting = resettingEngineId === engine.engineId
              return (
                <article key={engine.engineId} className="rounded-2xl border border-soa-line bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block truncate text-sm">{engine.name}</strong>
                      <span className="text-[10px] font-bold text-soa-muted">{engine.provider}</span>
                    </div>
                    <StatusPill
                      label={engine.health === 'probing'
                        ? '복구 확인 중'
                        : engine.health === 'cooldown'
                          ? `자동 격리 ${Math.ceil(engine.cooldownRemainingSeconds)}초`
                          : engine.selectionPenalty > 0
                            ? (engine.degradedRemainingSeconds > 0
                              ? `자동 우회 ${Math.ceil(engine.degradedRemainingSeconds)}초`
                              : '성능 기반 자동 감점')
                            : engine.recommended
                              ? '자동 우선'
                            : engine.ready
                              ? '대체 준비'
                              : '준비 필요'}
                      tone={engine.recommended && engine.health === 'ready' ? 'good' : 'warning'}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-bold text-soa-muted sm:grid-cols-4">
                    <span className="rounded-xl bg-[#f4f2ec] p-2">{successRateLabel(engine.successRate)}</span>
                    <span className="rounded-xl bg-[#f4f2ec] p-2">{latencyLabel(engine.averageLatencyMs)}</span>
                    <span className="rounded-xl bg-[#f4f2ec] p-2">격리 {engine.circuitOpenCount}회</span>
                    <span className="rounded-xl bg-[#f4f2ec] p-2">{engine.selectionPenalty > 0 ? `자동 감점 ${engine.selectionPenalty}` : `시도 ${engine.attemptCount}회`}</span>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-soa-muted">
                    {engine.qualityTier.toUpperCase()} · 한국어 {engine.koreanSpecialization} · 성공 {engine.successCount} · 실패 {engine.failureCount} · {engine.streaming ? '스트리밍 지원' : '완성 후 재생'}
                  </p>
                  {engine.selectionReason ? (
                    <p className="mt-1 text-[10px] font-bold leading-5 text-soa-muted">{engine.selectionReason}</p>
                  ) : null}

                  {engine.health === 'cooldown' ? (
                    <button
                      type="button"
                      disabled={resetting || loading}
                      onClick={() => onResetEngine(engine.engineId)}
                      className="focus-ring mt-3 min-h-9 rounded-xl border border-soa-line bg-white px-3 text-[11px] font-black disabled:opacity-50"
                    >
                      {resetting ? '격리 해제 중…' : '격리 상태 수동 초기화'}
                    </button>
                  ) : null}

                  {engine.lastFailureAt && engine.failureCount ? (
                    <p className="mt-2 break-words text-[10px] font-semibold leading-4 text-soa-muted">
                      최근 실패 {new Date(engine.lastFailureAt).toLocaleString('ko-KR')}
                    </p>
                  ) : null}

                  <div className="mt-3 space-y-2">
                    {engine.checks.map((check) => (
                      <div key={check.id} className="flex gap-2 text-[11px] leading-5">
                        <span
                          className={`mt-1.5 size-2 shrink-0 rounded-full ${check.status === 'ready' ? 'bg-emerald-500' : check.status === 'idle' ? 'bg-amber-400' : 'bg-soa-coral'}`}
                          aria-hidden="true"
                        />
                        <p>
                          <strong>{check.label}</strong>
                          <span className="block text-soa-muted">{check.detail}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f4f2ec] p-4 text-sm font-semibold leading-6 text-soa-muted">
          {error ?? '로컬 FastAPI를 실행하면 MeloTTS 설치, 시스템 음성, 메모리 상태를 확인할 수 있습니다.'}
        </p>
      )}

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="focus-ring mt-4 min-h-11 w-full rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50"
      >
        진단 다시 실행
      </button>
    </section>
  )
}
