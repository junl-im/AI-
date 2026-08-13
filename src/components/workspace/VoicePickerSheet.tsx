import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useModalDialog } from '../../hooks/useModalDialog'
import { recommendVoiceForScript } from '../../tts/voiceRecommendation'
import { VoicePreviewButton } from '../voice/VoicePreviewButton'
import {
  filterVoicePresets,
  voiceGenderLabels,
  voicePresets,
  type VoiceGender,
} from '../../tts/voicePresets'

interface VoicePickerSheetProps {
  open: boolean
  selectedId: string
  contextText?: string
  previewingId: string | null
  activePreviewId: string | null
  previewPlaying: boolean
  onClose: () => void
  onSelect: (voiceId: string) => void
  onPreview: (voiceId: string) => void
  onCreateVoice: () => void
}

type VoiceFilter = VoiceGender | 'all'

const filterOptions: Array<{ id: VoiceFilter; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'male', label: voiceGenderLabels.male },
  { id: 'female', label: voiceGenderLabels.female },
  { id: 'neutral', label: voiceGenderLabels.neutral },
]

export function VoicePickerSheet({
  open,
  selectedId,
  contextText = '',
  previewingId,
  activePreviewId,
  previewPlaying,
  onClose,
  onSelect,
  onPreview,
  onCreateVoice,
}: VoicePickerSheetProps) {
  const dialogRef = useModalDialog<HTMLElement>(open, onClose)
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [filter, setFilter] = useState<VoiceFilter>('all')
  const recommendation = useMemo(
    () => recommendVoiceForScript(contextText, voicePresets),
    [contextText],
  )
  const visibleVoices = useMemo(() => {
    const filtered = filterVoicePresets(filter)
    if (!recommendation || !filtered.some((voice) => voice.id === recommendation.voiceId)) return filtered
    return [...filtered].sort((left, right) => (
      Number(right.id === recommendation.voiceId) - Number(left.id === recommendation.voiceId)
    ))
  }, [filter, recommendation])
  const hasSelectedVoice = visibleVoices.some((voice) => voice.id === selectedId)

  function handleChoiceKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const movingForward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    const movingBackward = event.key === 'ArrowUp' || event.key === 'ArrowLeft'
    if (!movingForward && !movingBackward) return

    event.preventDefault()
    const nextIndex = movingForward
      ? (index + 1) % visibleVoices.length
      : (index - 1 + visibleVoices.length) % visibleVoices.length
    const nextVoice = visibleVoices[nextIndex]
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
        <header className="soa-sheet-header soa-voice-picker-header">
          <button
            type="button"
            className="soa-voice-picker-close"
            onClick={onClose}
            aria-label="목소리 선택 닫기"
            data-dialog-autofocus
          >
            <span className="soa-voice-picker-close__mobile" aria-hidden="true">‹</span>
            <span className="soa-voice-picker-close__desktop" aria-hidden="true">×</span>
          </button>
          <div className="soa-voice-picker-heading">
            <h2 id="voice-picker-title">목소리 선택</h2>
            <p>원하는 톤을 고르고 바로 미리 들어보세요.</p>
          </div>
          <button
            type="button"
            className="soa-voice-create-button"
            onClick={() => {
              onClose()
              onCreateVoice()
            }}
          >
            + 내 목소리
          </button>
        </header>
        <div className="soa-sheet-tags" role="group" aria-label="목소리 성별 필터">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => {
                setFilter(option.id)
                choiceRefs.current = []
              }}
            >
              {option.label}
            </button>
          ))}
          <span>{voicePresets.length}개 목소리</span>
        </div>
        {recommendation && contextText.trim() ? (
          <div className="soa-voice-context-recommendation" role="status">
            <strong>대본 맞춤 추천</strong>
            <span>{voicePresets.find((voice) => voice.id === recommendation.voiceId)?.name}</span>
            <small>{recommendation.reason}</small>
          </div>
        ) : null}
        <div className="soa-voice-sheet-list" role="radiogroup" aria-label="목소리 선택">
          {visibleVoices.map((voice, index) => {
            const selected = voice.id === selectedId
            const recommended = recommendation?.voiceId === voice.id
            return (
              <div key={voice.id} className={`${selected ? 'is-selected' : ''} ${recommended ? 'is-recommended' : ''}`.trim()}>
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
                  <span>
                    <strong>
                      {voice.name} <span className="soa-voice-gender">{voiceGenderLabels[voice.gender]}</span>
                      {recommended ? <em>대본 추천</em> : null}
                    </strong>
                    <small>{voice.description}</small>
                  </span>
                </button>
                <VoicePreviewButton
                  className="soa-voice-sheet-preview"
                  voiceId={voice.id}
                  voiceName={voice.name}
                  previewingId={previewingId}
                  activePreviewId={activePreviewId}
                  previewPlaying={previewPlaying}
                  onPreview={onPreview}
                />
                <span className="soa-voice-sheet-check" aria-hidden="true">{selected ? '✓' : ''}</span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
