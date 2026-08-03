import { useMemo } from 'react'
import { usePlayerStore } from '../../store/usePlayerStore'
import type { PlaybackSeamMetric } from '../../tts/generationTypes'
import { StatusPill } from '../ui/StatusPill'

interface SeamEvidenceRow extends PlaybackSeamMetric {
  trackId: string
  engineId: string
}

function percentile95(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)]
}

function downloadEvidence(rows: SeamEvidenceRow[], handoffErrors: number[]) {
  const gaps = rows.map((row) => row.gapMs)
  const waitedGaps = rows.filter((row) => row.waitedForSegment).map((row) => row.gapMs)
  const decodeGaps = rows.filter((row) => !row.waitedForSegment).map((row) => row.gapMs)
  const payload = {
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    definition: 'previous-ended to next-playing',
    count: rows.length,
    averageGapMs: gaps.length ? Math.round(gaps.reduce((total, value) => total + value, 0) / gaps.length) : null,
    p95GapMs: percentile95(gaps),
    maximumGapMs: gaps.length ? Math.max(...gaps) : null,
    waitedTransitions: rows.filter((row) => row.waitedForSegment).length,
    seamGroups: {
      generationWaitP95Ms: percentile95(waitedGaps),
      decodeTransitionP95Ms: percentile95(decodeGaps),
    },
    finalHandoff: {
      count: handoffErrors.length,
      p95ErrorMs: percentile95(handoffErrors),
      maximumErrorMs: handoffErrors.length ? Math.max(...handoffErrors) : null,
    },
    transitions: rows,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `sorion-playback-seams-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export function PlaybackSeamEvidenceCard() {
  const queue = usePlayerStore((state) => state.queue)
  const rows = useMemo<SeamEvidenceRow[]>(() => queue.flatMap((track) => (
    track.audio.telemetry?.seams ?? []
  ).map((seam) => ({
    ...seam,
    trackId: track.id,
    engineId: track.audio.result.engineId,
  }))), [queue])
  const handoffErrors = useMemo(() => queue.flatMap((track) => (
    track.audio.telemetry?.finalHandoffErrorMs != null
      ? [track.audio.telemetry.finalHandoffErrorMs]
      : []
  )), [queue])
  const gaps = rows.map((row) => row.gapMs)
  const average = gaps.length
    ? Math.round(gaps.reduce((total, value) => total + value, 0) / gaps.length)
    : null
  const p95 = percentile95(gaps)
  const maximum = gaps.length ? Math.max(...gaps) : null
  const waited = rows.filter((row) => row.waitedForSegment).length
  const waitedP95 = percentile95(rows.filter((row) => row.waitedForSegment).map((row) => row.gapMs))
  const decodeP95 = percentile95(rows.filter((row) => !row.waitedForSegment).map((row) => row.gapMs))
  const handoffP95 = percentile95(handoffErrors)
  const recent = rows.slice(-5).reverse()

  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">PLAYBACK SEAM METRICS</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">구간 전환 실측</h2>
        </div>
        <StatusPill label={rows.length ? `${rows.length}회` : '미측정'} tone={rows.length ? 'good' : 'warning'} />
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-soa-muted">
        이전 WAV 종료부터 다음 WAV의 playing까지 측정합니다. P95는 느린 전환 5%의 경계를 보여주며 생성 대기와 디코딩 지연이 포함될 수 있습니다.
      </p>
      {rows.length ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-black sm:grid-cols-4">
            <span className="rounded-2xl bg-white p-3">평균<br /><b className="text-base">{average}ms</b></span>
            <span className="rounded-2xl bg-white p-3">P95<br /><b className="text-base">{p95}ms</b></span>
            <span className="rounded-2xl bg-white p-3">최대<br /><b className="text-base">{maximum}ms</b></span>
            <span className="rounded-2xl bg-white p-3">대기 포함<br /><b className="text-base">{waited}회</b></span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-black">
            <span className="rounded-2xl bg-amber-50 p-3 text-amber-800">생성 대기 P95<br /><b className="text-base">{waitedP95 != null ? `${waitedP95}ms` : '미측정'}</b></span>
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">순수 전환 P95<br /><b className="text-base">{decodeP95 != null ? `${decodeP95}ms` : '미측정'}</b></span>
          </div>
          <p className="rounded-2xl bg-white px-4 py-3 text-xs font-bold text-soa-muted">
            최종 WAV 교체 위치 오차 P95: {handoffP95 != null ? `${handoffP95}ms` : '미측정'}
          </p>
          <div className="space-y-2">
            {recent.map((row) => (
              <div key={`${row.trackId}-${row.fromSegment}-${row.toSegment}-${row.recordedAt}`} className="flex items-center justify-between gap-3 rounded-2xl border border-soa-line bg-white px-4 py-3 text-xs font-bold">
                <span>{row.fromSegment} → {row.toSegment} 구간</span>
                <span className={row.waitedForSegment ? 'text-amber-700' : 'text-emerald-700'}>
                  {row.gapMs}ms{row.waitedForSegment ? ' · 생성 대기 포함' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-[#f4f2ec] p-4 text-sm font-semibold leading-6 text-soa-muted">
          장문 부분 재생에서 두 번째 구간이 실제로 재생되면 전환 시간이 기록됩니다.
        </p>
      )}
      <button
        type="button"
        onClick={() => downloadEvidence(rows, handoffErrors)}
        disabled={!rows.length && !handoffErrors.length}
        className="focus-ring mt-4 min-h-11 w-full rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-45"
      >
        구간 전환 증거 JSON 저장
      </button>
    </section>
  )
}
