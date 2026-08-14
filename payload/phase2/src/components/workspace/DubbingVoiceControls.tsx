import { useMemo, useState } from 'react'
import type { EngineInfo, VoiceEmotion } from '../../ai/contracts'
import type { VoiceCloneProfile } from '../../voiceclone/voiceCloneTypes'
import { resolveVoiceChoice } from '../../voice/voiceChoices'
import { VoicePreviewButton } from '../voice/VoicePreviewButton'
import { VoicePickerSheet } from './VoicePickerSheet'
import { VoiceSettingsSheet } from './VoiceSettingsSheet'

interface DubbingVoiceControlsProps {
  voiceId: string
  scriptText?: string
  previewingId: string | null
  activePreviewId: string | null
  previewPlaying: boolean
  speed: number
  pitch: number
  emotion: VoiceEmotion
  normalizeText: boolean
  engine: EngineInfo | null
  myVoiceProfiles?: VoiceCloneProfile[]
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
  scriptText = '',
  previewingId,
  activePreviewId,
  previewPlaying,
  speed,
  pitch,
  emotion,
  normalizeText,
  engine,
  myVoiceProfiles = [],
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
  const voice = useMemo(() => resolveVoiceChoice(myVoiceProfiles, voiceId), [myVoiceProfiles, voiceId])
  const myVoiceSelected = voice.kind === 'my-voice'

  return (
    <>
      <section className="soa-dubbing-voice-row" aria-label="현재 목소리와 음성 설정">
        <button
          type="button"
          className={`soa-dubbing-voice-choice ${myVoiceSelected ? 'is-my-voice' : ''}`}
          onClick={() => setPickerOpen(true)}
          aria-label={`현재 목소리 ${voice.name} 선택`}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span className={`soa-voice-avatar ${voice.tone}`} aria-hidden="true">{voice.shortName}</span>
          <span><strong>{voice.name}{myVoiceSelected ? <em>MY</em> : null}</strong><small>{voice.meta}</small></span>
          <b aria-hidden="true">⌄</b>
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="음성 설정 열기"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          title={myVoiceSelected ? '내 목소리 · 숫자 읽기 설정' : '속도 · 높낮이 · 말투'}
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
        selectedId={voiceId}
        contextText={scriptText}
        previewingId={previewingId}
        activePreviewId={activePreviewId}
        previewPlaying={previewPlaying}
        myVoiceProfiles={myVoiceProfiles}
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
        supportsSpeed={!myVoiceSelected && (engine?.supportsSpeed ?? false)}
        supportsPitch={!myVoiceSelected && (engine?.supportsPitch ?? false)}
        supportsEmotion={!myVoiceSelected && (engine?.supportsEmotion ?? false)}
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
