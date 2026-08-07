import { useMemo, useState, type ChangeEvent } from 'react'
import {
  buildRuntimeSoakArtifactProvenance,
  buildRuntimeSoakComparisonEvidence,
  compareRuntimeSoakReports,
  parseRuntimeSoakReport,
  type RuntimeSoakArtifactProvenance,
  type RuntimeSoakReport,
} from '../../quality/runtimeSoakReport'
import { StatusPill } from '../ui/StatusPill'

interface LoadedSoakReport {
  report: RuntimeSoakReport
  provenance: RuntimeSoakArtifactProvenance
}

async function readFile(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error ?? new Error('파일을 읽지 못했습니다.'))
    reader.readAsText(file)
  })
}

async function sha256Text(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return ''
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  )
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
}

function shortHash(value: string): string {
  return value ? `${value.slice(0, 10)}…` : '계산 불가'
}

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function RuntimeSoakComparisonCard() {
  const [previous, setPrevious] = useState<LoadedSoakReport | null>(null)
  const [current, setCurrent] = useState<LoadedSoakReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const comparison = useMemo(
    () => previous && current ? compareRuntimeSoakReports(previous.report, current.report) : null,
    [current, previous],
  )

  async function load(event: ChangeEvent<HTMLInputElement>, target: 'previous' | 'current') {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await readFile(file)
      const report = parseRuntimeSoakReport(text)
      const loadedAt = new Date().toISOString()
      const fileSha256 = await sha256Text(text)
      const loaded = {
        report,
        provenance: buildRuntimeSoakArtifactProvenance(
          report,
          file.name,
          fileSha256,
          loadedAt,
        ),
      }
      if (target === 'previous') setPrevious(loaded)
      else setCurrent(loaded)
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
          <span className="mt-1 block text-[10px] text-soa-muted">{previous ? `${previous.provenance.file_name} · v${previous.report.app_version}` : '미선택'}</span>
        </label>
        <label className="focus-ring rounded-2xl border border-soa-line bg-white p-3 text-xs font-black">
          현재 soak JSON
          <input className="mt-2 block w-full text-[11px]" type="file" accept="application/json,.json" onChange={(event) => void load(event, 'current')} />
          <span className="mt-1 block text-[10px] text-soa-muted">{current ? `${current.provenance.file_name} · v${current.report.app_version}` : '미선택'}</span>
        </label>
      </div>
      {previous && current ? (
        <div className="mt-3 grid gap-2 text-[10px] font-bold text-soa-muted sm:grid-cols-2" aria-label="soak 비교 provenance">
          <div className="rounded-xl bg-white p-3">
            <strong className="block text-soa-ink">이전 증거</strong>
            <span className="block break-all">{previous.provenance.file_name}</span>
            <span className="block">SHA {shortHash(previous.provenance.file_sha256)}</span>
            <span className="block">수집 {previous.report.completed_at || '미기록'}</span>
          </div>
          <div className="rounded-xl bg-white p-3">
            <strong className="block text-soa-ink">현재 증거</strong>
            <span className="block break-all">{current.provenance.file_name}</span>
            <span className="block">SHA {shortHash(current.provenance.file_sha256)}</span>
            <span className="block">수집 {current.report.completed_at || '미기록'}</span>
          </div>
        </div>
      ) : null}
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
          {previous && current ? (
            <button
              type="button"
              className="focus-ring min-h-10 rounded-xl border border-soa-line bg-white px-3 text-xs font-black"
              onClick={() => downloadJson(
                buildRuntimeSoakComparisonEvidence(
                  previous.provenance,
                  current.provenance,
                  comparison,
                ),
                `sorion-runtime-soak-comparison-${new Date().toISOString().slice(0, 10)}.json`,
              )}
            >비교 증거 JSON 저장</button>
          ) : null}
        </div>
      ) : null}
      {error ? <p className="mt-3 text-xs font-bold text-soa-coral">{error}</p> : null}
    </section>
  )
}
