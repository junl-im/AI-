import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { ComposerDirective } from '../../workspace/workspaceTypes'

const directives: ComposerDirective[] = [
  { id: 'commercial', label: '광고톤으로' },
  { id: 'slow', label: '더 천천히' },
  { id: 'numbers', label: '숫자 읽기 쉽게' },
  { id: 'bright', label: '밝은 톤으로' },
]

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>
}

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

interface ChatComposerProps {
  disabled: boolean
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

export function ChatComposer({
  disabled,
  onSubmit,
  onVoiceUnavailable,
}: ChatComposerProps) {
  const [value, setValue] = useState('')
  const [selected, setSelected] = useState<ComposerDirective[]>([
    directives.find((directive) => directive.id === 'numbers')!,
  ])
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  function toggleDirective(directive: ComposerDirective) {
    setSelected((current) => current.some((item) => item.id === directive.id)
      ? current.filter((item) => item.id !== directive.id)
      : [...current, directive])
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSubmit(trimmed, selected)
    setValue('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
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
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      if (transcript) setValue((current) => `${current} ${transcript}`.trim())
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    setListening(true)
    recognition.start()
  }

  return (
    <form className="soa-chat-composer" onSubmit={handleSubmit} aria-label="채팅형 음성 생성">
      <div className="soa-prompt-chips" aria-label="추천 프롬프트">
        {directives.map((directive) => {
          const active = selected.some((item) => item.id === directive.id)
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
      <div className="soa-chat-input">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요…"
          aria-label="음성으로 만들 메시지"
          rows={1}
          maxLength={500}
        />
        <button
          type="button"
          className={listening ? 'is-listening' : ''}
          onClick={toggleVoiceInput}
          aria-label={listening ? '음성 입력 중지' : '마이크로 입력'}
        >
          {listening ? '■' : '●'}
        </button>
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          aria-label="메시지 보내기"
        >
          ↑
        </button>
      </div>
      <div className="soa-composer-meta">
        <span>Enter로 전송 · Shift+Enter 줄바꿈</span>
        <strong>{value.length} / 500</strong>
      </div>
    </form>
  )
}
