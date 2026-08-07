import { useMemo, useState, type ChangeEvent } from 'react'
import {
  compareRuntimeSoakReports,
  parseRuntimeSoakReport,
  type RuntimeSoakReport,
} from '../../quality/runtimeSoakReport'
import { StatusPill } from '../ui/StatusPill'

async function readFile(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽지 못했습니다.'))
    reader.readAsText(file)
  })
}

export function RuntimeSoakComparisonCard() {
  const [previous, setPrevious] = useState<RuntimeSoakReport | null>(null)
  const [current, setCurrent] = useState<RuntimeSoakReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const comparison = useMemo(
    () => previous && current ? compareRuntimeSoakReports(previous, current) : null,
    [current, previous],
  )

  async function load(event: ChangeEvent<HTMLInputElement>, target: 'previous' | 'current') {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const report = parseRuntimeSoakReport(await readFile(file))
      if (target === 'previous') setPrevious(report)
      else setCurrent(report)
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'runtime soak 보고서를 읽지 못했습니다.')
    }
  }

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">RUNTIME SOAK COMPARE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">이전 실행과 안정성 비교</h2>
        </div>
        <StatusPill
          label={comparison?.status === 'regressed' ? '회귀 감지' : comparison ? '안정' : '보고서 선택'}
          tone={comparison?.status === 'regressed' ? 'warning' : comparison ? 'good' : 'neutral'}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        `run_runtime_soak.py`가 만든 runtime-soak/2 JSON 두 개를 선택해 API·Worker의 응답, 성공률, 메모리와 복구 시간을 같은 기준으로 비교합니다.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="focus-ring rounded-2xl border border-soa-line bg-white p-3 text-xs font-black">
          이전 soak JSON
          <input className="mt-2 block w-full text-[11px]" type="file" accept="application/json,.json" onChange={(event) => void load(event, 'previous')} />
          <span className="mt-1 block text-[10px] text-soa-muted">{previous ? `v${previous.app_version} · ${previous.status}` : '미선택'}</span>
        </label>
        <label className="focus-ring rounded-2xl border border-soa-line bg-white p-3 text-xs font-black">
          현재 soak JSON
          <input className="mt-2 block w-full text-[11px]" type="file" accept="application/json,.json" onChange={(event) => void load(event, 'current')} />
          <span className="mt-1 block text-[10px] text-soa-muted">{current ? `v${current.app_version} · ${current.status}` : '미선택'}</span>
        </label>
      </div>
      {comparison ? (
        <div className="mt-3 space-y-2">
          {comparison.targets.map((item) => (
            <div key={item.target} className="rounded-xl bg-white p-3 text-xs font-bold leading-5">
              <div className="flex items-center justify-between gap-2">
                <strong>{item.target}</strong>
                <StatusPill label={item.status} tone={item.status === 'regressed' ? 'warning' : item.status === 'stable' ? 'good' : 'neutral'} />
              </div>
              {item.reasons.length ? <ul className="mt-1 list-disc pl-4 text-soa-coral">{item.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p className="mt-1 text-soa-muted">기준 임계치를 넘는 회귀가 없습니다.</p>}
            </div>
          ))}
        </div>
      ) : null}
      {error ? <p className="mt-3 text-xs font-bold text-soa-coral">{error}</p> : null}
    </section>
  )
}
