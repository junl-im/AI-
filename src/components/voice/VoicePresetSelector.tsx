import { voicePresets } from '../../tts/voicePresets'

interface VoicePresetSelectorProps {
  value: string
  onChange: (voiceId: string) => void
}

export function VoicePresetSelector({ value, onChange }: VoicePresetSelectorProps) {
  return (
    <section className="mt-6 min-w-0" aria-labelledby="voice-preset-title">
      <div className="flex items-end justify-between gap-3">
        <h2 id="voice-preset-title" className="text-sm font-black tracking-[-0.03em]">목소리 선택</h2>
        <span className="text-[10px] font-bold text-soa-muted">옆으로 밀어 비교하세요</span>
      </div>
      <div className="soa-voice-chip-row" role="radiogroup" aria-label="한국어 음성 프리셋">
        {voicePresets.map((voice) => {
          const selected = value === voice.id
          return (
            <button
              key={voice.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(voice.id)}
              className={`focus-ring soa-voice-chip ${selected ? 'is-selected' : ''}`}
            >
              <span className={`soa-voice-chip__avatar ${voice.tone}`} aria-hidden="true">
                {voice.shortName}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="truncate text-[14px] tracking-[-0.025em]">{voice.name}</strong>
                  <span className="soa-voice-chip__badge">{voice.badge}</span>
                </span>
                <span className="mt-1 block text-[11px] leading-4 opacity-65">{voice.description}</span>
              </span>
              <span className="soa-voice-chip__check" aria-hidden="true">✓</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
