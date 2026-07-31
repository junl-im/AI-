import { useState } from 'react'
import type { VoiceCloneJob } from '../../voiceclone/voiceCloneTypes'

interface CloneExecutionCardProps {
  profileName: string
  ready: boolean
  reason: string | null
  job: VoiceCloneJob | null
  busy: boolean
  error: string | null
  onStart: (text: string) => void
  onCancel: () => void
  onRetry: () => void
}

const statusLabels: Record<VoiceCloneJob['status'], string> = {
  queued: '대기 중',
  running: '생성 중',
  completed: '완료',
  failed: '실패',
  cancelled: '취소됨',
}

export function CloneExecutionCard({
  profileName,
  ready,
  reason,
  job,
  busy,
  error,
  onStart,
  onCancel,
  onRetry,
}: CloneExecutionCardProps) {
  const [text, setText] = useState('안녕하세요. 소리온에서 만든 내 목소리입니다.')
  const running = job?.status === 'queued' || job?.status === 'running'
  const canStart = ready && text.trim().length > 0 && !busy && !running

  return (
    <section className="soa-clone-execution" aria-labelledby="clone-execution-title">
      <div className="soa-clone-execution__head">
        <div>
          <span>REAL CLONE EXECUTION</span>
          <h2 id="clone-execution-title">{profileName}로 문장을 말하게 합니다.</h2>
        </div>
        <strong className={ready ? 'is-ready' : 'is-waiting'}>
          {ready ? 'WORKER READY' : 'WORKER WAITING'}
        </strong>
      </div>
      <p>
        문장을 구간별로 생성하고, 첫 구간이 끝나는 순간부터 진행 상태를 표시합니다.
        실제 모델이 준비되지 않은 환경에서는 실행 버튼을 열지 않습니다.
      </p>
      {!ready ? <div className="soa-worker-warning">{reason ?? 'CosyVoice Worker 연결이 필요합니다.'}</div> : null}
      <label className="soa-clone-script">
        복제할 문장
        <textarea
          value={text}
          maxLength={500}
          rows={4}
          onChange={(event) => setText(event.target.value)}
          placeholder="내 목소리로 만들 문장을 입력하세요."
        />
        <span>{text.length} / 500</span>
      </label>
      <button
        type="button"
        className="soa-clone-run"
        disabled={!canStart}
        onClick={() => onStart(text.trim())}
      >
        {running ? `목소리 생성 중 · ${job?.progress ?? 0}%` : '이 목소리로 WAV 생성하기'}
      </button>
      {error ? <p role="alert" className="soa-clone-job-error">{error}</p> : null}
      {job ? (
        <div className="soa-clone-job" aria-live="polite">
          <div className="soa-clone-job__summary">
            <div>
              <strong>{statusLabels[job.status]}</strong>
              <span>{job.message}</span>
            </div>
            <b>{job.progress}%</b>
          </div>
          <div className="soa-clone-job__progress" aria-hidden="true">
            <i style={{ width: `${job.progress}%` }} />
          </div>
          <ol className="soa-clone-job__segments">
            {job.segments.map((segment) => (
              <li key={segment.index} className={`is-${segment.status}`}>
                <span>{String(segment.index).padStart(2, '0')}</span>
                <div><strong>{segment.text}</strong><small>{segment.message}</small></div>
                <b>{segment.progress}%</b>
              </li>
            ))}
          </ol>
          {running ? (
            <button type="button" className="soa-clone-job__cancel" onClick={onCancel}>
              생성 취소
            </button>
          ) : null}
          {job.status === 'failed' || job.status === 'cancelled' ? (
            <button type="button" className="soa-clone-job__retry" onClick={onRetry}>
              실패·취소 구간만 다시 시도
            </button>
          ) : null}
          {job.status === 'completed' ? (
            <small className="soa-clone-job__complete">
              완성 음원을 하단 Linked Player Dock에 연결했습니다.
              {job.firstAudioMs ? ` 첫 구간 ${job.firstAudioMs}ms.` : ''}
            </small>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
