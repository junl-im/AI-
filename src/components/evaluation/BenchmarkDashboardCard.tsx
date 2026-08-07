import { useMemo, useState } from 'react'
import {
  confirmWorkerOperatorBaseline,
  getWorkerOperatorBaselineHistory,
  previewWorkerOperatorBaselineRestore,
  restoreWorkerOperatorBaseline,
  retireWorkerOperatorBaseline,
} from '../../quality/qualityApi'
import type {
  DeviceBenchmarkSummary,
  OperatorBaselineHistoryEntry,
  OperatorBaselineRestorePreview,
  WorkerTelemetrySummary,
  WorkerTelemetryAggregate,
} from '../../quality/qualityTypes'
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
  const [baselineBusy, setBaselineBusy] = useState<string | null>(null)
  const [baselineNotice, setBaselineNotice] = useState<string | null>(null)
  const [baselineError, setBaselineError] = useState<string | null>(null)
  const [historyOpenGroup, setHistoryOpenGroup] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState<string | null>(null)
  const [historyByGroup, setHistoryByGroup] = useState<Record<string, OperatorBaselineHistoryEntry[]>>({})
  const [restorePreview, setRestorePreview] = useState<OperatorBaselineRestorePreview | null>(null)
  const groups = useMemo(() => workerSummary?.metricGroups ?? [], [workerSummary?.metricGroups])
  const presets = useMemo(() => [...new Set(groups.map((item) => item.presetId))].sort(), [groups])
  const digests = useMemo(() => [...new Set(groups.map((item) => item.modelDigest || 'missing'))].sort(), [groups])
  const filtered = groups.filter((item) => (
    (presetFilter === 'all' || item.presetId === presetFilter)
    && (digestFilter === 'all' || (item.modelDigest || 'missing') === digestFilter)
  ))

  async function confirmBaseline(group: WorkerTelemetryAggregate) {
    const replacing = Boolean(group.operatorBaseline)
    if (!window.confirm(replacing
      ? '현재 최근 5건으로 운영자 기준선을 교체할까요?'
      : '현재 최근 5건을 운영자 확정 기준선으로 저장할까요?')) return
    setBaselineBusy(group.operatorBaseline?.baselineId ?? group.engineId + group.presetId)
    setBaselineError(null)
    setBaselineNotice(null)
    try {
      const baseline = await confirmWorkerOperatorBaseline(
        group,
        replacing ? 'Quality Lab에서 운영자 기준선 교체' : 'Quality Lab에서 운영자 기준선 최초 확정',
      )
      setBaselineNotice(`운영자 기준선 ${baseline.baselineId.slice(0, 12)}…을 확정했습니다.`)
      onRefresh()
    } catch (caught) {
      setBaselineError(caught instanceof Error ? caught.message : '운영자 기준선을 확정하지 못했습니다.')
    } finally {
      setBaselineBusy(null)
    }
  }

  async function retireBaseline(group: WorkerTelemetryAggregate) {
    const baseline = group.operatorBaseline
    if (!baseline || !window.confirm('이 운영자 기준선을 폐기할까요? 자동 기준선은 계속 유지됩니다.')) return
    setBaselineBusy(baseline.baselineId)
    setBaselineError(null)
    setBaselineNotice(null)
    try {
      await retireWorkerOperatorBaseline(baseline.baselineId, 'Quality Lab에서 운영자 기준선 폐기')
      setBaselineNotice('운영자 기준선을 폐기했습니다. 자동 기준선 평가는 계속됩니다.')
      onRefresh()
    } catch (caught) {
      setBaselineError(caught instanceof Error ? caught.message : '운영자 기준선을 폐기하지 못했습니다.')
    } finally {
      setBaselineBusy(null)
    }
  }

  async function toggleHistory(group: WorkerTelemetryAggregate) {
    if (historyOpenGroup === group.groupKey) {
      setHistoryOpenGroup(null)
      setRestorePreview(null)
      return
    }
    setHistoryOpenGroup(group.groupKey)
    setRestorePreview(null)
    if (historyByGroup[group.groupKey]) return
    setHistoryLoading(group.groupKey)
    setBaselineError(null)
    try {
      const history = await getWorkerOperatorBaselineHistory(group.groupKey)
      setHistoryByGroup((current) => ({ ...current, [group.groupKey]: history }))
    } catch (caught) {
      setBaselineError(caught instanceof Error ? caught.message : '운영자 기준선 이력을 불러오지 못했습니다.')
    } finally {
      setHistoryLoading(null)
    }
  }

  async function previewRestore(entry: OperatorBaselineHistoryEntry) {
    setBaselineBusy(entry.baseline.baselineId)
    setBaselineError(null)
    try {
      setRestorePreview(await previewWorkerOperatorBaselineRestore(entry.baseline.baselineId))
    } catch (caught) {
      setBaselineError(caught instanceof Error ? caught.message : '복원 미리보기를 불러오지 못했습니다.')
    } finally {
      setBaselineBusy(null)
    }
  }

  async function restoreBaseline(group: WorkerTelemetryAggregate) {
    if (!restorePreview) return
    const target = restorePreview.target
    if (!window.confirm(`${new Date(target.createdAt).toLocaleString('ko-KR')} 기준선으로 복원할까요? 현재 기준선도 이력에 남습니다.`)) return
    setBaselineBusy(target.baselineId)
    setBaselineError(null)
    setBaselineNotice(null)
    try {
      await restoreWorkerOperatorBaseline(target.baselineId, 'Quality Lab 복원 미리보기 확인 후 복원')
      const history = await getWorkerOperatorBaselineHistory(group.groupKey)
      setHistoryByGroup((current) => ({ ...current, [group.groupKey]: history }))
      setRestorePreview(null)
      setBaselineNotice('과거 운영자 기준선을 복원했습니다. 교체된 기준선은 이력에 그대로 보존됩니다.')
      onRefresh()
    } catch (caught) {
      setBaselineError(caught instanceof Error ? caught.message : '과거 운영자 기준선을 복원하지 못했습니다.')
    } finally {
      setBaselineBusy(null)
    }
  }

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
              <div className="mt-3 rounded-xl border border-soa-line bg-[#fbfaf6] px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong className="text-xs text-soa-ink">운영자 확정 기준선</strong>
                    <p>{group.operatorBaseline
                      ? `${new Date(group.operatorBaseline.createdAt).toLocaleString('ko-KR')} · 최근 ${group.operatorBaseline.sourceRecords}건 snapshot`
                      : '아직 확정하지 않음 · 자동 기준선과 별도로 관리'}</p>
                  </div>
                  {group.operatorRegression ? (
                    <StatusPill
                      label={`운영자 ${regressionLabel(group.operatorRegression.status, group.operatorRegression.availableRecords, 5)}`}
                      tone={regressionTone(group.operatorRegression.status)}
                    />
                  ) : null}
                </div>
                {group.operatorBaseline ? (
                  <p className="mt-1 font-mono">SHA-256 {compactHash(group.operatorBaseline.sourceRecordsSha256)}</p>
                ) : null}
                {group.operatorRegression?.reasons.length ? (
                  <ul className="mt-1 list-disc pl-4">
                    {group.operatorRegression.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void confirmBaseline(group)}
                    disabled={group.records < 5 || baselineBusy !== null}
                    className="focus-ring min-h-9 rounded-xl border border-soa-line bg-white px-3 text-[10px] font-black disabled:opacity-40"
                  >{group.operatorBaseline ? '현재 5건으로 교체' : '현재 5건 기준선 확정'}</button>
                  {group.operatorBaseline ? (
                    <button
                      type="button"
                      onClick={() => void retireBaseline(group)}
                      disabled={baselineBusy !== null}
                      className="focus-ring min-h-9 rounded-xl border border-soa-line bg-white px-3 text-[10px] font-black disabled:opacity-40"
                    >기준선 폐기</button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void toggleHistory(group)}
                    disabled={historyLoading === group.groupKey}
                    className="focus-ring min-h-9 rounded-xl border border-soa-line bg-white px-3 text-[10px] font-black disabled:opacity-40"
                  >{historyLoading === group.groupKey ? '이력 불러오는 중…' : historyOpenGroup === group.groupKey ? '이력 닫기' : '기준선 이력'}</button>
                </div>
                {historyOpenGroup === group.groupKey ? (
                  <div className="mt-3 space-y-2 border-t border-soa-line pt-3" aria-label={`${group.presetId} 운영자 기준선 이력`}>
                    {(historyByGroup[group.groupKey] ?? []).length ? (historyByGroup[group.groupKey] ?? []).map((entry) => (
                      <div key={entry.baseline.baselineId} className="rounded-xl bg-white px-3 py-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <strong className="text-[11px] text-soa-ink">{new Date(entry.baseline.createdAt).toLocaleString('ko-KR')} · {entry.baseline.sourceRecords}건</strong>
                          <StatusPill label={entry.status === 'active' ? '현재 사용 중' : '과거 기준선'} tone={entry.status === 'active' ? 'good' : 'warning'} />
                        </div>
                        <p>first audio P95 {metric(entry.baseline.metrics.p95FirstAudioMs, 'ms')} · RTF P95 {metric(entry.baseline.metrics.p95RealtimeFactor)} · 실패율 {(entry.baseline.metrics.failureRate * 100).toFixed(1)}%</p>
                        <p>handoff P95 {metric(entry.baseline.metrics.p95FinalHandoffErrorMs, 'ms')} · {entry.baseline.note || '메모 없음'}</p>
                        {entry.retiredReason ? <p>마지막 교체/폐기: {entry.retiredReason}</p> : null}
                        {entry.lastRestoredAt ? <p>마지막 복원: {new Date(entry.lastRestoredAt).toLocaleString('ko-KR')} · {entry.lastRestoreReason}</p> : null}
                        {entry.status === 'retired' ? (
                          <button
                            type="button"
                            className="focus-ring mt-2 min-h-8 rounded-lg border border-soa-line bg-[#fbfaf6] px-3 text-[10px] font-black disabled:opacity-40"
                            disabled={baselineBusy !== null}
                            onClick={() => void previewRestore(entry)}
                          >복원 전 비교</button>
                        ) : null}
                      </div>
                    )) : historyLoading === group.groupKey ? null : (
                      <p className="rounded-xl bg-white px-3 py-2">저장된 운영자 기준선 이력이 없습니다.</p>
                    )}
                    {restorePreview?.target.groupKey === group.groupKey ? (
                      <div className="rounded-xl border border-soa-line bg-[#f7f5ef] p-3" aria-label="기준선 복원 미리보기">
                        <strong className="text-xs text-soa-ink">복원 미리보기</strong>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg bg-white p-2">
                            <b className="text-soa-ink">복원 대상</b>
                            <p>{new Date(restorePreview.target.createdAt).toLocaleString('ko-KR')}</p>
                            <p>first audio {metric(restorePreview.target.metrics.p95FirstAudioMs, 'ms')} · RTF {metric(restorePreview.target.metrics.p95RealtimeFactor)}</p>
                            <p>실패율 {(restorePreview.target.metrics.failureRate * 100).toFixed(1)}% · handoff {metric(restorePreview.target.metrics.p95FinalHandoffErrorMs, 'ms')}</p>
                          </div>
                          <div className="rounded-lg bg-white p-2">
                            <b className="text-soa-ink">현재 활성</b>
                            {restorePreview.currentActive ? (
                              <>
                                <p>{new Date(restorePreview.currentActive.createdAt).toLocaleString('ko-KR')}</p>
                                <p>first audio {metric(restorePreview.currentActive.metrics.p95FirstAudioMs, 'ms')} · RTF {metric(restorePreview.currentActive.metrics.p95RealtimeFactor)}</p>
                                <p>실패율 {(restorePreview.currentActive.metrics.failureRate * 100).toFixed(1)}% · handoff {metric(restorePreview.currentActive.metrics.p95FinalHandoffErrorMs, 'ms')}</p>
                              </>
                            ) : <p>현재 활성 기준선 없음</p>}
                          </div>
                        </div>
                        <ul className="mt-2 list-disc pl-4">{restorePreview.summary.map((line) => <li key={line}>{line}</li>)}</ul>
                        <div className="mt-2 flex gap-2">
                          <button type="button" className="focus-ring min-h-9 rounded-xl border border-soa-line bg-white px-3 text-[10px] font-black" onClick={() => void restoreBaseline(group)} disabled={baselineBusy !== null || restorePreview.currentActive?.baselineId === restorePreview.target.baselineId}>과거 기준선 복원</button>
                          <button type="button" className="focus-ring min-h-9 rounded-xl border border-soa-line bg-white px-3 text-[10px] font-black" onClick={() => setRestorePreview(null)}>취소</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f7f5ef] p-4 text-xs font-bold text-soa-muted">선택한 조건의 Worker 자동 텔레메트리가 없습니다.</p>
      )}

      {baselineNotice ? <p className="mt-4 rounded-xl bg-soa-mint/20 px-3 py-2 text-xs font-bold text-soa-ink">{baselineNotice}</p> : null}
      {baselineError ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{baselineError}</p> : null}

      <div className="mt-4 rounded-2xl bg-[#f7f5ef] p-3 text-[10px] font-bold leading-5 text-soa-muted">
        <strong className="text-xs text-soa-ink">실기기 soak 별도 집계</strong>
        <p>기록 {deviceSummary?.totalRecords ?? 0} · READY {deviceSummary?.readyRecords ?? 0} · 경고 {deviceSummary?.warningRecords ?? 0} · 실패 {deviceSummary?.failedRecords ?? 0}</p>
        <p>그룹 {deviceSummary?.metricGroups.length ?? 0}개 · 실제 인증은 Device Evidence 카드의 10·30·60분 표를 기준으로 판단합니다.</p>
      </div>
      <button type="button" onClick={onRefresh} disabled={loading} className="focus-ring mt-4 min-h-11 w-full rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50">benchmark 다시 집계</button>
    </section>
  )
}
