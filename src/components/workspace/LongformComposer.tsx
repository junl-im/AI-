import {
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { splitTextForUi } from '../../tts/segmentText'
import type { WorkspaceMessage } from '../../workspace/workspaceTypes'

const MAX_SCRIPT_LENGTH = 20_000


export function normalizeImportedScript(raw: string, filename = ''): string {
  const normalized = raw.replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '')
  const isSubtitle = /\.(srt|vtt)$/i.test(filename)
    || /(?:^|\n)WEBVTT(?:\n|$)/.test(normalized)
    || /\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s*-->\s*\d{1,2}:\d{2}/.test(normalized)
  if (!isSubtitle) return normalized.slice(0, MAX_SCRIPT_LENGTH)

  const lines = normalized.split('\n')
  const cleaned = lines.flatMap((line) => {
    const value = line.trim()
    if (!value || value === 'WEBVTT' || /^\d+$/.test(value)) return []
    if (/^\d{1,2}:\d{2}(?::\d{2})?[.,]\d{3}\s*-->/.test(value)) return []
    if (/^(NOTE|STYLE|REGION)(\s|$)/.test(value)) return []
    return [value.replace(/<[^>]+>/g, '')]
  })
  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').slice(0, MAX_SCRIPT_LENGTH)
}

interface LongformComposerProps {
  disabled: boolean
  value: string
  activity: WorkspaceMessage
  voiceControls?: ReactNode
  onAddBlank?: () => void
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
  voiceControls,
  onAddBlank,
  onValueChange,
  onSubmit,
}: LongformComposerProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  async function loadScriptFile(file: File | undefined) {
    if (!file) return
    const raw = await file.text()
    const next = normalizeImportedScript(raw, file.name)
    onValueChange(next)
    window.requestAnimationFrame?.(() => editorRef.current?.focus({ preventScroll: true }))
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    void loadScriptFile(file)
  }

  function handleDrop(event: ReactDragEvent<HTMLDivElement>) {
    const file = event.dataTransfer.files?.[0]
    if (!file) return
    event.preventDefault()
    void loadScriptFile(file)
  }

  return (
    <section className="soa-dubbing-script soa-one-flow-composer" aria-labelledby="dubbing-script-title">
      <div className="soa-one-flow-composer__heading">
        <div>
          <span>ONE-FLOW DUBBING</span>
          <h1 id="dubbing-script-title">대본만 넣으면 바로 더빙</h1>
          <p>목소리를 고르고 대본을 입력한 뒤 한 번만 누르세요. 문장 분할과 생성 순서는 자동으로 처리합니다.</p>
        </div>
        <span className="soa-one-flow-composer__shortcut" aria-label="제작 단축키">⌘/Ctrl + Enter</span>
      </div>

      {voiceControls ? (
        <div className="soa-one-flow-composer__voice" aria-label="빠른 목소리 선택">
          {voiceControls}
        </div>
      ) : null}

      <div
        className="soa-dubbing-script__editor"
        onDragOver={(event) => { if (event.dataTransfer.types.includes('Files')) event.preventDefault() }}
        onDrop={handleDrop}
      >
        <textarea
          ref={editorRef}
          id="sorion-content-editor"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'여기에 더빙할 문장을 입력하거나 붙여 넣으세요.\n\n긴 글도 그대로 붙여 넣으면 문장별로 자동 정리합니다.'}
          aria-label="음성으로 만들 장문 내용"
          rows={9}
          maxLength={MAX_SCRIPT_LENGTH}
          spellCheck="true"
        />
        <div className="soa-dubbing-script__stats" aria-label="내용 통계">
          <span>{value.length.toLocaleString()} / {MAX_SCRIPT_LENGTH.toLocaleString()}자</span>
          <span>{stats.paragraphs}개 문단</span>
          <span>{stats.segments}개 대사</span>
          <span className="soa-one-flow-composer__auto">자동 문장 분할</span>
          <span>TXT · SRT · VTT 바로 불러오기</span>
          <strong>{formatDuration(stats.durationSeconds)}</strong>
        </div>
      </div>

      <div className={`soa-dubbing-activity soa-one-flow-composer__activity is-${activity.role}`} aria-live="polite">
        <span>{activity.badge ?? '작업 상태'}</span>
        <p>{activity.text}</p>
      </div>

      <div className="soa-one-flow-composer__actions">
        <input
          ref={fileInputRef}
          className="soa-one-flow-composer__file-input"
          type="file"
          accept=".txt,.md,.srt,.vtt,text/plain,text/vtt,application/x-subrip"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
        <button
          type="button"
          className="soa-one-flow-composer__blank"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          ⇧ 대본 파일 불러오기
        </button>
        {onAddBlank ? (
          <button type="button" className="soa-one-flow-composer__blank" onClick={onAddBlank} disabled={disabled}>
            ＋ 빈 대사부터 직접 편집
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="soa-dubbing-generate soa-one-flow-composer__generate"
        disabled={disabled || value.trim().length === 0}
        onClick={submit}
        aria-label="전체 내용 음성 제작 · 더빙 만들기"
      >
        <span>{disabled ? '더빙 만드는 중…' : '▶ 바로 더빙 만들기'}</span>
        <small>
          {stats.segments > 0
            ? `${stats.segments}개 대사 자동 생성 · 첫 음성 자동 재생 · 전체 내용 음성 제작`
            : '대본을 입력하면 바로 시작할 수 있습니다.'}
        </small>
      </button>
    </section>
  )
}
