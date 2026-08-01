import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { BackendStatus } from '../../store/useAppStore'
import { splitTextForUi } from '../../tts/segmentText'
import type { ComposerDirective, WorkspaceMessage } from '../../workspace/workspaceTypes'

const MAX_SCRIPT_LENGTH = 20_000

const directives: ComposerDirective[] = [
  { id: 'commercial', label: '광고 톤' },
  { id: 'slow', label: '천천히' },
  { id: 'numbers', label: '숫자 발음 보정' },
  { id: 'bright', label: '밝은 톤' },
]

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface LongformComposerProps {
  disabled: boolean
  value: string
  directiveIds: ComposerDirective['id'][]
  backendStatus: BackendStatus
  backendMessage: string
  activity: WorkspaceMessage
  onValueChange: (value: string) => void
  onDirectiveIdsChange: (ids: ComposerDirective['id'][]) => void
  onSubmit: (value: string, directives: ComposerDirective[]) => void
  onVoiceUnavailable: () => void
}

function speechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  const candidate = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.round(seconds % 60)
  return minutes > 0 ? `약 ${minutes}분 ${remainder}초` : `약 ${remainder}초`
}

function engineTitle(status: BackendStatus): string {
  if (status === 'online') return '실제 음성 엔진 준비됨'
  if (status === 'degraded') return '대체 음성 모드'
  if (status === 'checking') return '음성 시스템 확인 중'
  return '음성 서버 연결 대기 중'
}

export function LongformComposer({
  disabled,
  value,
  directiveIds,
  backendStatus,
  backendMessage,
  activity,
  onValueChange,
  onDirectiveIdsChange,
  onSubmit,
  onVoiceUnavailable,
}: LongformComposerProps) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const valueRef = useRef(value)

  useEffect(() => {
    valueRef.current = value
  }, [value])
  useEffect(() => () => recognitionRef.current?.stop(), [])
  const selected = directives.filter((directive) => directiveIds.includes(directive.id))
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

  function toggleDirective(directive: ComposerDirective) {
    onDirectiveIdsChange(directiveIds.includes(directive.id)
      ? directiveIds.filter((id) => id !== directive.id)
      : [...directiveIds, directive.id])
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed, selected)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  function toggleVoiceInput() {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const Recognition = speechRecognitionConstructor()
    if (!Recognition) {
      onVoiceUnavailable()
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'ko-KR'
    recognition.interimResults = false
    recognition.continuous = true
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript ?? ''
      if (!transcript) return
      const current = valueRef.current
      const next = `${current}${current ? '\n' : ''}${transcript}`.slice(0, MAX_SCRIPT_LENGTH)
      valueRef.current = next
      onValueChange(next)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  return (
    <section className="soa-longform-studio" aria-labelledby="longform-title">
      <header className="soa-longform-studio__head">
        <div>
          <span>LONGFORM VOICE STUDIO</span>
          <h1 id="longform-title">긴 원고를 한 번에 음성으로</h1>
          <p>대본·오디오북·강의 원고를 붙여 넣으면 문장별로 나누어 순서대로 생성합니다.</p>
        </div>
        <div className={`soa-longform-engine is-${backendStatus}`} role="status">
          <i aria-hidden="true" />
          <span><strong>{engineTitle(backendStatus)}</strong><small>{backendMessage}</small></span>
        </div>
      </header>

      <div className="soa-longform-card">
        <div className="soa-longform-card__toolbar">
          <div>
            <strong>원고</strong>
            <span>일반 Enter는 줄바꿈 · Ctrl/⌘+Enter는 제작 시작</span>
          </div>
          <div>
            <button type="button" onClick={toggleVoiceInput} className={listening ? 'is-listening' : ''}>
              {listening ? '음성 입력 중지' : '마이크로 받아쓰기'}
            </button>
            <button type="button" onClick={() => onValueChange('')} disabled={!value}>전체 지우기</button>
          </div>
        </div>
        <textarea
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={'여기에 긴 원고를 붙여 넣으세요.\n\n문단과 줄바꿈은 그대로 보존되고, 생성할 때 문장별 음성 블록으로 자동 분할됩니다.'}
          aria-label="음성으로 만들 장문 원고"
          rows={15}
          maxLength={MAX_SCRIPT_LENGTH}
          spellCheck="true"
        />
        <div className="soa-longform-stats" aria-label="원고 통계">
          <span><b>{value.length.toLocaleString()}</b> / {MAX_SCRIPT_LENGTH.toLocaleString()}자</span>
          <span><b>{stats.paragraphs}</b>개 문단</span>
          <span><b>{stats.segments}</b>개 음성 블록</span>
          <span><b>{formatDuration(stats.durationSeconds)}</b></span>
        </div>
      </div>

      <div className="soa-longform-options">
        <div>
          <span>읽기 옵션</span>
          <strong>원고에 맞는 기본 발화 설정</strong>
        </div>
        <div className="soa-longform-option-list">
          {directives.map((directive) => {
            const active = directiveIds.includes(directive.id)
            return (
              <button
                key={directive.id}
                type="button"
                aria-pressed={active}
                className={active ? 'is-active' : ''}
                onClick={() => toggleDirective(directive)}
              >
                {directive.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={`soa-longform-activity is-${activity.role}`} aria-live="polite">
        <span>{activity.badge ?? '작업 상태'}</span>
        <p>{activity.text}</p>
      </div>

      <button
        type="button"
        className="soa-longform-submit"
        disabled={disabled || value.trim().length === 0}
        onClick={submit}
      >
        <span>{disabled ? '음성 생성 중…' : '원고를 문장별 음성으로 제작'}</span>
        <small>{stats.segments > 0 ? `${stats.segments}개 블록 · 순차 생성` : '원고를 입력해 주세요'}</small>
      </button>
    </section>
  )
}
