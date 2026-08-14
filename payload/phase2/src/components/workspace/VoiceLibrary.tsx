import { useMemo, useState } from 'react'
import type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'
import { buildVoiceChoices, resolveVoiceChoice } from '../../voice/voiceChoices'

interface VoiceLibraryProps {
  value: string
  previewingId: string | null
  myVoiceProfiles?: VoiceCloneProfile[]
  onChange: (voiceId: string) => void
  onCreateVoice: () => void
}

export function VoiceLibrary({
  value,
  previewingId,
  myVoiceProfiles = [],
  onChange,
  onCreateVoice,
}: VoiceLibraryProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const selectedVoice = useMemo(() => resolveVoiceChoice(myVoiceProfiles, value), [myVoiceProfiles, value])
  const choices = useMemo(() => buildVoiceChoices(myVoiceProfiles), [myVoiceProfiles])
  const myVoices = choices.filter((voice) => voice.kind === 'my-voice')
  const presets = choices.filter((voice) => voice.kind === 'preset')

  function chooseVoice(voiceId: string) {
    onChange(voiceId)
    setMobileOpen(false)
  }

  function renderVoice(voice: (typeof choices)[number]) {
    const selected = value === voice.id
    return (
      <button
        key={voice.id}
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={() => chooseVoice(voice.id)}
        className={`${selected ? 'is-selected' : ''} ${voice.kind === 'my-voice' ? 'is-my-voice' : ''}`.trim()}
      >
        <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
        <span className="soa-voice-copy">
          <strong>{voice.name}{voice.kind === 'my-voice' ? <em>MY</em> : null}</strong>
          <span>{voice.meta}</span>
          <small>{previewingId === voice.id ? '프리뷰 생성 중…' : voice.description}</small>
        </span>
        <span className="soa-voice-select-mark" aria-hidden="true">{selected ? '✓' : '▶'}</span>
      </button>
    )
  }

  return (
    <aside className={`soa-voice-library ${mobileOpen ? 'is-open' : ''}`} aria-label="목소리 라이브러리">
      <button
        type="button"
        className="soa-voice-library__mobile-summary"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span className={`soa-voice-avatar ${selectedVoice.tone}`} aria-hidden="true">{selectedVoice.shortName}</span>
        <span><strong>{selectedVoice.name}</strong><small>{selectedVoice.meta}</small></span>
        <b aria-hidden="true">{mobileOpen ? '⌃' : '⌄'}</b>
      </button>

      <div className="soa-voice-library__content">
        <div className="soa-voice-library__head">
          <span>VOICE LIBRARY</span>
          <strong>목소리</strong>
          <p>MY VOICE와 기본 성우를 같은 곳에서 고르고, 선택한 타임라인 대사에 즉시 연결합니다.</p>
        </div>
        <div className="soa-voice-library__list" role="radiogroup" aria-label="한국어 음성 선택">
          {myVoices.length ? (
            <section className="soa-voice-library__group" aria-label="내 목소리">
              <div className="soa-voice-library__group-title"><strong>MY VOICE</strong><span>{myVoices.length}</span></div>
              {myVoices.map(renderVoice)}
            </section>
          ) : null}
          <section className="soa-voice-library__group" aria-label="SoriON 기본 목소리">
            <div className="soa-voice-library__group-title"><strong>SoriON VOICES</strong><span>{presets.length}</span></div>
            {presets.map(renderVoice)}
          </section>
        </div>
        <button type="button" className="soa-new-voice" aria-label="새 보이스 만들기 · 내 목소리" onClick={() => { setMobileOpen(false); onCreateVoice() }}>
          <span aria-hidden="true">＋</span> 내 목소리 만들기
        </button>
      </div>
    </aside>
  )
}
