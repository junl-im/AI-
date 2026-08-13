import { useMemo, useState } from 'react'
import type { VoiceCloneJob } from '../../voiceclone/voiceCloneTypes'

interface CloneExecutionCardProps {
  profileName: string
  ready: boolean
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

const testScripts = [
  { id: 'natural', label: '자연스러움', text: '안녕하세요. 오늘은 조금 천천히 이야기해 볼게요. 편안하게 들리는지 확인해 주세요.' },
  { id: 'narration', label: '내레이션', text: '작은 선택이 모여 하나의 이야기가 됩니다. 문장 끝까지 호흡과 톤이 자연스럽게 이어지는지 들어보세요.' },
  { id: 'bright', label: '밝은 톤', text: '좋아요! 지금부터 새로운 아이디어를 함께 시작해 볼까요? 밝고 또렷한 느낌을 확인해 주세요.' },
  { id: 'serious', label: '차분한 톤', text: '중요한 내용은 서두르지 않고 정확하게 전달하는 것이 좋습니다. 안정적인 저음과 발음을 확인해 주세요.' },
]

export function CloneExecutionCard({
  profileName,
  ready,
  job,
  busy,
  error,
  onStart,
  onCancel,
  onRetry,
}: CloneExecutionCardProps) {
  const [text, setText] = useState(testScripts[0].text)
  const [selectedScriptId, setSelectedScriptId] = useState(testScripts[0].id)
  const running = job?.status === 'queued' || job?.status === 'running'
  const canStart = ready && text.trim().length > 0 && !busy && !running
  const completedSegments = useMemo(
    () => job?.segments.filter((segment) => segment.status === 'completed').length ?? 0,
    [job?.segments],
  )

  return (
    <section className="soa-clone-execution soa-voice-test-lab" aria-labelledby="clone-execution-title">
      <div className="soa-clone-execution__head">
        <div>
          <span>VOICE TEST LAB</span>
          <h2 id="clone-execution-title">{profileName}의 실제 느낌을 비교하세요.</h2>
        </div>
        <strong className={ready ? 'is-ready' : 'is-waiting'}>
          {ready ? 'READY' : '자동 준비 중'}
        </strong>
      </div>
      <p>한 문장만 듣고 결정하지 마세요. 자연스러움·내레이션·밝은 톤·차분한 톤을 번갈아 들어보면 발음과 호흡의 약점이 훨씬 잘 보입니다.</p>

      <div className="soa-voice-test-presets" role="tablist" aria-label="목소리 테스트 문장">
        {testScripts.map((script) => (
          <button
            key={script.id}
            type="button"
            role="tab"
            aria-selected={selectedScriptId === script.id}
            className={selectedScriptId === script.id ? 'is-active' : ''}
            onClick={() => {
              setSelectedScriptId(script.id)
              setText(script.text)
            }}
          >
            {script.label}
          </button>
        ))}
      </div>

      {!ready ? <div className="soa-worker-warning">음성 엔진을 자동으로 준비하고 있습니다. 저장된 원본 샘플과 동의 기록은 그대로 유지됩니다.</div> : null}
      <label className="soa-clone-script">
        테스트 문장
        <textarea
          value={text}
          maxLength={500}
          rows={4}
          onChange={(event) => {
            setSelectedScriptId('custom')
            setText(event.target.value)
          }}
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
        {running ? `내 목소리 생성 중 · ${job?.progress ?? 0}%` : '▶ 이 문장으로 내 목소리 테스트'}
      </button>

      {error ? <p role="alert" className="soa-clone-job-error">{error}</p> : null}
      {job ? (
        <div className="soa-clone-job" aria-live="polite">
          <div className="soa-clone-job__summary">
            <div>
              <strong>{statusLabels[job.status]}</strong>
              <span>{job.message}</span>
              <small>{job.segments.length ? `완료 구간 ${completedSegments}/${job.segments.length}` : '구간 준비 중'}</small>
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
