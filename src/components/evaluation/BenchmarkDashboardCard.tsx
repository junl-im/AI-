import { useMemo, useState } from 'react'
import type { DeviceBenchmarkSummary, WorkerTelemetrySummary } from '../../quality/qualityTypes'
import { StatusPill } from '../ui/StatusPill'

interface BenchmarkDashboardCardProps {
  deviceSummary: DeviceBenchmarkSummary | null
  workerSummary: WorkerTelemetrySummary | null
  loading: boolean
  onRefresh: () => void
}

function compactHash(value: string) {
  return value ? `${value.slice(0, 10)}…${value.slice(-6)}` : 'digest 없음'
}

function metric(value: number | null, suffix = '') {
  return value === null ? '-' : `${Number(value.toFixed(3))}${suffix}`
}

function regressionLabel(status: 'insufficient' | 'stable' | 'warning' | 'regressed', available: number, minimum: number) {
  if (status === 'insufficient') return `기준선 ${available}/${minimum}`
  if (status === 'stable') return '기준선 안정'
  if (status === 'warning') return '회귀 주의'
  return '성능 회귀'
}

function regressionTone(status: 'insufficient' | 'stable' | 'warning' | 'regressed') {
  if (status === 'stable') return 'good' as const
  if (status === 'regressed') return 'danger' as const
  return 'warning' as const
}

export function BenchmarkDashboardCard({ deviceSummary, workerSummary, loading, onRefresh }: BenchmarkDashboardCardProps) {
  const [presetFilter, setPresetFilter] = useState('all')
  const [digestFilter, setDigestFilter] = useState('all')
  const groups = useMemo(() => workerSummary?.metricGroups ?? [], [workerSummary?.metricGroups])
  const presets = useMemo(() => [...new Set(groups.map((item) => item.presetId))].sort(), [groups])
  const digests = useMemo(() => [...new Set(groups.map((item) => item.modelDigest || 'missing'))].sort(), [groups])
  const filtered = groups.filter((item) => (
    (presetFilter === 'all' || item.presetId === presetFilter)
    && (digestFilter === 'all' || (item.modelDigest || 'missing') === digestFilter)
  ))

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">BENCHMARK DASHBOARD</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">모델·GPU·프리셋 성능 분리표</h2>
        </div>
        <StatusPill label={loading ? '집계 중' : `Worker ${workerSummary?.totalRecords ?? 0}건`} tone={(workerSummary?.totalRecords ?? 0) ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        짧은 Worker 자동 측정과 10·30·60분 실기기 soak를 섞지 않습니다. 모델 digest나 GPU가 다르면 별도 그룹으로 유지합니다.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-black">프리셋 필터
          <select value={presetFilter} onChange={(event) => setPresetFilter(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl border border-soa-line bg-white px-3">
            <option value="all">전체</option>
            {presets.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="text-xs font-black">모델 digest 필터
          <select value={digestFilter} onChange={(event) => setDigestFilter(event.target.value)} className="mt-1 min-h-10 w-full rounded-xl border border-soa-line bg-white px-3">
            <option value="all">전체</option>
            {digests.map((value) => <option key={value} value={value}>{compactHash(value === 'missing' ? '' : value)}</option>)}
          </select>
        </label>
      </div>

      {filtered.length ? (
        <div className="mt-4 space-y-2">
          {filtered.map((group) => (
            <div key={`${group.engineId}-${group.presetId}-${group.modelDigest}-${group.gpuName}`} className="rounded-2xl border border-soa-line bg-white p-3 text-[10px] font-bold leading-5 text-soa-muted">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-xs text-soa-ink">{group.presetId} · {group.modelId} {group.modelVersion}</strong>
                <div className="flex flex-wrap items-center gap-2">
                  <span>n={group.records} · 성공 {group.successRecords} · 실패율 {(group.failureRate * 100).toFixed(1)}%</span>
                  <StatusPill
                    label={regressionLabel(group.regression.status, group.regression.availableRecords, group.regression.minimumRecords)}
                    tone={regressionTone(group.regression.status)}
                  />
                </div>
              </div>
              <p>{group.deviceProfile} · {group.acceleratorName} · {group.gpuName || 'GPU 이름 없음'} · {compactHash(group.modelDigest)}</p>
              <p>first audio P50/P95 {metric(group.p50FirstAudioMs, 'ms')} / {metric(group.p95FirstAudioMs, 'ms')}</p>
              <p>RTF P50/P95 {metric(group.p50RealtimeFactor)} / {metric(group.p95RealtimeFactor)} · handoff P50/P95 {metric(group.p50FinalHandoffErrorMs, 'ms')} / {metric(group.p95FinalHandoffErrorMs, 'ms')}</p>
              {group.regression.baseline && group.regression.current ? (
                <div className="mt-2 rounded-xl bg-[#f7f5ef] px-3 py-2">
                  <p>기준→최근 · first audio {metric(group.regression.baseline.p95FirstAudioMs, 'ms')} → {metric(group.regression.current.p95FirstAudioMs, 'ms')} · RTF {metric(group.regression.baseline.p95RealtimeFactor)} → {metric(group.regression.current.p95RealtimeFactor)}</p>
                  <p>실패율 {(group.regression.baseline.failureRate * 100).toFixed(1)}% → {(group.regression.current.failureRate * 100).toFixed(1)}% · handoff {metric(group.regression.baseline.p95FinalHandoffErrorMs, 'ms')} → {metric(group.regression.current.p95FinalHandoffErrorMs, 'ms')}</p>
                </div>
              ) : null}
              {group.regression.reasons.length ? (
                <ul className="mt-2 list-disc pl-4 text-[10px]">
                  {group.regression.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f7f5ef] p-4 text-xs font-bold text-soa-muted">선택한 조건의 Worker 자동 텔레메트리가 없습니다.</p>
      )}

      <div className="mt-4 rounded-2xl bg-[#f7f5ef] p-3 text-[10px] font-bold leading-5 text-soa-muted">
        <strong className="text-xs text-soa-ink">실기기 soak 별도 집계</strong>
        <p>기록 {deviceSummary?.totalRecords ?? 0} · READY {deviceSummary?.readyRecords ?? 0} · 경고 {deviceSummary?.warningRecords ?? 0} · 실패 {deviceSummary?.failedRecords ?? 0}</p>
        <p>그룹 {deviceSummary?.metricGroups.length ?? 0}개 · 실제 인증은 Device Evidence 카드의 10·30·60분 표를 기준으로 판단합니다.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={loading} className="focus-ring mt-4 min-h-11 w-full rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50">benchmark 다시 집계</button>
    </section>
  )
}
