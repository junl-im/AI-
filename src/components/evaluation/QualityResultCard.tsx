import { useEffect, useState, type ChangeEvent } from 'react'
import { formatBytes, formatMilliseconds } from '../../quality/formatMetrics'
import { getQualityReview, saveQualityReview } from '../../quality/qualityReviewRepository'
import type { QualityResult } from '../../quality/qualityTypes'
import { useAppStore } from '../../store/useAppStore'
import { StatusPill } from '../ui/StatusPill'

interface QualityResultCardProps {
  result: QualityResult
  sentence: string
  onSaved: () => void
}

export function QualityResultCard({ result, sentence, onSaved }: QualityResultCardProps) {
  const showNotice = useAppStore((state) => state.showNotice)
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const ready = Boolean(result.audioUrl)

  useEffect(() => {
    let active = true
    void getQualityReview(sentence, result.engineId).then((review) => {
      if (!active || !review) return
      setRating(review.rating)
      setNote(review.note)
    }).catch(() => undefined)
    return () => { active = false }
  }, [result.engineId, sentence])

  async function saveReview() {
    if (rating < 1) {
      showNotice('먼저 별점을 선택해 주세요.')
      return
    }
    setSaving(true)
    try {
      await saveQualityReview({
        sentence,
        engineId: result.engineId,
        engineName: result.engineName,
        engineMode: result.engineMode,
        rating,
        note: note.trim(),
        elapsedMs: result.elapsedMs,
        durationSeconds: result.durationSeconds,
        realtimeFactor: result.realtimeFactor,
      })
      showNotice('품질 평가를 이 기기에 저장했습니다.')
      onSaved()
    } catch {
      showNotice('품질 평가를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

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
        <textarea value={note} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)} maxLength={500} placeholder="발음, 억양, 속도에서 느낀 점" className="focus-ring mt-2 min-h-20 w-full resize-none rounded-2xl border border-soa-line bg-white p-3 text-xs leading-5" />
        <button type="button" onClick={() => void saveReview()} disabled={saving} className="focus-ring mt-2 min-h-11 w-full rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50">{saving ? '저장 중…' : '평가 저장'}</button>
        <p className="mt-1 text-[10px] font-semibold text-soa-muted">별점과 메모는 IndexedDB에 저장되며 JSON·CSV 보고서로 내보낼 수 있습니다.</p>
      </div>
    </article>
  )
}
