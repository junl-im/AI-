import { useState } from 'react'
import type { VoiceEmotion } from '../../ai/contracts'
import type { EngineInfo } from '../../ai/contracts'
import { VoicePreviewButton } from '../voice/VoicePreviewButton'
import { buildVoiceChoices, resolveVoiceChoice, type VoiceChoice } from '../../voice/voiceChoices'
import { VoicePickerSheet } from './VoicePickerSheet'
import { VoiceSettingsSheet } from './VoiceSettingsSheet'

interface DubbingVoiceControlsProps {
  voiceId: string
  voiceChoices?: VoiceChoice[]
  scriptText?: string
  previewingId: string | null
  activePreviewId: string | null
  previewPlaying: boolean
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  engine: EngineInfo | null
  applyTargetCount?: number
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
  voiceChoices = buildVoiceChoices([]),
  scriptText = '',
  previewingId,
  activePreviewId,
  previewPlaying,
  speed,
  pitch,
  emotion,
  normalizeText,
  engine,
  applyTargetCount = 0,
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
  const voice = resolveVoiceChoice(voiceChoices, voiceId)
  const customVoice = voice.kind === 'my-voice'

  return (
    <>
      <section className="soa-dubbing-voice-row" aria-label="현재 목소리와 음성 설정">
        <button
          type="button"
          className={`soa-dubbing-voice-choice ${customVoice ? 'is-my-voice' : ''}`.trim()}
          onClick={() => setPickerOpen(true)}
          aria-label={`현재 목소리 ${voice.name} 선택`}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
          <span>
            <strong>{voice.name}{customVoice ? <em>MY VOICE</em> : null}</strong>
            <small>{customVoice ? voice.meta : voice.bestFor.join(' · ')}</small>
          </span>
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
      </section>

      <VoicePickerSheet
        open={pickerOpen}
        voices={voiceChoices}
        selectedId={voiceId}
        contextText={scriptText}
        previewingId={previewingId}
        activePreviewId={activePreviewId}
        previewPlaying={previewPlaying}
        onClose={() => setPickerOpen(false)}
        onSelect={onVoiceChange}
        onPreview={onPreview}
        onCreateVoice={onCreateVoice}
        applyTargetCount={applyTargetCount}
      />
      <VoiceSettingsSheet
        open={settingsOpen}
        speed={speed}
        pitch={pitch}
        emotion={emotion}
        normalizeText={normalizeText}
        supportsSpeed={!customVoice && (engine?.supportsSpeed ?? false)}
        supportsPitch={!customVoice && (engine?.supportsPitch ?? false)}
        supportsEmotion={!customVoice && (engine?.supportsEmotion ?? false)}
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
