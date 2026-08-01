import { useEffect } from 'react'
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
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div className="soa-sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="soa-bottom-sheet soa-voice-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-picker-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="soa-sheet-handle" aria-hidden="true" />
        <header className="soa-sheet-header">
          <button type="button" onClick={onClose} aria-label="목소리 선택 닫기">‹</button>
          <h2 id="voice-picker-title">전체 목소리</h2>
          <button type="button" onClick={onCreateVoice}>내 목소리</button>
        </header>
        <div className="soa-sheet-tabs" aria-label="목소리 분류">
          <span className="is-active">전체</span><span>한국어</span><span>장문 추천</span>
        </div>
        <div className="soa-voice-sheet-list" role="radiogroup" aria-label="목소리 선택">
          {voicePresets.map((voice) => {
            const selected = voice.id === selectedId
            return (
              <div key={voice.id} className={selected ? 'is-selected' : ''}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className="soa-voice-sheet-choice"
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
                  onClick={() => onPreview(voice.id)}
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
