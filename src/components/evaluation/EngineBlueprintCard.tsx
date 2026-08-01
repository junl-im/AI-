import type { EngineBlueprint } from '../../engines/catalogTypes'
import { StatusPill } from '../ui/StatusPill'

interface EngineBlueprintCardProps {
  blueprint: EngineBlueprint | null
  loading: boolean
  error: string | null
  onRefresh: () => void
}

const decisionLabel = {
  adopted: '채택',
  optional: '선택',
  benchmark: '벤치마크',
  'external-plugin': '외부 플러그인',
  'research-only': '연구 전용',
  excluded: '제외',
} as const

export function EngineBlueprintCard({
  blueprint,
  loading,
  error,
  onRefresh,
}: EngineBlueprintCardProps) {
  const adopted = blueprint?.items.filter((item) => item.decision === 'adopted') ?? []
  const research = blueprint?.items.filter((item) => (
    item.decision === 'benchmark'
    || item.decision === 'research-only'
    || item.decision === 'excluded'
  )) ?? []

  return (
    <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">
            KOREAN VOICE ORCHESTRATOR
          </span>
          <h2 className="mt-1 font-black tracking-[-0.035em]">무료 엔진 설계</h2>
        </div>
        <StatusPill label="엔진 자동 선택" tone="good" />
      </div>

      {loading ? <p className="mt-3 text-sm font-semibold text-soa-muted">엔진 설계를 확인하고 있습니다.</p> : null}
      {error ? (
        <div className="mt-3 rounded-2xl border border-soa-coral/30 bg-soa-coral/10 p-3">
          <p className="text-xs font-bold leading-5 text-soa-ink">{error}</p>
          <button type="button" onClick={onRefresh} className="focus-ring mt-2 text-xs font-black underline">
            다시 확인
          </button>
        </div>
      ) : null}

      {blueprint ? (
        <>
          <ol className="mt-4 space-y-2">
            {blueprint.pipeline.map((stage, index) => (
              <li key={stage.id} className="flex gap-3 rounded-2xl bg-white p-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-soa-ink text-[10px] font-black text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <strong className="block text-sm">{stage.name}</strong>
                  <span className="mt-1 block truncate text-[10px] font-bold text-soa-muted">
                    {stage.defaultEngineIds.join(' → ')}
                  </span>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {adopted.slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-2xl border border-soa-line bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm">{item.name}</strong>
                  <span className="text-[9px] font-black text-soa-violet">
                    {decisionLabel[item.decision]}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-soa-muted">{item.reason}</p>
              </div>
            ))}
          </div>

          <p className="mt-3 rounded-2xl bg-[#f4f2ec] p-3 text-[11px] font-semibold leading-5 text-soa-muted">
            F5-TTS·Kokoro 등은 품질만 보고 넣지 않습니다. 한국어·모델 라이선스·저사양 실행 기준을 통과해야 자동 경로에 들어옵니다. 현재 연구 후보 {research.length}개입니다.
          </p>
        </>
      ) : null}
    </article>
  )
}
