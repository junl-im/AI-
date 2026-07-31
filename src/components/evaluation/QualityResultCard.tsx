import { useState, type ChangeEvent } from 'react'
import { formatBytes, formatMilliseconds } from '../../quality/formatMetrics'
import type { QualityResult } from '../../quality/qualityTypes'
import { StatusPill } from '../ui/StatusPill'

interface QualityResultCardProps {
  result: QualityResult
}

export function QualityResultCard({ result }: QualityResultCardProps) {
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const ready = Boolean(result.audioUrl)

  return (
    <article className="rounded-[26px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div><strong className="block text-base">{result.engineName}</strong><span className="text-[10px] font-black tracking-[0.12em] text-soa-muted">{result.engineMode.toUpperCase()}</span></div>
        <StatusPill label={ready ? '재생 가능' : result.status} tone={ready ? 'good' : 'warning'} />
      </div>
      {result.audioUrl ? <audio controls preload="metadata" src={result.audioUrl} className="mt-4 w-full" aria-label={`${result.engineName} 비교 음성`} /> : null}
      <p className="mt-3 text-xs font-semibold leading-5 text-soa-muted">{result.message}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold">
        <span className="rounded-xl bg-[#f4f2ec] p-2">생성 {formatMilliseconds(result.elapsedMs)}</span>
        <span className="rounded-xl bg-[#f4f2ec] p-2">음원 {result.durationSeconds?.toFixed(1) ?? '-'}초</span>
        <span className="rounded-xl bg-[#f4f2ec] p-2">RTF {result.realtimeFactor ?? '-'}</span>
        <span className="rounded-xl bg-[#f4f2ec] p-2">크기 {formatBytes(result.fileSizeBytes)}</span>
      </div>
      <div className="mt-4">
        <span className="text-[10px] font-black tracking-[0.12em] text-soa-muted">청취 평가</span>
        <div className="mt-2 flex gap-1" aria-label="5점 평가">
          {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} aria-label={`${value}점`} className={`focus-ring size-10 rounded-xl text-lg font-black ${value <= rating ? 'bg-soa-lime' : 'bg-[#f4f2ec] text-soa-muted'}`}>★</button>)}
        </div>
        <textarea value={note} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)} placeholder="발음, 억양, 속도에서 느낀 점" className="focus-ring mt-2 min-h-20 w-full resize-none rounded-2xl border border-soa-line bg-white p-3 text-xs leading-5" />
        <p className="mt-1 text-[10px] font-semibold text-soa-muted">별점과 메모는 현재 브라우저에만 표시되며 서버로 전송하지 않습니다.</p>
      </div>
    </article>
  )
}
