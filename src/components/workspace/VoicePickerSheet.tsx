import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { useModalDialog } from '../../hooks/useModalDialog'
import { voicePresets } from '../../tts/voicePresets'

interface VoicePickerSheetProps {
  open: boolean
  selectedId: string
  previewingId: string | null
  onClose: () => void
  onSelect: (voiceId: string) => void
  onPreview: (voiceId: string) => void
  onCreateVoice: () => void
}

export function VoicePickerSheet({
  open,
  selectedId,
  previewingId,
  onClose,
  onSelect,
  onPreview,
  onCreateVoice,
}: VoicePickerSheetProps) {
  const dialogRef = useModalDialog<HTMLElement>(open, onClose)
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([])
  const hasSelectedVoice = voicePresets.some((voice) => voice.id === selectedId)

  function handleChoiceKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const movingForward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    const movingBackward = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    if (!movingForward && !movingBackward) return

    event.preventDefault()
    const nextIndex = movingForward
      ? (index + 1) % voicePresets.length
      : (index - 1 + voicePresets.length) % voicePresets.length
    const nextVoice = voicePresets[nextIndex]
    onSelect(nextVoice.id)
    choiceRefs.current[nextIndex]?.focus({ preventScroll: true })
  }

  if (!open) return null

  return (
    <div className="soa-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        className="soa-bottom-sheet soa-voice-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-picker-title"
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="soa-sheet-handle" aria-hidden="true" />
        <header className="soa-sheet-header">
          <button
            type="button"
            onClick={onClose}
            aria-label="목소리 선택 닫기"
            data-dialog-autofocus
          >
            ‹
          </button>
          <h2 id="voice-picker-title">전체 목소리</h2>
          <button
            type="button"
            onClick={() => {
              onClose()
              onCreateVoice()
            }}
          >
            내 목소리
          </button>
        </header>
        <div className="soa-sheet-tags" aria-label="목소리 라이브러리 특성">
          <span>한국어</span>
          <span>장문 추천</span>
          <span>{voicePresets.length}개 프리셋</span>
        </div>
        <div className="soa-voice-sheet-list" role="radiogroup" aria-label="목소리 선택">
          {voicePresets.map((voice, index) => {
            const selected = voice.id === selectedId
            return (
              <div key={voice.id} className={selected ? 'is-selected' : ''}>
                <button
                  ref={(element) => {
                    choiceRefs.current[index] = element
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (!hasSelectedVoice && index === 0) ? 0 : -1}
                  className="soa-voice-sheet-choice"
                  onKeyDown={(event) => handleChoiceKeyDown(event, index)}
                  onClick={() => {
                    onSelect(voice.id)
                    onClose()
                  }}
                >
                  <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
                  <span><strong>{voice.name}</strong><small>{voice.description}</small></span>
                </button>
                <button
                  type="button"
                  className="soa-voice-sheet-preview"
                  disabled={previewingId !== null}
                  aria-busy={previewingId === voice.id}
                  onClick={() => {
                    onSelect(voice.id)
                    onPreview(voice.id)
                  }}
                  aria-label={`${voice.name} 목소리 미리듣기`}
                >
                  {previewingId === voice.id ? '…' : '▶'}
                </button>
                <span className="soa-voice-sheet-check" aria-hidden="true">{selected ? '✓' : ''}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
