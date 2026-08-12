import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { splitTextForUi } from '../../tts/segmentText'
import {
  MAX_DUBBING_SCRIPT_LENGTH,
  countDetectedSpeakers,
  looksLikeSubtitleScript,
  normalizeImportedScript,
  polishScriptForSpeech,
} from '../../workspace/scriptPreparation'
import type { WorkspaceMessage } from '../../workspace/workspaceTypes'

export { normalizeImportedScript } from '../../workspace/scriptPreparation'

export interface LongformGenerationProgress {
  total: number
  ready: number
  failed: number
  generating: number
  queued: number
}

interface LongformComposerProps {
  disabled: boolean
  value: string
  activity: WorkspaceMessage
  voiceControls?: ReactNode
  speakerAssist?: ReactNode
  generationProgress?: LongformGenerationProgress
  resumeCount?: number
  submitBlockedReason?: string | null
  onAddBlank?: () => void
  onPreviewText?: (text: string) => void
  onCancelGeneration?: () => void
  onResumeGeneration?: () => void
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
  speakerAssist,
  generationProgress,
  resumeCount = 0,
  submitBlockedReason = null,
  onAddBlank,
  onPreviewText,
  onCancelGeneration,
  onResumeGeneration,
  onValueChange,
  onSubmit,
}: LongformComposerProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const alignEditorToMobileTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const editor = editorRef.current
    if (!editor || window.innerWidth > 760) return
    const rect = editor.getBoundingClientRect()
    const targetTop = Math.max(0, window.scrollY + rect.top - 68)
    if (Math.abs(rect.top - 68) < 10) return
    window.scrollTo({ top: targetTop, behavior })
  }, [])
  const alignEditorAfterFocus = useCallback(() => {
    window.requestAnimationFrame?.(() => alignEditorToMobileTop('smooth'))
    window.setTimeout(() => alignEditorToMobileTop('auto'), 220)
  }, [alignEditorToMobileTop])
  const stats = useMemo(() => {
    const trimmed = value.trim()
    const segments = trimmed ? splitTextForUi(trimmed) : []
    const spokenCharacters = trimmed.replace(/\s/g, '').length
    return {
      segments: segments.length,
      durationSeconds: spokenCharacters / 4.4,
      paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter(Boolean).length : 0,
      speakers: countDetectedSpeakers(trimmed),
    }
  }, [value])

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined
    const realign = () => {
      if (document.activeElement === editorRef.current) alignEditorToMobileTop('auto')
    }
    viewport.addEventListener('resize', realign)
    viewport.addEventListener('scroll', realign)
    return () => {
      viewport.removeEventListener('resize', realign)
      viewport.removeEventListener('scroll', realign)
    }
  }, [alignEditorToMobileTop])

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
      const next = `${value.slice(0, start)}${event.key}${value.slice(end)}`.slice(0, MAX_DUBBING_SCRIPT_LENGTH)
      onValueChange(next)
      const caret = Math.min(start + event.key.length, next.length)
      window.requestAnimationFrame?.(() => editor.setSelectionRange(caret, caret))
    }
    window.addEventListener('keydown', focusEditorFromTyping)
    return () => window.removeEventListener('keydown', focusEditorFromTyping)
  }, [disabled, onValueChange, value])

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled || submitBlockedReason) return
    onSubmit(trimmed)
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  function insertPreparedText(prepared: string) {
    const editor = editorRef.current
    if (!editor) {
      onValueChange(prepared.slice(0, MAX_DUBBING_SCRIPT_LENGTH))
      return
    }
    const start = editor.selectionStart ?? value.length
    const end = editor.selectionEnd ?? start
    const next = `${value.slice(0, start)}${prepared}${value.slice(end)}`.slice(0, MAX_DUBBING_SCRIPT_LENGTH)
    onValueChange(next)
    const caret = Math.min(start + prepared.length, next.length)
    window.requestAnimationFrame?.(() => {
      editor.focus({ preventScroll: true })
      editor.setSelectionRange(caret, caret)
    })
  }

  function handlePaste(event: ReactClipboardEvent<HTMLTextAreaElement>) {
    const pasted = event.clipboardData.getData('text/plain')
    if (!looksLikeSubtitleScript(pasted)) return
    event.preventDefault()
    insertPreparedText(normalizeImportedScript(pasted, 'clipboard.srt'))
  }

  function polishCurrentScript() {
    const next = polishScriptForSpeech(value)
    if (next !== value) onValueChange(next)
    window.requestAnimationFrame?.(() => editorRef.current?.focus({ preventScroll: true }))
  }

  function previewFirstSegment() {
    const first = splitTextForUi(value.trim())[0]
    if (first) onPreviewText?.(first)
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

      {speakerAssist}

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
          onFocus={alignEditorAfterFocus}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={'여기에 더빙할 문장을 입력하거나 붙여 넣으세요.\n\n긴 글도 그대로 붙여 넣으면 문장별로 자동 정리합니다.'}
          aria-label="음성으로 만들 장문 내용"
          rows={9}
          maxLength={MAX_DUBBING_SCRIPT_LENGTH}
          spellCheck="true"
        />
        <div className="soa-dubbing-script__stats" aria-label="내용 통계">
          <span>{value.length.toLocaleString()} / {MAX_DUBBING_SCRIPT_LENGTH.toLocaleString()}자</span>
          <span>{stats.paragraphs}개 문단</span>
          <span>{stats.segments}개 대사</span>
          {stats.speakers > 0 ? <span>{stats.speakers}명 화자 표기 감지</span> : null}
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
        <button
          type="button"
          className="soa-one-flow-composer__blank"
          onClick={polishCurrentScript}
          disabled={disabled || value.trim().length === 0}
          title="자막 타임코드, Markdown 목록 기호, 불필요한 공백을 말하기 좋은 대본 형태로 정리합니다."
        >
          ✦ 말하기 좋게 정리
        </button>
        {onPreviewText ? (
          <button
            type="button"
            className="soa-one-flow-composer__blank is-preview"
            onClick={previewFirstSegment}
            disabled={disabled || value.trim().length === 0}
          >
            ▶ 첫 문장 미리듣기
          </button>
        ) : null}
        {onAddBlank ? (
          <button type="button" className="soa-one-flow-composer__blank" onClick={onAddBlank} disabled={disabled}>
            ＋ 빈 대사부터 직접 편집
          </button>
        ) : null}
      </div>

      {disabled && generationProgress && generationProgress.total > 0 ? (
        <div className="soa-one-flow-progress" aria-label="더빙 생성 진행 상황">
          <div
            className="soa-one-flow-progress__bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={generationProgress.total}
            aria-valuenow={generationProgress.ready + generationProgress.failed}
          >
            <span style={{ width: `${Math.round(((generationProgress.ready + generationProgress.failed) / generationProgress.total) * 100)}%` }} />
          </div>
          <div className="soa-one-flow-progress__meta">
            <strong>{generationProgress.ready + generationProgress.failed} / {generationProgress.total}</strong>
            <span>{generationProgress.generating > 0 ? `${generationProgress.generating}개 생성 중` : '마무리 중'}</span>
            {generationProgress.queued > 0 ? <span>{generationProgress.queued}개 대기</span> : null}
            {generationProgress.failed > 0 ? <span>{generationProgress.failed}개 확인 필요</span> : null}
            {onCancelGeneration ? (
              <button type="button" onClick={onCancelGeneration}>생성 중지</button>
            ) : null}
          </div>
        </div>
      ) : null}


      {!disabled && resumeCount > 0 && onResumeGeneration ? (
        <button
          type="button"
          className="soa-one-flow-resume"
          onClick={onResumeGeneration}
          aria-label={`남은 대사 ${resumeCount}개 이어서 만들기`}
        >
          <span>▶ 남은 {resumeCount}개 이어서 만들기</span>
          <small>완성된 음성은 유지하고 대기 중인 대사만 다시 시작합니다.</small>
        </button>
      ) : null}

      {submitBlockedReason ? (
        <p className="soa-one-flow-composer__blocked" role="status">{submitBlockedReason}</p>
      ) : null}

      <button
        type="button"
        className="soa-dubbing-generate soa-one-flow-composer__generate"
        disabled={disabled || value.trim().length === 0 || Boolean(submitBlockedReason)}
        onClick={submit}
        aria-label="전체 내용 음성 제작 · 더빙 만들기"
      >
        <span>{disabled ? '더빙 만드는 중…' : submitBlockedReason ? '화자 목소리 확인 필요' : '▶ 바로 더빙 만들기'}</span>
        <small>
          {stats.segments > 0
            ? `${stats.segments}개 대사 안전 병렬 생성 · 첫 음성 자동 재생 · 순서 자동 유지`
            : '대본을 입력하면 바로 시작할 수 있습니다.'}
        </small>
      </button>
    </section>
  )
}
