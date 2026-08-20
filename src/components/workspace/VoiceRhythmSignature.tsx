import type { VoiceCadence } from '../../tts/voicePresets'

interface VoiceRhythmSignatureProps {
  cadence: VoiceCadence | 'custom'
  compact?: boolean
}

export function VoiceRhythmSignature({ cadence, compact = false }: VoiceRhythmSignatureProps) {
  return (
    <span
      className={`soa-voice-rhythm is-${cadence} ${compact ? 'is-compact' : ''}`.trim()}
      aria-hidden="true"
      data-voice-cadence={cadence}
    >
      <i /><i /><i /><i /><i /><i />
    </span>
  )
}
