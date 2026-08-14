import type { VoiceSampleAnalysis } from '../../voiceclone/voiceCloneTypes'

function percent(value: number | null) {
  return value === null ? '-' : `${Math.round(value * 100)}%`
}

export function SampleQualityCard({
  analysis,
  analyzing,
}: {
  analysis: VoiceSampleAnalysis | null
  analyzing: boolean
}) {
  return (
    <section className="soa-clone-card" aria-labelledby="sample-quality-title">
      <div className="soa-clone-card__head">
        <div><span>STEP 02</span><h2 id="sample-quality-title">샘플 품질 확인</h2></div>
        <strong className={analysis ? `is-${analysis.status}` : ''}>
          {analyzing ? '분석 중' : analysis?.status === 'good'
            ? '사용 가능'
            : analysis?.status === 'blocked'
              ? '다시 필요'
              : analysis ? '확인 필요' : '대기'}
        </strong>
      </div>
      {analysis ? (
        <>
          <dl className="soa-quality-metrics">
            <div><dt>길이</dt><dd>{analysis.durationSeconds.toFixed(1)}초</dd></div>
            <div><dt>무음</dt><dd>{percent(analysis.silenceRatio)}</dd></div>
            <div><dt>클리핑</dt><dd>{percent(analysis.clippingRatio)}</dd></div>
            <div><dt>음량</dt><dd>{analysis.rmsDb === null ? '-' : `${analysis.rmsDb} dB`}</dd></div>
          </dl>
          <ul className="soa-quality-messages">
            {analysis.messages.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </>
      ) : (
        <p>녹음이나 파일을 준비하면 길이·무음·클리핑·음량을 기기에서 먼저 검사합니다.</p>
      )}
    </section>
  )
}
