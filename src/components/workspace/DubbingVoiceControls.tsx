import { useState } from 'react'
import type { VoiceEmotion } from '../../ai/contracts'
import type { EngineInfo } from '../../ai/contracts'
import { getVoicePreset } from '../../tts/voicePresets'
import { VoicePickerSheet } from './VoicePickerSheet'
import { VoiceSettingsSheet } from './VoiceSettingsSheet'

interface DubbingVoiceControlsProps {
  voiceId: string
  previewingId: string | null
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  engine: EngineInfo | null
  onVoiceChange: (voiceId: string) => void
  onPreview: (voiceId: string) => void
  onSpeedChange: (value: number) => void
  onPitchChange: (value: number) => void
  onEmotionChange: (value: VoiceEmotion) => void
  onNormalizeTextChange: (value: boolean) => void
  onCreateVoice: () => void
}

export function DubbingVoiceControls({
  voiceId,
  previewingId,
  speed,
  pitch,
  emotion,
  normalizeText,
  engine,
  onVoiceChange,
  onPreview,
  onSpeedChange,
  onPitchChange,
  onEmotionChange,
  onNormalizeTextChange,
  onCreateVoice,
}: DubbingVoiceControlsProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const voice = getVoicePreset(voiceId)

  return (
    <>
      <section className="soa-dubbing-voice-row" aria-label="현재 목소리와 음성 설정">
        <button type="button" className="soa-dubbing-voice-choice" onClick={() => setPickerOpen(true)}>
          <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
          <span><strong>{voice.name}</strong><small>{voice.tags.join(' · ')}</small></span>
          <b aria-hidden="true">⌄</b>
        </button>
        <button type="button" onClick={() => setSettingsOpen(true)} aria-label="음성 설정 열기">☷</button>
        <button
          type="button"
          onClick={() => onPreview(voiceId)}
          disabled={previewingId !== null}
          aria-label={`${voice.name} 목소리 미리듣기`}
        >
          {previewingId === voiceId ? '…' : '▶'}
        </button>
      </section>

      <VoicePickerSheet
        open={pickerOpen}
        selectedId={voiceId}
        previewingId={previewingId}
        onClose={() => setPickerOpen(false)}
        onSelect={onVoiceChange}
        onPreview={onPreview}
        onCreateVoice={onCreateVoice}
      />
      <VoiceSettingsSheet
        open={settingsOpen}
        speed={speed}
        pitch={pitch}
        emotion={emotion}
        normalizeText={normalizeText}
        supportsSpeed={engine?.supportsSpeed ?? false}
        supportsPitch={engine?.supportsPitch ?? false}
        supportsEmotion={engine?.supportsEmotion ?? false}
        onClose={() => setSettingsOpen(false)}
        onSpeedChange={onSpeedChange}
        onPitchChange={onPitchChange}
        onEmotionChange={onEmotionChange}
        onNormalizeTextChange={onNormalizeTextChange}
        onPreview={() => onPreview(voiceId)}
      />
    </>
  )
}
