import { voicePresets } from '../../tts/voicePresets'

interface VoicePresetSelectorProps {
  value: string
  onChange: (voiceId: string) => void
}

export function VoicePresetSelector({ value, onChange }: VoicePresetSelectorProps) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-black tracking-[-0.03em]">목소리 선택</legend>
      <div className="mt-3 grid gap-3" role="radiogroup" aria-label="한국어 음성 프리셋">
        {voicePresets.map((voice) => {
          const selected = value === voice.id
          return (
            <button
              key={voice.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(voice.id)}
              className={`focus-ring flex min-h-[86px] items-center gap-3 rounded-[22px] border p-3 text-left transition active:scale-[0.995] ${
                selected ? 'border-soa-ink bg-soa-ink text-white shadow-[0_18px_40px_rgba(23,23,20,0.18)]' : 'border-soa-line bg-white'
              }`}
            >
              <span className={`grid size-14 shrink-0 place-items-center rounded-[18px] text-xl font-black text-soa-ink ${voice.tone}`} aria-hidden="true">
                {voice.shortName}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="truncate text-[15px] tracking-[-0.025em]">{voice.name}</strong>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${selected ? 'bg-white/15 text-white' : 'bg-[#ece9e1] text-soa-muted'}`}>
                    {voice.badge}
                  </span>
                </span>
                <span className={`mt-1 block text-xs leading-5 ${selected ? 'text-white/65' : 'text-soa-muted'}`}>{voice.description}</span>
              </span>
              <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs ${selected ? 'border-white bg-white text-soa-ink' : 'border-soa-line text-transparent'}`} aria-hidden="true">
                ✓
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
