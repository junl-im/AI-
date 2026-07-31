import type { VoiceEmotion } from '../../ai/contracts'

const emotions: Array<{ id: VoiceEmotion; label: string }> = [
  { id: 'neutral', label: '자연스럽게' },
  { id: 'happy', label: '밝게' },
  { id: 'calm', label: '차분하게' },
  { id: 'commercial', label: '광고톤' },
  { id: 'sad', label: '슬프게' },
  { id: 'angry', label: '강하게' },
]

interface EmotionSelectorProps {
  value: VoiceEmotion
  supported: boolean
  onChange: (emotion: VoiceEmotion) => void
}

export function EmotionSelector({ value, supported, onChange }: EmotionSelectorProps) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-black tracking-[-0.03em]">말하는 느낌</legend>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="감정 프리셋">
        {emotions.map((emotion) => {
          const disabled = !supported && emotion.id !== 'neutral'
          const selected = disabled ? emotion.id === 'neutral' : emotion.id === value
          return (
            <button
              key={emotion.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(emotion.id)}
              className={`focus-ring min-h-11 shrink-0 rounded-full border px-4 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-35 ${
                selected ? 'border-soa-violet bg-soa-violet text-white' : 'border-soa-line bg-white text-soa-muted'
              }`}
            >
              {emotion.label}
            </button>
          )
        })}
      </div>
      {!supported ? <p className="mt-2 text-[10px] font-semibold text-soa-muted">현재 엔진은 감정 제어를 지원하지 않아 자연스러운 기본 톤으로 생성합니다.</p> : null}
    </fieldset>
  )
}
