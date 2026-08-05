import { useEffect, useState, type ChangeEvent } from 'react'
import { formatBytes, formatMilliseconds } from '../../quality/formatMetrics'
import { getQualityReview, saveQualityReview } from '../../quality/qualityReviewRepository'
import type { QualityResult } from '../../quality/qualityTypes'
import type { VoiceGender } from '../../tts/voicePresets'
import type { QualityReviewDecision } from '../../quality/qualityReviewTypes'
import { useAppStore } from '../../store/useAppStore'
import { StatusPill } from '../ui/StatusPill'

interface QualityResultCardProps {
  result: QualityResult
  sentence: string
  voiceId: string
  voiceName: string
  voiceGender: VoiceGender
  onSaved: () => void
}

export function QualityResultCard({
  result,
  sentence,
  voiceId,
  voiceName,
  voiceGender,
  onSaved,
}: QualityResultCardProps) {
  const showNotice = useAppStore((state) => state.showNotice)
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<QualityReviewDecision>('needs-review')
  const [saving, setSaving] = useState(false)
  const ready = Boolean(result.audioUrl)

  useEffect(() => {
    let active = true
    void getQualityReview(sentence, result.engineId, voiceId).then((review) => {
      if (!active || !review) return
      setRating(review.rating)
      setNote(review.note)
      setDecision(review.decision ?? (review.rating >= 4 ? 'approved' : review.rating <= 2 ? 'rejected' : 'needs-review'))
    }).catch(() => undefined)
    return () => { active = false }
  }, [result.engineId, sentence, voiceId])

  async function saveReview() {
    if (rating < 1) {
      showNotice('먼저 별점을 선택해 주세요.')
      return
    }
    setSaving(true)
    try {
      await saveQualityReview({
        sentence,
        voiceId,
        voiceName,
        voiceGender,
        engineId: result.engineId,
        engineName: result.engineName,
        engineMode: result.engineMode,
        decision,
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
      <p className="mt-3 text-xs font-black leading-5">{voiceName} · {voiceGender}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-soa-muted">{result.message}</p>
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
        <div className="mt-2 grid grid-cols-3 gap-2" aria-label="검수 결정">
          {([
            ['approved', '승인 후보'],
            ['needs-review', '재검토'],
            ['rejected', '거부'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setDecision(value)}
              className={`focus-ring min-h-10 rounded-xl border text-[11px] font-black ${decision === value ? 'border-soa-ink bg-soa-ink text-white' : 'border-soa-line bg-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea value={note} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNote(event.target.value)} maxLength={500} placeholder="발음, 억양, 속도에서 느낀 점" className="focus-ring mt-2 min-h-20 w-full resize-none rounded-2xl border border-soa-line bg-white p-3 text-xs leading-5" />
        <button type="button" onClick={() => void saveReview()} disabled={saving} className="focus-ring mt-2 min-h-11 w-full rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50">{saving ? '저장 중…' : '평가 저장'}</button>
        <p className="mt-1 text-[10px] font-semibold text-soa-muted">별점·결정·메모는 IndexedDB에 저장됩니다. 승인 후보도 manifest 자동 승인으로 사용되지 않습니다.</p>
      </div>
    </article>
  )
}
