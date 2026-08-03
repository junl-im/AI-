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
  const manifest = summary?.manifest
  const checksum = manifest?.bundleSha256.slice(0, 12) ?? '미생성'
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
      <div className="mt-2 rounded-2xl border border-soa-line bg-white p-3 text-xs">
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold text-soa-muted">증거 manifest</span>
          <StatusPill label={`v${manifest?.schemaVersion ?? '2'}`} tone={manifest ? 'good' : 'warning'} />
        </div>
        <strong className="mt-1 block font-mono text-[11px]">SHA-256 {checksum}</strong>
        <span className="mt-1 block text-[10px] font-bold text-soa-muted">레코드 {manifest?.recordCount ?? 0}건 · 다운로드 전에 서버에서 다시 검증</span>
      </div>
      <p className="mt-3 text-[10px] font-bold leading-5 text-soa-muted">
        내려받는 증거 묶음은 장치 이름·브라우저 상세 버전·메모를 제거하고 레코드별 SHA-256과 전체 묶음 SHA-256을 포함합니다. 실제 음원과 모델 파일은 포함하지 않습니다.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={onRefresh} disabled={loading} className="focus-ring min-h-11 rounded-2xl border border-soa-line bg-white text-xs font-black disabled:opacity-50">새로고침</button>
        <button type="button" onClick={onDownload} className="focus-ring min-h-11 rounded-2xl bg-soa-ink text-xs font-black text-white">검증 후 JSON 받기</button>
      </div>
    </section>
  )
}
