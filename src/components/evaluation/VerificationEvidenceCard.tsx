import type { QualityEvidenceSummary } from '../../quality/qualityTypes'
import { StatusPill } from '../ui/StatusPill'

interface Props {
  summary: QualityEvidenceSummary | null
  loading: boolean
  onRefresh: () => void
  onDownload: () => void
}

export function VerificationEvidenceCard({ summary, loading, onRefresh, onDownload }: Props) {
  const completed = summary?.exportSoak.coverage.filter((item) => item.recorded).length ?? 0
  const sttTotal = summary?.stt.totalRecords ?? 0
  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">VERIFIED EVIDENCE</span>
          <h2 className="mt-1 text-xl font-black tracking-[-0.05em]">STT 개선 · 장문 Export</h2>
        </div>
        <StatusPill label={loading ? '확인 중' : `${completed}/6`} tone={completed === 6 ? 'good' : 'warning'} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl border border-soa-line bg-white p-3">
          <span className="font-bold text-soa-muted">STT 전후 비교</span>
          <strong className="mt-1 block text-lg">{sttTotal}건</strong>
          <span className="text-[10px] font-bold text-soa-muted">개선 {summary?.stt.improvedRecords ?? 0} · 재검수 통과 {summary?.stt.passedAfterRecords ?? 0}</span>
        </div>
        <div className="rounded-2xl border border-soa-line bg-white p-3">
          <span className="font-bold text-soa-muted">Export soak</span>
          <strong className="mt-1 block text-lg">{completed}/6</strong>
          <span className="text-[10px] font-bold text-soa-muted">통과 {summary?.exportSoak.readyRecords ?? 0} · 실패 {summary?.exportSoak.failedRecords ?? 0}</span>
        </div>
      </div>
      <p className="mt-3 text-[10px] font-bold leading-5 text-soa-muted">
        내려받는 증거 묶음은 기본적으로 장치 이름과 메모를 제거합니다. 실제 음원과 모델 파일은 포함하지 않습니다.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onRefresh} disabled={loading} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50">새로고침</button>
        <button type="button" onClick={onDownload} className="focus-ring min-h-11 rounded-2xl bg-soa-ink text-xs font-black text-white">증거 JSON 받기</button>
      </div>
    </section>
  )
}
