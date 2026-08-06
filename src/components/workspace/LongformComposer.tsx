import { useEffect, useMemo, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { splitTextForUi } from '../../tts/segmentText'
import type { WorkspaceMessage } from '../../workspace/workspaceTypes'

const MAX_SCRIPT_LENGTH = 20_000

interface LongformComposerProps {
  disabled: boolean
  value: string
  activity: WorkspaceMessage
  onValueChange: (value: string) => void
  onSubmit: (value: string) => void
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return minutes > 0 ? `약 ${minutes}분 ${remainder}초` : `약 ${remainder}초`
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(
    target.closest('input, textarea, select, button, a, [contenteditable="true"]'),
  )
}

export function LongformComposer({
  disabled,
  value,
  activity,
  onValueChange,
  onSubmit,
}: LongformComposerProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
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


  useEffect(() => {
    function focusEditorFromTyping(event: KeyboardEvent) {
      if (
        disabled
        || event.defaultPrevented
        || event.ctrlKey
        || event.metaKey
        || event.altKey
        || isEditableTarget(event.target)
      ) return
      const isCompositionStart = event.key === 'Process'
      if (!isCompositionStart && event.key.length !== 1) return
      const editor = editorRef.current
      if (!editor) return
      editor.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
      editor.focus({ preventScroll: true })
      if (isCompositionStart) return
      event.preventDefault()
      const start = editor.selectionStart ?? value.length
      const end = editor.selectionEnd ?? start
      const next = `${value.slice(0, start)}${event.key}${value.slice(end)}`.slice(0, MAX_SCRIPT_LENGTH)
      onValueChange(next)
      const caret = Math.min(start + event.key.length, next.length)
      window.requestAnimationFrame?.(() => editor.setSelectionRange(caret, caret))
    }
    window.addEventListener('keydown', focusEditorFromTyping)
    return () => window.removeEventListener('keydown', focusEditorFromTyping)
  }, [disabled, onValueChange, value])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed)
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <section className="soa-dubbing-script" aria-labelledby="dubbing-script-title">
      <div className="soa-dubbing-script__label">
        <div>
          <span>LONGFORM CONTENT</span>
          <h1 id="dubbing-script-title">더빙 내용</h1>
          <small>화면 어디서든 타이핑하면 이 글쓰기 구간으로 이동합니다.</small>
        </div>
        <button type="button" onClick={() => onValueChange('')} disabled={!value}>전체 지우기</button>
      </div>

      <div className="soa-dubbing-script__editor">
        <textarea
          ref={editorRef}
          id="sorion-content-editor"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'새 더빙 내용을 입력해 주세요.\n\n장문 내용을 붙여 넣으면 문장별 음성 블록으로 자동 분할합니다.'}
          aria-label="음성으로 만들 장문 내용"
          rows={11}
          maxLength={MAX_SCRIPT_LENGTH}
          spellCheck="true"
        />
        <div className="soa-dubbing-script__stats" aria-label="내용 통계">
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

      <button
        type="button"
        className="soa-dubbing-generate"
        disabled={disabled || value.trim().length === 0}
        onClick={submit}
      >
        <span>{disabled ? '음성 제작 중…' : '전체 내용 음성 제작'}</span>
        <small>{stats.segments > 0 ? `${stats.segments}개 블록을 순서대로 생성` : '내용을 입력해 주세요'}</small>
      </button>
    </section>
  )
}
