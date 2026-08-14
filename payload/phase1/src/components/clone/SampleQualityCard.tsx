import { calculateVoiceSampleScore, voiceSampleScoreLabel } from '../../voiceclone/sampleQualityScore'
import type { VoiceSampleAnalysis } from '../../voiceclone/voiceCloneTypes'

function percent(value: number | null) {
  return value === null ? '-' : `${Math.round(value * 100)}%`
}

function metricState(kind: 'silence' | 'clipping' | 'volume' | 'duration', analysis: VoiceSampleAnalysis): string {
  if (kind === 'duration') return analysis.durationSeconds >= 12 && analysis.durationSeconds <= 60 ? 'good' : 'warning'
  if (kind === 'silence') return analysis.silenceRatio == null ? 'neutral' : analysis.silenceRatio <= 0.22 ? 'good' : 'warning'
  if (kind === 'clipping') return analysis.clippingRatio == null ? 'neutral' : analysis.clippingRatio <= 0.01 ? 'good' : 'warning'
  if (analysis.rmsDb == null) return 'neutral'
  return analysis.rmsDb >= -30 && analysis.rmsDb <= -7 ? 'good' : 'warning'
}

export function SampleQualityCard({
  analysis,
  analyzing,
}: {
  analysis: VoiceSampleAnalysis | null
  analyzing: boolean
}) {
  const score = analysis ? calculateVoiceSampleScore(analysis) : null

  return (
    <section className="soa-clone-card soa-sample-quality-pro" aria-labelledby="sample-quality-title">
      <div className="soa-clone-card__head">
        <div><span>STEP 02 · QUALITY</span><h2 id="sample-quality-title">목소리 품질 코치</h2></div>
        <strong className={analysis ? `is-${analysis.status}` : ''}>
          {analyzing ? '분석 중' : score == null ? '샘플 대기' : `${score} / 100`}
        </strong>
      </div>

      {analysis && score != null ? (
        <>
          <div className={`soa-quality-score is-${analysis.status}`}>
            <div>
              <strong>{score}</strong><span>/100</span>
            </div>
            <p><b>{voiceSampleScoreLabel(score)}</b><small>기기 사전 점수 · 실제 모델 결과를 보장하지 않습니다.</small></p>
          </div>

          <dl className="soa-quality-metrics is-pro">
            <div className={`is-${metricState('duration', analysis)}`}><dt>길이</dt><dd>{analysis.durationSeconds.toFixed(1)}초</dd><small>15~30초 권장</small></div>
            <div className={`is-${metricState('silence', analysis)}`}><dt>무음</dt><dd>{percent(analysis.silenceRatio)}</dd><small>낮을수록 좋음</small></div>
            <div className={`is-${metricState('clipping', analysis)}`}><dt>클리핑</dt><dd>{percent(analysis.clippingRatio)}</dd><small>1% 이하 권장</small></div>
            <div className={`is-${metricState('volume', analysis)}`}><dt>음량</dt><dd>{analysis.rmsDb === null ? '-' : `${analysis.rmsDb} dB`}</dd><small>-30~-7 dB</small></div>
          </dl>

          <div className="soa-quality-coach">
            <strong>{analysis.status === 'good' ? '이 샘플로 진행해도 좋습니다.' : analysis.status === 'blocked' ? '이 샘플은 다시 준비해야 합니다.' : '조금만 다듬으면 더 좋아집니다.'}</strong>
            <ul className="soa-quality-messages">
              {analysis.messages.map((message) => <li key={message}>{message}</li>)}
            </ul>
          </div>
        </>
      ) : (
        <div className="soa-quality-empty">
          <strong>좋은 목소리는 좋은 원본에서 시작합니다.</strong>
          <p>녹음이나 파일을 준비하면 길이·무음·클리핑·음량을 브라우저에서 먼저 검사하고, 바로 개선 포인트를 보여드립니다.</p>
        </div>
      )}
    </section>
  )
}
