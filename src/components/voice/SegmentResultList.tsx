import { splitTextForUi } from '../../tts/segmentText'

interface SegmentResultListProps {
  text: string
  reportedCount: number
}

export function SegmentResultList({ text, reportedCount }: SegmentResultListProps) {
  const segments = splitTextForUi(text)
  const count = Math.max(reportedCount, segments.length)

  return (
    <section className="soa-segment-result" aria-labelledby="segment-result-title">
      <div className="soa-segment-result__head">
        <div>
          <span>LONG TEXT FLOW</span>
          <h3 id="segment-result-title">문장별 생성 구간</h3>
        </div>
        <strong>{count || 1}개 구간</strong>
      </div>
      <ol>
        {(segments.length ? segments : [text]).map((segment, index) => (
          <li key={`${segment}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{segment}</p>
            <b>완료</b>
          </li>
        ))}
      </ol>
      <p className="soa-segment-result__note">
        구간별로 만든 음성은 하나의 WAV로 연결되며, 전체 재생은 하단 Dock에서 이어집니다.
      </p>
    </section>
  )
}
