import { useMemo, useState } from 'react'
import { getVoicePreset, voicePresets } from '../../tts/voicePresets'

interface VoiceLibraryProps {
  value: string
  previewingId: string | null
  onChange: (voiceId: string) => void
  onCreateVoice: () => void
}

export function VoiceLibrary({
  value,
  previewingId,
  onChange,
  onCreateVoice,
}: VoiceLibraryProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const selectedVoice = useMemo(() => getVoicePreset(value), [value])

  function chooseVoice(voiceId: string) {
    onChange(voiceId)
    setMobileOpen(false)
  }

  return (
    <aside
      className={`soa-voice-library ${mobileOpen ? 'is-open' : ''}`}
      aria-label="목소리 라이브러리"
    >
      <button
        type="button"
        className="soa-voice-library__mobile-summary"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className={`soa-voice-avatar ${selectedVoice.tone}`} aria-hidden="true">
          {selectedVoice.shortName}
        </span>
        <span>
          <strong>{selectedVoice.name}</strong>
          <small>{selectedVoice.tags.join(' · ')}</small>
        </span>
        <b aria-hidden="true">{mobileOpen ? '⌃' : '⌄'}</b>
      </button>

      <div className="soa-voice-library__content">
        <div className="soa-voice-library__head">
          <span>VOICE LIBRARY</span>
          <strong>목소리</strong>
          <p>선택하면 짧은 프리뷰를 만들고 다음 블록부터 적용합니다.</p>
        </div>
        <div className="soa-voice-library__list" role="radiogroup" aria-label="한국어 음성 선택">
          {voicePresets.map((voice) => {
            const selected = value === voice.id
            return (
              <button
                key={voice.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => chooseVoice(voice.id)}
                className={selected ? 'is-selected' : ''}
              >
                <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">
                  {voice.shortName}
                </span>
                <span className="soa-voice-copy">
                  <strong>{voice.name}</strong>
                  <span>{voice.tags.join(' · ')}</span>
                  <small>{previewingId === voice.id ? '프리뷰 생성 중…' : voice.description}</small>
                </span>
                <span className="soa-voice-select-mark" aria-hidden="true">
                  {selected ? '✓' : '▶'}
                </span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          className="soa-new-voice"
          onClick={() => {
            setMobileOpen(false)
            onCreateVoice()
          }}
        >
          <span aria-hidden="true">＋</span>
          새 보이스 만들기
        </button>
      </div>
    </aside>
  )
}
