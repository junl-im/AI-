import { useMemo, type KeyboardEvent } from 'react'
import type { BackendStatus } from '../../store/useAppStore'
import { splitTextForUi } from '../../tts/segmentText'
import type { WorkspaceMessage } from '../../workspace/workspaceTypes'

const MAX_SCRIPT_LENGTH = 20_000

interface LongformComposerProps {
  disabled: boolean
  value: string
  backendStatus: BackendStatus
  backendMessage: string
  activity: WorkspaceMessage
  onValueChange: (value: string) => void
  onSubmit: (value: string) => void
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return minutes > 0 ? `약 ${minutes}분 ${remainder}초` : `약 ${remainder}초`
}

function engineStatusText(status: BackendStatus, message: string): string {
  if (status === 'online') return '실제 음성 엔진 준비됨'
  if (status === 'degraded' && message.includes('브라우저')) return '브라우저 음성 준비됨'
  if (status === 'degraded') return '대체 음성 모드'
  if (status === 'checking') return '음성 시스템 확인 중'
  return '음성 서버 연결 대기'
}

export function LongformComposer({
  disabled,
  value,
  backendStatus,
  backendMessage,
  activity,
  onValueChange,
  onSubmit,
}: LongformComposerProps) {
  const stats = useMemo(() => {
    const trimmed = value.trim()
    const segments = trimmed ? splitTextForUi(trimmed) : []
    const spokenCharacters = trimmed.replace(/\s/g, '').length
    return {
      segments: segments.length,
      durationSeconds: spokenCharacters / 4.4,
      paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0,
    }
  }, [value])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section className="soa-dubbing-script" aria-labelledby="dubbing-script-title">
      <div className="soa-dubbing-script__label">
        <div>
          <span>LONGFORM SCRIPT</span>
          <h1 id="dubbing-script-title">더빙 원고</h1>
        </div>
        <button type="button" onClick={() => onValueChange('')} disabled={!value}>전체 지우기</button>
      </div>

      <div className="soa-dubbing-script__editor">
        <textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'새 더빙을 입력해 주세요.\n\n장문 원고를 붙여 넣으면 문장별 음성 블록으로 자동 분할합니다.'}
          aria-label="음성으로 만들 장문 원고"
          rows={11}
          maxLength={MAX_SCRIPT_LENGTH}
          spellCheck="true"
        />
        <div className="soa-dubbing-script__stats" aria-label="원고 통계">
          <span>{value.length.toLocaleString()} / {MAX_SCRIPT_LENGTH.toLocaleString()}자</span>
          <span>{stats.paragraphs}개 문단</span>
          <span>{stats.segments}개 블록</span>
          <strong>{formatDuration(stats.durationSeconds)}</strong>
        </div>
      </div>

      <div className={`soa-dubbing-activity is-${activity.role}`} aria-live="polite">
        <span>{activity.badge ?? '작업 상태'}</span>
        <p>{activity.text}</p>
      </div>

      <div className={`soa-dubbing-engine-note is-${backendStatus}`} role="status">
        <i aria-hidden="true" />
        <span><strong>{engineStatusText(backendStatus, backendMessage)}</strong><small>{backendMessage}</small></span>
      </div>

      <button
        type="button"
        className="soa-dubbing-generate"
        disabled={disabled || value.trim().length === 0}
        onClick={submit}
      >
        <span>{disabled ? '음성 제작 중…' : '전체 원고 음성 제작'}</span>
        <small>{stats.segments > 0 ? `${stats.segments}개 블록을 순서대로 생성` : '원고를 입력해 주세요'}</small>
      </button>
    </section>
  )
}
