import type { TextPreview } from '../../quality/qualityTypes'

interface TextPreviewCardProps {
  preview: TextPreview | null
  loading: boolean
  onPreview: () => void
}

export function TextPreviewCard({ preview, loading, onPreview }: TextPreviewCardProps) {
  return (
    <section className="rounded-[28px] border border-soa-line bg-soa-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div><span className="text-[10px] font-black tracking-[0.15em] text-soa-muted">KOREAN PREPROCESS</span><h2 className="mt-1 text-xl font-black tracking-[-0.05em]">AI 발음 전처리</h2></div>
        <button type="button" onClick={onPreview} disabled={loading} className="focus-ring min-h-10 rounded-full bg-soa-ink px-4 text-xs font-black text-white disabled:opacity-50">{loading ? '분석 중' : '미리보기'}</button>
      </div>
      {preview ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-[#f4f2ec] p-4"><span className="text-[9px] font-black tracking-[0.13em] text-soa-muted">NORMALIZED</span><p className="mt-2 text-sm font-semibold leading-6">{preview.normalizedText}</p></div>
          <div className="flex flex-wrap gap-2">
            {preview.changes.length ? preview.changes.map((change) => <span key={change} className="rounded-full bg-soa-violet/15 px-3 py-1 text-[10px] font-black text-soa-violet">{change}</span>) : <span className="text-xs font-semibold text-soa-muted">변경할 표현이 없습니다.</span>}
          </div>
          <div>
            <strong className="text-xs">생성 구간 {preview.segmentCount}개</strong>
            <div className="mt-2 space-y-2">
              {preview.segments.map((segment, index) => <p key={`${index}-${segment.slice(0, 12)}`} className="rounded-2xl border border-soa-line bg-white px-4 py-3 text-xs font-semibold leading-5"><span className="mr-2 text-soa-muted">{index + 1}</span>{segment}</p>)}
            </div>
          </div>
        </div>
      ) : <p className="mt-4 text-sm font-semibold leading-6 text-soa-muted">숫자, 날짜, 금액, 영문 약어를 한국어 읽기 형태로 바꾸고 긴 문장을 생성 가능한 구간으로 나눕니다.</p>}
    </section>
  )
}
