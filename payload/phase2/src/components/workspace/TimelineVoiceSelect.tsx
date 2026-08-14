export interface TimelineVoiceOption {
  id: string
  name: string
  group?: 'my-voice' | 'preset'
}

interface TimelineVoiceSelectProps {
  label: string
  ariaLabel: string
  value: string
  options: TimelineVoiceOption[]
  disabled?: boolean
  className?: string
  help?: string
  onChange: (voiceId: string) => void
}

export function TimelineVoiceSelect({
  label,
  ariaLabel,
  value,
  options,
  disabled = false,
  className,
  help,
  onChange,
}: TimelineVoiceSelectProps) {
  return (
    <label className={className}>
      <span>{label}</span>
      <select
        aria-label={ariaLabel}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.group === 'my-voice' ? `MY · ${voice.name}` : voice.name}
          </option>
        ))}
      </select>
      {help ? <small>{help}</small> : null}
    </label>
  )
}
