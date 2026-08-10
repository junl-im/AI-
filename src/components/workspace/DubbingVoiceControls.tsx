import { useState } from 'react'
import type { VoiceEmotion } from '../../ai/contracts'
import type { EngineInfo } from '../../ai/contracts'
import { VoicePreviewButton } from '../voice/VoicePreviewButton'
import { getVoicePreset, voicePresets } from '../../tts/voicePresets'
import { VoicePickerSheet } from './VoicePickerSheet'
import { VoiceSettingsSheet } from './VoiceSettingsSheet'

interface DubbingVoiceControlsProps {
  voiceId: string
  previewingId: string | null
  activePreviewId: string | null
  previewPlaying: boolean
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
  activePreviewId,
  previewPlaying,
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
        <button
          type="button"
          className="soa-dubbing-voice-choice"
          onClick={() => setPickerOpen(true)}
          aria-label={`현재 목소리 ${voice.name} 선택`}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
          <span><strong>{voice.name}</strong><small>{voice.tags.join(' · ')}</small></span>
          <b aria-hidden="true">⌄</b>
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="음성 설정 열기"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          title="속도 · 높낮이 · 말투"
        >
          ☷
        </button>
        <VoicePreviewButton
          voiceId={voiceId}
          voiceName={voice.name}
          previewingId={previewingId}
          activePreviewId={activePreviewId}
          previewPlaying={previewPlaying}
          onPreview={onPreview}
        />
        <div className="soa-dubbing-voice-quick" aria-label="빠른 목소리 선택">
          {voicePresets.slice(0, 5).map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-pressed={preset.id === voiceId}
              aria-label={`${preset.name} 빠른 선택`}
              className={preset.id === voiceId ? 'is-active' : ''}
              onClick={() => onVoiceChange(preset.id)}
              title={preset.description}
            >
              <span className={`soa-voice-avatar ${preset.tone}`} aria-hidden="true">{preset.shortName}</span>
              <span>{preset.name}</span>
            </button>
          ))}
          <button type="button" className="soa-dubbing-voice-quick__all" onClick={() => setPickerOpen(true)}>전체</button>
        </div>
      </section>

      <VoicePickerSheet
        open={pickerOpen}
        selectedId={voiceId}
        previewingId={previewingId}
        activePreviewId={activePreviewId}
        previewPlaying={previewPlaying}
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
        previewing={previewingId !== null}
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
